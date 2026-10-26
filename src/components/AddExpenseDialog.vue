<template>
  <v-dialog
    v-model="isOpen"
    max-width="680"
    persistent
    scrollable
  >
    <v-card title="Add expense">
      <template #prepend>
        <v-icon icon="mdi-cash-plus" />
      </template>

      <v-card-subtitle>
        Record who paid, how much, and who it was for.
      </v-card-subtitle>

      <v-form
        ref="formRef"
        @submit.prevent="submit"
      >
        <v-card-text>
          <v-row dense>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="amount"
                autofocus
                label="Amount *"
                prefix="$"
                :rules="[positiveAmount]"
                type="text"
                inputmode="decimal"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-select
                v-model="paidBy"
                item-title="name"
                item-value="id"
                label="Paid by *"
                :rules="[requiredSelect('Choose who paid')]"
                :items="participants"
              />
            </v-col>
          </v-row>

          <v-select
            v-model="beneficiaries"
            chips
            clearable
            closable-chips
            item-title="name"
            item-value="id"
            label="Split between *"
            multiple
            :rules="[atLeastOneBeneficiary]"
            :items="participants"
          />

          <v-select
            v-model="strategy"
            hint="Equal divides evenly; percent and exact let you weight the split."
            label="Split strategy"
            :items="strategyOptions"
            persistent-hint
          />

          <!-- PERCENT / EXACT: one input per beneficiary -->
          <template v-if="strategy !== 'EQUAL' && beneficiaries.length > 0">
            <v-divider class="my-4" />

            <p class="text-caption text-medium-emphasis mb-2">
              {{ strategy === 'PERCENT'
                ? `Percent per person (must total 100%)`
                : `Exact amount per person (must total ${formatMoney(amount || '0')})` }}
            </p>

            <v-row
              v-for="id in beneficiaries"
              :key="id"
              dense
            >
              <v-col cols="12">
                <v-text-field
                  v-model="shares[id]"
                  density="compact"
                  inputmode="decimal"
                  :label="participantName(participants, id)"
                  :prefix="strategy === 'PERCENT' ? '%' : '$'"
                  type="text"
                />
              </v-col>
            </v-row>

            <v-alert
              class="mt-2"
              density="compact"
              :text="allocationMessage"
              :type="allocationValid ? 'success' : 'warning'"
              variant="tonal"
            />
          </template>

          <v-row
            class="mt-2"
            dense
          >
            <v-col
              cols="12"
              sm="6"
            >
              <v-select
                v-model="category"
                label="Category"
                :items="categoryOptions"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="description"
                label="Description"
                placeholder="e.g. Dinner at the beach"
                :rules="[maxLength(200)]"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-alert
          v-if="submitError"
          class="mx-4 mb-4"
          density="compact"
          :text="submitError"
          type="error"
          variant="tonal"
        />

        <v-divider />

        <v-card-actions class="px-4 py-3">
          <v-spacer />
          <v-btn
            :disabled="submitting"
            variant="text"
            @click="close"
          >
            Cancel
          </v-btn>
          <v-btn
            :disabled="!allocationValid"
            :loading="submitting"
            color="primary"
            prepend-icon="mdi-plus"
            type="submit"
            variant="flat"
          >
            Add expense
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'

  import { useSplitBillStore } from '@/stores/splitBill'
  import { formatMoney, participantName } from '@/utils/format'

  import type { ExpenseDraft, Participant, SplitStrategy } from '@/types/splitBill'
  import type { VForm } from 'vuetify/components'

  const props = defineProps<{
    modelValue: boolean
    groupId: string
    participants: Participant[]
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    created: []
  }>()

  const store = useSplitBillStore()

  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const formRef = ref<InstanceType<typeof VForm> | null>(null)
  const submitting = ref(false)
  const submitError = ref<string | null>(null)

  const amount = ref('')
  const paidBy = ref<string | null>(null)
  const beneficiaries = ref<string[]>([])
  const strategy = ref<SplitStrategy>('EQUAL')
  const shares = ref<Record<string, string>>({})
  const category = ref('general')
  const description = ref('')

  const strategyOptions = [
    { title: 'Equal split', value: 'EQUAL' },
    { title: 'By percentage', value: 'PERCENT' },
    { title: 'Exact amounts', value: 'EXACT' },
  ]

  const categoryOptions = ['general', 'food', 'transport', 'accommodation', 'activities']

  // Reset every time the dialog opens so a cancelled form never re-appears.
  watch(isOpen, open => {
    if (!open) return
    amount.value = ''
    beneficiaries.value = props.participants.map(participant => participant.id)
    // Default to the first participant so a valid expense needs one field only.
    paidBy.value = props.participants[0]?.id ?? null
    strategy.value = 'EQUAL'
    shares.value = {}
    category.value = 'general'
    description.value = ''
    submitError.value = null
    formRef.value?.resetValidation()
  })

  // Seed missing share inputs when the strategy or the beneficiaries change.
  watch([strategy, beneficiaries], ([currentStrategy, ids]) => {
    if (currentStrategy === 'EQUAL') return
    const next: Record<string, string> = {}
    for (const id of ids) next[id] = shares.value[id] ?? ''
    shares.value = next
  })

  function parseNumeric (value: string | null | undefined): number | null {
    if (value == null) return null
    const normalised = value.replace(/,/g, '').trim()
    if (!normalised) return null
    const numeric = Number(normalised)
    return Number.isFinite(numeric) ? numeric : null
  }

  const amountValue = computed(() => parseNumeric(amount.value) ?? 0)

  /** Mirrors the backend rules so the form never sends an invalid split. */
  const allocation = computed(() => {
    const ids = beneficiaries.value
    if (strategy.value === 'EQUAL') {
      return { valid: ids.length > 0, message: 'Split evenly between everyone selected.' }
    }

    const values = ids.map(id => parseNumeric(shares.value[id]))
    const missing = values.filter(value => value == null || value < 0).length
    const total = values.reduce<number>((acc, value) => acc + (value ?? 0), 0)
    const target = strategy.value === 'PERCENT' ? 100 : amountValue.value
    const unit = strategy.value === 'PERCENT' ? '%' : ''

    if (missing > 0) {
      return { valid: false, message: `Fill in a value for every selected person (${missing} missing).` }
    }
    if (Math.abs(total - target) > 0.005) {
      const shown = strategy.value === 'PERCENT'
        ? `${total.toFixed(2)}%`
        : formatMoney(total.toFixed(2))
      const expected = strategy.value === 'PERCENT' ? '100%' : formatMoney(target.toFixed(2))
      return { valid: false, message: `Allocated ${shown} of ${expected}.` }
    }
    return { valid: true, message: `Allocated ${total.toFixed(2)}${unit} — matches the expense.` }
  })

  const allocationValid = computed(() => allocation.value.valid)
  const allocationMessage = computed(() => allocation.value.message)

  const positiveAmount = (value: string | null) => {
    const numeric = parseNumeric(value)
    if (numeric == null) return 'Enter an amount'
    return numeric > 0 || 'Amount must be greater than 0'
  }

  const requiredSelect = (message: string) => (value: unknown) => Boolean(value) || message

  const atLeastOneBeneficiary = (value: string[] | null) =>
    (value?.length ?? 0) >= 1 || 'Select at least one person'

  const maxLength = (limit: number) => (value: string | null) =>
    !value || value.length <= limit ? true : `Must be ${limit} characters or fewer`

  function buildShares (): Record<string, string> {
    if (strategy.value === 'EQUAL') return {}
    const result: Record<string, string> = {}
    for (const id of beneficiaries.value) {
      const parsed = parseNumeric(shares.value[id])
      result[id] = String(parsed ?? 0)
    }
    return result
  }

  async function submit (): Promise<void> {
    const { valid } = await (formRef.value?.validate() ?? { valid: false })
    if (!valid || !allocationValid.value || !paidBy.value) return

    submitting.value = true
    submitError.value = null

    const draft: ExpenseDraft = {
      amount: String(amountValue.value),
      paidBy: paidBy.value,
      for: [...beneficiaries.value],
      strategy: strategy.value,
      shares: buildShares(),
      category: category.value,
      description: description.value.trim(),
    }

    try {
      await store.addExpense(props.groupId, draft)
      emit('created')
      close()
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : 'Could not add the expense. Please try again.'
    } finally {
      submitting.value = false
    }
  }

  function close (): void {
    isOpen.value = false
  }
</script>
