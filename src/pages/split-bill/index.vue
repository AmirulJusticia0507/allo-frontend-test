<template>
  <v-container class="py-8">
    <v-row align="center">
      <v-col
        cols="12"
        sm="8"
      >
        <h1 class="text-h4 font-weight-bold">
          Split Bill
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
          Create a group, log who paid for what, and see the fewest transfers needed to settle up.
        </p>
      </v-col>
      <v-col
        class="d-flex justify-sm-end"
        cols="12"
        sm="4"
      >
        <v-btn
          color="primary"
          prepend-icon="mdi-account-multiple-plus"
          variant="flat"
          @click="isCreateOpen = true"
        >
          New group
        </v-btn>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row
      v-if="store.groupsState.status === 'idle' || store.groupsState.status === 'loading'"
      class="mt-4"
    >
      <v-col
        v-for="index in 3"
        :key="index"
        cols="12"
        md="6"
        lg="4"
      >
        <v-skeleton-loader
          class="rounded"
          type="heading, subtitle, text"
        />
      </v-col>
    </v-row>

    <!-- Fail -->
    <ErrorState
      v-else-if="store.groupsState.status === 'error'"
      class="mt-6"
      :message="store.groupsState.error ?? 'Unable to load groups.'"
      title="Could not load groups"
      @retry="retry"
    />

    <!-- Success + empty -->
    <v-sheet
      v-else-if="groups.length === 0"
      class="d-flex flex-column align-center text-center pa-8 mt-6 rounded"
      color="surface-variant"
    >
      <v-icon
        class="mb-3"
        icon="mdi-account-group-outline"
        size="56"
      />
      <h2 class="text-h6 mb-2">
        No groups yet
      </h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Start a group for your trip, team lunch, or shared apartment.
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="flat"
        @click="isCreateOpen = true"
      >
        Create your first group
      </v-btn>
    </v-sheet>

    <!-- Success -->
    <v-row
      v-else
      class="mt-2"
    >
      <v-col
        v-for="group in groups"
        :key="group.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          class="h-100 d-flex flex-column"
          elevation="2"
          hover
          link
          :to="{ name: '/split-bill/[id]', params: { id: group.id } }"
        >
          <v-card-title class="text-subtitle-1 font-weight-bold text-wrap">
            {{ group.name }}
          </v-card-title>
          <v-card-subtitle>
            {{ group.participants.length }} {{ group.participants.length === 1 ? 'participant' : 'participants' }}
          </v-card-subtitle>
          <v-card-text class="flex-grow-1">
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="participant in group.participants"
                :key="participant.id"
                label
                size="small"
                variant="tonal"
              >
                {{ participant.name }}
              </v-chip>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-3">
            <span class="text-caption text-medium-emphasis">Open group</span>
            <v-spacer />
            <v-icon
              icon="mdi-chevron-right"
              size="20"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <CreateGroupDialog
      v-model="isCreateOpen"
      @created="onCreated"
    />

    <v-snackbar
      v-model="snackbar"
      color="success"
      :timeout="3000"
    >
      Group created
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  import CreateGroupDialog from '@/components/CreateGroupDialog.vue'
  import ErrorState from '@/components/ErrorState.vue'
  import { usePageTitle, TITLE_PREFIXES } from '@/composables/usePageTitle'
  import { useSplitBillGroups } from '@/composables/useSplitBillGroups'

  const { store, groups, retry } = useSplitBillGroups()
  const router = useRouter()

  const isCreateOpen = ref(false)
  const snackbar = ref(false)

  function onCreated (id: string): void {
    snackbar.value = true
    // Go straight to the new group so the user can add the first expense.
    void router.push({ name: '/split-bill/[id]', params: { id } })
  }

  usePageTitle('Split Bill', TITLE_PREFIXES.splitBill)
</script>
