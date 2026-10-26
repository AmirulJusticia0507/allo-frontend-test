<template>
  <v-container class="py-6">
    <v-btn
      class="mb-4 text-none"
      prepend-icon="mdi-arrow-left"
      size="small"
      to="/split-bill"
      variant="text"
    >
      Back to groups
    </v-btn>

    <!-- Loading -->
    <v-sheet
      v-if="status === 'idle' || status === 'loading'"
      class="pa-4 rounded"
      color="surface"
    >
      <v-skeleton-loader type="heading, subtitle, article, text, text" />
    </v-sheet>

    <!-- Fail -->
    <ErrorState
      v-else-if="status === 'error'"
      :message="error ?? 'Unable to load this group.'"
      title="Could not load group"
      @retry="retry"
    />

    <!-- Success -->
    <template v-else-if="group">
      <v-row align="center">
        <v-col
          cols="12"
          sm="8"
        >
          <h1 class="text-h4 font-weight-bold">
            {{ group.name }}
          </h1>
          <div class="d-flex flex-wrap ga-1 mt-2">
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
        </v-col>
        <v-col
          class="d-flex justify-sm-end ga-2"
          cols="12"
          sm="4"
        >
          <v-btn
            :loading="refreshing"
            class="text-none"
            prepend-icon="mdi-refresh"
            variant="text"
            @click="retry"
          >
            Refresh
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            variant="flat"
            @click="isExpenseOpen = true"
          >
            Add expense
          </v-btn>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col
          cols="12"
          lg="7"
        >
          <ExpenseList
            :expenses="expenses"
            :participants="group.participants"
          />
        </v-col>

        <v-col
          cols="12"
          lg="5"
        >
          <v-sheet
            v-if="!settlement"
            class="pa-6 rounded"
            color="surface-variant"
          >
            <div class="d-flex align-center ga-3">
              <v-progress-circular
                indeterminate
                size="22"
              />
              <span class="text-body-2">Calculating settlement…</span>
            </div>
          </v-sheet>
          <SettlementSummary
            v-else
            :participants="group.participants"
            :paying="paying"
            :settlement="settlement"
            @mark-paid="markPaid"
          />
        </v-col>
      </v-row>
    </template>

    <AddExpenseDialog
      v-if="group"
      v-model="isExpenseOpen"
      :group-id="group.id"
      :participants="group.participants"
      @created="onExpenseCreated"
    />

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3500"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useRoute } from 'vue-router'

  import AddExpenseDialog from '@/components/AddExpenseDialog.vue'
  import ErrorState from '@/components/ErrorState.vue'
  import ExpenseList from '@/components/ExpenseList.vue'
  import SettlementSummary from '@/components/SettlementSummary.vue'
  import { usePageTitle, TITLE_PREFIXES } from '@/composables/usePageTitle'
  import { useSplitBillGroup } from '@/composables/useSplitBillGroup'

  import type { Transaction } from '@/types/splitBill'

  const route = useRoute()
  const id = computed(() => {
    const param = route.params.id
    return (Array.isArray(param) ? param[0] : param) ?? ''
  })

  const { store, group, expenses, settlement, status, error, refreshing, retry } = useSplitBillGroup(id)

  const isExpenseOpen = ref(false)
  const paying = ref(false)

  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref<'success' | 'error'>('success')

  function notify (text: string, color: 'success' | 'error' = 'success'): void {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  function onExpenseCreated (): void {
    notify('Expense added')
  }

  /**
   * Records the recommended transfer so the group keeps an audit trail.
   * Note: the backend stores payments but does not subtract them from the
   * settlement yet (see docs/split-bill-api.md → Known gaps).
   */
  async function markPaid (transaction: Transaction): Promise<void> {
    paying.value = true
    try {
      await store.addPayment(id.value, {
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        note: 'Marked paid from the app',
      })
      notify('Payment recorded')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not record the payment.', 'error')
    } finally {
      paying.value = false
    }
  }

  usePageTitle(() => group.value?.name, TITLE_PREFIXES.splitBill)
</script>
