import type { NftMarketUpdate, OrderUpdatedEvent } from '../domain/types'

export interface RealtimeServerToClientEvents {
  'nft.updated': (payload: NftMarketUpdate) => void
  'order.updated': (payload: OrderUpdatedEvent) => void
}

export interface RealtimeClientToServerEvents {
  'client.ready': () => void
}

export type RealtimeConnectionState =
  'connecting' | 'connected' | 'disconnected' | 'error'

export type RealtimeDemoScenario =
  | {
      event: 'nft.updated'
      nftId: string
      price?: string
      availableQuantity?: number
    }
  | {
      event: 'order.updated'
      sessionToken: string
      orderId: string
      status: 'pending' | 'confirmed' | 'declined'
      transactionId?: string | null
    }
