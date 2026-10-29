import assert from 'node:assert/strict'
import { test } from 'node:test'
import { QueryClient } from '@tanstack/react-query'
import { nfts } from '../../src/data/nfts.ts'
import {
  applyNftUpdate,
  applyOrderUpdate,
  resetRealtimeVersions,
  subscribeRealtimeEvents,
} from '../../src/realtime/querySync.ts'
import { io as createClient } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type {
  RealtimeClientToServerEvents,
  RealtimeServerToClientEvents,
} from '../../src/realtime/contracts.ts'
import type { Order } from '../../src/domain/types.ts'

const nftEvent = (version: number, price = '2.50') => ({
  eventId: `ev-${version}`,
  sequence: version,
  nftId: 'emerald-ape-042',
  price,
  availableQuantity: 3,
  version,
  occurredAt: new Date(0).toISOString(),
})

test('atualiza catalogo, detalhe e carrinho e ignora duplicados ou fora de ordem', async () => {
  resetRealtimeVersions()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const original = structuredClone(
    nfts.find((nft) => nft.id === 'emerald-ape-042')!,
  )
  client.setQueryData(['catalog', {}], {
    items: [original],
    page: 1,
    pageSize: 1,
    total: 1,
    pageCount: 1,
  })
  client.setQueryData(['nft', original.id], original)
  client.setQueryData(['cart', 'user-a'], {
    items: [
      {
        nftId: original.id,
        quantity: 1,
        edition: original.edition,
        nft: original,
      },
    ],
    couponCode: null,
    version: 1,
  })
  assert.equal(await applyNftUpdate(client, nftEvent(2)), true)
  assert.equal(
    client.getQueryData<{ items: typeof nfts }>(['catalog', {}])?.items[0]
      .price,
    '2.50',
  )
  assert.equal(
    client.getQueryData<typeof original>(['nft', original.id])
      ?.availableQuantity,
    3,
  )
  assert.equal(
    client.getQueryData<{ items: Array<{ nft: typeof original }> }>([
      'cart',
      'user-a',
    ])?.items[0].nft.price,
    '2.50',
  )
  assert.equal(await applyNftUpdate(client, nftEvent(2)), false)
  assert.equal(await applyNftUpdate(client, nftEvent(1, '0.50')), false)
  client.clear()
})

test('atualizacao privada de pedido exige a identidade da sessao atual', async () => {
  resetRealtimeVersions()
  const client = new QueryClient()
  const event = {
    eventId: 'order-1-v2',
    sequence: 1,
    orderId: 'order-1',
    userId: 'user-a',
    status: 'confirmed' as const,
    transactionId: 'simulated-order-1',
    version: 2,
    occurredAt: new Date(0).toISOString(),
  }
  const order: Order = {
    id: 'order-1',
    status: 'pending',
    transactionId: null,
    items: [],
    subtotal: '1',
    discount: '0',
    networkFee: '0.016',
    total: '1.016',
    wallet: {
      id: 'wallet-1',
      label: 'Principal',
      address: '0x123',
      ensName: null,
      network: 'Ethereum',
      provider: 'MetaMask',
      isPrimary: true,
      balance: '10.0',
    },
    createdAt: new Date(0).toISOString(),
    version: 1,
  }
  client.setQueryData(['orders', 'user-a', 'order-1'], order)
  assert.equal(await applyOrderUpdate(client, event, 'user-b'), false)
  assert.equal(await applyOrderUpdate(client, event, 'user-a'), true)
  assert.equal(
    client.getQueryData<Order>(['orders', 'user-a', 'order-1'])?.status,
    'confirmed',
  )
  assert.equal(await applyOrderUpdate(client, event, 'user-a'), false)
  assert.equal(
    await applyOrderUpdate(
      client,
      { ...event, eventId: 'order-1-v1', version: 1, status: 'pending' },
      'user-a',
    ),
    false,
  )
  client.clear()
})

test('assinatura e remocao de listeners nao duplicam eventos', () => {
  const client = new QueryClient()
  const socket = createClient('http://127.0.0.1:1', {
    autoConnect: false,
  }) as Socket<RealtimeServerToClientEvents, RealtimeClientToServerEvents>
  const setState = () => undefined
  const cleanup = subscribeRealtimeEvents(socket, client, () => null, setState)
  assert.equal(socket.listeners('nft.updated').length, 1)
  cleanup()
  assert.equal(socket.listeners('nft.updated').length, 0)
  assert.equal(socket.listeners('order.updated').length, 0)
  client.clear()
  socket.disconnect()
})
