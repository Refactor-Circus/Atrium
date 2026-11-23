<script setup lang="ts">
/**
 * What a Guardian screen or block shows while it loads: a skeleton, then its
 * content, or the no-access state on a 403, a not-found state on a 404 and
 * an error card on any other failure. A block passes `compact`.
 */
defineProps<{ ready: boolean, failed: boolean, status: number | null, compact?: boolean, notFound?: string }>()

defineSlots<{ default?: () => unknown }>()

const { t } = useI18n()
</script>

<template>
  <AtriumNoAccess v-if="failed && status === 403" :compact="compact" />
  <UAlert
    v-else-if="failed && status === 404"
    color="neutral"
    variant="subtle"
    icon="i-lucide-search-x"
    :title="notFound ?? t('guardian.state.not_found')"
    data-testid="guardian-not-found"
  />
  <AtriumErrorCard v-else-if="failed" :message="t('guardian.state.load_failed')" />
  <slot v-else-if="ready" />
  <USkeleton v-else class="h-24" data-testid="guardian-loading" />
</template>
