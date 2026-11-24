<script setup lang="ts">
import { useImpexStats } from './shared'

/**
 * `impex.message-volume`: messages in and out over the stats window, from
 * `impex.stats.show` (`messages`). Impex sends `messages: null` when the
 * user may not list messages, and the widget then shows nothing.
 */
defineProps<{ data?: Record<string, unknown>, settings?: Record<string, unknown> }>()

const { t } = useI18n()
const stats = useImpexStats()

const messages = computed(() => stats.data.value?.messages ?? null)
</script>

<template>
  <AtriumNoAccess v-if="stats.forbidden.value" compact />
  <AtriumErrorCard v-else-if="stats.status.value === 'error'" :message="t('atrium.widget.failed')" />
  <USkeleton v-else-if="stats.status.value !== 'success'" class="h-10" />
  <div v-else-if="messages" class="grid grid-cols-2 gap-2 text-sm" data-testid="impex-message-volume">
    <AtriumStat :label="t('impex.widgets.inbound')" icon="i-lucide-arrow-down-left" tone="primary">
      <template #value><span data-testid="impex-message-volume-inbound">{{ messages.inbound }}</span></template>
    </AtriumStat>
    <AtriumStat :label="t('impex.widgets.outbound')" icon="i-lucide-arrow-up-right">
      <template #value><span data-testid="impex-message-volume-outbound">{{ messages.outbound }}</span></template>
    </AtriumStat>
    <p class="col-span-2 text-xs text-muted">{{ t('impex.widgets.window', { hours: messages.window_hours }) }}</p>
  </div>
</template>
