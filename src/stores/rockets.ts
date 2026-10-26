/**
 * stores/rockets.ts
 *
 * Single source of truth for rocket data:
 * - the remote (API) rockets plus the user-created ones (API is read-only),
 * - list / detail loading, error and success states,
 * - request cancellation so fast navigation never leaks late responses.
 */

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

import { isAbortError } from '@/services/http'
import { fetchRocket, fetchRockets } from '@/services/rocketApi'

import type { AsyncState } from '@/types/asyncState'
import type { Rocket, RocketDraft } from '@/types/rocket'

function errorMessage (error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function initialState<T> (): AsyncState<T> {
  return { data: null, status: 'idle', error: null }
}

export const useRocketStore = defineStore('rockets', () => {
  const remoteRockets = ref<Rocket[]>([])
  const customRockets = ref<Rocket[]>([])

  const listState = reactive<AsyncState<Rocket[]>>(initialState())
  const detailStates = reactive<Record<string, AsyncState<Rocket>>>({})

  const rockets = computed<Rocket[]>(() => [...customRockets.value, ...remoteRockets.value])

  // One controller per request scope, so starting a new load cancels the old one.
  let listController: AbortController | null = null
  const detailControllers = new Map<string, AbortController>()

  function getById (id: string): Rocket | undefined {
    return rockets.value.find(rocket => rocket.id === id)
  }

  /** UI state for one rocket's detail screen. */
  function detailState (id: string): AsyncState<Rocket> {
    const existing = detailStates[id]
    if (existing) {
      // Already in memory (e.g. opened from the list) — show it immediately.
      const cached = getById(id)
      if (existing.status !== 'loading' && cached && !existing.data) {
        return { ...existing, data: cached, status: 'success' }
      }
      return existing
    }

    const cached = getById(id)
    return cached
      ? { data: cached, status: 'success', error: null }
      : initialState<Rocket>()
  }

  /** Fetches the rocket list. No-op while a fetch is already in flight. */
  async function loadRockets ({ force = false }: { force?: boolean } = {}): Promise<void> {
    if (listState.status === 'loading' && !force) return
    if (listState.status === 'success' && !force) return

    listController?.abort()
    const controller = new AbortController()
    listController = controller

    listState.status = 'loading'
    listState.error = null

    try {
      const result = await fetchRockets({ signal: controller.signal })
      if (controller.signal.aborted) return
      remoteRockets.value = result
      listState.data = rockets.value
      listState.status = 'success'
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) return
      listState.status = 'error'
      listState.error = errorMessage(error)
    } finally {
      if (listController === controller) listController = null
    }
  }

  /** Loads one rocket's detail, reusing data already fetched from the list. */
  async function loadRocket (id: string, { force = false } = {}): Promise<void> {
    const cached = getById(id)

    // User-created rockets only live in memory; nothing to fetch.
    if (cached?.isCustom) {
      detailStates[id] = { data: cached, status: 'success', error: null }
      return
    }

    const current = detailStates[id]
    if (!force && (current?.status === 'loading' || current?.status === 'success')) return

    detailControllers.get(id)?.abort()
    const controller = new AbortController()
    detailControllers.set(id, controller)

    detailStates[id] = { data: cached ?? null, status: 'loading', error: null }

    try {
      const result = await fetchRocket(id, { signal: controller.signal })
      if (controller.signal.aborted) return
      // Keep local copies in sync (and available offline in the list).
      remoteRockets.value = remoteRockets.value.map(rocket => (rocket.id === id ? result : rocket))
      detailStates[id] = { data: result, status: 'success', error: null }
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) return
      detailStates[id] = {
        data: cached ?? null,
        status: 'error',
        error: errorMessage(error),
      }
    } finally {
      if (detailControllers.get(id) === controller) detailControllers.delete(id)
    }
  }

  /**
   * Adds a rocket locally. The API is read-only, so created rockets only
   * live in this store for the duration of the session.
   */
  function addRocket (draft: RocketDraft): Rocket {
    const rocket: Rocket = {
      ...draft,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      family: null,
      active: true,
      manufacturer: {
        name: draft.countryCode ? 'Custom' : null,
        country_code: draft.countryCode,
      },
      isCustom: true,
    }

    customRockets.value = [rocket, ...customRockets.value]
    listState.data = rockets.value
    detailStates[rocket.id] = { data: rocket, status: 'success', error: null }
    return rocket
  }

  /** Cancels in-flight list/detail requests (called when leaving a screen). */
  function cancelPendingRequests (): void {
    listController?.abort()
    listController = null
    detailControllers.forEach(controller => controller.abort())
    detailControllers.clear()
  }

  /** Cancels the in-flight request for one rocket, if any. */
  function cancelRocketRequest (id: string): void {
    detailControllers.get(id)?.abort()
    detailControllers.delete(id)
  }

  return {
    rockets,
    listState,
    detailState,
    getById,
    loadRockets,
    loadRocket,
    addRocket,
    cancelPendingRequests,
    cancelRocketRequest,
  }
})
