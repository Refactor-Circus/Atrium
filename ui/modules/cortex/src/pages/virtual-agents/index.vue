<script setup lang="ts">
import { cortexData, useCortexAction, useCortexLoad, type CortexList, type CortexVirtualAgent } from '../../components/cortex'
import CortexActionError from '../../components/CortexActionError.vue'
import CortexLoad from '../../components/CortexLoad.vue'
import CortexPage from '../../components/CortexPage.vue'

/**
 * `cortex.virtual-agents`: the virtual agents, a page at a time
 * (`virtual-agents.index?page=`), each with edit, run and delete.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const action = useCortexAction()

const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const { client, data, pending, failed, status, reload } = useCortexLoad(async cortex =>
  cortexData<CortexList<CortexVirtualAgent>>(await cortex.GET('/virtual-agents', { params: { query: { page: page.value } } })))

watch(page, () => void reload())

const agents = computed(() => data.value?.data ?? [])
const lastPage = computed(() => data.value?.meta?.last_page ?? 1)

function goTo(target: number): void {
  void router.push({ query: { ...route.query, page: target > 1 ? String(target) : undefined } })
}

async function destroy(agent: CortexVirtualAgent): Promise<void> {
  if (!client || !window.confirm(t('cortex.virtual_agents.confirm_delete'))) {
    return
  }

  if (await action.run(async () => cortexData(await client.DELETE('/virtual-agents/{agent}', { params: { path: { agent: agent.slug } } })))) {
    await reload()
  }
}
</script>

<template>
  <CortexPage :title="t('cortex.virtual_agents.title')" screen-key="cortex.virtual-agents">
    <template #actions>
      <UButton to="/cortex/virtual-agents/create" icon="i-lucide-plus" :label="t('cortex.virtual_agents.new')" data-testid="cortex-new-agent" />
    </template>

    <CortexLoad :ready="!pending" :failed="failed" :status="status">
      <div class="flex flex-col gap-4">
        <CortexActionError :forbidden="action.forbidden.value" :message="action.message.value" />

        <p v-if="agents.length === 0" class="atrium-empty" data-testid="cortex-empty">{{ t('cortex.virtual_agents.empty') }}</p>

        <table v-else class="w-full text-sm" data-testid="cortex-virtual-agents">
          <thead class="text-left text-muted">
            <tr>
              <th class="py-2">{{ t('cortex.agent.name') }}</th>
              <th class="py-2">{{ t('cortex.agent.slug') }}</th>
              <th class="py-2">{{ t('cortex.agent.prompt') }}</th>
              <th class="py-2">{{ t('cortex.agent.provider') }}</th>
              <th class="py-2">{{ t('cortex.agent.model') }}</th>
              <th class="py-2 text-right">{{ t('cortex.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="agent in agents" :key="agent.slug" :data-testid="`cortex-agent-${agent.slug}`">
              <td class="py-2">
                <RouterLink :to="`/cortex/virtual-agents/${agent.slug}`" class="font-medium hover:underline">{{ agent.name }}</RouterLink>
              </td>
              <td class="py-2"><code class="text-xs">{{ agent.slug }}</code></td>
              <td class="py-2">{{ agent.published_version ? `v${agent.published_version}` : '—' }}</td>
              <td class="py-2">{{ agent.provider ?? '—' }}</td>
              <td class="py-2">{{ agent.model ?? '—' }}</td>
              <td class="py-2">
                <div class="flex justify-end gap-2">
                  <UButton size="xs" variant="outline" icon="i-lucide-pencil" :to="`/cortex/virtual-agents/${agent.slug}`" :label="t('cortex.edit')" :data-testid="`cortex-edit-${agent.slug}`" />
                  <UButton size="xs" variant="outline" icon="i-lucide-play" :to="`/cortex/run?agent=virtual:${agent.slug}`" :label="t('cortex.run.run')" :data-testid="`cortex-run-${agent.slug}`" />
                  <UButton size="xs" color="error" variant="outline" icon="i-lucide-trash" :label="t('cortex.delete')" :data-testid="`cortex-delete-${agent.slug}`" @click="destroy(agent)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="lastPage > 1" class="flex items-center gap-2" data-testid="cortex-pages">
          <UButton size="xs" variant="outline" icon="i-lucide-chevron-left" :disabled="page <= 1" :aria-label="t('cortex.previous')" data-testid="cortex-previous" @click="goTo(page - 1)" />
          <span class="text-sm text-muted">{{ t('cortex.page', { page, last: lastPage }) }}</span>
          <UButton size="xs" variant="outline" icon="i-lucide-chevron-right" :disabled="page >= lastPage" :aria-label="t('cortex.next')" data-testid="cortex-next" @click="goTo(page + 1)" />
        </div>
      </div>
    </CortexLoad>
  </CortexPage>
</template>
