<template>
  <v-app>
    <v-app-bar
      color="surface"
      elevation="1"
      flat
    >
      <v-app-bar-title>
        <router-link
          class="d-flex align-center text-decoration-none text-high-emphasis ga-2"
          to="/"
        >
          <v-icon
            color="primary"
            icon="mdi-rocket-launch"
          />
          <span class="text-subtitle-1 font-weight-bold">Allo Space</span>
        </router-link>
      </v-app-bar-title>

      <template #append>
        <v-btn
          class="mr-2 text-none"
          color="primary"
          prepend-icon="mdi-plus"
          variant="flat"
          @click="emit('add')"
        >
          Add rocket
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <v-footer
      class="justify-center text-caption text-medium-emphasis"
      color="surface"
    >
      Rocket data from the Launch Library 2 API by The Space Devs
    </v-footer>

    <!-- App-level dialogs, kept mounted so they survive route changes. -->
    <AddRocketDialog
      v-model="isAddDialogOpen"
      @created="onCreated"
    />

    <v-snackbar
      v-model="snackbar"
      color="success"
      :timeout="3000"
    >
      Rocket added to the list
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  import AddRocketDialog from '@/components/AddRocketDialog.vue'

  const emit = defineEmits<{
    add: []
  }>()

  const router = useRouter()

  const isAddDialogOpen = ref(false)
  const snackbar = ref(false)

  function onCreated (id: string): void {
    snackbar.value = true
    // Jump to the detail screen so the new rocket is visible right away.
    void router.push({ name: '/rockets/[id]', params: { id } })
  }
</script>
