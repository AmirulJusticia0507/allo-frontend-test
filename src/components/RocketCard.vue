<template>
  <v-card
    :class="['h-100 d-flex flex-column rocket-card', { 'rocket-card--custom': rocket.isCustom }]"
    :ripple="clickable"
    :to="clickable ? { name: '/rockets/[id]', params: { id: rocket.id } } : undefined"
    elevation="2"
    hover
    link
  >
    <v-img
      :alt="`${rocket.fullName} image`"
      :src="rocket.imageUrl ?? undefined"
      class="rocket-card__image"
      cover
      height="180"
      lazy-src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9'%3E%3Crect width='16' height='9' fill='%23202020'/%3E%3C/svg%3E"
    >
      <template #placeholder>
        <div class="d-flex align-center justify-center fill-height bg-surface-variant">
          <v-progress-circular
            indeterminate
            size="28"
          />
        </div>
      </template>

      <template #error>
        <div class="rocket-card__image-fallback">
          <v-icon
            icon="mdi-rocket-launch-outline"
            size="56"
          />
          <span class="text-caption mt-1">{{ rocket.imageUrl ? 'Image unavailable' : 'No image provided' }}</span>
        </div>
      </template>

      <div class="rocket-card__badges d-flex ga-1 pa-2">
        <v-chip
          v-if="rocket.isCustom"
          color="secondary"
          label
          size="small"
        >
          Custom
        </v-chip>
        <RocketStatusChip :active="rocket.active" />
      </div>
    </v-img>

    <v-card-title class="text-subtitle-1 font-weight-bold text-wrap">
      {{ rocket.fullName }}
    </v-card-title>

    <v-card-subtitle class="pb-0">
      {{ rocket.countryCode ? formatCountry(rocket.countryCode) : 'Country unknown' }}
    </v-card-subtitle>

    <v-card-text class="flex-grow-1 text-body-2">
      {{ description }}
    </v-card-text>

    <v-card-actions class="px-4 pb-3">
      <span class="text-caption text-medium-emphasis">
        {{ rocket.maidenFlight ? `First flight: ${formatDate(rocket.maidenFlight)}` : 'First flight: not available' }}
      </span>
      <v-spacer />
      <v-icon
        icon="mdi-chevron-right"
        size="20"
      />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  import { formatCountry, formatDate, truncate } from '@/utils/format'

  import type { Rocket } from '@/types/rocket'

  const props = withDefaults(defineProps<{
    rocket: Rocket
    clickable?: boolean
  }>(), {
    clickable: true,
  })

  const description = computed(
    () => truncate(props.rocket.description, 140) || 'No description available for this rocket.',
  )
</script>

<style scoped>
.rocket-card {
  overflow: hidden;
  transition: transform 150ms ease-in-out;
}

.rocket-card:hover {
  transform: translateY(-2px);
}

.rocket-card--custom {
  border: 1px solid rgb(var(--v-theme-secondary));
}

.rocket-card__image-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-surface-variant));
}

.rocket-card__badges {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
