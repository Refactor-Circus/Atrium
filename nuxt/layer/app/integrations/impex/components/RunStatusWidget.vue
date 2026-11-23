<script setup lang="ts">
import { RUN_STATUSES, useImpexStats } from './shared'
import ImpexStatusBadge from './ImpexStatusBadge.vue'

/**
 * `impex.run-status`: how many runs sit in each state, and how many are
 * still active, from `impex.stats.show` (`runs.by_status`, `runs.active`).
 */
defineProps<{ data?: Record<string, unknown>, settings?: Record<string, unknown> }>()

const { t } = useI18n()
const stats = useImpexStats()

const runs = computed(() => stats.data.value?.runs ?? null)
</script>

<template>
  <div data-testid="impex-run-status">
    <AtriumNoAccess v-if="stats.forbidden.value" compact />
    <AtriumErrorCard v-else-if="stats.status.value === 'error'" :message="t('atrium.widget.failed')" />
    <USkeleton v-else-if="!runs" class="h-16" />
    <div v-else class="space-y-3">
      <p class="text-sm text-muted" data-testid="impex-run-status-active">
        {{ t('impex.widgets.active', { count: runs.active }) }}
      </p>
      <ul class="grid grid-cols-2 gap-2 text-sm">
        <li v-for="status in RUN_STATUSES" :key="status" class="flex items-center justify-between gap-2" :data-testid="`impex-run-status-${status}`">
          <ImpexStatusBadge :status="status" />
          <span class="font-medium tabular-nums">{{ runs.by_status[status] ?? 0 }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
