/**
 * composables/useRocketDetail.ts
 *
 * Lifecycle glue for the rocket detail screen.
 */

import { computed, onMounted, onUnmounted, watch } from 'vue'

import { useRocketStore } from '@/stores/rockets'

import type { Rocket } from '@/types/rocket'
import type { Ref } from 'vue'

export function useRocketDetail (id: Ref<string>) {
  const store = useRocketStore()

  const rocket = computed<Rocket | null>(() => store.detailState(id.value).data)
  const status = computed(() => store.detailState(id.value).status)
  const error = computed(() => store.detailState(id.value).error)

  // Also handles navigation between two detail pages without unmounting.
  watch(id, newId => void store.loadRocket(newId), { immediate: true })

  onMounted(() => {
    void store.loadRocket(id.value)
  })

  onUnmounted(() => {
    // Detail page leaving: stop the request, but keep the list as-is.
    const state = store.detailState(id.value)
    if (state.status === 'loading') store.cancelRocketRequest(id.value)
  })

  function retry (): void {
    void store.loadRocket(id.value, { force: true })
  }

  return { rocket, status, error, retry }
}
