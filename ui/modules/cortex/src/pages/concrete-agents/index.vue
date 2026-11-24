<script setup lang="ts">
import { cortexData, useCortexLoad, type CortexConcreteAgent, type CortexList } from '../../components/cortex'
import CortexLoad from '../../components/CortexLoad.vue'
import CortexPage from '../../components/CortexPage.vue'

/**
 * `cortex.concrete-agents`: the agents declared in code
 * (`concrete-agents.index`), with whether their prompt and tools are
 * overridden.
 */
const { t } = useI18n()

const { data, pending, failed, status } = useCortexLoad(async cortex =>
  cortexData<CortexList<CortexConcreteAgent>>(await cortex.GET('/concrete-agents')).data)

const agents = computed(() => data.value ?? [])
</script>

<template>
  <CortexPage :title="t('cortex.concrete_agents.title')" screen-key="cortex.concrete-agents" :description="t('cortex.concrete_agents.description')">
    <CortexLoad :ready="!pending" :failed="failed" :status="status">
      <p v-if="agents.length === 0" class="atrium-empty" data-testid="cortex-empty">{{ t('cortex.concrete_agents.empty') }}</p>

      <table v-else class="w-full text-sm" data-testid="cortex-concrete-agents">
        <thead class="text-left text-muted">
          <tr>
            <th class="py-2">{{ t('cortex.agent.name') }}</th>
            <th class="py-2">{{ t('cortex.agent.prompt') }}</th>
            <th class="py-2">{{ t('cortex.agent.tools') }}</th>
            <th class="py-2 text-right">{{ t('cortex.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="agent in agents" :key="agent.name" :data-testid="`cortex-agent-${agent.name}`">
            <td class="py-2">
              <RouterLink :to="`/cortex/concrete-agents/${agent.name}`" class="font-medium hover:underline">{{ agent.name }}</RouterLink>
            </td>
            <td class="py-2">
              <UBadge
                v-if="agent.published_version !== null"
                color="success"
                variant="subtle"
                :label="t('cortex.versions.overridden', { version: agent.published_version })"
                data-status="overridden"
              />
              <UBadge v-else color="neutral" variant="subtle" :label="t('cortex.versions.from_code')" data-status="from_code" />
            </td>
            <td class="py-2">
              <UBadge v-if="agent.tools_overridden" color="success" variant="subtle" :label="t('cortex.tools.overridden')" />
              <span v-else class="text-muted">{{ t('cortex.tools.count', { count: agent.tools.length }) }}</span>
            </td>
            <td class="py-2">
              <div class="flex justify-end gap-2">
                <UButton size="xs" variant="outline" icon="i-lucide-pencil" :to="`/cortex/concrete-agents/${agent.name}`" :label="t('cortex.edit')" />
                <UButton size="xs" variant="outline" icon="i-lucide-play" :to="`/cortex/run?agent=concrete:${agent.name}`" :label="t('cortex.run.run')" :data-testid="`cortex-run-${agent.name}`" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </CortexLoad>
  </CortexPage>
</template>
