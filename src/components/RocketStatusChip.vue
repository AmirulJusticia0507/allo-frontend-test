<template>
  <v-chip
    v-if="active === null"
    label
    size="small"
    variant="outlined"
  >
    Status unknown
  </v-chip>
  <v-chip
    v-else
    :color="active ? 'success' : 'default'"
    label
    size="small"
    variant="flat"
  >
    {{ active ? 'Active' : 'Retired' }}
  </v-chip>
</template>

<script lang="ts" setup>
  defineProps<{
    active: boolean | null
  }>()
</script>
