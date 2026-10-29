import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Nft } from '../domain/types'
import type { CatalogQuery } from '../domain/types'
import type { Session } from '../domain/types'
import { ApiError, getSessionToken, getSessionUserId } from './client'
import {
  authApi,
  cartApi,
  catalogApi,
  favoritesApi,
  mockApi,
  ordersApi,
  profileApi,
  walletsApi,
} from './resources'
import type {
  CartItemInput,
  Credentials,
  OrderInput,
  ProfileUpdate,
  Registration,
  WalletInput,
} from './resources'

export const queryKeys = {
  catalog: (query: CatalogQuery) => ['catalog', query] as const,
  nft: (id: string) => ['nft', id] as const,
  collections: ['collections'] as const,
  session: ['session'] as const,
  profile: (userId: string | null) => ['profile', userId] as const,
  favorites: (userId: string | null) => ['favorites', userId] as const,
  cart: (userId: string | null) => ['cart', userId] as const,
  quote: (userId: string | null) => ['checkout', 'quote', userId] as const,
  wallets: (userId: string | null) => ['wallets', userId] as const,
  orders: (userId: string | null) => ['orders', userId] as const,
  order: (userId: string | null, id: string) => ['orders', userId, id] as const,
}

export function useNfts(query: CatalogQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog(query),
    queryFn: ({ signal }) => catalogApi.list(query, signal),
    enabled,
  })
}

export function useNft(id: string) {
  return useQuery({
    queryKey: queryKeys.nft(id),
    queryFn: ({ signal }) => catalogApi.get(id, signal),
    enabled: Boolean(id),
  })
}

export function useCollections() {
  return useQuery({
    queryKey: queryKeys.collections,
    queryFn: ({ signal }) => catalogApi.collections(signal),
  })
}

export function useSession() {
  return useQuery<Session | null>({
    queryKey: queryKeys.session,
    queryFn: async ({ signal }) => {
      if (!getSessionToken()) return null
      try {
        return await authApi.session(signal)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    retry: false,
  })
}

export function useLogin() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (credentials: Credentials) => authApi.login(credentials),
    onSuccess: (session) => {
      client.setQueryData(queryKeys.session, session)
      void client.invalidateQueries({
        queryKey: queryKeys.profile(session.user.id),
      })
      void client.invalidateQueries({
        queryKey: queryKeys.favorites(session.user.id),
      })
      void client.invalidateQueries({
        queryKey: queryKeys.cart(session.user.id),
      })
      void client.invalidateQueries({
        queryKey: queryKeys.wallets(session.user.id),
      })
    },
  })
}

export function useRegister() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (registration: Registration) => authApi.register(registration),
    onSuccess: (session) => {
      client.setQueryData(queryKeys.session, session)
      void client.invalidateQueries({
        queryKey: queryKeys.profile(session.user.id),
      })
      void client.invalidateQueries({
        queryKey: queryKeys.favorites(session.user.id),
      })
      void client.invalidateQueries({
        queryKey: queryKeys.cart(session.user.id),
      })
      void client.invalidateQueries({
        queryKey: queryKeys.wallets(session.user.id),
      })
    },
  })
}

export function useLogout() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      void client.cancelQueries()
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'session',
      })
      client.setQueryData<Session | null>(queryKeys.session, null)
    },
  })
}

export function useResetMockScenario() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: mockApi.reset,
    onSuccess: () => client.clear(),
  })
}

export function useProfile(userId = getSessionUserId(), enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: ({ signal }) => profileApi.get(signal),
    enabled: enabled && Boolean(userId),
    retry: false,
  })
}

export function useUpdateProfile() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileUpdate) => profileApi.update(input),
    onSuccess: (profile) => {
      client.setQueryData(queryKeys.profile(profile.id), profile)
      void client.invalidateQueries({ queryKey: queryKeys.session })
    },
  })
}

export function useUpdateAvatar() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (avatarUrl: string | null) =>
      profileApi.updateAvatar(avatarUrl),
    onSuccess: (profile) =>
      client.setQueryData(queryKeys.profile(profile.id), profile),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => profileApi.changePassword(currentPassword, newPassword),
  })
}

export function useFavorites(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.favorites(userId),
    queryFn: ({ signal }) => favoritesApi.list(signal),
    enabled: Boolean(userId),
    retry: false,
  })
}

export function useToggleFavorite(userId: string) {
  const client = useQueryClient()
  const key = queryKeys.favorites(userId)
  return useMutation({
    mutationFn: async ({
      nft,
      isFavorite,
    }: {
      nft: Nft
      isFavorite: boolean
    }) => {
      if (isFavorite) await favoritesApi.remove(nft.id)
      else await favoritesApi.add(nft.id)
      return nft
    },
    onMutate: async ({
      nft,
      isFavorite,
    }): Promise<{ previous: Nft[] | undefined }> => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Nft[]>(key)
      if (previous) {
        client.setQueryData<Nft[]>(key, (current) =>
          isFavorite
            ? (current ?? []).filter((item) => item.id !== nft.id)
            : (current ?? []).some((item) => item.id === nft.id)
              ? current
              : [...(current ?? []), nft],
        )
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(key, context.previous)
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })
}

export function useCart(userId = getSessionUserId()) {
  return useQuery({
    queryKey: queryKeys.cart(userId),
    queryFn: ({ signal }) => cartApi.get(signal),
    refetchOnMount: 'always',
  })
}

export function useAddCartItem(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CartItemInput) => cartApi.add(input),
    onSuccess: (cart) => {
      client.setQueryData(queryKeys.cart(userId), cart)
      void client.invalidateQueries({ queryKey: queryKeys.quote(userId) })
    },
  })
}

export function useUpdateCartItem(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ nftId, quantity }: { nftId: string; quantity: number }) =>
      cartApi.update(nftId, quantity),
    onSuccess: (cart) => {
      client.setQueryData(queryKeys.cart(userId), cart)
      void client.invalidateQueries({ queryKey: queryKeys.quote(userId) })
    },
  })
}

export function useRemoveCartItem(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (nftId: string) => cartApi.remove(nftId),
    onSuccess: (cart) => {
      client.setQueryData(queryKeys.cart(userId), cart)
      void client.invalidateQueries({ queryKey: queryKeys.quote(userId) })
    },
  })
}

export function useApplyCoupon(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => cartApi.applyCoupon(code),
    onSuccess: (cart) => {
      client.setQueryData(queryKeys.cart(userId), cart)
      void client.invalidateQueries({ queryKey: queryKeys.quote(userId) })
    },
  })
}

export function useRemoveCoupon(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: cartApi.removeCoupon,
    onSuccess: (cart) => {
      client.setQueryData(queryKeys.cart(userId), cart)
      void client.invalidateQueries({ queryKey: queryKeys.quote(userId) })
    },
  })
}

export function useCheckoutQuote(userId = getSessionUserId(), enabled = true) {
  return useQuery({
    queryKey: queryKeys.quote(userId),
    queryFn: ({ signal }) => cartApi.quote(signal),
    enabled,
    refetchOnMount: 'always',
    retry: false,
  })
}

export function useWallets(userId = getSessionUserId(), enabled = true) {
  return useQuery({
    queryKey: queryKeys.wallets(userId),
    queryFn: ({ signal }) => walletsApi.list(signal),
    enabled: enabled && Boolean(userId),
    retry: false,
  })
}

export function useSaveWallet(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: WalletInput) => walletsApi.create(input),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.wallets(userId) }),
  })
}

export function useUpdateWallet(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WalletInput> }) =>
      walletsApi.update(id, input),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.wallets(userId) }),
  })
}

export function useAddDemoWalletBalance(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      walletsApi.addDemoBalance(id, amount),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.wallets(userId) }),
  })
}

export function useCreateOrder(userId = getSessionUserId()) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: OrderInput
      idempotencyKey: string
    }) => ordersApi.create(input, idempotencyKey),
    onSuccess: (order) => {
      client.setQueryData(queryKeys.order(userId, order.id), order)
      void client.invalidateQueries({ queryKey: queryKeys.orders(userId) })
      void client.invalidateQueries({ queryKey: queryKeys.cart(userId) })
      void client.invalidateQueries({ queryKey: queryKeys.quote(userId) })
      void client.invalidateQueries({ queryKey: queryKeys.wallets(userId) })
    },
  })
}

export function useOrders(userId = getSessionUserId(), enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders(userId),
    queryFn: ({ signal }) => ordersApi.list(signal),
    enabled: enabled && Boolean(userId),
    retry: false,
  })
}

export function useOrder(id: string, userId = getSessionUserId()) {
  return useQuery({
    queryKey: queryKeys.order(userId, id),
    queryFn: ({ signal }) => ordersApi.get(id, signal),
    enabled: Boolean(id) && Boolean(userId),
    retry: false,
  })
}
