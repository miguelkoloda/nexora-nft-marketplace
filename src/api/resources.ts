import { http, resetApiClientState } from './client'
import type {
  Cart,
  CatalogQuery,
  Collection,
  Nft,
  Order,
  PageResult,
  Profile,
  Quote,
  Session,
  Wallet,
} from '../domain/types'

export type Credentials = { email: string; password: string }
export type Registration = Credentials & {
  username: string
  displayName: string
}
export type CartItemInput = {
  nftId: string
  quantity: number
  edition?: string
}
export type ProfileUpdate = Partial<
  Pick<Profile, 'username' | 'displayName' | 'phone' | 'address'>
>
export type WalletInput = Omit<Wallet, 'id' | 'balance'> & { balance?: string }
export type OrderInput = { quoteId: string; walletId: string }

export const catalogApi = {
  list: (query: CatalogQuery = {}, signal?: AbortSignal) =>
    http
      .get<PageResult<Nft>>('/nfts', { params: query, signal })
      .then((r) => r.data),
  get: (id: string, signal?: AbortSignal) =>
    http
      .get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })
      .then((r) => r.data),
  collections: (signal?: AbortSignal) =>
    http.get<Collection[]>('/collections', { signal }).then((r) => r.data),
}

export const authApi = {
  login: (input: Credentials) =>
    http.post<Session>('/auth/login', input).then((r) => r.data),
  register: (input: Registration) =>
    http.post<Session>('/auth/register', input).then((r) => r.data),
  session: (signal?: AbortSignal) =>
    http.get<Session>('/auth/session', { signal }).then((r) => r.data),
  logout: () => http.post<{ ok: true }>('/auth/logout').then((r) => r.data),
}

export const profileApi = {
  get: (signal?: AbortSignal) =>
    http.get<Profile>('/profile', { signal }).then((r) => r.data),
  update: (input: ProfileUpdate) =>
    http.patch<Profile>('/profile', input).then((r) => r.data),
  updateAvatar: (avatarUrl: string | null) =>
    http.put<Profile>('/profile/avatar', { avatarUrl }).then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    http
      .put<{ ok: true }>('/profile/password', { currentPassword, newPassword })
      .then((r) => r.data),
}

export const favoritesApi = {
  list: (signal?: AbortSignal) =>
    http.get<Nft[]>('/favorites', { signal }).then((r) => r.data),
  add: (nftId: string) =>
    http
      .put<Nft>(`/favorites/${encodeURIComponent(nftId)}`)
      .then((r) => r.data),
  remove: (nftId: string) =>
    http
      .delete<{ ok: true }>(`/favorites/${encodeURIComponent(nftId)}`)
      .then((r) => r.data),
}

export const cartApi = {
  get: (signal?: AbortSignal) =>
    http.get<Cart>('/cart', { signal }).then((r) => r.data),
  add: (item: CartItemInput) =>
    http.post<Cart>('/cart/items', item).then((r) => r.data),
  update: (nftId: string, quantity: number) =>
    http
      .patch<Cart>(`/cart/items/${encodeURIComponent(nftId)}`, { quantity })
      .then((r) => r.data),
  remove: (nftId: string) =>
    http
      .delete<Cart>(`/cart/items/${encodeURIComponent(nftId)}`)
      .then((r) => r.data),
  applyCoupon: (code: string) =>
    http.post<Cart>('/cart/coupon', { code }).then((r) => r.data),
  removeCoupon: () => http.delete<Cart>('/cart/coupon').then((r) => r.data),
  quote: (signal?: AbortSignal) =>
    http.post<Quote>('/checkout/quote', {}, { signal }).then((r) => r.data),
}

export const walletsApi = {
  list: (signal?: AbortSignal) =>
    http.get<Wallet[]>('/wallets', { signal }).then((r) => r.data),
  create: (input: WalletInput) =>
    http.post<Wallet>('/wallets', input).then((r) => r.data),
  update: (id: string, input: Partial<WalletInput>) =>
    http
      .patch<Wallet>(`/wallets/${encodeURIComponent(id)}`, input)
      .then((r) => r.data),
}

export const ordersApi = {
  create: (input: OrderInput, idempotencyKey: string) =>
    http
      .post<Order>('/orders', input, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .then((r) => r.data),
  list: (signal?: AbortSignal) =>
    http.get<Order[]>('/orders', { signal }).then((r) => r.data),
  get: (id: string, signal?: AbortSignal) =>
    http
      .get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })
      .then((r) => r.data),
}

export const mockApi = {
  reset: () =>
    http.post<{ ok: true }>('/__mock/reset').then((r) => {
      resetApiClientState()
      return r.data
    }),
}
