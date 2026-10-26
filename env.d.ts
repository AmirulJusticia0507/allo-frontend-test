/**
 * env.d.ts
 *
 * Type declarations for Vite and the app's environment variables.
 */

/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface ImportMetaEnv {
  /** Overrides the Launch Library 2 API base URL (see `src/config/env.ts`). */
  readonly VITE_API_BASE_URL?: string
  /** Overrides the Split Bill API base URL (defaults to the proxied `/api`). */
  readonly VITE_SPLIT_BILL_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
