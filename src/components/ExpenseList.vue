<template>
  <v-sheet
    class="pa-4 pa-sm-6 rounded"
    color="surface"
    elevation="2"
  >
    <div class="d-flex align-center mb-3">
      <h2 class="text-h6 font-weight-bold">
        Expenses
      </h2>
      <v-spacer />
      <v-chip
        label
        size="small"
        variant="tonal"
      >
        {{ expenses.length }}
      </v-chip>
    </div>

    <v-sheet
      v-if="expenses.length === 0"
      class="d-flex flex-column align-center text-center pa-6 rounded"
      color="surface-variant"
    >
      <v-icon
        class="mb-2"
        icon="mdi-receipt-text-outline"
        size="44"
      />
      <span class="text-body-2 text-medium-emphasis">
        No expenses yet. Add the first one to start splitting.
      </span>
    </v-sheet>

    <v-list
      v-else
      density="comfortable"
    >
      <v-list-item
        v-for="expense in sortedExpenses"
        :key="expense.id"
      >
        <template #prepend>
          <v-avatar
            class="mr-3"
            color="primary"
            variant="tonal"
          >
            <v-icon
              :icon="categoryIcon(expense.category)"
              size="20"
            />
          </v-avatar>
        </template>

        <v-list-item-title class="text-body-2">
          {{ expense.description || expense.category }}
        </v-list-item-title>

        <v-list-item-subtitle>
          {{ label(expense.paidBy) }} paid · split {{ describeSplit(expense) }}
          · {{ formatDate(expense.createdAt) }}
        </v-list-item-subtitle>

        <template #append>
          <div class="text-right">
            <div class="text-body-2 font-weight-bold">
              {{ formatMoney(expense.amount) }}
            </div>
            <div class="text-caption text-medium-emphasis text-capitalize">
              {{ expense.category }}
            </div>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  import { formatDate, formatMoney, participantName } from '@/utils/format'

  import type { Expense, Participant } from '@/types/splitBill'

  const props = defineProps<{
    expenses: Expense[]
    participants: Participant[]
  }>()

  const CATEGORY_ICONS: Record<string, string> = {
    general: 'mdi-receipt',
    food: 'mdi-silverware-fork-knife',
    transport: 'mdi-car',
    accommodation: 'mdi-bed',
    activities: 'mdi-ticket',
  }

  function categoryIcon (category: string): string {
    return CATEGORY_ICONS[category] ?? 'mdi-receipt'
  }

  function label (id: string): string {
    return participantName(props.participants, id)
  }

  function describeSplit (expense: Expense): string {
    const names = expense.for.map(participantName.bind(null, props.participants))
    const who = names.length > 3
      ? `${names.slice(0, 3).join(', ')} +${names.length - 3}`
      : names.join(', ')
    return `${expense.strategy.toLowerCase()} between ${who}`
  }

  /** Newest first, without mutating the store array. */
  const sortedExpenses = computed(() =>
    [...props.expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  )
</script>
