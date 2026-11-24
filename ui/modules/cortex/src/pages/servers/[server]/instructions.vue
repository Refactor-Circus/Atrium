<script setup lang="ts">
import {
  cortexData,
  untypedBody,
  useCortexAction,
  useCortexLoad,
  type CortexList,
  type CortexOne,
  type CortexServer,
  type CortexServerInstruction,
  type CortexTool,
  type CortexVersion,
  type CortexVersionsApi
} from '../../../components/cortex'
import CortexActionError from '../../../components/CortexActionError.vue'
import CortexLoad from '../../../components/CortexLoad.vue'
import CortexPage from '../../../components/CortexPage.vue'
import CortexToolPicker from '../../../components/CortexToolPicker.vue'
import CortexVersions from '../../../components/CortexVersions.vue'

/**
 * `cortex.server-instructions`: an MCP server's instructions override
 * (`servers.instructions.show`, with its versions, a new version, publishing
 * and removal: `servers.instructions.*`) and its toolset, picked from its
 * code tools and the registered tools (`servers.tools.update`) or restored
 * to the code's after a confirmation (`servers.tools.destroy`). Saving no
 * tool at all needs the "serve no tools" box, as in v1.
 */
const { t } = useI18n()
const route = useRoute()
const tools = useCortexAction()

const name = computed(() => String(route.params.server))
const path = () => ({ params: { path: { server: name.value } } })

const { client, data, pending, failed, status, reload } = useCortexLoad(async (cortex) => {
  const [instruction, servers, registered] = await Promise.all([
    cortex.GET('/servers/{server}/instructions', path()).then(result => cortexData<CortexOne<CortexServerInstruction>>(result).data),
    cortex.GET('/servers').then(result => cortexData<CortexList<CortexServer>>(result).data),
    cortex.GET('/tools').then(result => cortexData<CortexList<CortexTool>>(result).data).catch(() => [] as CortexTool[])
  ])

  return { instruction, server: servers.find(entry => entry.name === name.value) ?? null, registered }
})

const server = computed(() => data.value?.server ?? null)
const live = computed(() => data.value?.instruction.published_content ?? server.value?.instructions ?? null)
const selected = ref<string[]>([])
const confirmEmpty = ref(false)
const emptyRefused = ref(false)

watch(server, (value) => {
  selected.value = [...(value?.tools ?? [])]
}, { immediate: true })

const pickerTools = computed(() => {
  const served = server.value?.tools ?? []
  const registered = data.value?.registered ?? []

  return [
    ...served.map(tool => ({ name: tool, label: tool, tags: registered.find(entry => entry.name === tool)?.tags ?? [] })),
    ...registered.filter(tool => !served.includes(tool.name)).map(tool => ({ name: tool.name, label: tool.name, tags: tool.tags }))
  ]
})

const versions: CortexVersionsApi = {
  list: async () => cortexData<CortexList<CortexVersion>>(await client!.GET('/servers/{server}/instructions/versions', path())).data,
  store: async body => cortexData(await client!.POST('/servers/{server}/instructions/versions', { ...path(), body })),
  publish: async version => cortexData(await client!.POST('/servers/{server}/instructions/versions/{version}/publish', { params: { path: { server: name.value, version } } })),
  destroy: async () => cortexData(await client!.DELETE('/servers/{server}/instructions', path()))
}

async function saveTools(): Promise<void> {
  emptyRefused.value = selected.value.length === 0 && !confirmEmpty.value

  if (!client || emptyRefused.value) {
    return
  }

  if (await tools.run(async () => cortexData(await client.PUT('/servers/{server}/tools', { ...path(), body: untypedBody({ tools: selected.value }) })))) {
    confirmEmpty.value = false
    await reload()
  }
}

async function restoreTools(): Promise<void> {
  if (!client || !window.confirm(t('cortex.tools.confirm_restore'))) {
    return
  }

  if (await tools.run(async () => cortexData(await client.DELETE('/servers/{server}/tools', path())))) {
    await reload()
  }
}
</script>

<template>
  <CortexPage
    :title="t('cortex.servers.instructions_title', { server: name })"
    screen-key="cortex.server-instructions"
    :record="name"
    :back="{ to: '/cortex/servers', label: t('cortex.servers.title') }"
  >
    <CortexLoad :ready="!pending && data !== null" :failed="failed" :status="status">
      <div class="flex flex-col gap-3">
        <CortexVersions
          :api="versions"
          :live="live"
          :live-title="t('cortex.servers.instructions')"
          :published="data?.instruction.published_version ?? null"
          override
          @changed="reload"
        />

        <UCard v-if="server" data-testid="cortex-server-tools">
          <template #header>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-medium">{{ t('cortex.agent.tools') }}</h3>
              <UBadge v-if="server.tools_overridden" color="success" variant="subtle" :label="t('cortex.tools.overridden')" data-status="overridden" />
              <UBadge v-else color="neutral" variant="subtle" :label="t('cortex.versions.from_code')" data-status="from_code" />
            </div>
          </template>

          <div class="flex flex-col gap-4">
            <CortexActionError :forbidden="tools.forbidden.value" :message="tools.message.value" />
            <UAlert v-if="tools.error('tools')" color="error" variant="subtle" :title="tools.error('tools')" data-testid="cortex-tools-error" />
            <UAlert v-if="emptyRefused" color="warning" variant="subtle" :title="t('cortex.servers.confirm_empty_needed')" data-testid="cortex-confirm-empty-needed" />

            <CortexToolPicker v-model="selected" :tools="pickerTools" id-prefix="cortex-server-tool-" />

            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input v-model="confirmEmpty" type="checkbox" class="accent-(--ui-error)" data-testid="cortex-confirm-empty">
              {{ t('cortex.servers.confirm_empty') }}
            </label>

            <div class="flex items-center gap-2">
              <UButton icon="i-lucide-check" :label="t('cortex.tools.save')" :loading="tools.busy.value" data-testid="cortex-save-tools" @click="saveTools" />
              <UButton
                v-if="server.tools_overridden"
                color="neutral"
                variant="ghost"
                icon="i-lucide-undo-2"
                :label="t('cortex.tools.restore')"
                data-testid="cortex-restore-tools"
                @click="restoreTools"
              />
            </div>
          </div>
        </UCard>
      </div>
    </CortexLoad>
  </CortexPage>
</template>
