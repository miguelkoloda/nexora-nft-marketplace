import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { io as createClient } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { createRealtimeServer } from '../../server/realtime/index.ts'
import type {
  RealtimeClientToServerEvents,
  RealtimeServerToClientEvents,
} from '../../src/realtime/contracts.ts'

type Client = Socket<RealtimeServerToClientEvents, RealtimeClientToServerEvents>
const activeClients: Client[] = []
const activeServers: Array<ReturnType<typeof createRealtimeServer>> = []

afterEach(async () => {
  activeClients.splice(0).forEach((socket) => socket.disconnect())
  await Promise.all(activeServers.splice(0).map((server) => server.close()))
})

async function start(
  port = 0,
  options: Parameters<typeof createRealtimeServer>[0] = {},
) {
  const server = createRealtimeServer({
    host: '127.0.0.1',
    port,
    adminToken: 'test-admin',
    ...options,
  })
  const assignedPort = await server.listen()
  activeServers.push(server)
  return { server, port: assignedPort, url: `http://127.0.0.1:${assignedPort}` }
}

test('servidor local emite token temporário e desativa emissão fora do modo demo', async () => {
  const local = await start()
  const issued = await fetch(`${local.url}/__demo/session-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-a' }),
  })
  assert.equal(issued.status, 200)
  const session = (await issued.json()) as { token: string; expiresAt: string }
  assert.match(session.token, /^nexora\.user-a\./)
  assert.ok(Date.parse(session.expiresAt) > Date.now())

  const production = await start(0, { demoMode: false })
  const disabled = await fetch(`${production.url}/__demo/session-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-a' }),
  })
  assert.equal(disabled.status, 404)
})

function connect(url: string, token?: string, reconnection = false): Client {
  const socket = createClient(url, {
    auth: { token },
    reconnection,
    reconnectionDelay: 40,
    reconnectionDelayMax: 80,
    timeout: 300,
    forceNew: true,
  }) as Client
  activeClients.push(socket)
  return socket
}

function once<T>(socket: Client, event: string, timeout = 2_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      timeout,
    )
    socket.once(
      event as never,
      ((payload: T) => {
        clearTimeout(timer)
        resolve(payload)
      }) as never,
    )
  })
}

async function trigger(url: string, body: unknown) {
  const response = await fetch(`${url}/__demo/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Admin': 'test-admin',
    },
    body: JSON.stringify(body),
  })
  assert.equal(response.status, 200)
  return response.json() as Promise<Record<string, unknown>>
}

test('entrega evento tipado de preco e disponibilidade e limpa conexao', async () => {
  const { url } = await start()
  const socket = connect(url)
  await once(socket, 'connect')
  const eventPromise = once<Record<string, unknown>>(socket, 'nft.updated')
  const emitted = await trigger(url, {
    event: 'nft.updated',
    nftId: 'emerald-ape-042',
    price: '2.75',
    availableQuantity: 4,
  })
  const received = await eventPromise
  assert.deepEqual(received, emitted)
  assert.equal(received.price, '2.75')
  assert.equal(received.availableQuantity, 4)
  socket.disconnect()
  assert.equal(socket.connected, false)
})

test('cliente reconecta depois que o servidor reinicia na mesma porta', async () => {
  const initial = await start()
  const socket = connect(initial.url, undefined, true)
  await once(socket, 'connect')
  const firstEventPromise = once<Record<string, unknown>>(socket, 'nft.updated')
  await trigger(initial.url, {
    event: 'nft.updated',
    nftId: 'emerald-ape-042',
    price: '2.20',
  })
  const firstEvent = await firstEventPromise
  const reconnected = once(socket, 'connect', 3_000)
  await initial.server.close()
  activeServers.splice(activeServers.indexOf(initial.server), 1)
  await new Promise((resolve) => setTimeout(resolve, 100))
  const replacement = await start(initial.port)
  assert.equal(replacement.port, initial.port)
  await reconnected
  assert.equal(socket.connected, true)
  const secondEventPromise = once<Record<string, unknown>>(
    socket,
    'nft.updated',
  )
  await trigger(replacement.url, {
    event: 'nft.updated',
    nftId: 'emerald-ape-042',
    price: '2.30',
  })
  const secondEvent = await secondEventPromise
  assert.ok(Number(secondEvent.version) > Number(firstEvent.version))
})

test('eventos de pedido chegam somente a conexao vinculada ao token do usuario', async () => {
  const { url, server } = await start()
  const expiry = Date.now() + 60_000
  const tokenA = server.issueDemoSessionToken('user-a', expiry)
  const tokenB = server.issueDemoSessionToken('user-b', expiry)
  const userA = connect(url, tokenA)
  const userB = connect(url, tokenB)
  await Promise.all([once(userA, 'connect'), once(userB, 'connect')])
  const receivedByA = once<Record<string, unknown>>(userA, 'order.updated')
  let receivedByB = false
  userB.on('order.updated', () => {
    receivedByB = true
  })
  await trigger(url, {
    event: 'order.updated',
    sessionToken: tokenA,
    orderId: 'order-a',
    status: 'confirmed',
  })
  const event = await receivedByA
  await new Promise((resolve) => setTimeout(resolve, 80))
  assert.equal(event.userId, 'user-a')
  assert.equal(receivedByB, false)
  userB.emit('client.ready')
  const untypedClient = userB as unknown as {
    emit: (event: string, payload?: unknown) => void
  }
  untypedClient.emit('user.subscribe', { userId: 'user-a' })
  assert.equal(userB.connected, true)
})

test('token adulterado ou expirado nao recebe atualizacoes privadas', async () => {
  const { url, server } = await start()
  const expired = server.issueDemoSessionToken('user-a', Date.now() - 1_000)
  const invalid = connect(url, expired)
  await once(invalid, 'connect')
  let received = false
  invalid.on('order.updated', () => {
    received = true
  })
  const valid = server.issueDemoSessionToken('user-a', Date.now() + 60_000)
  const privateEvent = once(invalid, 'order.updated', 120).catch(() => null)
  await trigger(url, {
    event: 'order.updated',
    sessionToken: valid,
    orderId: 'order-a',
    status: 'confirmed',
  })
  assert.equal(await privateEvent, null)
  assert.equal(received, false)
})
