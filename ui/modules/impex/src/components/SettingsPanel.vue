<script setup lang="ts">
import { integrationData } from '@refactor-circus/atrium'
import { type ImpexSettingsSummary, useImpexResource } from './shared'
import ImpexState from './ImpexState.vue'

/**
 * The `impex` settings panel: retention, the engine's limits and artifact
 * storage, read from `impex.settings-summary.show`, in the rows the v1 panel
 * showed.
 */
defineProps<{ data?: Record<string, unknown> }>()

const { t } = useI18n()

const summary = useImpexResource(async client => integrationData(await client.GET('/settings-summary')).data as ImpexSettingsSummary)

const days = (count: number) => t('impex.settings.days', { count })
const seconds = (count: number) => t('impex.settings.seconds', { count })
const bytes = (count: number) => t('impex.settings.bytes', { count })

const sections = computed(() => {
  const value = summary.data.value

  if (!value) {
    return []
  }

  return [
    {
      key: 'retention',
      title: t('impex.settings.retention'),
      rows: [
        { key: 'completed_runs_days', label: t('impex.settings.completed_runs'), value: days(value.retention.completed_runs_days) },
        { key: 'failed_runs_days', label: t('impex.settings.failed_runs'), value: days(value.retention.failed_runs_days) },
        { key: 'messages_days', label: t('impex.settings.messages'), value: days(value.retention.messages_days) },
        { key: 'artifacts_days', label: t('impex.settings.artifacts'), value: days(value.retention.artifacts_days) },
        { key: 'events_days', label: t('impex.settings.events'), value: days(value.retention.events_days) },
        { key: 'deliveries_days', label: t('impex.settings.deliveries'), value: days(value.retention.deliveries_days) }
      ]
    },
    {
      key: 'limits',
      title: t('impex.settings.limits'),
      rows: [
        { key: 'max_step_seconds', label: t('impex.settings.max_step'), value: seconds(value.limits.max_step_seconds) },
        { key: 'resume_margin_seconds', label: t('impex.settings.resume_margin'), value: seconds(value.limits.resume_margin_seconds) },
        { key: 'lease_seconds', label: t('impex.settings.lease'), value: seconds(value.limits.lease_seconds) },
        { key: 'lock_seconds', label: t('impex.settings.lock'), value: seconds(value.limits.lock_seconds) },
        { key: 'max_resumptions', label: t('impex.settings.max_resumptions'), value: String(value.limits.max_resumptions) },
        { key: 'fan_out_max', label: t('impex.settings.fan_out_max'), value: String(value.limits.fan_out_max) },
        { key: 'sync_seconds', label: t('impex.settings.sync'), value: seconds(value.limits.sync_seconds) }
      ]
    },
    {
      key: 'artifacts',
      title: t('impex.settings.artifact_storage'),
      rows: [
        { key: 'disk', label: t('impex.settings.disk'), value: value.artifacts.disk ?? t('impex.settings.default_disk') },
        { key: 'path', label: t('impex.settings.path'), value: value.artifacts.path },
        { key: 'inline_threshold', label: t('impex.settings.inline_threshold'), value: bytes(value.artifacts.inline_threshold) },
        { key: 'memo_bytes', label: t('impex.settings.memo'), value: bytes(value.artifacts.memo_bytes) },
        { key: 'preview_bytes', label: t('impex.settings.preview_bytes'), value: bytes(value.preview_bytes) }
      ]
    }
  ]
})
</script>

<template>
  <div data-testid="impex-settings">
    <ImpexState :error="summary.error.value" :ready="summary.data.value !== null">
      <div class="grid gap-4 md:grid-cols-3">
        <UCard v-for="section in sections" :key="section.key" :data-testid="`impex-settings-${section.key}`">
          <template #header>
            <h3 class="font-medium">{{ section.title }}</h3>
          </template>
          <dl class="space-y-2 text-sm">
            <div v-for="row in section.rows" :key="row.key" class="flex justify-between gap-3" :data-row="row.key">
              <dt class="text-muted">{{ row.label }}</dt>
              <dd class="font-medium tabular-nums">{{ row.value }}</dd>
            </div>
          </dl>
        </UCard>
      </div>
    </ImpexState>
  </div>
</template>
