<template>
  <div class="d-flex align-start ga-3 pa-4 rounded bg-surface-variant h-100">
    <v-icon
      class="mt-1"
      color="primary"
      :icon="icon"
      size="22"
    />
    <div class="min-width-0">
      <div class="text-caption text-medium-emphasis">
        {{ label }}
      </div>
      <div class="text-body-1 font-weight-medium text-wrap">
        {{ value }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    icon: string
    label: string
    value: string
  }>()
</script>
