import type { QueryClient, Query } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import type {
  Cart,
  Nft,
  NftMarketUpdate,
  Order,
  OrderUpdatedEvent,
  PageResult,
} from '../domain/types'
import type {
  RealtimeClientToServerEvents,
  RealtimeConnectionState,
  RealtimeServerToClientEvents,
} from './contracts'

const nftVersions = new Map<string, number>()
const orderVersions = new Map<string, number>()
const eventIds = new Set<string>()

function updateNft(nft: Nft, event: NftMarketUpdate): Nft {
  return nft.id === event.nftId
    ? { ...nft, price: event.price, availableQuantity: event.availableQuantity }
    : nft
}

function isNftArray(value: unknown): value is Nft[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === 'object' && item !== null && 'id' in item,
    )
  )
}

function patchNftQuery(
  query: Query,
  event: NftMarketUpdate,
  client: QueryClient,
): void {
  const key = query.queryKey
  if (key[0] === 'catalog') {
    client.setQueryData<PageResult<Nft>>(
      key,
      (current) =>
        current && {
          ...current,
          items: current.items.map((item) => updateNft(item, event)),
        },
    )
  } else if (key[0] === 'nft' && key[1] === event.nftId) {
    client.setQueryData<Nft>(
      key,
      (current) => current && updateNft(current, event),
    )
  } else if (key[0] === 'cart') {
    client.setQueryData<Cart>(
      key,
      (current) =>
        current && {
          ...current,
          items: current.items.map((item) => ({
            ...item,
            nft: updateNft(item.nft, event),
          })),
        },
    )
  } else if (key[0] === 'favorites' || key[0] === 'collections') {
    client.setQueryData(key, (current: unknown) =>
      isNftArray(current)
        ? current.map((item) => updateNft(item, event))
        : current,
    )
  }
}

export async function applyNftUpdate(
  client: QueryClient,
  event: NftMarketUpdate,
): Promise<boolean> {
  if (
    !event.eventId ||
    !event.nftId ||
    eventIds.has(event.eventId) ||
    !Number.isSafeInteger(event.sequence) ||
    event.sequence < 1 ||
    !Number.isSafeInteger(event.version) ||
    event.version < 1 ||
    event.version <= (nftVersions.get(event.nftId) ?? 0)
  )
    return false
  if (
    !/^\d+(\.\d{1,18})?$/.test(event.price) ||
    BigInt(event.price.replace('.', '')) <= 0n ||
    !Number.isSafeInteger(event.availableQuantity) ||
    event.availableQuantity < 0
  )
    return false
  const related = client
    .getQueryCache()
    .findAll({
      predicate: (query) =>
        ['catalog', 'nft', 'cart', 'checkout', 'favorites'].includes(
          String(query.queryKey[0]),
        ),
    })
  await Promise.all(
    related.map((query) =>
      client.cancelQueries({ queryKey: query.queryKey, exact: true }),
    ),
  )
  nftVersions.set(event.nftId, event.version)
  eventIds.add(event.eventId)
  for (const query of related) patchNftQuery(query, event, client)
  await Promise.all([
    client.invalidateQueries({ queryKey: ['catalog'] }),
    client.invalidateQueries({ queryKey: ['nft', event.nftId] }),
    client.invalidateQueries({ queryKey: ['cart'] }),
    client.invalidateQueries({ queryKey: ['checkout', 'quote'] }),
  ])
  return true
}

export async function applyOrderUpdate(
  client: QueryClient,
  event: OrderUpdatedEvent,
  currentUserId: string | null,
): Promise<boolean> {
  const key = `${event.userId}:${event.orderId}`
  if (
    !currentUserId ||
    !event.userId ||
    !event.orderId ||
    event.userId !== currentUserId ||
    !event.eventId ||
    eventIds.has(event.eventId) ||
    !Number.isSafeInteger(event.sequence) ||
    event.sequence < 1 ||
    !Number.isSafeInteger(event.version) ||
    event.version < 1 ||
    event.version <= (orderVersions.get(key) ?? 0) ||
    !['pending', 'confirmed', 'declined'].includes(event.status) ||
    (event.transactionId !== null && typeof event.transactionId !== 'string')
  )
    return false
  const orderQueryKey = ['orders', currentUserId, event.orderId] as const
  await client.cancelQueries({ queryKey: orderQueryKey, exact: true })
  orderVersions.set(key, event.version)
  eventIds.add(event.eventId)
  client.setQueryData<Order>(orderQueryKey, (current) =>
    current && current.version < event.version
      ? {
          ...current,
          status: event.status,
          transactionId: event.transactionId,
          version: event.version,
        }
      : current,
  )
  await Promise.all([
    client.invalidateQueries({ queryKey: ['orders', currentUserId] }),
    client.invalidateQueries({ queryKey: orderQueryKey }),
    client.invalidateQueries({ queryKey: ['cart', currentUserId] }),
    client.invalidateQueries({
      queryKey: ['checkout', 'quote', currentUserId],
    }),
  ])
  return true
}

export function resetRealtimeVersions(): void {
  nftVersions.clear()
  orderVersions.clear()
  eventIds.clear()
}

export function subscribeRealtimeEvents(
  socket: Socket<RealtimeServerToClientEvents, RealtimeClientToServerEvents>,
  client: QueryClient,
  getCurrentUserId: () => string | null,
  setState: (state: RealtimeConnectionState) => void,
): () => void {
  const onConnect = () => {
    setState('connected')
    const userId = getCurrentUserId()
    void client.invalidateQueries({
      predicate: (query) =>
        ['catalog', 'nft'].includes(String(query.queryKey[0])) ||
        (query.queryKey[0] === 'cart' && query.queryKey[1] === userId) ||
        (query.queryKey[0] === 'checkout' && query.queryKey[2] === userId) ||
        (query.queryKey[0] === 'orders' && query.queryKey[1] === userId),
    })
  }
  const onDisconnect = () => setState('disconnected')
  const onError = () => setState('error')
  const onNftUpdate = (event: NftMarketUpdate) => {
    void applyNftUpdate(client, event)
  }
  const onOrderUpdate = (event: OrderUpdatedEvent) => {
    void applyOrderUpdate(client, event, getCurrentUserId())
  }
  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)
  socket.on('connect_error', onError)
  socket.on('nft.updated', onNftUpdate)
  socket.on('order.updated', onOrderUpdate)
  return () => {
    socket.off('connect', onConnect)
    socket.off('disconnect', onDisconnect)
    socket.off('connect_error', onError)
    socket.off('nft.updated', onNftUpdate)
    socket.off('order.updated', onOrderUpdate)
  }
}
