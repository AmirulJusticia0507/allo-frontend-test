/**
 * composables/usePageTitle.ts
 *
 * Keeps `document.title` in sync with the current screen.
 */

import { onUnmounted, toValue, watchEffect } from 'vue'

import type { MaybeRefOrGetter } from 'vue'

const BASE_TITLE = 'Allo Space'

export function usePageTitle (title: MaybeRefOrGetter<string | null | undefined>): void {
  watchEffect(() => {
    const value = toValue(title)
    document.title = value ? `${value} · ${BASE_TITLE}` : BASE_TITLE
  })

  onUnmounted(() => {
    document.title = BASE_TITLE
  })
}
