/**
 * composables/usePageTitle.ts
 *
 * Keeps `document.title` in sync with the current screen.
 */

import { onUnmounted, toValue, watchEffect } from 'vue'

import type { MaybeRefOrGetter } from 'vue'

const BASE_TITLE = 'Allo Space'

/**
 * Per-screen prefixes so rocket and split bill screens read differently.
 * `prefix` is optional: callers that omit it keep the base title.
 */
export const TITLE_PREFIXES = {
  splitBill: 'Allo Split',
} as const

export function usePageTitle (
  title: MaybeRefOrGetter<string | null | undefined>,
  prefix: string = BASE_TITLE,
): void {
  watchEffect(() => {
    const value = toValue(title)
    document.title = value ? `${value} · ${prefix}` : BASE_TITLE
  })

  onUnmounted(() => {
    document.title = BASE_TITLE
  })
}
