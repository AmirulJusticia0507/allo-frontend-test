/**
 * composables/useSplitBillGroup.ts
 *
 * Lifecycle glue for one split bill group: loads the group, its expenses and
 * its settlement, reloads when the route id changes, and cancels the request
 * when the screen is left.
 */

import { computed, onMounted, onUnmounted, watch } from 'vue'

import { useSplitBillStore } from '@/stores/splitBill'

import type { Ref } from 'vue'

export function useSplitBillGroup (id: Ref<string>) {
  const store = useSplitBillStore()

  const detail = computed(() => (id.value ? store.detailState(id.value) : null))

  const group = computed(() => detail.value?.group.data ?? null)
  const expenses = computed(() => detail.value?.expenses.data ?? [])
  const settlement = computed(() => detail.value?.settlement.data ?? null)

  /** The page is in a loading state while nothing has arrived yet. */
  const status = computed(() => {
    const state = detail.value
    if (!state) return 'idle' as const
    if (state.group.status === 'error') return 'error' as const
    if (state.settlement.status === 'error') return 'error' as const
    if (state.group.status === 'success' || state.settlement.status === 'success') return 'success' as const
    if (state.group.status === 'loading' || state.settlement.status === 'loading') return 'loading' as const
    return 'idle' as const
  })

  const error = computed(() =>
    detail.value?.group.error
    ?? detail.value?.settlement.error
    ?? detail.value?.expenses.error
    ?? null,
  )

  /** True while a *refresh* of already-visible data is running. */
  const refreshing = computed(() =>
    detail.value?.settlement.status === 'loading' && detail.value?.settlement.data != null,
  )

  // Also handles navigation between two groups without unmounting the page.
  watch(id, newId => {
    if (newId) void store.loadGroup(newId)
  }, { immediate: true })

  onMounted(() => {
    if (id.value) void store.loadGroup(id.value)
  })

  onUnmounted(() => {
    if (id.value) store.cancelGroupRequest(id.value)
  })

  function retry (): void {
    if (id.value) void store.loadGroup(id.value, { force: true })
  }

  return { store, group, expenses, settlement, status, error, refreshing, retry }
}
