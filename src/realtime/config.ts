const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env
const localMockMode = env?.MODE === 'browser-test' || env?.MODE === 'audit'

export const realtimeServerUrl =
  env?.VITE_REALTIME_URL ??
  (env?.DEV || localMockMode ? 'http://127.0.0.1:5188' : '')

export const realtimeEnabled = Boolean(realtimeServerUrl)

export const mockModeEnabled =
  !env ||
  env?.VITE_ENABLE_MOCKS === 'true' ||
  ((env?.DEV === true || localMockMode) && env?.VITE_ENABLE_MOCKS !== 'false')

export const demoSocketIdentityExchangeEnabled =
  mockModeEnabled && (env?.DEV === true || env?.MODE === 'browser-test')

export const realtimeStateSyncEnabled =
  env?.VITE_REALTIME_STATE_SYNC !== 'false'
