<script setup lang="ts">
/**
 * What a Cortex page shows while it loads: a skeleton, then its content, or
 * the no-access state on a 403, a not-found state on a 404 and an error
 * card on any other failure.
 */
defineProps<{ ready: boolean, failed: boolean, status: number | null }>()

defineSlots<{ default?: () => unknown }>()

const { t } = useI18n()
</script>

<template>
  <AtriumNoAccess v-if="failed && status === 403" />
  <UAlert
    v-else-if="failed && status === 404"
    color="neutral"
    variant="subtle"
    icon="i-lucide-search-x"
    :title="t('cortex.state.not_found')"
    data-testid="cortex-not-found"
  />
  <AtriumErrorCard v-else-if="failed" :message="t('cortex.state.load_failed')" />
  <slot v-else-if="ready" />
  <USkeleton v-else class="h-32" data-testid="cortex-loading" />
</template>
