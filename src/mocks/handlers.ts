import { delay, http, HttpResponse } from 'msw'
import type { JsonBodyType } from 'msw'
import type {
  CartItemInput,
  ProfileUpdate,
  Registration,
  WalletInput,
} from '../api/resources'
import {
  addCartItem,
  addFavorite,
  authenticate,
  changePassword,
  createOrder,
  createQuote,
  DatabaseError,
  findNft,
  getCart,
  getOrder,
  getProfile,
  getSessionFromToken,
  getWallets,
  addWalletDemoBalance,
  changeNftForScenario,
  getCollections,
  listFavorites,
  listNfts,
  listOrders,
  login,
  ownerForRequest,
  register,
  removeCartItem,
  removeFavorite,
  removeSession,
  resetMockDatabase,
  saveWallet,
  setCoupon,
  updateAvatar,
  updateCartItem,
  updateProfile,
  applyRealtimeNftUpdate,
  getRealtimeNftVersion,
  applyRealtimeOrderUpdate,
} from './database'
import type { User, NftMarketUpdate, OrderUpdatedEvent } from '../domain/types'
import { realtimeServerUrl, realtimeStateSyncEnabled } from '../realtime/config'

type ErrorResponse = {
  code: string
  message: string
  fields?: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isServiceWorkerRequest(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.serviceWorker?.controller) &&
    realtimeStateSyncEnabled
  )
}

async function syncRealtimeState(request: Request): Promise<void> {
  if (!isServiceWorkerRequest()) return
  const headers = new Headers()
  const realtimeToken = request.headers.get('X-Realtime-Token')
  if (realtimeToken) headers.set('Authorization', `Bearer ${realtimeToken}`)
  const fetchState = async <T>(path: string): Promise<T | null> => {
    try {
      const response = await fetch(
        `${realtimeServerUrl}/__demo/state/${path}`,
        {
          headers,
          signal: AbortSignal.timeout(300),
        },
      )
      if (!response.ok) return null
      return (await response.json()) as T
    } catch {
      return null
    }
  }
  const [nftState, orderState] = await Promise.all([
    fetchState<{ updates?: unknown }>('nfts'),
    realtimeToken
      ? fetchState<{ updates?: unknown }>('orders')
      : Promise.resolve(null),
  ])
  if (Array.isArray(nftState?.updates)) {
    const updates = nftState.updates.filter(
      isRecord,
    ) as unknown as NftMarketUpdate[]
    updates.sort((a, b) => a.sequence - b.sequence)
    updates.forEach(applyRealtimeNftUpdate)
  }
  if (Array.isArray(orderState?.updates)) {
    const updates = orderState.updates.filter(
      isRecord,
    ) as unknown as OrderUpdatedEvent[]
    updates.sort((a, b) => a.sequence - b.sequence)
    updates.forEach(applyRealtimeOrderUpdate)
  }
}

async function readBody<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

async function respond(
  request: Request,
  action: () => Promise<unknown> | unknown,
): Promise<Response> {
  const scenario = request.headers.get('X-Mock-Scenario')
  if (scenario === 'slow') await delay(650)
  if (scenario === 'network-error') return HttpResponse.error()
  if (scenario === 'server-error') {
    return HttpResponse.json<ErrorResponse>(
      { code: 'MOCK_SERVER_ERROR', message: 'Falha simulada no serviço.' },
      { status: 503 },
    )
  }
  try {
    const result = await action()
    if (result instanceof Response) return result
    return HttpResponse.json(result as JsonBodyType)
  } catch (error) {
    if (error instanceof DatabaseError) {
      const payload: ErrorResponse = {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      }
      return HttpResponse.json(payload, { status: error.status })
    }
    return HttpResponse.json<ErrorResponse>(
      {
        code: 'MOCK_HANDLER_ERROR',
        message: 'Falha inesperada no serviço simulado.',
      },
      { status: 500 },
    )
  }
}

function tokenFrom(request: Request): string | null {
  return (
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null
  )
}

function requireUser(request: Request): User {
  if (request.headers.get('X-Mock-Scenario') === 'session-expired') {
    throw new DatabaseError(401, 'SESSION_EXPIRED', 'Sua sessão expirou.')
  }
  const user = authenticate(tokenFrom(request))
  if (!user)
    throw new DatabaseError(
      401,
      'UNAUTHORIZED',
      'Entre na sua conta para continuar.',
    )
  return user
}

function owner(request: Request): string {
  const token = tokenFrom(request)
  if (token) {
    if (request.headers.get('X-Mock-Scenario') === 'session-expired')
      throw new DatabaseError(401, 'SESSION_EXPIRED', 'Sua sessão expirou.')
    const user = authenticate(token)
    if (!user)
      throw new DatabaseError(
        401,
        'UNAUTHORIZED',
        'Sessão inválida ou expirada.',
      )
    return ownerForRequest(user.id, request.headers.get('X-Guest-Id'))
  }
  return ownerForRequest(null, request.headers.get('X-Guest-Id'))
}

export const handlers = [
  http.post('*/api/__mock/realtime/nft', ({ request }) =>
    respond(request, async () => {
      const body = await readBody<{
        nftId?: unknown
        price?: unknown
        availableQuantity?: unknown
      }>(request)
      if (
        typeof body.nftId !== 'string' ||
        (body.price !== undefined && typeof body.price !== 'string') ||
        (body.availableQuantity !== undefined &&
          typeof body.availableQuantity !== 'number')
      )
        throw new DatabaseError(422, 'INVALID_NFT_UPDATE', 'Evento invÃ¡lido.')
      const nft = findNft(body.nftId)
      if (!nft)
        throw new DatabaseError(404, 'NFT_NOT_FOUND', 'NFT nÃ£o encontrado.')
      const price = body.price ?? nft.price
      const availableQuantity = body.availableQuantity ?? nft.availableQuantity
      if (
        typeof price !== 'string' ||
        !/^\d+(\.\d{1,18})?$/.test(price) ||
        typeof availableQuantity !== 'number' ||
        !Number.isSafeInteger(availableQuantity) ||
        availableQuantity < 0
      )
        throw new DatabaseError(422, 'INVALID_NFT_UPDATE', 'Evento invÃ¡lido.')
      const previousVersion = getRealtimeNftVersion(nft.id)
      const version = Math.max(Date.now(), previousVersion + 1)
      const event: NftMarketUpdate = {
        eventId: `msw-nft:${nft.id}:${version}`,
        sequence: version,
        nftId: nft.id,
        price,
        availableQuantity,
        version,
        occurredAt: new Date().toISOString(),
      }
      if (!applyRealtimeNftUpdate(event))
        throw new DatabaseError(409, 'STALE_NFT_UPDATE', 'Evento desatualizado.')
      return event
    }),
  ),
  http.post('*/api/__mock/realtime/order', ({ request }) =>
    respond(request, async () => {
      const user = requireUser(request)
      const body = await readBody<{
        orderId?: unknown
        status?: unknown
        transactionId?: unknown
      }>(request)
      if (
        typeof body.orderId !== 'string' ||
        !['confirmed', 'declined'].includes(String(body.status)) ||
        (body.transactionId !== undefined &&
          body.transactionId !== null &&
          typeof body.transactionId !== 'string')
      )
        throw new DatabaseError(422, 'INVALID_ORDER_UPDATE', 'Evento invÃ¡lido.')
      const order = getOrder(user.id, body.orderId)
      if (!order)
        throw new DatabaseError(404, 'ORDER_NOT_FOUND', 'Pedido nÃ£o encontrado.')
      if (order.status !== 'pending')
        throw new DatabaseError(409, 'ORDER_STATUS_TERMINAL', 'Pedido finalizado.')
      const version = Math.max(Date.now(), order.version + 1)
      const event: OrderUpdatedEvent = {
        eventId: `msw-order:${order.id}:${version}`,
        sequence: version,
        orderId: order.id,
        userId: user.id,
        status: body.status as OrderUpdatedEvent['status'],
        transactionId:
          body.status === 'confirmed'
            ? typeof body.transactionId === 'string'
              ? body.transactionId
              : `simulated-${order.id}`
            : null,
        version,
        occurredAt: new Date().toISOString(),
      }
      if (!applyRealtimeOrderUpdate(event))
        throw new DatabaseError(409, 'STALE_ORDER_UPDATE', 'Evento desatualizado.')
      return event
    }),
  ),
  http.get('*/api/nfts', ({ request }) =>
    respond(request, async () => {
      await syncRealtimeState(request)
      return listNfts(new URL(request.url).searchParams)
    }),
  ),
  http.get('*/api/nfts/:nftId', ({ request, params }) =>
    respond(request, async () => {
      await syncRealtimeState(request)
      const nft = findNft(String(params.nftId))
      if (!nft)
        throw new DatabaseError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
      return nft
    }),
  ),
  http.get('*/api/collections', ({ request }) =>
    respond(request, getCollections),
  ),

  http.post('*/api/auth/login', ({ request }) =>
    respond(request, async () => {
      const body = await readBody<{ email?: string; password?: string }>(
        request,
      )
      if (typeof body.email !== 'string' || typeof body.password !== 'string')
        throw new DatabaseError(
          422,
          'VALIDATION_ERROR',
          'Informe e-mail e senha.',
        )
      return login(
        body.email,
        body.password,
        request.headers.get('X-Guest-Id') ?? 'anonymous',
      )
    }),
  ),
  http.post('*/api/auth/register', ({ request }) =>
    respond(request, async () => {
      const body = await readBody<Partial<Registration>>(request)
      if (
        typeof body.email !== 'string' ||
        typeof body.password !== 'string' ||
        typeof body.username !== 'string' ||
        typeof body.displayName !== 'string'
      ) {
        throw new DatabaseError(
          422,
          'VALIDATION_ERROR',
          'Preencha os campos obrigatórios.',
        )
      }
      return register(
        body as Registration,
        request.headers.get('X-Guest-Id') ?? 'anonymous',
      )
    }),
  ),
  http.get('*/api/auth/session', ({ request }) =>
    respond(request, () => {
      if (request.headers.get('X-Mock-Scenario') === 'session-expired')
        throw new DatabaseError(401, 'SESSION_EXPIRED', 'Sua sessão expirou.')
      const session = getSessionFromToken(tokenFrom(request))
      if (!session)
        throw new DatabaseError(
          401,
          'UNAUTHORIZED',
          'Sessão inválida ou expirada.',
        )
      return session
    }),
  ),
  http.post('*/api/auth/logout', ({ request }) =>
    respond(request, () => {
      removeSession(tokenFrom(request))
      return { ok: true }
    }),
  ),

  http.get('*/api/profile', ({ request }) =>
    respond(request, () => getProfile(requireUser(request).id)),
  ),
  http.patch('*/api/profile', ({ request }) =>
    respond(request, async () =>
      updateProfile(
        requireUser(request).id,
        await readBody<ProfileUpdate>(request),
      ),
    ),
  ),
  http.put('*/api/profile/avatar', ({ request }) =>
    respond(request, async () => {
      const body = await readBody<{ avatarUrl?: string | null }>(request)
      if (body.avatarUrl !== null && typeof body.avatarUrl !== 'string')
        throw new DatabaseError(
          422,
          'VALIDATION_ERROR',
          'Informe uma URL de avatar válida.',
        )
      return updateAvatar(requireUser(request).id, body.avatarUrl ?? null)
    }),
  ),
  http.put('*/api/profile/password', ({ request }) =>
    respond(request, async () => {
      const body = await readBody<{
        currentPassword?: string
        newPassword?: string
      }>(request)
      if (
        typeof body.currentPassword !== 'string' ||
        typeof body.newPassword !== 'string'
      )
        throw new DatabaseError(
          422,
          'VALIDATION_ERROR',
          'Informe a senha atual e a nova senha.',
        )
      await changePassword(
        requireUser(request).id,
        body.currentPassword,
        body.newPassword,
      )
      return { ok: true }
    }),
  ),

  http.get('*/api/favorites', ({ request }) =>
    respond(request, () => listFavorites(requireUser(request).id)),
  ),
  http.put('*/api/favorites/:nftId', ({ request, params }) =>
    respond(request, () =>
      addFavorite(requireUser(request).id, String(params.nftId)),
    ),
  ),
  http.delete('*/api/favorites/:nftId', ({ request, params }) =>
    respond(request, () => {
      const user = requireUser(request)
      removeFavorite(user.id, String(params.nftId))
      return { ok: true }
    }),
  ),

  http.get('*/api/cart', ({ request }) =>
    respond(request, async () => {
      await syncRealtimeState(request)
      return getCart(owner(request))
    }),
  ),
  http.post('*/api/cart/items', ({ request }) =>
    respond(request, async () => {
      await syncRealtimeState(request)
      return addCartItem(owner(request), await readBody<CartItemInput>(request))
    }),
  ),
  http.patch('*/api/cart/items/:nftId', ({ request, params }) =>
    respond(request, async () => {
      const body = await readBody<{ quantity?: number }>(request)
      return updateCartItem(
        owner(request),
        String(params.nftId),
        Number(body.quantity),
      )
    }),
  ),
  http.delete('*/api/cart/items/:nftId', ({ request, params }) =>
    respond(request, () =>
      removeCartItem(owner(request), String(params.nftId)),
    ),
  ),
  http.post('*/api/cart/coupon', ({ request }) =>
    respond(request, async () => {
      const body = await readBody<{ code?: string }>(request)
      if (typeof body.code !== 'string')
        throw new DatabaseError(
          422,
          'COUPON_INVALID',
          'Informe um código promocional.',
        )
      return setCoupon(owner(request), body.code)
    }),
  ),
  http.delete('*/api/cart/coupon', ({ request }) =>
    respond(request, () => setCoupon(owner(request), null)),
  ),

  http.post('*/api/checkout/quote', ({ request }) =>
    respond(request, async () => {
      await syncRealtimeState(request)
      return createQuote(owner(request))
    }),
  ),
  http.get('*/api/wallets', ({ request }) =>
    respond(request, () => getWallets(requireUser(request).id)),
  ),
  http.post('*/api/wallets', ({ request }) =>
    respond(request, async () =>
      saveWallet(requireUser(request).id, await readBody<WalletInput>(request)),
    ),
  ),
  http.patch('*/api/wallets/:walletId', ({ request, params }) =>
    respond(request, async () =>
      saveWallet(
        requireUser(request).id,
        await readBody<WalletInput>(request),
        String(params.walletId),
      ),
    ),
  ),
  http.post('*/api/wallets/:walletId/demo-balance', ({ request, params }) =>
    respond(request, async () => {
      const body = await readBody<{ amount?: unknown }>(request)
      if (typeof body.amount !== 'string')
        throw new DatabaseError(
          422,
          'INVALID_DEMO_TOP_UP',
          'Informe o valor demonstrativo em ETH.',
        )
      return addWalletDemoBalance(
        requireUser(request).id,
        String(params.walletId),
        body.amount,
      )
    }),
  ),

  http.post('*/api/orders', ({ request }) =>
    respond(request, async () => {
      await syncRealtimeState(request)
      const user = requireUser(request)
      const body = await readBody<{ quoteId?: string; walletId?: string }>(
        request,
      )
      if (!body.quoteId || !body.walletId)
        throw new DatabaseError(
          422,
          'VALIDATION_ERROR',
          'Cotação e carteira são obrigatórias.',
        )
      const scenario = request.headers.get('X-Mock-Scenario')
      if (scenario === 'price-changed')
        changeNftForScenario('emerald-ape-042', { price: '9.99' })
      if (scenario === 'stock-changed')
        changeNftForScenario('emerald-ape-042', { availableQuantity: 0 })
      const result = createOrder(
        user.id,
        body.quoteId,
        body.walletId,
        request.headers.get('Idempotency-Key') ?? '',
        scenario,
      )
      if (
        !result.recovered &&
        request.headers.get('X-Mock-Scenario') === 'timeout-after-create'
      )
        return HttpResponse.error()
      return result.order
    }),
  ),
  http.get('*/api/orders', ({ request }) =>
    respond(request, async () => {
      await syncRealtimeState(request)
      return listOrders(requireUser(request).id)
    }),
  ),
  http.get('*/api/orders/:orderId', ({ request, params }) =>
    respond(request, async () => {
      await syncRealtimeState(request)
      const order = getOrder(requireUser(request).id, String(params.orderId))
      if (!order)
        throw new DatabaseError(
          404,
          'ORDER_NOT_FOUND',
          'Pedido não encontrado.',
        )
      return order
    }),
  ),

  http.post('*/api/__mock/reset', ({ request }) =>
    respond(request, () => {
      resetMockDatabase()
      return { ok: true }
    }),
  ),
]
