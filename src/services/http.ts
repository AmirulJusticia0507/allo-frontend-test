/**
 * services/http.ts
 *
 * Tiny `fetch` wrapper that adds the API base URL, timeouts, and a
 * normalised error type so the UI only has to deal with {@link ApiError}.
 *
 * Shared by the Launch Library client (`rocketApi.ts`) and the Split Bill
 * client (`splitBillApi.ts`).
 */

import { API_BASE_URL } from '@/config/env'

const DEFAULT_TIMEOUT_MS = 15_000

export class ApiError extends Error {
  /** HTTP status, or `null` for network/timeout/parse failures. */
  readonly status: number | null

  constructor (message: string, status: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function toUserMessage (status: number): string {
  if (status === 400 || status === 422) return 'Some of the details are not valid. Please check the form and try again.'
  if (status === 404) return 'The requested data could not be found.'
  if (status === 429) return 'Too many requests. Please wait a moment and try again.'
  if (status >= 500) return 'The server is having trouble right now. Please try again.'
  return `The request failed (HTTP ${status}).`
}

/**
 * Extracts the `{ "error": "…" }` message that the Split Bill API returns on
 * failure, so the UI can show the exact validation problem. Returns `null`
 * when the body is missing or not in that shape.
 */
async function readErrorBody (response: Response): Promise<string | null> {
  try {
    const body = await response.json() as { error?: unknown }
    return typeof body?.error === 'string' && body.error.trim() ? body.error : null
  } catch {
    return null
  }
}

export interface RequestOptions {
  /** Caller-provided signal, used to cancel in-flight requests. */
  signal?: AbortSignal
  timeoutMs?: number
  /** Base URL override; defaults to the Launch Library base URL. */
  baseUrl?: string
  /** JSON request body. When set, the request is sent as `POST`. */
  body?: unknown
}

/**
 * Sends a JSON request and parses a JSON response.
 *
 * A custom `signal` treats an abort as a cancellation (see `isAbortError`),
 * while the internal timeout produces a readable {@link ApiError}.
 *
 * @param path Path relative to the base URL, e.g. `/config/launcher/133/`.
 */
export async function requestJson<T> (
  path: string,
  {
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    baseUrl = API_BASE_URL,
    body,
  }: RequestOptions = {},
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      signal: combinedSignal,
      headers: body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    const cancelled = signal?.aborted ?? false
    const timedOut = timeoutSignal.aborted
    throw new ApiError(
      cancelled
        ? 'The request was cancelled.'
        : timedOut
          ? 'The request timed out. Please check your connection and try again.'
          : 'Unable to reach the server. Please check your connection and try again.',
    )
  }

  if (!response.ok) {
    const serverMessage = await readErrorBody(response)
    throw new ApiError(serverMessage ?? toUserMessage(response.status), response.status)
  }

  try {
    return await response.json() as T
  } catch {
    throw new ApiError('The server returned an unexpected response.')
  }
}

/**
 * GETs a JSON resource from the API.
 *
 * @param path Path relative to the API base URL, e.g. `/config/launcher/133/`.
 * @param signal Optional caller-provided signal, used to cancel in-flight requests.
 */
export function getJson<T> (path: string, options: RequestOptions = {}): Promise<T> {
  return requestJson<T>(path, options)
}

/** `true` when an error was caused by a caller-cancelled request. */
export function isAbortError (error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  // Cross-origin `fetch` rejects with a `TypeError` on abort, so the wrapper
  // marks cancellations with this message instead of relying on the type.
  return error instanceof ApiError && error.message === 'The request was cancelled.'
}
