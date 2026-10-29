export type Nft = {
  id: string
  name: string
  collection: string
  price: string
  edition: string
  artwork: string
  category: string
  network: string
  availableQuantity: number
}

export type NftMarketUpdate = {
  eventId: string
  sequence: number
  nftId: string
  price: string
  availableQuantity: number
  version: number
  occurredAt: string
}

export type OrderUpdatedEvent = {
  eventId: string
  sequence: number
  orderId: string
  userId: string
  status: OrderStatus
  transactionId: string | null
  version: number
  occurredAt: string
}

export type Collection = {
  id: string
  name: string
  category: string
  network: string
  nftCount: number
}

export type User = {
  id: string
  email: string
  username: string
  displayName: string
}

export type Profile = User & {
  phone: string
  address: string
  avatarUrl: string | null
}

export type Session = {
  token: string
  user: User
  expiresAt: string
}

export type CatalogQuery = {
  search?: string
  category?: string
  network?: string
  minPrice?: string
  maxPrice?: string
  sort?: 'recent' | 'price-asc' | 'price-desc' | 'popular'
  page?: number
  pageSize?: number
}

export type PageResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  pageCount: number
}

export type CartItem = {
  nftId: string
  quantity: number
  edition: string
  nft: Nft
}

export type Cart = {
  items: CartItem[]
  couponCode: string | null
  version: number
}

export type Quote = {
  id: string
  items: Array<{
    nftId: string
    name: string
    quantity: number
    unitPrice: string
    lineTotal: string
    edition: string
  }>
  subtotal: string
  discount: string
  networkFee: string
  total: string
  couponCode: string | null
  cartVersion: number
  expiresAt: string
}

export type Wallet = {
  id: string
  label: string
  address: string
  ensName: string | null
  network: string
  provider: 'MetaMask' | 'WalletConnect' | 'Coinbase Wallet'
  isPrimary: boolean
  balance: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export type Order = {
  id: string
  status: OrderStatus
  transactionId: string | null
  items: Quote['items']
  subtotal: string
  discount: string
  networkFee: string
  total: string
  wallet: Wallet
  createdAt: string
  version: number
}

export type ApiErrorPayload = {
  code: string
  message: string
  fields?: Record<string, string>
}
