import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { AppShell } from '../components/layout/AppShell'
import { NotFoundPage } from '../components/feedback/NotFoundPage'
import type { CatalogQuery } from '../domain/types'
import { authApi } from '../api/resources'
import { ApiError } from '../api/client'

const rootRoute = createRootRoute({ component: () => <Outlet /> })
const HomePage = lazyRouteComponent(
  () => import('../features/catalog/HomePage'),
  'HomePage',
)
const NftPage = lazyRouteComponent(
  () => import('../features/catalog/NftPage'),
  'NftPage',
)
const CartPage = lazyRouteComponent(
  () => import('../features/cart/CartPage'),
  'CartPage',
)
const CheckoutPage = lazyRouteComponent(
  () => import('../features/checkout/CheckoutPage'),
  'CheckoutPage',
)
const AuthPage = lazyRouteComponent(
  () => import('../features/auth/AuthPage'),
  'AuthPage',
)
const AccountPage = lazyRouteComponent(
  () => import('../features/account/AccountPage'),
  'AccountPage',
)

function DetailRoutePending() {
  return (
    <section
      className="route-detail-pending page-wrap"
      aria-label="Carregando detalhes do NFT"
      aria-busy="true"
    >
      <div className="detail-loading-skeleton" />
    </section>
  )
}
const ConfirmationPage = lazyRouteComponent(
  () => import('../features/orders/ConfirmationPage'),
  'ConfirmationPage',
)
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'shell',
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})

const catalogSorts: CatalogQuery['sort'][] = [
  'recent',
  'price-asc',
  'price-desc',
  'popular',
]

function validateCatalogSearch(search: Record<string, unknown>): CatalogQuery {
  const page = Number(search.page)
  return {
    ...(typeof search.search === 'string' && search.search.trim()
      ? { search: search.search.trim() }
      : {}),
    ...(typeof search.category === 'string'
      ? { category: search.category }
      : {}),
    ...(typeof search.network === 'string' ? { network: search.network } : {}),
    ...(typeof search.minPrice === 'string'
      ? { minPrice: search.minPrice }
      : {}),
    ...(typeof search.maxPrice === 'string'
      ? { maxPrice: search.maxPrice }
      : {}),
    ...(catalogSorts.includes(search.sort as CatalogQuery['sort'])
      ? { sort: search.sort as CatalogQuery['sort'] }
      : {}),
    ...(Number.isSafeInteger(page) && page > 0 ? { page } : {}),
  }
}

function validateAuthSearch(search: Record<string, unknown>) {
  return {
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }
}

async function requireSession({
  location,
}: {
  location: { pathname: string }
}) {
  try {
    return await authApi.session()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect({
        to: '/login',
        search: { returnTo: location.pathname },
      })
    }
    throw error
  }
}

const indexRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: HomePage,
})
const nftRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/nft/$nftId',
  pendingComponent: DetailRoutePending,
  component: NftPage,
})
const cartRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/cart',
  component: CartPage,
})
const checkoutRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/checkout',
  beforeLoad: requireSession,
  component: CheckoutPage,
})
const loginRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/login',
  validateSearch: validateAuthSearch,
  component: () => <AuthPage mode="login" />,
})
const registerRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/register',
  validateSearch: validateAuthSearch,
  component: () => <AuthPage mode="register" />,
})
const profileRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/account/profile',
  beforeLoad: requireSession,
  component: () => <AccountPage section="profile" />,
})
const walletsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/account/wallets',
  beforeLoad: requireSession,
  component: () => <AccountPage section="wallets" />,
})
const ordersRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/account/orders',
  beforeLoad: requireSession,
  component: () => <AccountPage section="orders" />,
})
const confirmationRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/orders/$orderId/confirmation',
  beforeLoad: requireSession,
  component: ConfirmationPage,
})
const notFoundRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '$',
  component: NotFoundPage,
})

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    indexRoute,
    nftRoute,
    cartRoute,
    checkoutRoute,
    loginRoute,
    registerRoute,
    profileRoute,
    walletsRoute,
    ordersRoute,
    confirmationRoute,
    notFoundRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
