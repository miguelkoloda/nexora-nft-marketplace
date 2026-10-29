import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type {
  RealtimeClientToServerEvents,
  RealtimeServerToClientEvents,
} from './contracts'
import { realtimeServerUrl } from './config'
import { getRealtimeSessionToken } from './sessionToken'

export const realtimeSocket = io(realtimeServerUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 250,
  reconnectionDelayMax: 2_000,
  timeout: 2_000,
  auth: (callback) => callback({ token: getRealtimeSessionToken() }),
}) as unknown as Socket<
  RealtimeServerToClientEvents,
  RealtimeClientToServerEvents
>
