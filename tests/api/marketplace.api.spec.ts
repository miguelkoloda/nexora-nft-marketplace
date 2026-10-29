import { expect, test } from '@playwright/test'
import {
  ApiError,
  getSessionToken,
  http,
  resetApiClientState,
  setMockScenario,
} from '../../src/api/client'
import {
  authApi,
  cartApi,
  catalogApi,
  favoritesApi,
  mockApi,
  ordersApi,
  profileApi,
  walletsApi,
} from '../../src/api/resources'
import { resetMockDatabase } from '../../src/mocks/database'
import { server } from '../../src/mocks/server'

test.describe.configure({ mode: 'serial' })

test.beforeAll(() => {
  http.defaults.baseURL = 'http://127.0.0.1/api'
  server.listen({ onUnhandledRequest: 'error' })
})
test.beforeEach(() => {
  server.resetHandlers()
  resetMockDatabase()
  resetApiClientState()
})
test.afterAll(() => server.close())

test('lista e filtra NFTs com paginação e ordenação', async () => {
  const result = await catalogApi.list({
    network: 'Ethereum',
    sort: 'price-asc',
    page: 1,
    pageSize: 2,
  })

  expect(result.total).toBe(5)
  expect(result.items).toHaveLength(2)
  expect(result.items[0].id).toBe('emerald-ape-071')
  expect(result.pageCount).toBe(3)
})

test('retorna 404 tipado para NFT inexistente', async () => {
  const request = catalogApi.get('missing-nft')
  await expect(request).rejects.toMatchObject<ApiError>({
    status: 404,
    code: 'NFT_NOT_FOUND',
  })
})

test('endpoint de evento MSW atualiza a fonte REST demonstrativa de NFTs', async () => {
  const response = await http.post('/__mock/realtime/nft', {
    nftId: 'emerald-ape-042',
    price: '6.75',
    availableQuantity: 3,
  })
  expect(response.data).toMatchObject({
    eventId: expect.stringContaining('msw-nft:emerald-ape-042:'),
    nftId: 'emerald-ape-042',
    price: '6.75',
    availableQuantity: 3,
  })
  await expect(catalogApi.get('emerald-ape-042')).resolves.toMatchObject({
    price: '6.75',
    availableQuantity: 3,
  })
})

test('combina busca, categoria, rede, faixa de preÃ§o e paginaÃ§Ã£o', async () => {
  const searched = await catalogApi.list({
    search: 'nomad',
    page: 1,
    pageSize: 20,
  })
  expect(searched.items.map((item) => item.id)).toEqual([
    'sage-nomad-009',
    'violet-nomad-314',
    'sage-nomad-028',
  ])

  const filtered = await catalogApi.list({
    category: 'Arte 3D',
    network: 'Ethereum',
    minPrice: '1.50',
    maxPrice: '2.00',
    sort: 'price-desc',
    page: 1,
    pageSize: 1,
  })
  expect(filtered.total).toBe(1)
  expect(filtered.items[0].id).toBe('neon-vessel-552')
  expect(filtered.pageCount).toBe(1)
})

test('catálogo retorna página vazia quando os filtros não encontram NFTs', async () => {
  const result = await catalogApi.list({
    search: 'inexistente',
    page: 1,
    pageSize: 9,
  })
  expect(result.items).toEqual([])
  expect(result.total).toBe(0)
  expect(result.pageCount).toBe(0)
})

test('autentica usuários, atualiza perfil e mantém favoritos isolados por conta', async () => {
  const alex = await authApi.login({
    email: 'alex@kurio.test',
    password: 'Kurio123!',
  })
  expect((await authApi.session()).user.id).toBe(alex.user.id)
  expect((await favoritesApi.list()).map((nft) => nft.id)).toEqual([
    'emerald-ape-042',
  ])

  await favoritesApi.add('violet-nomad-314')
  expect((await favoritesApi.list()).map((nft) => nft.id)).toContain(
    'violet-nomad-314',
  )
  await profileApi.update({ displayName: 'Alex Atualizado' })
  expect((await profileApi.get()).displayName).toBe('Alex Atualizado')

  await authApi.login({ email: 'sam@kurio.test', password: 'Collect123!' })
  expect((await favoritesApi.list()).map((nft) => nft.id)).toEqual([
    'golden-beat-207',
  ])
  await authApi.logout()
  await expect(authApi.session()).rejects.toMatchObject({
    status: 401,
    code: 'UNAUTHORIZED',
  })
})

test('valida cadastro, conflito de conta e expiração de sessão', async () => {
  const registration = {
    email: 'new@kurio.test',
    password: 'Collector123!',
    username: 'newcollector',
    displayName: 'New Collector',
  }
  await authApi.register(registration)
  await authApi.logout()
  await expect(authApi.register(registration)).rejects.toMatchObject({
    status: 409,
    code: 'ACCOUNT_CONFLICT',
  })

  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  setMockScenario('session-expired')
  await expect(profileApi.get()).rejects.toMatchObject({
    status: 401,
    code: 'SESSION_EXPIRED',
  })
  setMockScenario(null)
})

test('rejeita credenciais incorretas, mantém sessão no cliente e encerra logout', async () => {
  await expect(
    authApi.login({ email: 'alex@kurio.test', password: 'senha-incorreta' }),
  ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
  expect(getSessionToken()).toBeNull()

  const session = await authApi.login({
    email: 'alex@kurio.test',
    password: 'Kurio123!',
  })
  expect(getSessionToken()).toBe(session.token)
  expect((await authApi.session()).user.id).toBe(session.user.id)
  await authApi.logout()
  expect(getSessionToken()).toBeNull()
  await expect(authApi.session()).rejects.toMatchObject({ status: 401 })
})

test('rejeita dados inválidos de cadastro sem criar uma sessão', async () => {
  await expect(
    authApi.register({
      username: '',
      displayName: '',
      email: 'email-invalido',
      password: 'short',
    }),
  ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
  await expect(authApi.session()).rejects.toMatchObject({ status: 401 })
})

test('mescla carrinho visitante, aplica cupom e calcula ETH sem ponto flutuante', async () => {
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 2 })
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  expect((await cartApi.get()).items[0].quantity).toBe(2)

  await cartApi.applyCoupon('KURIO10')
  const quote = await cartApi.quote()
  expect(quote.subtotal).toBe('2.38')
  expect(quote.discount).toBe('0.238')
  expect(quote.networkFee).toBe('0.016')
  expect(quote.total).toBe('2.158')
})

test('rejeita cupom inválido ou expirado sem simular aplicação', async () => {
  await expect(cartApi.applyCoupon('WRONG')).rejects.toMatchObject({
    status: 422,
    code: 'COUPON_INVALID',
  })
  await expect(cartApi.applyCoupon('EXPIRED')).rejects.toMatchObject({
    status: 410,
    code: 'COUPON_EXPIRED',
  })
  expect((await cartApi.get()).couponCode).toBeNull()
})

test('carrinho visitante tem cotação precisa e suporta remoção de cupom e item', async () => {
  expect((await cartApi.get()).items).toHaveLength(0)
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 2 })
  let quote = await cartApi.quote()
  expect(quote.subtotal).toBe('2.38')
  expect(quote.total).toBe('2.396')

  await cartApi.applyCoupon('KURIO10')
  quote = await cartApi.quote()
  expect(quote.discount).toBe('0.238')
  expect(quote.total).toBe('2.158')

  await cartApi.removeCoupon()
  expect((await cartApi.quote()).discount).toBe('0')
  await cartApi.update('emerald-ape-042', 1)
  expect((await cartApi.get()).items[0].quantity).toBe(1)
  await cartApi.remove('emerald-ape-042')
  expect((await cartApi.get()).items).toHaveLength(0)
})

test('carrinhos autenticados permanecem isolados entre contas', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 2 })
  await authApi.login({ email: 'sam@kurio.test', password: 'Collect123!' })
  expect((await cartApi.get()).items).toHaveLength(0)
  await cartApi.add({ nftId: 'golden-beat-207', quantity: 1 })
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  expect((await cartApi.get()).items.map((item) => item.nftId)).toEqual([
    'emerald-ape-042',
  ])
})

test('login e carrinho preservam falhas HTTP e de rede', async () => {
  setMockScenario('server-error')
  await expect(
    authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' }),
  ).rejects.toMatchObject({ status: 503, code: 'MOCK_SERVER_ERROR' })
  await expect(cartApi.get()).rejects.toMatchObject({
    status: 503,
    code: 'MOCK_SERVER_ERROR',
  })

  setMockScenario('network-error')
  await expect(cartApi.get()).rejects.toMatchObject({
    status: 0,
    code: 'NETWORK_ERROR',
  })
  setMockScenario(null)
  expect((await cartApi.get()).items).toHaveLength(0)
})

test('cria pedido confirmado, recupera retry idempotente e preserva snapshot', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 2 })
  const quote = await cartApi.quote()
  const input = { quoteId: quote.id, walletId: 'wallet-alex-main' }
  const first = await ordersApi.create(input, 'checkout-attempt-001')
  const recovered = await ordersApi.create(input, 'checkout-attempt-001')

  expect(first.status).toBe('confirmed')
  expect(recovered.id).toBe(first.id)
  expect(recovered.total).toBe('2.396')
  expect((await ordersApi.get(first.id)).items[0].lineTotal).toBe('2.38')
  expect(
    (await walletsApi.list()).find((wallet) => wallet.id === input.walletId)
      ?.balance,
  ).toBe('10.104')
  expect((await catalogApi.get('emerald-ape-042')).availableQuantity).toBe(10)
  expect((await cartApi.get()).items).toHaveLength(0)
  await expect(
    ordersApi.create(
      { ...input, walletId: 'wallet-alex-secondary' },
      'checkout-attempt-001',
    ),
  ).rejects.toMatchObject({ status: 409, code: 'IDEMPOTENCY_CONFLICT' })
})

test('recupera o mesmo pedido após timeout ocorrido depois da criação', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  const quote = await cartApi.quote()
  const input = { quoteId: quote.id, walletId: 'wallet-alex-main' }
  setMockScenario('timeout-after-create')
  await expect(
    ordersApi.create(input, 'checkout-timeout-001'),
  ).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  expect((await cartApi.get()).items[0].quantity).toBe(1)
  setMockScenario(null)

  const recovered = await ordersApi.create(input, 'checkout-timeout-001')
  expect(recovered.status).toBe('confirmed')
  expect((await ordersApi.list()).map((order) => order.id)).toEqual([
    recovered.id,
  ])
  expect((await cartApi.get()).items).toHaveLength(0)
})

test('valida preço e estoque atuais antes de registrar um pedido', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  let quote = await cartApi.quote()
  setMockScenario('price-changed')
  await expect(
    ordersApi.create(
      { quoteId: quote.id, walletId: 'wallet-alex-main' },
      'checkout-price-change',
    ),
  ).rejects.toMatchObject({ status: 409, code: 'PRICE_CHANGED' })
  setMockScenario(null)
  expect(await ordersApi.list()).toHaveLength(0)
  expect((await cartApi.get()).items).toHaveLength(1)

  await mockApi.reset()
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  quote = await cartApi.quote()
  setMockScenario('stock-changed')
  await expect(
    ordersApi.create(
      { quoteId: quote.id, walletId: 'wallet-alex-main' },
      'checkout-stock-change',
    ),
  ).rejects.toMatchObject({ status: 409, code: 'INSUFFICIENT_STOCK' })
  setMockScenario(null)
  expect(await ordersApi.list()).toHaveLength(0)
  expect((await cartApi.get()).items).toHaveLength(1)
})

test('pedido e consulta ficam isolados por usuário', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await expect(ordersApi.get('missing-order')).rejects.toMatchObject({
    status: 404,
    code: 'ORDER_NOT_FOUND',
  })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  const quote = await cartApi.quote()
  const order = await ordersApi.create(
    { quoteId: quote.id, walletId: 'wallet-alex-main' },
    'checkout-private-order',
  )
  await authApi.login({ email: 'sam@kurio.test', password: 'Collect123!' })
  expect(await ordersApi.list()).toHaveLength(0)
  await expect(ordersApi.get(order.id)).rejects.toMatchObject({
    status: 404,
    code: 'ORDER_NOT_FOUND',
  })
})

test('sessão expirada durante a criação não registra pedido nem perde carrinho', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  const quote = await cartApi.quote()
  setMockScenario('session-expired')
  await expect(
    ordersApi.create(
      { quoteId: quote.id, walletId: 'wallet-alex-main' },
      'checkout-expired-session',
    ),
  ).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED' })
  setMockScenario(null)
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  expect(await ordersApi.list()).toHaveLength(0)
  expect((await cartApi.get()).items[0].quantity).toBe(1)
})

test('falha da API no checkout mantém carrinho e não cria pedido', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  const quote = await cartApi.quote()
  setMockScenario('server-error')
  await expect(
    ordersApi.create(
      { quoteId: quote.id, walletId: 'wallet-alex-main' },
      'checkout-api-failure',
    ),
  ).rejects.toMatchObject({ status: 503, code: 'MOCK_SERVER_ERROR' })
  setMockScenario(null)
  expect(await ordersApi.list()).toHaveLength(0)
  expect((await cartApi.get()).items[0].quantity).toBe(1)
})

test('falha de pagamento não esvazia o carrinho', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  const quote = await cartApi.quote()
  setMockScenario('payment-declined')
  const order = await ordersApi.create(
    { quoteId: quote.id, walletId: 'wallet-alex-main' },
    'checkout-declined-001',
  )
  setMockScenario(null)

  expect(order.status).toBe('declined')
  expect((await cartApi.get()).items[0].quantity).toBe(1)
})

test('simula falha HTTP e falha de rede sem convertê-las em sucesso', async () => {
  setMockScenario('server-error')
  await expect(catalogApi.list()).rejects.toMatchObject({
    status: 503,
    code: 'MOCK_SERVER_ERROR',
  })
  setMockScenario('network-error')
  await expect(catalogApi.list()).rejects.toMatchObject({
    status: 0,
    code: 'NETWORK_ERROR',
  })
})

test('valida carteiras e dados de perfil com persistência no estado simulado', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  const wallet = await walletsApi.create({
    label: 'Fria',
    address: '0x0123456789abcdef0123456789abcdef01234567',
    ensName: null,
    network: 'Ethereum',
    provider: 'WalletConnect',
    isPrimary: false,
  })
  expect((await walletsApi.list()).map((item) => item.id)).toContain(wallet.id)
  expect((await profileApi.update({ phone: '+55 11 90000-0000' })).phone).toBe(
    '+55 11 90000-0000',
  )
  await expect(
    walletsApi.create({
      label: '',
      address: '',
      ensName: null,
      network: '',
      provider: 'MetaMask',
      isPrimary: false,
    }),
  ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
})

test('saldo insuficiente rejeita pedido e preserva saldo e carrinho', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  const wallet = await walletsApi.create({
    label: 'Saldo baixo',
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    ensName: null,
    network: 'Ethereum',
    provider: 'MetaMask',
    isPrimary: false,
    balance: '0.1',
  })
  const quote = await cartApi.quote()

  await expect(
    ordersApi.create(
      { quoteId: quote.id, walletId: wallet.id },
      'insufficient-funds-attempt',
    ),
  ).rejects.toMatchObject({ status: 422, code: 'INSUFFICIENT_FUNDS' })

  expect((await walletsApi.list()).find((item) => item.id === wallet.id)?.balance)
    .toBe('0.1')
  expect((await cartApi.get()).items).toHaveLength(1)
  expect(await ordersApi.list()).toHaveLength(0)
})

test('o endpoint de reset restaura fixtures e limpa a sessão do cliente', async () => {
  await authApi.login({ email: 'alex@kurio.test', password: 'Kurio123!' })
  await cartApi.add({ nftId: 'emerald-ape-042', quantity: 1 })
  await mockApi.reset()

  expect((await cartApi.get()).items).toHaveLength(0)
  await expect(authApi.session()).rejects.toMatchObject({
    status: 401,
    code: 'UNAUTHORIZED',
  })
})
