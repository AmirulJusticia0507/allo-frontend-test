/**
 * config/env.ts
 *
 * Centralised runtime configuration.
 */

/**
 * Base URL of the Launch Library 2 API.
 *
 * Defaults to the same-origin path `/launch-library`, which the Vite dev server
 * proxies to `VITE_API_PROXY_TARGET` (default: the high-rate-limit `lldev` host,
 * see `vite.config.mts`). Going through the proxy avoids CORS and hosts that
 * cancel cross-origin requests. Set `VITE_API_BASE_URL` to call the API direct.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? '/launch-library'
