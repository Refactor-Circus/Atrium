<script setup lang="ts">
import type { ImpexAction } from './shared'

/**
 * The outcome of a page's last action: what it did, the field errors of a
 * 422, the no-access notice of a 403, or why it failed.
 */
const props = defineProps<{ action: ImpexAction }>()

const { t } = useI18n()

const notice = computed(() => props.action.notice.value)
const failure = computed(() => props.action.failure.value)
const forbidden = computed(() => props.action.forbidden.value)
const errors = computed(() => Object.entries(props.action.errors.value))
</script>

<template>
  <div v-if="notice || failure || forbidden || errors.length" class="space-y-2">
    <UAlert v-if="notice" color="success" variant="subtle" :title="notice" data-testid="impex-notice" />
    <AtriumNoAccess v-if="forbidden" compact :description="t('impex.common.action_forbidden')" />
    <AtriumErrorCard v-if="failure" :message="failure" />
    <ul v-if="errors.length" class="space-y-1 rounded-md border border-error/40 p-3 text-sm text-error" role="alert" data-testid="impex-field-errors">
      <li v-for="[field, messages] in errors" :key="field" :data-field="field">
        {{ messages.join(' ') }}
      </li>
    </ul>
  </div>
</template>
