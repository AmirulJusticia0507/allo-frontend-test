<template>
  <v-container class="py-6">
    <v-btn
      class="mb-4 text-none"
      prepend-icon="mdi-arrow-left"
      size="small"
      to="/"
      variant="text"
    >
      Back to rocket list
    </v-btn>

    <!-- Loading -->
    <v-sheet
      v-if="status === 'idle' || status === 'loading'"
      class="pa-4 rounded"
      color="surface"
    >
      <v-skeleton-loader type="image, heading, subtitle, paragraph, text, text" />
    </v-sheet>

    <!-- Fail -->
    <ErrorState
      v-else-if="status === 'error'"
      :message="error ?? 'Unable to load this rocket.'"
      title="Could not load rocket"
      @retry="retry"
    />

    <!-- Success -->
    <v-row v-else-if="rocket">
      <v-col
        cols="12"
        md="5"
      >
        <v-img
          :alt="`${rocket.fullName} image`"
          class="rounded"
          :src="rocket.imageUrl ?? undefined"
          cover
          max-height="420"
          min-height="280"
        >
          <template #error>
            <div class="detail-image-fallback">
              <v-icon
                icon="mdi-rocket-launch-outline"
                size="72"
              />
              <span class="text-caption mt-2">{{ rocket.imageUrl ? 'Image unavailable' : 'No image provided' }}</span>
            </div>
          </template>
        </v-img>
      </v-col>

      <v-col
        cols="12"
        md="7"
      >
        <div class="d-flex flex-wrap align-center ga-2 mb-2">
          <h1 class="text-h4 font-weight-bold">
            {{ rocket.fullName }}
          </h1>
          <RocketStatusChip :active="rocket.active" />
          <v-chip
            v-if="rocket.isCustom"
            color="secondary"
            label
            size="small"
          >
            Custom
          </v-chip>
        </div>

        <p
          v-if="rocket.family"
          class="text-subtitle-2 text-medium-emphasis mb-4"
        >
          {{ rocket.family }} family
        </p>

        <p class="text-body-1 mb-6">
          {{ rocket.description ?? 'No description available for this rocket.' }}
        </p>

        <v-row dense>
          <v-col
            cols="12"
            sm="6"
          >
            <RocketFact
              icon="mdi-cash"
              label="Cost per launch"
              :value="formatCost(rocket.launchCost)"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <RocketFact
              icon="mdi-earth"
              label="Country"
              :value="formatCountry(rocket.countryCode)"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <RocketFact
              icon="mdi-calendar-start"
              label="First flight"
              :value="formatDate(rocket.maidenFlight)"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <RocketFact
              icon="mdi-factory"
              label="Manufacturer"
              :value="rocket.manufacturer?.name ?? NOT_AVAILABLE"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import ErrorState from '@/components/ErrorState.vue'
  import RocketFact from '@/components/RocketFact.vue'
  import RocketStatusChip from '@/components/RocketStatusChip.vue'
  import { usePageTitle } from '@/composables/usePageTitle'
  import { useRocketDetail } from '@/composables/useRocketDetail'
  import { formatCost, formatCountry, formatDate, NOT_AVAILABLE } from '@/utils/format'

  // Route params are string | string[]; a missing value shows the error state
  // (the request then fails and offers a retry).
  const route = useRoute()
  const id = computed(() => {
    const param = route.params.id
    return (Array.isArray(param) ? param[0] : param) ?? ''
  })

  const { rocket, status, error, retry } = useRocketDetail(id)

  usePageTitle(() => rocket.value?.fullName)
</script>

<style scoped>
.detail-image-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 280px;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-surface-variant));
}
</style>
