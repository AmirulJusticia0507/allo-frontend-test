<template>
  <v-row :dense="dense">
    <v-col
      v-for="index in count"
      :key="index"
      cols="12"
      md="6"
      sm="12"
    >
      <v-skeleton-loader
        class="rounded"
        type="image, article, actions"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
  withDefaults(defineProps<{
    count?: number
    dense?: boolean
  }>(), {
    count: 4,
    dense: false,
  })
</script>
