<script setup lang="ts">
/**
 * A failed mutation that is not a validation error: the no-access state on a
 * 403, else Cortex's message.
 */
defineProps<{ forbidden: boolean, message: string | null }>()

const { t } = useI18n()
</script>

<template>
  <AtriumNoAccess v-if="forbidden" compact :title="t('cortex.state.action_forbidden')" />
  <UAlert v-else-if="message" color="error" variant="subtle" :title="message" data-testid="cortex-action-error" />
</template>
