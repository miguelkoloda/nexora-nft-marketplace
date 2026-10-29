/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_MOCKS?: string
  readonly VITE_REALTIME_URL?: string
  readonly VITE_REALTIME_STATE_SYNC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
