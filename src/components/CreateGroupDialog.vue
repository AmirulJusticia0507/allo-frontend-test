<template>
  <v-dialog
    v-model="isOpen"
    max-width="560"
    persistent
  >
    <v-card title="New group">
      <template #prepend>
        <v-icon icon="mdi-account-multiple-plus-outline" />
      </template>

      <v-card-subtitle>
        Name the group and list everyone who shares the expenses.
      </v-card-subtitle>

      <v-form
        ref="formRef"
        @submit.prevent="submit"
      >
        <v-card-text>
          <v-text-field
            v-model="name"
            autofocus
            counter="80"
            label="Group name *"
            placeholder="e.g. Bali Trip"
            :rules="[required('Group name is required'), maxLength(80)]"
          />

          <v-combobox
            v-model="participants"
            chips
            clearable
            closable-chips
            hint="Type a name and press Enter after each person."
            label="Participants *"
            multiple
            persistent-hint
            placeholder="e.g. Alice"
            :rules="[atLeastTwoParticipants]"
          />
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
            :loading="submitting"
            color="primary"
            prepend-icon="mdi-check"
            type="submit"
            variant="flat"
          >
            Create group
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'

  import { useSplitBillStore } from '@/stores/splitBill'

  import type { VForm } from 'vuetify/components'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    created: [id: string]
  }>()

  const store = useSplitBillStore()

  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const formRef = ref<InstanceType<typeof VForm> | null>(null)
  const submitting = ref(false)
  const submitError = ref<string | null>(null)

  const name = ref('')
  const participants = ref<string[]>([])

  // Reset every time the dialog opens so a cancelled form never re-appears.
  watch(isOpen, open => {
    if (!open) return
    name.value = ''
    participants.value = []
    submitError.value = null
    formRef.value?.resetValidation()
  })

  const required = (message: string) => (value: string | null) =>
    value && value.trim() ? true : message

  const maxLength = (limit: number) => (value: string | null) =>
    !value || value.length <= limit ? true : `Must be ${limit} characters or fewer`

  const atLeastTwoParticipants = (value: string[] | null) => {
    const names = (value ?? []).map(entry => entry.trim()).filter(Boolean)
    if (new Set(names.map(entry => entry.toLowerCase())).size !== names.length) {
      return 'Participant names must be unique'
    }
    return names.length >= 2 || 'Add at least 2 participants'
  }

  async function submit (): Promise<void> {
    const { valid } = await (formRef.value?.validate() ?? { valid: false })
    if (!valid) return

    submitting.value = true
    submitError.value = null

    const names = participants.value
      .map(entry => entry.trim())
      .filter(Boolean)

    try {
      const group = await store.createGroup({ name: name.value.trim(), participants: names })
      if (!group) return
      emit('created', group.id)
      close()
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : 'Could not create the group. Please try again.'
    } finally {
      submitting.value = false
    }
  }

  function close (): void {
    isOpen.value = false
  }
</script>
