<script setup lang="ts">
import { integrationData, useAtriumIntegration } from '@refactor-circus/atrium'
import { fieldErrors } from './entries'

/**
 * The v1 "Record an event" card: an action, optionally the record it is
 * about and a note, posted to `keen.entries.store` (the note goes in the
 * entry's `context`). A 422 shows the field errors, and a 403 a no-access
 * notice; `recorded` fires once Keen has the entry.
 */
const emit = defineEmits<{ recorded: [] }>()

const { t } = useI18n()
const { client } = useAtriumIntegration('keen')

const form = reactive({ action: '', subject_label: '', note: '' })
const error = shallowRef<unknown>(null)
const saving = ref(false)
const done = ref(false)

const errors = computed(() => fieldErrors(error.value))
const forbidden = computed(() => atriumStatus(error.value) === 403)
const failed = computed(() => error.value !== null && !forbidden.value && Object.keys(errors.value).length === 0)

async function submit(): Promise<void> {
  if (!client) {
    return
  }

  saving.value = true
  done.value = false
  error.value = null

  try {
    integrationData(await client.POST('/entries', {
      body: {
        action: form.action,
        ...(form.subject_label !== '' ? { subject_label: form.subject_label } : {}),
        // Keen takes any object as context; its schema types it loosely.
        ...(form.note !== '' ? { context: { note: form.note } as unknown as string[] } : {})
      }
    }))

    Object.assign(form, { action: '', subject_label: '', note: '' })
    done.value = true
    emit('recorded')
  } catch (e) {
    error.value = e
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UCard data-testid="keen-record">
    <template #header>
      <h2 class="font-medium">{{ t('keen.record.title') }}</h2>
    </template>

    <AtriumNoAccess v-if="forbidden" compact :description="t('keen.record.forbidden')" class="mb-3" />
    <UAlert v-else-if="failed" color="error" :title="t('keen.record.failed')" class="mb-3" data-testid="keen-record-failed" />
    <UAlert v-else-if="done" color="success" variant="subtle" :title="t('keen.record.recorded')" class="mb-3" data-testid="keen-record-done" />

    <form class="flex flex-wrap items-start gap-3" data-testid="keen-record-form" @submit.prevent="submit">
      <UFormField :label="t('keen.record.action')" name="action" :hint="t('keen.record.action_hint')" :error="errors.action?.[0]" required class="w-56">
        <UInput v-model="form.action" required class="w-full" data-testid="keen-record-action" />
      </UFormField>
      <UFormField :label="t('keen.record.subject')" name="subject_label" :error="errors.subject_label?.[0]" class="w-56">
        <UInput v-model="form.subject_label" class="w-full" data-testid="keen-record-subject" />
      </UFormField>
      <UFormField :label="t('keen.record.note')" name="note" :error="errors['context.note']?.[0] ?? errors.context?.[0]" class="w-80">
        <UInput v-model="form.note" class="w-full" data-testid="keen-record-note" />
      </UFormField>
      <UButton type="submit" icon="i-lucide-square-pen" :loading="saving" class="self-end" data-testid="keen-record-submit">
        {{ t('keen.record.submit') }}
      </UButton>
    </form>
  </UCard>
</template>
