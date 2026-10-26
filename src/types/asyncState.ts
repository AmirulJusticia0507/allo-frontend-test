/**
 * types/asyncState.ts
 *
 * Shared shape for the loading / error / success UI states.
 */

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  status: AsyncStatus
  error: string | null
}
