const REALTIME_TOKEN_KEY = 'kurio.realtime.token'

export function getRealtimeSessionToken(): string | null {
  try {
    return globalThis.localStorage?.getItem(REALTIME_TOKEN_KEY) ?? null
  } catch {
    return null
  }
}

export function setRealtimeSessionToken(token: string | null): void {
  try {
    if (token) globalThis.localStorage?.setItem(REALTIME_TOKEN_KEY, token)
    else globalThis.localStorage?.removeItem(REALTIME_TOKEN_KEY)
  } catch {
    // Persistência de token só é necessária no navegador.
  }
}
