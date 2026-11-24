<script setup lang="ts">
import type { GuardianAction } from './guardian'

/**
 * A failed Guardian action that is not a field error: the no-access notice
 * on a 403, "too many attempts" with the wait on a 429, else Guardian's
 * message.
 */
defineProps<{ action: GuardianAction }>()

const { t } = useI18n()
</script>

<template>
  <AtriumNoAccess v-if="action.forbidden.value" compact />
  <UAlert
    v-else-if="action.status.value === 429"
    color="warning"
    variant="subtle"
    :title="t('guardian.two_factor.throttled')"
    :description="action.retryAfter.value ? t('guardian.two_factor.retry_after', { seconds: action.retryAfter.value }) : undefined"
    data-testid="guardian-throttled"
  />
  <UAlert v-else-if="action.message.value" color="error" variant="subtle" :title="action.message.value" data-testid="guardian-action-error" />
</template>
