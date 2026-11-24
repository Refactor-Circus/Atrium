<script setup lang="ts">
import {
  cortexData,
  useCortexLoad,
  type CortexList,
  type CortexOne,
  type CortexTool,
  type CortexToolDescription,
  type CortexVersion,
  type CortexVersionsApi
} from '../../../components/cortex'
import CortexLoad from '../../../components/CortexLoad.vue'
import CortexPage from '../../../components/CortexPage.vue'
import CortexVersions from '../../../components/CortexVersions.vue'

/**
 * `cortex.tool-description`: the override of a tool's description
 * (`tools.description.show`): its versions, a new version, publishing one,
 * and removing the override after a confirmation (`tools.description.*`).
 * The description in force is the published override, or the tool's own
 * (`tools.index`).
 */
const { t } = useI18n()
const route = useRoute()

const tool = computed(() => String(route.params.tool))
const path = () => ({ params: { path: { tool: tool.value } } })

const { client, data, pending, failed, status, reload } = useCortexLoad(async (cortex) => {
  const [override, registered] = await Promise.all([
    cortex.GET('/tools/{tool}/description', path()).then(result => cortexData<CortexOne<CortexToolDescription>>(result).data),
    cortex.GET('/tools').then(result => cortexData<CortexList<CortexTool>>(result).data).catch(() => [] as CortexTool[])
  ])

  return { override, own: registered.find(entry => entry.name === tool.value)?.description ?? null }
})

const live = computed(() => data.value?.override.published_content ?? data.value?.own ?? null)

const versions: CortexVersionsApi = {
  list: async () => cortexData<CortexList<CortexVersion>>(await client!.GET('/tools/{tool}/description/versions', path())).data,
  store: async body => cortexData(await client!.POST('/tools/{tool}/description/versions', { ...path(), body })),
  publish: async version => cortexData(await client!.POST('/tools/{tool}/description/versions/{version}/publish', { params: { path: { tool: tool.value, version } } })),
  destroy: async () => cortexData(await client!.DELETE('/tools/{tool}/description', path()))
}
</script>

<template>
  <CortexPage
    :title="t('cortex.tools.description_title', { tool })"
    screen-key="cortex.tool-description"
    :record="tool"
    :back="{ to: '/cortex/tools', label: t('cortex.tools.title') }"
  >
    <CortexLoad :ready="!pending && data !== null" :failed="failed" :status="status">
      <CortexVersions
        :api="versions"
        :live="live"
        :live-title="t('cortex.tools.description')"
        :published="data?.override.published_version ?? null"
        override
        @changed="reload"
      />
    </CortexLoad>
  </CortexPage>
</template>
