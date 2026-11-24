<script setup lang="ts">
import { formatDate, runPath, useImpexStats } from './shared'

/**
 * `impex.recent-failures`: the runs that failed most recently, from
 * `impex.stats.show` (`runs.recent_failures`), each linking to its run.
 */
defineProps<{ data?: Record<string, unknown>, settings?: Record<string, unknown> }>()

const { t } = useI18n()
const stats = useImpexStats()

const failures = computed(() => stats.data.value?.runs.recent_failures ?? null)
</script>

<template>
  <div data-testid="impex-recent-failures">
    <AtriumNoAccess v-if="stats.forbidden.value" compact />
    <AtriumErrorCard v-else-if="stats.status.value === 'error'" :message="t('atrium.widget.failed')" />
    <USkeleton v-else-if="!failures" class="h-16" />
    <p v-else-if="failures.length === 0" class="text-sm text-muted">{{ t('impex.widgets.no_failures') }}</p>
    <ul v-else class="divide-y divide-default text-sm">
      <li v-for="run in failures" :key="run.id" class="flex items-center justify-between gap-2 py-1.5">
        <RouterLink :to="runPath(run.id)" class="truncate font-medium hover:underline" :data-testid="`impex-failure-${run.id}`">{{ run.flow }}</RouterLink>
        <span class="shrink-0 text-xs text-muted">{{ formatDate(run.finished_at) }}</span>
      </li>
    </ul>
  </div>
</template>
