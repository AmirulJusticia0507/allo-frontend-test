<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold">
          SpaceX Rockets
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Browse every launch vehicle built by SpaceX, filter the fleet, or add your own concept rocket.
        </p>
      </v-col>
    </v-row>

    <!-- Filter bar is useless until we have data to filter. -->
    <RocketFilterBar
      v-if="store.listState.status === 'success' && store.rockets.length > 0"
      v-model:search="search"
      v-model:country="country"
      v-model:active="active"
      :countries="countries"
      :total-count="store.rockets.length"
      :result-count="filteredRockets.length"
      :has-active-filters="hasActiveFilters"
      @reset="resetFilters"
    />

    <!-- Loading -->
    <RocketListSkeleton
      v-if="store.listState.status === 'idle' || store.listState.status === 'loading'"
      class="mt-6"
    />

    <!-- Fail -->
    <ErrorState
      v-else-if="store.listState.status === 'error'"
      class="mt-6"
      :message="store.listState.error ?? 'Unable to load rockets.'"
      :retrying="false"
      title="Could not load rockets"
      @retry="retry"
    />

    <!-- Success + empty result after filtering -->
    <v-sheet
      v-else-if="filteredRockets.length === 0"
      class="d-flex flex-column align-center text-center pa-8 mt-6 rounded"
      color="surface-variant"
    >
      <v-icon
        class="mb-3"
        icon="mdi-rocket-outline"
        size="56"
      />
      <h2 class="text-h6 mb-2">
        {{ hasActiveFilters ? 'No rockets match your filters' : 'No rockets yet' }}
      </h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ hasActiveFilters
          ? 'Try a different search term, country, or status.'
          : 'Add your first rocket to get started.' }}
      </p>
      <v-btn
        v-if="hasActiveFilters"
        prepend-icon="mdi-filter-remove-outline"
        variant="outlined"
        @click="resetFilters"
      >
        Reset filters
      </v-btn>
    </v-sheet>

    <!-- Success -->
    <v-row
      v-else
      class="mt-2"
    >
      <v-col
        v-for="rocket in filteredRockets"
        :key="rocket.id"
        cols="12"
        md="6"
        lg="4"
      >
        <RocketCard :rocket="rocket" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { useRocketList } from '@/composables/useRocketList'
  import { usePageTitle } from '@/composables/usePageTitle'

  const {
    store,
    search,
    country,
    active,
    countries,
    filteredRockets,
    hasActiveFilters,
    resetFilters,
    retry,
  } = useRocketList()

  usePageTitle('SpaceX Rockets')
</script>
