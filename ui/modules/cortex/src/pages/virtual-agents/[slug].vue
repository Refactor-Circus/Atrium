<script setup lang="ts">
import {
  cortexData,
  useCortexAction,
  useCortexLoad,
  type CortexList,
  type CortexOne,
  type CortexVersion,
  type CortexVersionsApi,
  type CortexVirtualAgent
} from '../../components/cortex'
import CortexActionError from '../../components/CortexActionError.vue'
import CortexAgentForm from '../../components/CortexAgentForm.vue'
import CortexLoad from '../../components/CortexLoad.vue'
import CortexPage from '../../components/CortexPage.vue'
import CortexVersions from '../../components/CortexVersions.vue'

/**
 * `cortex.virtual-agent`: one virtual agent (`virtual-agents.show`). It edits
 * the agent (`virtual-agents.update`), lists its prompt versions, saves a new
 * one and publishes one (`virtual-agents.versions.*`), and deletes the agent
 * after a confirmation.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const action = useCortexAction()

const slug = computed(() => String(route.params.slug))

const { client, data: agent, pending, failed, status, reload } = useCortexLoad(async cortex =>
  cortexData<CortexOne<CortexVirtualAgent>>(await cortex.GET('/virtual-agents/{agent}', { params: { path: { agent: slug.value } } })).data)

const path = () => ({ params: { path: { agent: slug.value } } })

const versions: CortexVersionsApi = {
  list: async () => cortexData<CortexList<CortexVersion>>(await client!.GET('/virtual-agents/{agent}/versions', { params: { path: { agent: slug.value }, query: { per_page: 100 } } })).data,
  store: async body => cortexData(await client!.POST('/virtual-agents/{agent}/versions', { ...path(), body })),
  publish: async version => cortexData(await client!.POST('/virtual-agents/{agent}/versions/{version}/publish', { params: { path: { agent: slug.value, version } } }))
}

async function destroy(): Promise<void> {
  if (!client || !window.confirm(t('cortex.virtual_agents.confirm_delete'))) {
    return
  }

  if (await action.run(async () => cortexData(await client.DELETE('/virtual-agents/{agent}', path())))) {
    await router.push('/cortex/virtual-agents')
  }
}
</script>

<template>
  <CortexPage
    :title="agent?.name ?? t('cortex.virtual_agents.title')"
    screen-key="cortex.virtual-agent"
    :record="slug"
    :back="{ to: '/cortex/virtual-agents', label: t('cortex.virtual_agents.title') }"
  >
    <template #actions>
      <UButton variant="outline" icon="i-lucide-play" :to="`/cortex/run?agent=virtual:${slug}`" :label="t('cortex.run.run')" data-testid="cortex-run-agent" />
      <UButton color="error" variant="outline" icon="i-lucide-trash" :label="t('cortex.delete')" data-testid="cortex-delete-agent" @click="destroy" />
    </template>

    <CortexLoad :ready="!pending && agent !== null" :failed="failed" :status="status">
      <div class="flex flex-col gap-3">
        <CortexActionError :forbidden="action.forbidden.value" :message="action.message.value" />
        <CortexAgentForm :agent="agent" @saved="reload" />
        <CortexVersions
          :api="versions"
          :live="agent?.instructions ?? null"
          :live-title="t('cortex.agent.prompt')"
          :published="agent?.published_version ?? null"
          @changed="reload"
        />
      </div>
    </CortexLoad>
  </CortexPage>
</template>
