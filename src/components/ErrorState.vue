<template>
  <v-sheet
    class="d-flex flex-column align-center justify-center text-center pa-8 rounded"
    color="surface-variant"
    min-height="280"
  >
    <v-icon
      class="mb-4 text-error"
      icon="mdi-alert-circle-outline"
      size="56"
    />
    <h2 class="text-h6 mb-2">
      {{ title }}
    </h2>
    <p class="text-body-2 text-medium-emphasis mb-6">
      {{ message }}
    </p>
    <v-btn
      :loading="retrying"
      color="primary"
      prepend-icon="mdi-refresh"
      variant="flat"
      @click="emit('retry')"
    >
      Retry
    </v-btn>
  </v-sheet>
</template>

<script lang="ts" setup>
  withDefaults(defineProps<{
    title?: string
    message: string
    retrying?: boolean
  }>(), {
    title: 'Something went wrong',
    retrying: false,
  })

  const emit = defineEmits<{
    retry: []
  }>()
</script>
