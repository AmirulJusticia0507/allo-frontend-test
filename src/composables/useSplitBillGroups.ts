/**
 * composables/useSplitBillGroups.ts
 *
 * Lifecycle glue for the split bill group list: loads on mount, cancels
 * pending requests on unmount, and exposes the create-group action.
 */

import { computed, onMounted, onUnmounted } from 'vue'

import { useSplitBillStore } from '@/stores/splitBill'

import type { BillGroup } from '@/types/splitBill'

export function useSplitBillGroups () {
  const store = useSplitBillStore()

  // Reuse data already in the store (e.g. coming back from a detail screen);
  // only the first visit hits the API.
  onMounted(() => {
    if (store.groupsState.status === 'idle') void store.loadGroups()
  })

  onUnmounted(() => {
    store.cancelListRequest()
  })

  // TODO(split-bill): investigate why `fetchGroups` types its result as `never`.
  const groups = computed(() => (store.groupsState.data ?? []) as BillGroup[])

  return {
    store,
    groups,
    retry: () => store.loadGroups({ force: true }),
    createGroup: (name: string, participants: string[]) =>
      store.createGroup({ name, participants }),
  }
}
