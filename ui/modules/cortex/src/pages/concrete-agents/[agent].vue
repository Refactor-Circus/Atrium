<script setup lang="ts">
import {
  cortexData,
  untypedBody,
  useCortexAction,
  useCortexLoad,
  type CortexConcreteAgent,
  type CortexList,
  type CortexOne,
  type CortexTool,
  type CortexVersion,
  type CortexVersionsApi
} from '../../components/cortex'
import CortexActionError from '../../components/CortexActionError.vue'
import CortexLoad from '../../components/CortexLoad.vue'
import CortexPage from '../../components/CortexPage.vue'
import CortexToolPicker from '../../components/CortexToolPicker.vue'
import CortexVersions from '../../components/CortexVersions.vue'

/**
 * `cortex.concrete-agent`: a code-declared agent (`concrete-agents.show`).
 * An overridable agent's prompt override lists its versions, saves and
 * publishes one, and is removed after a confirmation
 * (`concrete-agents.versions.*`, `concrete-agents.override.destroy`). Its
 * toolset is overridden with the tool picker and restored to the code's
 * (`concrete-agents.tools.update`, with `tools: null` to restore).
 */
const { t } = useI18n()
const route = useRoute()
const tools = useCortexAction()

const name = computed(() => String(route.params.agent))
const path = () => ({ params: { path: { agent: name.value } } })

const { client, data, pending, failed, status, reload } = useCortexLoad(async (cortex) => {
  const [agent, registered] = await Promise.all([
    cortex.GET('/concrete-agents/{agent}', path()).then(result => cortexData<CortexOne<CortexConcreteAgent>>(result).data),
    cortex.GET('/tools').then(result => cortexData<CortexList<CortexTool>>(result).data).catch(() => [] as CortexTool[])
  ])

  return { agent, registered }
})

const agent = computed(() => data.value?.agent ?? null)
const selected = ref<string[]>([])

watch(agent, (value) => {
  selected.value = [...(value?.tools ?? [])]
}, { immediate: true })

/** The agent's own code tools first, then every registered Cortex tool. */
const pickerTools = computed(() => {
  const own = agent.value?.default_tools ?? []
  const registered = data.value?.registered ?? []

  return [
    ...own.map(tool => ({ name: tool, label: tool, tags: registered.find(entry => entry.name === tool)?.tags ?? [] })),
    ...registered.filter(tool => !own.includes(tool.name)).map(tool => ({ name: tool.name, label: tool.name, tags: tool.tags }))
  ]
})

const versions: CortexVersionsApi = {
  list: async () => cortexData<CortexList<CortexVersion>>(await client!.GET('/concrete-agents/{agent}/versions', path())).data,
  store: async body => cortexData(await client!.POST('/concrete-agents/{agent}/versions', { ...path(), body })),
  publish: async version => cortexData(await client!.POST('/concrete-agents/{agent}/versions/{version}/publish', { params: { path: { agent: name.value, version } } })),
  destroy: async () => cortexData(await client!.DELETE('/concrete-agents/{agent}/override', path()))
}

async function saveTools(): Promise<void> {
  if (client && await tools.run(async () => cortexData(await client.PUT('/concrete-agents/{agent}/tools', { ...path(), body: untypedBody({ tools: selected.value }) })))) {
    await reload()
  }
}

async function restoreTools(): Promise<void> {
  if (!client || !window.confirm(t('cortex.tools.confirm_restore'))) {
    return
  }

  if (await tools.run(async () => cortexData(await client.PUT('/concrete-agents/{agent}/tools', { ...path(), body: untypedBody({ tools: null }) })))) {
    await reload()
  }
}
</script>

<template>
  <CortexPage
    :title="name"
    screen-key="cortex.concrete-agent"
    :record="name"
    :back="{ to: '/cortex/concrete-agents', label: t('cortex.concrete_agents.title') }"
  >
    <template #actions>
      <UButton variant="outline" icon="i-lucide-play" :to="`/cortex/run?agent=concrete:${name}`" :label="t('cortex.run.run')" data-testid="cortex-run-agent" />
    </template>

    <CortexLoad :ready="!pending && agent !== null" :failed="failed" :status="status">
      <div v-if="agent" class="flex flex-col gap-3">
        <CortexVersions
          v-if="agent.overridable"
          :api="versions"
          :live="agent.instructions"
          :live-title="t('cortex.agent.prompt')"
          :published="agent.published_version"
          override
          @changed="reload"
        />
        <UCard v-else>
          <template #header>
            <h3 class="font-medium">{{ t('cortex.agent.prompt') }}</h3>
          </template>
          <p class="mb-2 text-sm text-muted" data-testid="cortex-not-overridable">{{ t('cortex.concrete_agents.not_overridable') }}</p>
          <pre class="overflow-x-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-xs">{{ agent.instructions }}</pre>
        </UCard>

        <UCard data-testid="cortex-agent-tools">
          <template #header>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-medium">{{ t('cortex.agent.tools') }}</h3>
              <UBadge v-if="agent.tools_overridden" color="success" variant="subtle" :label="t('cortex.tools.overridden')" data-status="overridden" />
              <UBadge v-else color="neutral" variant="subtle" :label="t('cortex.versions.from_code')" data-status="from_code" />
            </div>
          </template>

          <div class="flex flex-col gap-4">
            <CortexActionError :forbidden="tools.forbidden.value" :message="tools.message.value" />
            <UAlert v-if="tools.error('tools')" color="error" variant="subtle" :title="tools.error('tools')" data-testid="cortex-tools-error" />

            <template v-if="agent.tools_overridable">
              <CortexToolPicker v-model="selected" :tools="pickerTools" id-prefix="cortex-agent-tool-" />
              <div class="flex items-center gap-2">
                <UButton icon="i-lucide-check" :label="t('cortex.tools.save')" :loading="tools.busy.value" data-testid="cortex-save-tools" @click="saveTools" />
                <UButton
                  v-if="agent.tools_overridden"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-undo-2"
                  :label="t('cortex.tools.restore')"
                  data-testid="cortex-restore-tools"
                  @click="restoreTools"
                />
              </div>
            </template>
            <ul v-else class="flex flex-col gap-1 text-sm" data-testid="cortex-agent-tools-served">
              <li v-for="tool in agent.tools" :key="tool"><code class="text-xs">{{ tool }}</code></li>
            </ul>
          </div>
        </UCard>
      </div>
    </CortexLoad>
  </CortexPage>
</template>
