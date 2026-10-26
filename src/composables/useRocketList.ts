/**
 * composables/useRocketList.ts
 *
 * Lifecycle glue for the rocket list screen: loads the data on mount and
 * exposes client-side filtering.
 */

import { computed, onMounted, ref } from 'vue'

import { useRocketStore } from '@/stores/rockets'

import type { Rocket } from '@/types/rocket'
import type { Ref } from 'vue'

export type ActiveFilter = 'all' | 'active' | 'inactive'

export interface RocketFilters {
  search: Ref<string>
  country: Ref<string | null>
  active: Ref<ActiveFilter>
}

export function useRocketList () {
  const store = useRocketStore()

  // Reuse data already in the store (e.g. when coming back from a detail
  // screen); only the first visit — or an explicit retry — hits the API.
  onMounted(() => {
    if (store.listState.status === 'idle') void store.loadRockets()
  })

  // The in-flight list request is intentionally not cancelled on unmount: the
  // detail screen needs the cached rocket, and the store reuses the response
  // when the user comes back to the list. Only explicit retries replace it.

  const search = ref('')
  const country = ref<string | null>(null)
  const active = ref<ActiveFilter>('all')

  const countries = computed<string[]>(() => {
    const codes = store.rockets
      .map(rocket => rocket.countryCode)
      .filter((code): code is string => Boolean(code))
    return [...new Set(codes)].sort()
  })

  const filteredRockets = computed<Rocket[]>(() => {
    const query = search.value.trim().toLowerCase()

    return store.rockets
      .filter(rocket => {
        const matchesQuery = !query
          || [rocket.fullName, rocket.description, rocket.family]
            .some(field => field?.toLowerCase().includes(query))

        const matchesCountry = !country.value || rocket.countryCode === country.value

        const matchesActive = active.value === 'all'
          || (active.value === 'active' ? rocket.active === true : rocket.active === false)

        return matchesQuery && matchesCountry && matchesActive
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  })

  const hasActiveFilters = computed(
    () => Boolean(search.value.trim()) || Boolean(country.value) || active.value !== 'all',
  )

  function resetFilters (): void {
    search.value = ''
    country.value = null
    active.value = 'all'
  }

  return {
    store,
    search,
    country,
    active,
    countries,
    filteredRockets,
    hasActiveFilters,
    resetFilters,
    retry: () => store.loadRockets({ force: true }),
  }
}
