import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSessionUserId } from '../api/client'
import { useSession } from '../api/hooks'
import type { RealtimeConnectionState } from './contracts'
import { realtimeSocket } from './client'
import {
  demoSocketIdentityExchangeEnabled,
  realtimeEnabled,
  realtimeServerUrl,
} from './config'
import { subscribeRealtimeEvents } from './querySync'
import { setRealtimeSessionToken } from './sessionToken'

const RealtimeContext = createContext<RealtimeConnectionState>('connecting')

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const session = useSession()
  const [state, setState] = useState<RealtimeConnectionState>('connecting')
  const token = session.data?.token ?? null
  const userId = session.data?.user.id ?? null

  useEffect(() => {
    const socket = realtimeSocket
    const unsubscribe = subscribeRealtimeEvents(
      socket,
      queryClient,
      getSessionUserId,
      setState,
    )
    let cancelled = false
    setState(realtimeEnabled ? 'connecting' : 'error')

    if (token && demoSocketIdentityExchangeEnabled && userId) {
      void fetch(`${realtimeServerUrl}/__demo/session-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error('REALTIME_SESSION_UNAVAILABLE')
          return (await response.json()) as { token: string }
        })
        .then(({ token: realtimeToken }) => {
          if (cancelled) return
          setRealtimeSessionToken(realtimeToken)
          socket.auth = { token: realtimeToken }
          socket.connect()
        })
        .catch(() => {
          if (!cancelled) setState('error')
        })
    } else {
      setRealtimeSessionToken(null)
      socket.auth = {
        token: token && !demoSocketIdentityExchangeEnabled ? token : null,
      }
      if (realtimeEnabled) socket.connect()
    }
    return () => {
      cancelled = true
      unsubscribe()
      socket.disconnect()
      if (!token) setRealtimeSessionToken(null)
    }
  }, [queryClient, token, userId])

  const value = useMemo(() => state, [state])
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeStatus(): RealtimeConnectionState {
  return useContext(RealtimeContext)
}
