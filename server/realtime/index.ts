import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'
import { Server as SocketServer } from 'socket.io'
import type { Socket } from 'socket.io'
import { nfts } from '../../src/data/nfts.ts'
import type {
  NftMarketUpdate,
  OrderStatus,
  OrderUpdatedEvent,
} from '../../src/domain/types.ts'
import type {
  RealtimeClientToServerEvents,
  RealtimeServerToClientEvents,
} from '../../src/realtime/contracts.ts'

type SessionClaims = { userId: string; expiresAt: number }
type NftEventInput = {
  event: 'nft.updated'
  nftId: string
  price?: string
  availableQuantity?: number
}
type OrderEventInput = {
  event: 'order.updated'
  sessionToken: string
  orderId: string
  status: OrderStatus
  transactionId?: string | null
}
type DemoEventInput = NftEventInput | OrderEventInput

type RealtimeSocket = Socket<
  RealtimeClientToServerEvents,
  RealtimeServerToClientEvents
>

type RealtimeServerOptions = {
  host?: string
  port?: number
  adminToken?: string
  allowedOrigin?: string
  demoMode?: boolean
  signingKey?: string
}

function sessionSignaturePayload(userId: string, expiresAt: number): string {
  return `${userId}.${expiresAt}`
}

function verifySessionToken(
  token: string,
  demoMode: boolean,
  signingKey: string,
): SessionClaims | null {
  if (!demoMode) {
    const jwtSecret = process.env.REALTIME_JWT_SECRET
    if (!jwtSecret) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerPart, payloadPart, signaturePart] = parts
    try {
      const header = JSON.parse(
        Buffer.from(headerPart, 'base64url').toString('utf8'),
      ) as { alg?: unknown }
      const payload = JSON.parse(
        Buffer.from(payloadPart, 'base64url').toString('utf8'),
      ) as { sub?: unknown; exp?: unknown }
      if (
        header.alg !== 'HS256' ||
        typeof payload.sub !== 'string' ||
        typeof payload.exp !== 'number' ||
        payload.exp * 1000 <= Date.now()
      )
        return null
      const expected = createHmac('sha256', jwtSecret)
        .update(`${headerPart}.${payloadPart}`)
        .digest()
      const supplied = Buffer.from(signaturePart, 'base64url')
      if (
        supplied.length !== expected.length ||
        !timingSafeEqual(supplied, expected)
      )
        return null
      return { userId: payload.sub, expiresAt: payload.exp * 1000 }
    } catch {
      return null
    }
  }
  const match = /^nexora\.([a-zA-Z0-9_-]+)\.(\d+)\.([a-f0-9]{64})$/.exec(token)
  if (!match) return null
  const [, userId, rawExpiry, suppliedHex] = match
  const expiresAt = Number(rawExpiry)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return null
  const expected = createHmac('sha256', signingKey)
    .update(sessionSignaturePayload(userId, expiresAt))
    .digest()
  const supplied = Buffer.from(suppliedHex, 'hex')
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return null
  return { userId, expiresAt }
}

function writeJson(
  response: ServerResponse,
  status: number,
  body: unknown,
  allowedOrigins: string,
  requestOrigin: string | undefined,
): void {
  const originList = allowedOrigins.split(',').map((value) => value.trim())
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Demo-Admin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
  if (requestOrigin && originList.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin
  }
  response.writeHead(status, headers)
  response.end(JSON.stringify(body))
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let length = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    length += buffer.length
    if (length > 16_384) throw new Error('PAYLOAD_TOO_LARGE')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validPrice(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,18})?$/.test(value))
    return false
  return BigInt(value.replace('.', '').replace(/^0+(?=\d)/, '')) > 0n
}

function nextVersion(previous = 0): number {
  return Math.max(Date.now(), previous + 1)
}

export function createRealtimeServer(options: RealtimeServerOptions = {}) {
  const production = process.env.NODE_ENV === 'production'
  const demoMode = options.demoMode ?? !production
  const host =
    options.host ??
    process.env.REALTIME_HOST ??
    (production ? '0.0.0.0' : '127.0.0.1')
  const port =
    options.port ?? Number(process.env.PORT ?? process.env.REALTIME_PORT ?? 5188)
  const signingKey = options.signingKey ?? randomBytes(32).toString('hex')
  const adminToken =
    options.adminToken ??
    process.env.REALTIME_DEMO_ADMIN_TOKEN ??
    (demoMode ? 'local-demo-only-token' : randomBytes(32).toString('hex'))
  const allowedOrigin =
    options.allowedOrigin ??
    process.env.REALTIME_ALLOWED_ORIGIN ??
    'http://127.0.0.1:5173,http://127.0.0.1:5187,http://127.0.0.1:5189'

  const nftState = new Map<string, NftMarketUpdate>()
  const orderState = new Map<string, OrderUpdatedEvent>()
  const nftVersions = new Map<string, number>()
  let sequence = 0
  let connectionsPaused = false

  const server = createServer((request, response) => {
    const json = (status: number, body: unknown) =>
      writeJson(response, status, body, allowedOrigin, request.headers.origin)
    const url = new URL(request.url ?? '/', `http://${host}:${port}`)
    if (request.method === 'OPTIONS') {
      json(204, {})
      return
    }
    if (request.method === 'GET' && url.pathname === '/__demo/health') {
      json(200, {
        service: 'nexora-realtime-demo',
        simulated: true,
      })
      return
    }
    if (request.method === 'GET' && url.pathname === '/__demo/state/nfts') {
      json(200, { updates: [...nftState.values()] })
      return
    }
    if (request.method === 'POST' && url.pathname === '/__demo/session-token') {
      if (!demoMode) {
        json(404, { code: 'NOT_FOUND' })
        return
      }
      void readJson(request)
        .then((body) => {
          if (
            !isRecord(body) ||
            typeof body.userId !== 'string' ||
            !/^[a-zA-Z0-9_-]{1,80}$/.test(body.userId)
          )
            throw new Error('INVALID_SESSION_REQUEST')
          const expiresAt = Date.now() + 60 * 60 * 1000
          const signature = createHmac('sha256', signingKey)
            .update(sessionSignaturePayload(body.userId, expiresAt))
            .digest('hex')
          json(200, {
            token: `nexora.${body.userId}.${expiresAt}.${signature}`,
            expiresAt: new Date(expiresAt).toISOString(),
          })
        })
        .catch((error: unknown) => {
          json(422, {
            code:
              error instanceof Error
                ? error.message
                : 'INVALID_SESSION_REQUEST',
          })
        })
      return
    }
    if (request.method === 'GET' && url.pathname === '/__demo/state/orders') {
      const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
      const claims = token
        ? verifySessionToken(token, demoMode, signingKey)
        : null
      if (!claims) {
        json(401, { code: 'UNAUTHORIZED' })
        return
      }
      json(200, {
        updates: [...orderState.values()].filter(
          (event) => event.userId === claims.userId,
        ),
      })
      return
    }
    if (request.method === 'POST' && url.pathname === '/__demo/reset') {
      if (request.headers['x-demo-admin'] !== adminToken) {
        json(403, { code: 'FORBIDDEN' })
        return
      }
      nftState.clear()
      orderState.clear()
      nftVersions.clear()
      sequence = 0
      connectionsPaused = false
      json(200, { ok: true })
      return
    }
    if (request.method === 'POST' && url.pathname === '/__demo/pause') {
      if (request.headers['x-demo-admin'] !== adminToken) {
        json(403, { code: 'FORBIDDEN' })
        return
      }
      connectionsPaused = true
      for (const socket of io.sockets.sockets.values()) socket.conn.close()
      json(200, { paused: true })
      return
    }
    if (request.method === 'POST' && url.pathname === '/__demo/resume') {
      if (request.headers['x-demo-admin'] !== adminToken) {
        json(403, { code: 'FORBIDDEN' })
        return
      }
      connectionsPaused = false
      json(200, { paused: false })
      return
    }
    if (request.method === 'POST' && url.pathname === '/__demo/shutdown') {
      if (request.headers['x-demo-admin'] !== adminToken) {
        json(403, { code: 'FORBIDDEN' })
        return
      }
      json(200, { ok: true })
      setTimeout(() => {
        void io.close()
      }, 25)
      return
    }
    if (request.method === 'POST' && url.pathname === '/__demo/trigger') {
      if (request.headers['x-demo-admin'] !== adminToken) {
        json(403, { code: 'FORBIDDEN' })
        return
      }
      void readJson(request)
        .then((body) => trigger(body))
        .then((event) => json(200, event))
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'INVALID_EVENT'
          json(message === 'PAYLOAD_TOO_LARGE' ? 413 : 422, {
            code: message,
          })
        })
      return
    }
    json(404, { code: 'NOT_FOUND' })
  })

  const io = new SocketServer<
    RealtimeClientToServerEvents,
    RealtimeServerToClientEvents
  >(server, {
    cors: { origin: allowedOrigin.split(',').map((value) => value.trim()) },
    maxHttpBufferSize: 16_384,
  })

  io.use((socket, next) => {
    if (connectionsPaused) {
      next(new Error('REALTIME_UNAVAILABLE'))
      return
    }
    const token = socket.handshake.auth.token
    const claims =
      typeof token === 'string'
        ? verifySessionToken(token, demoMode, signingKey)
        : null
    socket.data.userId = claims?.userId ?? null
    socket.data.sessionExpiresAt = claims?.expiresAt ?? null
    next()
  })

  io.on('connection', (socket: RealtimeSocket) => {
    const userId = socket.data.userId
    if (typeof userId === 'string') socket.join(`user:${userId}`)
    socket.on('client.ready', () => undefined)
  })

  async function trigger(input: unknown): Promise<unknown> {
    if (!isRecord(input)) throw new Error('INVALID_EVENT')
    if (input.event === 'nft.updated') {
      const nftId = input.nftId
      const nft = nfts.find((item) => item.id === nftId)
      if (!nft) throw new Error('NFT_NOT_FOUND')
      const current = nftState.get(nft.id)
      const price = input.price ?? current?.price ?? nft.price
      const availableQuantity =
        input.availableQuantity ??
        current?.availableQuantity ??
        nft.availableQuantity
      if (
        !validPrice(price) ||
        typeof availableQuantity !== 'number' ||
        !Number.isSafeInteger(availableQuantity) ||
        availableQuantity < 0
      ) {
        throw new Error('INVALID_NFT_UPDATE')
      }
      const version = nextVersion(nftVersions.get(nft.id))
      nftVersions.set(nft.id, version)
      const event: NftMarketUpdate = {
        eventId: `nft:${nft.id}:${version}`,
        sequence: ++sequence,
        nftId: nft.id,
        price,
        availableQuantity,
        version,
        occurredAt: new Date().toISOString(),
      }
      nftState.set(nft.id, event)
      io.emit('nft.updated', event)
      return event
    }
    if (input.event === 'order.updated') {
      const claims =
        typeof input.sessionToken === 'string'
          ? verifySessionToken(input.sessionToken, demoMode, signingKey)
          : null
      if (!claims) throw new Error('INVALID_SESSION')
      const orderId = input.orderId
      const status = input.status
      if (
        typeof orderId !== 'string' ||
        orderId.length > 100 ||
        !['pending', 'confirmed', 'declined'].includes(String(status))
      ) {
        throw new Error('INVALID_ORDER_UPDATE')
      }
      const key = `${claims.userId}:${orderId}`
      const previous = orderState.get(key)
      if (previous && previous.status !== 'pending')
        throw new Error('ORDER_STATUS_TERMINAL')
      const version = nextVersion(previous?.version)
      const event: OrderUpdatedEvent = {
        eventId: `order:${orderId}:${version}`,
        sequence: ++sequence,
        orderId,
        userId: claims.userId,
        status: status as OrderStatus,
        transactionId:
          status === 'confirmed'
            ? typeof input.transactionId === 'string'
              ? input.transactionId
              : `simulated-${orderId}`
            : null,
        version,
        occurredAt: new Date().toISOString(),
      }
      orderState.set(key, event)
      io.to(`user:${claims.userId}`).emit('order.updated', event)
      return event
    }
    throw new Error('UNSUPPORTED_EVENT')
  }

  return {
    io,
    server,
    trigger,
    issueDemoSessionToken(userId: string, expiresAt: number) {
      if (!demoMode) throw new Error('DEMO_MODE_DISABLED')
      const signature = createHmac('sha256', signingKey)
        .update(sessionSignaturePayload(userId, expiresAt))
        .digest('hex')
      return `nexora.${userId}.${expiresAt}.${signature}`
    },
    async listen(): Promise<number> {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, host, () => {
          server.off('error', reject)
          resolve()
        })
      })
      const address = server.address()
      return address && typeof address !== 'string' ? address.port : port
    },
    async close(): Promise<void> {
      await new Promise<void>((resolve) => io.close(() => resolve()))
    },
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const realtime = createRealtimeServer()
  void realtime.listen().then((port) => {
    process.stdout.write(`Nexora realtime simulation listening on ${port}\n`)
  })
}
