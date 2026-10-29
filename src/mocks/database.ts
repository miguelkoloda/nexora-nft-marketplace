import { collections, nfts } from '../data/nfts'
import {
  multiplyEther,
  parseEther,
  formatEther,
  percentageOf,
} from '../lib/ether'
import type {
  Cart,
  Collection,
  Nft,
  Order,
  Profile,
  Quote,
  Session,
  User,
  Wallet,
} from '../domain/types'
import type {
  CartItemInput,
  ProfileUpdate,
  Registration,
  WalletInput,
} from '../api/resources'
import type { NftMarketUpdate, OrderUpdatedEvent } from '../domain/types'

const STORAGE_KEY = 'kurio.mock.database.v1'
const PASSWORD_HASHES: Record<string, string> = {
  'alex@kurio.test':
    '5967c16c2022d4e40c36c348638237f3846e004c5f74dcde8aa0373f383aa8d4',
  'sam@kurio.test':
    'de01ef33b385b430032184c03ce9a585dfd3a4959322803467c30ef6821b7679',
}

type StoredUser = { profile: Profile; passwordHash: string }
type SessionRecord = { userId: string; expiresAt: string }
type StoredCartItem = { nftId: string; quantity: number; edition: string }
type StoredCart = {
  items: StoredCartItem[]
  couponCode: string | null
  version: number
}
type IdempotencyRecord = {
  fingerprint: string
  orderId: string
  cartCleared?: boolean
}
type QuoteRecord = { quote: Quote; ownerId: string }

type Database = {
  nfts: Nft[]
  collections: Collection[]
  users: Record<string, StoredUser>
  sessions: Record<string, SessionRecord>
  favorites: Record<string, string[]>
  carts: Record<string, StoredCart>
  wallets: Record<string, Wallet[]>
  quotes: Record<string, QuoteRecord>
  orders: Record<string, Order>
  orderOwners: Record<string, string>
  idempotency: Record<string, IdempotencyRecord>
  nftRealtimeVersions: Record<string, number>
  sequence: number
}

function loadPersisted(): Database | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'nfts' in parsed &&
      'users' in parsed &&
      'orderOwners' in parsed
    ) {
      const database = parsed as Database
      database.nftRealtimeVersions ??= {}
      for (const walletList of Object.values(database.wallets ?? {})) {
        for (const wallet of walletList) {
          if (!wallet.balance || typeof wallet.balance !== 'string') {
            wallet.balance = wallet.isPrimary ? '12.5' : '0.25'
          }
        }
      }
      return database
    }
  } catch {
    return null
  }
  return null
}

function save(database: Database): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(database))
  } catch {
    // In-memory state remains usable where browser storage is unavailable.
  }
}

function profile(user: User, phone: string, address: string): Profile {
  return { ...user, phone, address, avatarUrl: null }
}

function createSeed(): Database {
  const alex: User = {
    id: 'user-alex',
    email: 'alex@kurio.test',
    username: 'alexmorgan',
    displayName: 'Alex Morgan',
  }
  const sam: User = {
    id: 'user-sam',
    email: 'sam@kurio.test',
    username: 'samrivera',
    displayName: 'Sam Rivera',
  }
  return {
    nfts: structuredClone(nfts),
    collections: structuredClone(collections),
    users: {
      [alex.id]: {
        profile: profile(alex, '+55 11 99999-0000', ''),
        passwordHash: PASSWORD_HASHES[alex.email],
      },
      [sam.id]: {
        profile: profile(sam, '+55 21 98888-0000', ''),
        passwordHash: PASSWORD_HASHES[sam.email],
      },
    },
    sessions: {},
    favorites: {
      [alex.id]: ['emerald-ape-042'],
      [sam.id]: ['golden-beat-207'],
    },
    carts: {},
    wallets: {
      [alex.id]: [
        {
          id: 'wallet-alex-main',
          label: 'Principal',
          address: '0xA91F00000000000000000000000000000000E82C',
          ensName: 'alex.kurio.eth',
          network: 'Ethereum',
          provider: 'MetaMask',
          isPrimary: true,
          balance: '12.5',
        },
        {
          id: 'wallet-alex-secondary',
          label: 'Reserva',
          address: '0xB72000000000000000000000000000000000D310',
          ensName: 'nova.kurio.eth',
          network: 'Polygon',
          provider: 'Coinbase Wallet',
          isPrimary: false,
          balance: '0.25',
        },
      ],
      [sam.id]: [
        {
          id: 'wallet-sam-main',
          label: 'Principal',
          address: '0xC50100000000000000000000000000000000A420',
          ensName: null,
          network: 'Ethereum',
          provider: 'WalletConnect',
          isPrimary: true,
          balance: '8.0',
        },
      ],
    },
    quotes: {},
    orders: {},
    orderOwners: {},
    idempotency: {},
    nftRealtimeVersions: {},
    sequence: 1,
  }
}

let database = loadPersisted() ?? createSeed()
save(database)

export function resetMockDatabase(): void {
  database = createSeed()
  save(database)
}

export function getCollections(): Collection[] {
  return structuredClone(database.collections)
}

export function listNfts(query: URLSearchParams): {
  items: Nft[]
  page: number
  pageSize: number
  total: number
  pageCount: number
} {
  const search = query.get('search')?.trim().toLocaleLowerCase()
  const category = query.get('category')
  const network = query.get('network')
  const minPrice = query.get('minPrice')
  const maxPrice = query.get('maxPrice')
  const sort = query.get('sort') ?? 'recent'
  const page = Math.max(1, Number(query.get('page') ?? 1) || 1)
  const pageSize = Math.min(
    50,
    Math.max(1, Number(query.get('pageSize') ?? 12) || 12),
  )
  let result = [...database.nfts]
  if (search)
    result = result.filter((nft) =>
      `${nft.name} ${nft.collection}`.toLocaleLowerCase().includes(search),
    )
  if (category) result = result.filter((nft) => nft.category === category)
  if (network)
    result = result.filter(
      (nft) => nft.network.toLocaleLowerCase() === network.toLocaleLowerCase(),
    )
  try {
    if (minPrice)
      result = result.filter(
        (nft) => parseEther(nft.price) >= parseEther(minPrice),
      )
    if (maxPrice)
      result = result.filter(
        (nft) => parseEther(nft.price) <= parseEther(maxPrice),
      )
  } catch {
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'Faixa de preço inválida.',
      { price: 'Informe um valor ETH válido.' },
    )
  }
  if (sort === 'price-asc')
    result.sort((a, b) =>
      parseEther(a.price) < parseEther(b.price)
        ? -1
        : parseEther(a.price) > parseEther(b.price)
          ? 1
          : 0,
    )
  if (sort === 'price-desc')
    result.sort((a, b) =>
      parseEther(a.price) > parseEther(b.price)
        ? -1
        : parseEther(a.price) < parseEther(b.price)
          ? 1
          : 0,
    )
  if (sort === 'popular')
    result.sort((a, b) => b.availableQuantity - a.availableQuantity)
  const total = result.length
  const offset = (page - 1) * pageSize
  return {
    items: structuredClone(result.slice(offset, offset + pageSize)),
    page,
    pageSize,
    total,
    pageCount: Math.ceil(total / pageSize),
  }
}

export function findNft(id: string): Nft | undefined {
  const nft = database.nfts.find((item) => item.id === id)
  return nft ? structuredClone(nft) : undefined
}

export function changeNftForScenario(
  id: string,
  update: Partial<Pick<Nft, 'price' | 'availableQuantity'>>,
): void {
  const nft = database.nfts.find((item) => item.id === id)
  if (nft) Object.assign(nft, update)
  save(database)
}

export function applyRealtimeNftUpdate(event: NftMarketUpdate): boolean {
  const nft = database.nfts.find((item) => item.id === event.nftId)
  if (
    !nft ||
    !Number.isSafeInteger(event.version) ||
    event.version <= (database.nftRealtimeVersions[event.nftId] ?? 0) ||
    typeof event.price !== 'string' ||
    !Number.isSafeInteger(event.availableQuantity) ||
    event.availableQuantity < 0
  ) {
    return false
  }
  try {
    if (parseEther(event.price) <= 0n) return false
  } catch {
    return false
  }
  nft.price = event.price
  nft.availableQuantity = event.availableQuantity
  database.nftRealtimeVersions[event.nftId] = event.version
  save(database)
  return true
}

export function getRealtimeNftVersion(nftId: string): number {
  return database.nftRealtimeVersions[nftId] ?? 0
}

export function applyRealtimeOrderUpdate(event: OrderUpdatedEvent): boolean {
  const order = database.orders[event.orderId]
  if (
    !order ||
    database.orderOwners[event.orderId] !== event.userId ||
    !Number.isSafeInteger(event.version) ||
    event.version <= order.version ||
    order.status !== 'pending' ||
    !['pending', 'confirmed', 'declined'].includes(event.status)
  ) {
    return false
  }
  if (event.status === 'confirmed') {
    const cart = cloneCart(event.userId)
    for (const item of order.items) {
      const nft = database.nfts.find((entry) => entry.id === item.nftId)
      if (nft)
        nft.availableQuantity = Math.max(
          0,
          nft.availableQuantity - item.quantity,
        )
      const cartItem = cart.items.find((entry) => entry.nftId === item.nftId)
      if (cartItem)
        cartItem.quantity = Math.max(0, cartItem.quantity - item.quantity)
    }
    cart.items = cart.items.filter((item) => item.quantity > 0)
    if (!cart.items.length) cart.couponCode = null
    cart.version += 1
    const userWallet = (database.wallets[event.userId] ?? []).find(
      (entry) => entry.id === order.wallet.id,
    )
    if (userWallet) {
      try {
        const currentBal = parseEther(userWallet.balance)
        const orderTot = parseEther(order.total)
        if (currentBal >= orderTot) {
          userWallet.balance = formatEther(currentBal - orderTot)
        }
      } catch {
        // preserve balance
      }
    }
  }
  order.status = event.status
  order.transactionId =
    event.status === 'confirmed' ? event.transactionId : null
  order.version = event.version
  save(database)
  return true
}

function nextId(prefix: string): string {
  const id = `${prefix}-${database.sequence}`
  database.sequence += 1
  return id
}

function guestKey(guestId: string): string {
  return `guest:${guestId || 'anonymous'}`
}

export function resolveSession(
  token: string | null,
): { user: User; profile: Profile } | null {
  if (!token) return null
  const session = database.sessions[token]
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null
  const userRecord = database.users[session.userId]
  if (!userRecord) return null
  return {
    user: userRecord.profile,
    profile: structuredClone(userRecord.profile),
  }
}

export function authenticate(token: string | null): User | null {
  return resolveSession(token)?.user ?? null
}

function cloneCart(owner: string): StoredCart {
  if (!database.carts[owner])
    database.carts[owner] = { items: [], couponCode: null, version: 1 }
  return database.carts[owner]
}

export function getCart(owner: string): Cart {
  const stored = cloneCart(owner)
  return {
    items: stored.items.flatMap((item) => {
      const nft = database.nfts.find((entry) => entry.id === item.nftId)
      return nft ? [{ ...item, nft: structuredClone(nft) }] : []
    }),
    couponCode: stored.couponCode,
    version: stored.version,
  }
}

export function addCartItem(owner: string, input: CartItemInput): Cart {
  const nft = database.nfts.find((item) => item.id === input.nftId)
  if (!nft) throw new DatabaseError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1)
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'A quantidade deve ser maior que zero.',
      { quantity: 'Quantidade inválida.' },
    )
  const cart = cloneCart(owner)
  const existing = cart.items.find((item) => item.nftId === input.nftId)
  const totalQuantity = (existing?.quantity ?? 0) + input.quantity
  if (totalQuantity > nft.availableQuantity)
    throw new DatabaseError(
      409,
      'INSUFFICIENT_STOCK',
      'A quantidade solicitada excede a disponibilidade.',
    )
  if (existing) existing.quantity = totalQuantity
  else
    cart.items.push({
      nftId: nft.id,
      quantity: input.quantity,
      edition: input.edition ?? nft.edition,
    })
  cart.version += 1
  save(database)
  return getCart(owner)
}

export function updateCartItem(
  owner: string,
  nftId: string,
  quantity: number,
): Cart {
  const cart = cloneCart(owner)
  const index = cart.items.findIndex((item) => item.nftId === nftId)
  if (index < 0)
    throw new DatabaseError(
      404,
      'CART_ITEM_NOT_FOUND',
      'Item não encontrado no carrinho.',
    )
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'A quantidade deve ser um inteiro positivo.',
      { quantity: 'Quantidade inválida.' },
    )
  const nft = database.nfts.find((item) => item.id === nftId)
  if (!nft) throw new DatabaseError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
  if (quantity > nft.availableQuantity)
    throw new DatabaseError(
      409,
      'INSUFFICIENT_STOCK',
      'A quantidade solicitada excede a disponibilidade.',
    )
  cart.items[index].quantity = quantity
  cart.version += 1
  save(database)
  return getCart(owner)
}

export function removeCartItem(owner: string, nftId: string): Cart {
  const cart = cloneCart(owner)
  const remaining = cart.items.filter((item) => item.nftId !== nftId)
  if (remaining.length === cart.items.length)
    throw new DatabaseError(
      404,
      'CART_ITEM_NOT_FOUND',
      'Item não encontrado no carrinho.',
    )
  cart.items = remaining
  cart.version += 1
  save(database)
  return getCart(owner)
}

export function setCoupon(owner: string, value: string | null): Cart {
  const cart = cloneCart(owner)
  if (value) {
    const code = value.trim().toUpperCase()
    if (code === 'EXPIRED')
      throw new DatabaseError(
        410,
        'COUPON_EXPIRED',
        'Este código promocional expirou.',
      )
    if (code !== 'KURIO10')
      throw new DatabaseError(
        422,
        'COUPON_INVALID',
        'Código promocional inválido.',
        { code: 'Verifique o código informado.' },
      )
    cart.couponCode = code
  } else {
    cart.couponCode = null
  }
  cart.version += 1
  save(database)
  return getCart(owner)
}

export function listFavorites(userId: string): Nft[] {
  const ids = database.favorites[userId] ?? []
  return ids.flatMap((id) => {
    const nft = database.nfts.find((item) => item.id === id)
    return nft ? [structuredClone(nft)] : []
  })
}

export function addFavorite(userId: string, nftId: string): Nft {
  const nft = database.nfts.find((item) => item.id === nftId)
  if (!nft) throw new DatabaseError(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
  const favorites =
    database.favorites[userId] ?? (database.favorites[userId] = [])
  if (!favorites.includes(nftId)) favorites.push(nftId)
  save(database)
  return structuredClone(nft)
}

export function removeFavorite(userId: string, nftId: string): void {
  database.favorites[userId] = (database.favorites[userId] ?? []).filter(
    (id) => id !== nftId,
  )
  save(database)
}

async function hashPassword(password: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export async function login(
  email: string,
  password: string,
  guestId: string,
): Promise<Session> {
  const normalizedEmail = email.trim().toLocaleLowerCase()
  const record = Object.values(database.users).find(
    (user) => user.profile.email === normalizedEmail,
  )
  if (!record || record.passwordHash !== (await hashPassword(password)))
    throw new DatabaseError(
      401,
      'INVALID_CREDENTIALS',
      'E-mail ou senha inválidos.',
    )
  return createSession(record.profile, guestId)
}

export async function register(
  input: Registration,
  guestId: string,
): Promise<Session> {
  const email = input.email.trim().toLocaleLowerCase()
  if (
    !input.username.trim() ||
    !input.displayName.trim() ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    input.password.length < 8
  ) {
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'Revise os dados do cadastro.',
      {
        ...(!input.username.trim()
          ? { username: 'Informe um nome de usuário.' }
          : {}),
        ...(!input.displayName.trim()
          ? { displayName: 'Informe seu nome.' }
          : {}),
        ...(!/^\S+@\S+\.\S+$/.test(email) ? { email: 'E-mail inválido.' } : {}),
        ...(input.password.length < 8
          ? { password: 'Use ao menos 8 caracteres.' }
          : {}),
      },
    )
  }
  if (
    Object.values(database.users).some(
      ({ profile: user }) =>
        user.email === email || user.username === input.username.trim(),
    )
  ) {
    throw new DatabaseError(
      409,
      'ACCOUNT_CONFLICT',
      'E-mail ou nome de usuário já cadastrado.',
    )
  }
  const user: User = {
    id: nextId('user'),
    email,
    username: input.username.trim(),
    displayName: input.displayName.trim(),
  }
  database.users[user.id] = {
    profile: profile(user, '', ''),
    passwordHash: await hashPassword(input.password),
  }
  database.favorites[user.id] = []
  database.wallets[user.id] = []
  save(database)
  return createSession(user, guestId)
}

async function createSession(user: User, guestId: string): Promise<Session> {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const token = `mock.${globalThis.crypto.randomUUID()}`
  database.sessions[token] = { userId: user.id, expiresAt }
  const guestOwner = guestKey(guestId)
  const guestCart = database.carts[guestOwner]
  if (guestCart?.items.length) {
    const userCart = cloneCart(user.id)
    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find(
        (item) => item.nftId === guestItem.nftId,
      )
      const nft = database.nfts.find((item) => item.id === guestItem.nftId)
      const quantity = (existing?.quantity ?? 0) + guestItem.quantity
      if (!nft) continue
      if (existing) existing.quantity = quantity
      else userCart.items.push(guestItem)
    }
    userCart.version += 1
    delete database.carts[guestOwner]
  }
  save(database)
  return { token, user, expiresAt }
}

export function getProfile(userId: string): Profile {
  const stored = database.users[userId]
  if (!stored)
    throw new DatabaseError(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.')
  return structuredClone(stored.profile)
}

export function updateProfile(userId: string, input: ProfileUpdate): Profile {
  const stored = database.users[userId]
  if (!stored)
    throw new DatabaseError(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.')
  if (input.username !== undefined && !input.username.trim())
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'Nome de usuário inválido.',
      { username: 'Este campo é obrigatório.' },
    )
  if (
    input.username &&
    Object.values(database.users).some(
      (entry) =>
        entry.profile.id !== userId &&
        entry.profile.username === input.username,
    )
  )
    throw new DatabaseError(
      409,
      'ACCOUNT_CONFLICT',
      'Nome de usuário já cadastrado.',
    )
  stored.profile = { ...stored.profile, ...input }
  save(database)
  return structuredClone(stored.profile)
}

export function updateAvatar(
  userId: string,
  avatarUrl: string | null,
): Profile {
  const stored = database.users[userId]
  if (!stored)
    throw new DatabaseError(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.')
  stored.profile.avatarUrl = avatarUrl
  save(database)
  return structuredClone(stored.profile)
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const stored = database.users[userId]
  if (!stored)
    throw new DatabaseError(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado.')
  if (stored.passwordHash !== (await hashPassword(currentPassword)))
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'A senha atual está incorreta.',
      { currentPassword: 'Senha atual incorreta.' },
    )
  if (newPassword.length < 8)
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'A nova senha deve ter ao menos 8 caracteres.',
      { newPassword: 'Use ao menos 8 caracteres.' },
    )
  stored.passwordHash = await hashPassword(newPassword)
  save(database)
}

export function getWallets(userId: string): Wallet[] {
  return structuredClone(database.wallets[userId] ?? [])
}

export function saveWallet(
  userId: string,
  input: WalletInput,
  id?: string,
): Wallet {
  if (!input.label.trim() || !input.address.trim() || !input.network.trim())
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'Revise os dados da carteira.',
      { address: 'Informe endereço e rede.' },
    )
  const wallets = database.wallets[userId] ?? (database.wallets[userId] = [])
  if (input.isPrimary) wallets.forEach((wallet) => (wallet.isPrimary = false))
  const existing = id ? wallets.find((wallet) => wallet.id === id) : undefined
  if (id && !existing)
    throw new DatabaseError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
  const balance = existing?.balance ?? input.balance ?? '5.0'
  const wallet: Wallet = {
    ...input,
    balance,
    id: existing?.id ?? nextId('wallet'),
  }
  if (existing) Object.assign(existing, wallet)
  else wallets.push(wallet)
  save(database)
  return structuredClone(wallet)
}

export function createQuote(ownerId: string): Quote {
  const cart = getCart(ownerId)
  for (const item of cart.items) {
    if (item.quantity > item.nft.availableQuantity)
      throw new DatabaseError(
        409,
        'INSUFFICIENT_STOCK',
        `${item.nft.name} não tem mais unidades suficientes.`,
      )
  }
  const subtotal = cart.items.reduce(
    (sum, item) =>
      sum + parseEther(multiplyEther(item.nft.price, item.quantity)),
    0n,
  )
  const discount =
    cart.couponCode === 'KURIO10'
      ? parseEther(percentageOf(formatEther(subtotal), 10))
      : 0n
  const fee = parseEther('0.016')
  const quote: Quote = {
    id: nextId('quote'),
    items: cart.items.map(({ nft, quantity, edition }) => ({
      nftId: nft.id,
      name: nft.name,
      quantity,
      unitPrice: nft.price,
      lineTotal: multiplyEther(nft.price, quantity),
      edition,
    })),
    subtotal: formatEther(subtotal),
    discount: formatEther(discount),
    networkFee: formatEther(fee),
    total: formatEther(subtotal - discount + fee),
    couponCode: cart.couponCode,
    cartVersion: cart.version,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }
  database.quotes[quote.id] = { quote, ownerId }
  save(database)
  return structuredClone(quote)
}

export function createOrder(
  userId: string,
  quoteId: string,
  walletId: string,
  idempotencyKey: string,
  scenario: string | null,
): { order: Order; recovered: boolean } {
  if (!idempotencyKey.trim())
    throw new DatabaseError(
      422,
      'VALIDATION_ERROR',
      'Informe a chave de idempotência.',
    )
  const key = `${userId}:${idempotencyKey}`
  const fingerprint = JSON.stringify({ quoteId, walletId })
  const previous = database.idempotency[key]
  if (previous) {
    if (previous.fingerprint !== fingerprint)
      throw new DatabaseError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'A chave de idempotência já foi usada com outros dados.',
      )
    const order = database.orders[previous.orderId]
    if (!order)
      throw new DatabaseError(
        500,
        'ORDER_RECOVERY_FAILED',
        'Não foi possível recuperar o pedido.',
      )
    if (order.status === 'confirmed' && !previous.cartCleared) {
      const cart = cloneCart(userId)
      for (const item of order.items) {
        const cartItem = cart.items.find((entry) => entry.nftId === item.nftId)
        if (cartItem)
          cartItem.quantity = Math.max(0, cartItem.quantity - item.quantity)
      }
      cart.items = cart.items.filter((item) => item.quantity > 0)
      if (!cart.items.length) cart.couponCode = null
      cart.version += 1
      previous.cartCleared = true
      save(database)
    }
    return { order: structuredClone(order), recovered: true }
  }
  const storedQuote = database.quotes[quoteId]
  if (!storedQuote || storedQuote.ownerId !== userId)
    throw new DatabaseError(404, 'QUOTE_NOT_FOUND', 'Cotação não encontrada.')
  if (Date.parse(storedQuote.quote.expiresAt) <= Date.now())
    throw new DatabaseError(
      409,
      'QUOTE_EXPIRED',
      'A cotação expirou. Gere uma nova cotação.',
    )
  const cart = cloneCart(userId)
  if (cart.version !== storedQuote.quote.cartVersion)
    throw new DatabaseError(
      409,
      'QUOTE_STALE',
      'O carrinho mudou. Revise os valores antes de confirmar.',
    )
  const wallet = (database.wallets[userId] ?? []).find(
    (item) => item.id === walletId,
  )
  if (!wallet)
    throw new DatabaseError(
      422,
      'WALLET_REQUIRED',
      'Selecione uma carteira cadastrada.',
    )
  const orderTotalBigInt = parseEther(storedQuote.quote.total)
  const walletBalanceBigInt = parseEther(wallet.balance)
  if (walletBalanceBigInt < orderTotalBigInt) {
    throw new DatabaseError(
      422,
      'INSUFFICIENT_FUNDS',
      'Saldo insuficiente na carteira selecionada.',
      {
        walletId: `Saldo atual (${wallet.balance} ETH) é insuficiente para o valor total (${storedQuote.quote.total} ETH).`,
      },
    )
  }
  for (const quoteItem of storedQuote.quote.items) {
    const nft = database.nfts.find((item) => item.id === quoteItem.nftId)
    if (!nft || nft.availableQuantity < quoteItem.quantity)
      throw new DatabaseError(
        409,
        'INSUFFICIENT_STOCK',
        'A disponibilidade mudou. Atualize o carrinho.',
      )
    if (nft.price !== quoteItem.unitPrice)
      throw new DatabaseError(
        409,
        'PRICE_CHANGED',
        'O preço de um NFT mudou. Gere uma nova cotação antes de confirmar.',
      )
  }
  const status =
    scenario === 'payment-declined'
      ? 'declined'
      : scenario === 'order-pending'
        ? 'pending'
        : 'confirmed'
  const order: Order = {
    id: nextId('order'),
    status,
    transactionId:
      status === 'confirmed'
        ? `0x${nextId('tx').replaceAll('-', '').padEnd(32, '0')}`
        : null,
    items: structuredClone(storedQuote.quote.items),
    subtotal: storedQuote.quote.subtotal,
    discount: storedQuote.quote.discount,
    networkFee: storedQuote.quote.networkFee,
    total: storedQuote.quote.total,
    wallet: structuredClone(wallet),
    createdAt: new Date().toISOString(),
    version: 1,
  }
  database.orders[order.id] = order
  database.orderOwners[order.id] = userId
  database.idempotency[key] = {
    fingerprint,
    orderId: order.id,
    cartCleared: status !== 'confirmed' || scenario !== 'timeout-after-create',
  }
  if (status === 'confirmed') {
    wallet.balance = formatEther(walletBalanceBigInt - orderTotalBigInt)
    for (const item of storedQuote.quote.items) {
      const nft = database.nfts.find((entry) => entry.id === item.nftId)
      if (nft) nft.availableQuantity -= item.quantity
      if (scenario !== 'timeout-after-create') {
        const cartItem = cart.items.find((entry) => entry.nftId === item.nftId)
        if (cartItem) cartItem.quantity -= item.quantity
      }
    }
    if (scenario !== 'timeout-after-create') {
      cart.items = cart.items.filter((item) => item.quantity > 0)
      if (!cart.items.length) cart.couponCode = null
      cart.version += 1
    }
  }
  save(database)
  return { order: structuredClone(order), recovered: false }
}

export function listOrders(userId: string): Order[] {
  return Object.values(database.orders)
    .filter((order) => database.orderOwners[order.id] === userId)
    .map((order) => structuredClone(order))
}

export function getOrder(userId: string, orderId: string): Order | undefined {
  const order = database.orders[orderId]
  if (!order) return undefined
  return database.orderOwners[orderId] === userId
    ? structuredClone(order)
    : undefined
}

export class DatabaseError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export function getUserById(userId: string): User | null {
  return database.users[userId]?.profile ?? null
}

export function removeSession(token: string | null): void {
  if (token) delete database.sessions[token]
  save(database)
}

export function ownerForRequest(
  userId: string | null,
  guestId: string | null,
): string {
  return userId ?? guestKey(guestId ?? 'anonymous')
}

export function getSessionFromToken(token: string | null): Session | null {
  const resolved = resolveSession(token)
  if (!resolved || !token) return null
  const record = database.sessions[token]
  return { token, user: resolved.user, expiresAt: record.expiresAt }
}
