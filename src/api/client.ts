import axios, { AxiosError } from 'axios'
import type { ApiErrorPayload } from '../domain/types'
import { mockModeEnabled } from '../realtime/config'

const SESSION_KEY = 'kurio.session.token'
const USER_KEY = 'kurio.session.user'
const GUEST_KEY = 'kurio.guest.id'
const MOCK_SCENARIO_KEY = 'kurio.mock.scenario'
const MOCK_SCENARIOS = new Set([
  'slow',
  'network-error',
  'server-error',
  'session-expired',
  'payment-declined',
  'order-pending',
  'timeout-after-create',
  'price-changed',
  'stock-changed',
])
let volatileToken: string | null = null
let volatileUserId: string | null = null
let volatileGuestId: string | null = null

function readStorage(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) globalThis.localStorage?.removeItem(key)
    else globalThis.localStorage?.setItem(key, value)
  } catch {
    // O estado volátil continua disponível em ambientes sem armazenamento web.
  }
}

export function getSessionToken(): string | null {
  return readStorage(SESSION_KEY) ?? volatileToken
}

export function setSessionToken(token: string | null): void {
  volatileToken = token
  writeStorage(SESSION_KEY, token)
  if (!token) {
    volatileUserId = null
    writeStorage(USER_KEY, null)
  }
}

export function getSessionUserId(): string | null {
  return readStorage(USER_KEY) ?? volatileUserId
}

function setSession(token: string, userId: string): void {
  setSessionToken(token)
  volatileUserId = userId
  writeStorage(USER_KEY, userId)
}

export function getGuestId(): string {
  const stored = readStorage(GUEST_KEY)
  if (stored) return stored
  if (volatileGuestId) return volatileGuestId
  volatileGuestId = globalThis.crypto?.randomUUID?.() ?? `guest-${Date.now()}`
  writeStorage(GUEST_KEY, volatileGuestId)
  return volatileGuestId
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const status = error.response?.status ?? 0
    const payload = error.response?.data
    return new ApiError(
      payload?.message ?? error.message ?? 'Falha de comunicação com a API.',
      status,
      payload?.code ?? (status ? 'HTTP_ERROR' : 'NETWORK_ERROR'),
      payload?.fields,
    )
  }
  return new ApiError('Falha inesperada na camada de API.', 0, 'UNKNOWN_ERROR')
}

const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || '/api'

export const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 8_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getSessionToken()
  config.headers.set('X-Guest-Id', getGuestId())
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  const realtimeToken = readStorage('kurio.realtime.token')
  if (realtimeToken) config.headers.set('X-Realtime-Token', realtimeToken)
  else config.headers.delete('X-Realtime-Token')
  const scenario = mockModeEnabled ? readStorage(MOCK_SCENARIO_KEY) : null
  if (scenario && MOCK_SCENARIOS.has(scenario))
    config.headers.set('X-Mock-Scenario', scenario)
  if (config.url?.endsWith('/__mock/reset'))
    config.headers.delete('X-Mock-Scenario')
  return config
})

http.interceptors.response.use(
  (response) => {
    if (
      response.config.url?.endsWith('/auth/login') ||
      response.config.url?.endsWith('/auth/register') ||
      response.config.url?.endsWith('/auth/session')
    ) {
      const payload = response.data as {
        token?: unknown
        user?: { id?: unknown }
      }
      if (
        typeof payload.token === 'string' &&
        typeof payload.user?.id === 'string'
      ) {
        setSession(payload.token, payload.user.id)
      }
    }
    if (response.config.url?.endsWith('/auth/logout')) setSessionToken(null)
    return response
  },
  (error: AxiosError<ApiErrorPayload>) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    const code = error.response?.data?.code
    if (code === 'SESSION_EXPIRED' || code === 'UNAUTHORIZED')
      setSessionToken(null)
    return Promise.reject(toApiError(error))
  },
)

export function setMockScenario(scenario: string | null): void {
  if (scenario && MOCK_SCENARIOS.has(scenario)) {
    http.defaults.headers.common['X-Mock-Scenario'] = scenario
    writeStorage(MOCK_SCENARIO_KEY, scenario)
  } else {
    delete http.defaults.headers.common['X-Mock-Scenario']
    writeStorage(MOCK_SCENARIO_KEY, null)
  }
}

export function resetApiClientState(): void {
  volatileToken = null
  volatileGuestId = null
  setSessionToken(null)
  volatileUserId = null
  try {
    globalThis.localStorage?.removeItem(GUEST_KEY)
    globalThis.localStorage?.removeItem(MOCK_SCENARIO_KEY)
  } catch {
    // Armazenamento não está disponível no processo de testes.
  }
  delete http.defaults.headers.common['X-Mock-Scenario']
}
