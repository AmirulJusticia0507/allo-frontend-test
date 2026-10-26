<template>
  <v-row class="justify-center">
    <v-col
      cols="12"
      sm="10"
      md="8"
      lg="6"
    >
      <v-card class="pa-4">
        <v-text-field
          :model-value="search"
          clearable
          density="comfortable"
          hide-details
          label="Search rockets"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="value => emit('update:search', value ?? '')"
        />

        <v-row class="mt-1">
          <v-col
            cols="12"
            sm="6"
          >
            <v-select
              :model-value="country"
              clearable
              density="comfortable"
              hide-details
              label="Country"
              :items="countries"
              @update:model-value="value => emit('update:country', value ?? null)"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <v-select
              :model-value="active"
              density="comfortable"
              hide-details
              label="Status"
              :items="statusOptions"
              @update:model-value="value => emit('update:active', value)"
            />
          </v-col>
        </v-row>

        <div class="d-flex align-center mt-3">
          <span class="text-body-2 text-medium-emphasis">
            Showing {{ resultCount }} of {{ totalCount }} rockets
          </span>
          <v-spacer />
          <v-btn
            v-if="hasActiveFilters"
            prepend-icon="mdi-filter-remove-outline"
            size="small"
            variant="text"
            @click="emit('reset')"
          >
            Reset
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
  import type { ActiveFilter } from '@/composables/useRocketList'

  defineProps<{
    search: string
    country: string | null
    active: ActiveFilter
    countries: string[]
    resultCount: number
    totalCount: number
    hasActiveFilters: boolean
  }>()

  const emit = defineEmits<{
    'update:search': [value: string]
    'update:country': [value: string | null]
    'update:active': [value: ActiveFilter]
    reset: []
  }>()

  const statusOptions: { title: string, value: ActiveFilter }[] = [
    { title: 'All statuses', value: 'all' },
    { title: 'Active', value: 'active' },
    { title: 'Retired', value: 'inactive' },
  ]
</script>
