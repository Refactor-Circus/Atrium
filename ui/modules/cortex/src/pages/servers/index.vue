<script setup lang="ts">
import { cortexData, useCortexLoad, type CortexList, type CortexServer } from '../../components/cortex'
import CortexLoad from '../../components/CortexLoad.vue'
import CortexPage from '../../components/CortexPage.vue'

/**
 * `cortex.servers`: the MCP servers (`servers.index`), with the tools each
 * serves and whether they are overridden, each linking to its instructions
 * and tools.
 */
const { t } = useI18n()

const { data, pending, failed, status } = useCortexLoad(async cortex =>
  cortexData<CortexList<CortexServer>>(await cortex.GET('/servers')).data)

const servers = computed(() => data.value ?? [])
</script>

<template>
  <CortexPage :title="t('cortex.servers.title')" screen-key="cortex.servers">
    <CortexLoad :ready="!pending" :failed="failed" :status="status">
      <p v-if="servers.length === 0" class="atrium-empty" data-testid="cortex-empty">{{ t('cortex.servers.empty') }}</p>

      <table v-else class="w-full text-sm" data-testid="cortex-servers">
        <thead class="text-left text-muted">
          <tr>
            <th class="py-2">{{ t('cortex.agent.name') }}</th>
            <th class="py-2">{{ t('cortex.agent.tools') }}</th>
            <th class="py-2 text-right">{{ t('cortex.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="server in servers" :key="server.name" :data-testid="`cortex-server-${server.name}`">
            <td class="py-2"><code class="text-xs">{{ server.name }}</code></td>
            <td class="py-2">
              <div class="flex flex-wrap items-center gap-2">
                <span>{{ t('cortex.tools.count', { count: server.tools.length }) }}</span>
                <UBadge v-if="server.tools_overridden" color="success" variant="subtle" :label="t('cortex.tools.overridden')" />
                <UBadge
                  v-if="server.missing_tools.length"
                  color="warning"
                  variant="subtle"
                  :label="t('cortex.servers.missing_tools', { tools: server.missing_tools.join(', ') })"
                  data-testid="cortex-missing-tools"
                />
              </div>
            </td>
            <td class="py-2 text-right">
              <UButton
                size="xs"
                variant="outline"
                icon="i-lucide-file-text"
                :to="`/cortex/servers/${server.name}/instructions`"
                :label="t('cortex.servers.edit_instructions')"
                :data-testid="`cortex-instructions-${server.name}`"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </CortexLoad>
  </CortexPage>
</template>
