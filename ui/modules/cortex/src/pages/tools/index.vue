<script setup lang="ts">
import { cortexData, useCortexLoad, type CortexList, type CortexTool } from '../../components/cortex'
import CortexLoad from '../../components/CortexLoad.vue'
import CortexPage from '../../components/CortexPage.vue'

/**
 * `cortex.tools`: the registered tools (`tools.index`), narrowed by tag as
 * the v1 chips did (`?tag=`, sent to the API) and by name, each linking to
 * its description.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const tag = computed(() => typeof route.query.tag === 'string' && route.query.tag !== '' ? route.query.tag : null)
const search = ref('')

const { data, pending, failed, status, reload } = useCortexLoad(async cortex => ({
  tools: cortexData<CortexList<CortexTool>>(await cortex.GET('/tools', { params: { query: tag.value === null ? {} : { tag: tag.value } } })).data,
  tags: tag.value === null
    ? null
    : cortexData<CortexList<CortexTool>>(await cortex.GET('/tools')).data.flatMap(tool => tool.tags)
}))

watch(tag, () => void reload())

const tags = computed(() => [...new Set(data.value?.tags ?? (data.value?.tools ?? []).flatMap(tool => tool.tags))].sort())

const tools = computed(() => (data.value?.tools ?? [])
  .filter(tool => search.value === '' || tool.name.toLowerCase().includes(search.value.toLowerCase())))

function choose(option: string | null): void {
  void router.push({ query: { ...route.query, tag: option ?? undefined } })
}
</script>

<template>
  <CortexPage :title="t('cortex.tools.title')" screen-key="cortex.tools">
    <CortexLoad :ready="!pending" :failed="failed" :status="status">
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2" data-testid="cortex-tags">
          <UButton size="xs" color="neutral" :variant="tag === null ? 'solid' : 'outline'" :label="t('cortex.tools.all_tags')" data-testid="cortex-tag-all" @click="choose(null)" />
          <UButton
            v-for="option in tags"
            :key="option"
            size="xs"
            color="neutral"
            :variant="tag === option ? 'solid' : 'outline'"
            :label="option"
            :data-testid="`cortex-tag-${option}`"
            @click="choose(option)"
          />
          <UInput v-model="search" class="ml-auto" icon="i-lucide-search" :placeholder="t('cortex.tools.search')" data-testid="cortex-tool-search" />
        </div>

        <p v-if="tools.length === 0" class="atrium-empty" data-testid="cortex-empty">{{ t('cortex.tools.empty') }}</p>

        <table v-else class="w-full text-sm" data-testid="cortex-tools">
          <thead class="text-left text-muted">
            <tr>
              <th class="py-2">{{ t('cortex.agent.name') }}</th>
              <th class="py-2">{{ t('cortex.tools.description') }}</th>
              <th class="py-2">{{ t('cortex.tools.tags') }}</th>
              <th class="py-2 text-right">{{ t('cortex.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="tool in tools" :key="tool.name" :data-testid="`cortex-tool-${tool.name}`">
              <td class="py-2"><code class="text-xs">{{ tool.name }}</code></td>
              <td class="py-2">{{ tool.description }}</td>
              <td class="py-2">
                <div class="flex flex-wrap gap-1">
                  <UBadge v-for="toolTag in tool.tags" :key="toolTag" color="neutral" variant="subtle" size="sm" :label="toolTag" />
                </div>
              </td>
              <td class="py-2 text-right">
                <UButton
                  size="xs"
                  variant="outline"
                  icon="i-lucide-file-text"
                  :to="`/cortex/tools/${tool.name}/description`"
                  :label="t('cortex.tools.edit_description')"
                  :data-testid="`cortex-describe-${tool.name}`"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CortexLoad>
  </CortexPage>
</template>
