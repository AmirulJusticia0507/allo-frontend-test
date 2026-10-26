<template>
  <v-sheet
    class="pa-4 pa-sm-6 rounded"
    color="surface"
    elevation="2"
  >
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <h2 class="text-h6 font-weight-bold">
        Settlement
      </h2>
      <v-chip
        v-if="optimised"
        color="success"
        label
        size="small"
        variant="tonal"
      >
        {{ transactions.length }} {{ transactions.length === 1 ? 'transfer' : 'transfers' }}
      </v-chip>
    </div>

    <v-row dense>
      <v-col
        cols="12"
        sm="4"
      >
        <RocketFact
          icon="mdi-cash-multiple"
          label="Total expenses"
          :value="formatMoney(settlement.totalExpenses)"
        />
      </v-col>
      <v-col
        cols="12"
        sm="4"
      >
        <RocketFact
          icon="mdi-percent"
          label="Service charge"
          :value="`${formatMoney(settlement.serviceChargeAmount)} (${settlement.serviceChargePct}%)`"
        />
      </v-col>
      <v-col
        cols="12"
        sm="4"
      >
        <RocketFact
          icon="mdi-account-cash"
          label="Total including service charge"
          :value="formatMoney(settlement.totalWithServiceCharge)"
        />
      </v-col>
    </v-row>

    <v-divider class="my-6" />

    <h3 class="text-subtitle-1 font-weight-bold mb-3">
      Balances
    </h3>
    <v-table density="compact">
      <tbody>
        <tr
          v-for="balance in settlement.perParticipant"
          :key="balance.id"
        >
          <td class="font-weight-medium">
            {{ balance.name }}
          </td>
          <td class="text-right">
            <span
              class="font-weight-bold"
              :class="balanceClass(balance.balance)"
            >
              {{ formatSignedMoney(balance.balance) }}
            </span>
          </td>
          <td class="d-none d-sm-table-cell text-medium-emphasis text-caption">
            {{ describeBalance(balance.balance) }}
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-divider class="my-6" />

    <h3 class="text-subtitle-1 font-weight-bold mb-3">
      Who pays whom
    </h3>

    <v-sheet
      v-if="transactions.length === 0"
      class="d-flex align-center ga-3 pa-4 rounded"
      color="surface-variant"
    >
      <v-icon
        color="success"
        icon="mdi-check-decagram-outline"
        size="28"
      />
      <span class="text-body-2">Everyone is settled up. No transfers needed.</span>
    </v-sheet>

    <v-list
      v-else
      density="compact"
    >
      <v-list-item
        v-for="transaction in transactions"
        :key="`${transaction.from}-${transaction.to}-${transaction.amount}`"
      >
        <template #prepend>
          <v-icon
            class="mr-3"
            color="primary"
            icon="mdi-arrow-right-thin"
          />
        </template>

        <v-list-item-title class="text-body-2">
          <strong>{{ label(transaction.from) }}</strong>
          pays
          <strong>{{ label(transaction.to) }}</strong>
        </v-list-item-title>

        <template #append>
          <div class="d-flex align-center ga-2">
            <span class="text-body-2 font-weight-bold">
              {{ formatMoney(transaction.amount) }}
            </span>
            <v-btn
              class="text-none"
              :disabled="paying"
              size="small"
              variant="text"
              @click="onMarkPaid(transaction)"
            >
              Mark paid
            </v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>

    <v-alert
      v-if="payments.length > 0"
      class="mt-4"
      density="compact"
      type="info"
      variant="tonal"
    >
      {{ payments.length }} payment{{ payments.length === 1 ? '' : 's' }} recorded. The balances above
      include all expenses; the backend does not yet apply recorded payments to the settlement.
    </v-alert>
  </v-sheet>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  import RocketFact from '@/components/RocketFact.vue'
  import { formatMoney, formatSignedMoney, participantName } from '@/utils/format'

  import type { Participant, Settlement, Transaction } from '@/types/splitBill'

  const props = defineProps<{
    settlement: Settlement
    participants: Participant[]
    paying?: boolean
  }>()

  const emit = defineEmits<{
    'mark-paid': [transaction: Transaction]
  }>()

  const transactions = computed(() => props.settlement.transactions)
  const payments = computed(() => props.settlement.paymentsApplied ?? [])
  const optimised = computed(() => transactions.value.length > 0)

  function label (id: string): string {
    return participantName(props.participants, id)
  }

  function balanceClass (balance: string): string {
    const numeric = Number(balance)
    if (numeric > 0) return 'text-success'
    if (numeric < 0) return 'text-error'
    return 'text-medium-emphasis'
  }

  function describeBalance (balance: string): string {
    const numeric = Number(balance)
    if (numeric > 0) return 'is owed'
    if (numeric < 0) return 'owes'
    return 'settled'
  }

  function onMarkPaid (transaction: Transaction): void {
    emit('mark-paid', transaction)
  }
</script>
