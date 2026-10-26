<template>
  <v-dialog
    v-model="isOpen"
    max-width="640"
    persistent
    scrollable
  >
    <v-card :title="`Add rocket`">
      <template #prepend>
        <v-icon icon="mdi-rocket-launch-outline" />
      </template>

      <v-card-subtitle>
        The Launch Library API is read-only, so new rockets are kept in the app only.
      </v-card-subtitle>

      <v-form
        ref="formRef"
        @submit.prevent="submit"
      >
        <v-card-text>
          <v-text-field
            v-model="form.fullName"
            :rules="[required, maxLength(100)]"
            counter="100"
            label="Rocket name *"
            placeholder="e.g. Falcon 9 Block 6"
          />

          <v-textarea
            v-model="form.description"
            label="Description"
            rows="3"
            auto-grow
            counter="1000"
            :rules="[maxLength(1000)]"
          />

          <v-row dense>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="form.launchCost"
                label="Cost per launch (USD)"
                placeholder="e.g. 52000000"
                :rules="[optionalNumeric]"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-select
                v-model="form.countryCode"
                clearable
                label="Country"
                :items="countryOptions"
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model="form.maidenFlight"
            label="First flight"
            type="date"
            clearable
          />

          <v-text-field
            v-model="form.imageUrl"
            hint="Leave empty to use a placeholder"
            label="Image URL"
            placeholder="https://…"
            persistent-hint
            :rules="[optionalUrl]"
          />

          <v-alert
            v-if="imagePreviewError && form.imageUrl"
            class="mt-4"
            density="compact"
            text="The image URL could not be loaded; a placeholder will be shown instead."
            type="warning"
            variant="tonal"
          />
        </v-card-text>

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
            color="primary"
            prepend-icon="mdi-plus"
            type="submit"
            variant="flat"
          >
            Save rocket
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { computed, reactive, ref, watch } from 'vue'

  import { useRocketStore } from '@/stores/rockets'

  import type { RocketDraft } from '@/types/rocket'
  import type { VForm } from 'vuetify/components'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    created: [id: string]
  }>()

  const store = useRocketStore()

  /** The dialog is fully controlled by `v-model` on the parent. */
  const isOpen = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const formRef = ref<InstanceType<typeof VForm> | null>(null)
  const submitting = ref(false)
  const imagePreviewError = ref(false)

  interface RocketForm {
    fullName: string
    description: string
    launchCost: string
    countryCode: string | null
    maidenFlight: string
    imageUrl: string
  }

  function emptyForm (): RocketForm {
    return {
      fullName: '',
      description: '',
      launchCost: '',
      countryCode: null,
      maidenFlight: '',
      imageUrl: '',
    }
  }

  const form = reactive<RocketForm>(emptyForm())

  const COUNTRY_CODES = [
    'USA', 'CHN', 'RUS', 'FRA', 'JPN', 'IND', 'NZL', 'GBR', 'DEU', 'ITA', 'KOR',
  ]

  const countryOptions = COUNTRY_CODES.map(code => ({
    title: code,
    value: code,
  }))

  // Reset every time the dialog opens so a cancelled form never re-appears.
  watch(isOpen, open => {
    if (open) {
      Object.assign(form, emptyForm())
      imagePreviewError.value = false
      formRef.value?.resetValidation()
    }
  })

  watch(() => form.imageUrl, () => {
    imagePreviewError.value = false
  })

  const required = (value: string | null) => (value && value.trim() ? true : 'Rocket name is required')
  const maxLength = (limit: number) => (value: string | null) =>
    !value || value.length <= limit ? true : `Must be ${limit} characters or fewer`
  const optionalNumeric = (value: string | null) =>
    !value || value.trim() === '' || (Number.isFinite(Number(value.replace(/,/g, ''))) && Number(value.replace(/,/g, '')) >= 0)
      ? true
      : 'Enter a positive number'
  const optionalUrl = (value: string | null) => {
    if (!value || value.trim() === '') return true
    try {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol) || 'Enter a valid http(s) URL'
    } catch {
      return 'Enter a valid http(s) URL'
    }
  }

  function normalise (value: string): string | null {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  async function submit (): Promise<void> {
    const { valid } = await (formRef.value?.validate() ?? { valid: false })
    if (!valid) return

    submitting.value = true
    try {
      const draft: RocketDraft = {
        fullName: form.fullName.trim(),
        description: normalise(form.description),
        imageUrl: normalise(form.imageUrl),
        launchCost: normalise(form.launchCost.replace(/,/g, '')),
        countryCode: normalise(form.countryCode ?? ''),
        maidenFlight: normalise(form.maidenFlight),
      }

      const rocket = store.addRocket(draft)
      emit('created', rocket.id)
      close()
    } finally {
      submitting.value = false
    }
  }

  function close (): void {
    isOpen.value = false
  }
</script>
