/**
 * composables/useRocketDetail.ts
 *
 * Lifecycle glue for the rocket detail screen.
 */

import { computed, watch } from 'vue'

import { useRocketStore } from '@/stores/rockets'

import type { Rocket } from '@/types/rocket'
import type { Ref } from 'vue'

export function useRocketDetail (id: Ref<string>) {
  const store = useRocketStore()

  const rocket = computed<Rocket | null>(() => store.detailState(id.value).data)
  const status = computed(() => store.detailState(id.value).status)
  const error = computed(() => store.detailState(id.value).error)

  // `immediate` covers the first load; the watcher handles navigating between
  // two detail pages without unmounting. The in-flight request is not cancelled
  // on unmount: it only fills the shared store cache the list also reads.
  watch(id, newId => void store.loadRocket(newId), { immediate: true })

  function retry (): void {
    void store.loadRocket(id.value, { force: true })
  }

  return { rocket, status, error, retry }
}
