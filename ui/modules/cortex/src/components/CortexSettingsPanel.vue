<script setup lang="ts">
import { cortexData, useCortexLoad, type CortexOne, type CortexSettingsSummary } from './cortex'
import CortexLoad from './CortexLoad.vue'

/**
 * The `cortex` settings panel (AC 61): the v1 panel's rows from Cortex's
 * `settings-summary` endpoint: the provider, tool, concrete-agent and MCP
 * server counts, and whether the agent cache is on. PHP sends `data: {}`.
 */
defineProps<{ data?: Record<string, unknown> }>()

const { t } = useI18n()

const { data: summary, pending, failed, status } = useCortexLoad(async client =>
  cortexData<CortexOne<CortexSettingsSummary>>(await client.GET('/settings-summary')).data)

const stats = computed(() => summary.value
  ? [
      { key: 'providers', label: t('cortex.settings.providers'), value: summary.value.providers.length },
      { key: 'tools', label: t('cortex.settings.tools'), value: summary.value.tool_count },
      { key: 'agents', label: t('cortex.settings.concrete_agents'), value: summary.value.agent_count },
      { key: 'servers', label: t('cortex.settings.servers'), value: summary.value.server_count }
    ]
  : [])
</script>

<template>
  <div data-testid="cortex-settings-panel">
    <CortexLoad :ready="!pending && summary !== null" :failed="failed" :status="status">
      <div class="flex flex-col gap-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UCard v-for="stat in stats" :key="stat.key" :data-testid="`cortex-stat-${stat.key}`">
            <p class="text-sm text-muted">{{ stat.label }}</p>
            <p class="text-2xl font-semibold">{{ stat.value }}</p>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <h3 class="font-medium">{{ t('cortex.settings.cache') }}</h3>
          </template>
          <UBadge
            :color="summary?.cache_enabled ? 'success' : 'neutral'"
            variant="subtle"
            :label="summary?.cache_enabled ? t('cortex.settings.enabled') : t('cortex.settings.disabled')"
            :data-status="summary?.cache_enabled ? 'enabled' : 'disabled'"
            data-testid="cortex-cache"
          />
        </UCard>
      </div>
    </CortexLoad>
  </div>
</template>
