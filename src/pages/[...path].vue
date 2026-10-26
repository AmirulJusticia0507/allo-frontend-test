<template>
  <v-container class="py-8">
    <v-sheet
      class="pa-8 rounded text-center"
      color="surface-variant"
    >
      <v-icon
        class="mb-3"
        icon="mdi-map-marker-question-outline"
        size="64"
      />
      <h1 class="text-h5 font-weight-bold mb-2">
        Page not found
      </h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        The page you are looking for does not exist.
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-arrow-left"
        to="/"
        variant="flat"
      >
        Back to rocket list
      </v-btn>
    </v-sheet>
  </v-container>
</template>

<script lang="ts" setup>
  import { usePageTitle } from '@/composables/usePageTitle'

  usePageTitle('Page not found')
</script>
