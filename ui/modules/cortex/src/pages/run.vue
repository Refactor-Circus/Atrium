<script setup lang="ts">
import { cortexData, useCortexAction, useCortexLoad, type CortexAgentReference, type CortexAgentRun, type CortexList, type CortexOne } from '../components/cortex'
import CortexActionError from '../components/CortexActionError.vue'
import CortexLoad from '../components/CortexLoad.vue'
import CortexPage from '../components/CortexPage.vue'

/**
 * `cortex.run`: runs an agent the user may run (`runnable-agents.index`)
 * with an input, through `virtual-agents.run` or `concrete-agents.run` by the
 * agent's type, and shows the response and its usage. `?agent=virtual:{slug}`
 * or `?agent=concrete:{name}` preselects one, as v1's run links did.
 */
const { t } = useI18n()
const route = useRoute()
const action = useCortexAction()

const { client, data, pending, failed, status } = useCortexLoad(async cortex =>
  cortexData<CortexList<CortexAgentReference>>(await cortex.GET('/runnable-agents')).data)

const agents = computed(() => data.value ?? [])

function option(agent: CortexAgentReference): string {
  return `${agent.type === 'concrete_agent' ? 'concrete' : 'virtual'}:${agent.key}`
}

const selected = ref(typeof route.query.agent === 'string' ? route.query.agent : '')
const input = ref('')
const result = shallowRef<CortexAgentRun | null>(null)

/** The usage as `key: value` rows; Cortex sends it as an object. */
const usage = computed(() => {
  const value = result.value?.usage as unknown

  return value && typeof value === 'object'
    ? Object.entries(value as Record<string, unknown>).map(([key, entry]) => ({ key, value: typeof entry === 'object' ? JSON.stringify(entry) : String(entry) }))
    : []
})

async function run(): Promise<void> {
  const [type, key] = selected.value.split(/:(.*)/s) as [string, string | undefined]

  if (!client || !key) {
    return
  }

  result.value = null

  await action.run(async () => {
    const answer = type === 'concrete'
      ? await client.POST('/concrete-agents/{agent}/run', { params: { path: { agent: key } }, body: { input: input.value } })
      : await client.POST('/virtual-agents/{agent}/run', { params: { path: { agent: key } }, body: { input: input.value } })

    result.value = cortexData<CortexOne<CortexAgentRun>>(answer).data
  })
}
</script>

<template>
  <CortexPage :title="t('cortex.run.title')" screen-key="cortex.run">
    <CortexLoad :ready="!pending" :failed="failed" :status="status">
      <div class="flex max-w-2xl flex-col gap-5">
        <p v-if="agents.length === 0" class="text-sm text-muted" data-testid="cortex-no-runnable-agents">{{ t('cortex.run.none') }}</p>

        <UCard v-else>
          <form class="flex flex-col gap-4" data-testid="cortex-run-form" @submit.prevent="run">
            <CortexActionError :forbidden="action.forbidden.value" :message="action.message.value" />

            <UFormField :label="t('cortex.run.agent')" :error="action.error('agent')" required>
              <select v-model="selected" class="w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="cortex-run-agent-select">
                <option value="" disabled>{{ t('cortex.run.select_agent') }}</option>
                <option v-for="agent in agents" :key="option(agent)" :value="option(agent)">{{ agent.name }}</option>
              </select>
            </UFormField>

            <UFormField :label="t('cortex.run.input')" :error="action.error('input')" required>
              <UTextarea v-model="input" :rows="6" class="w-full" data-testid="cortex-run-input" />
            </UFormField>

            <div>
              <UButton type="submit" icon="i-lucide-play" :label="t('cortex.run.run')" :loading="action.busy.value" :disabled="selected === ''" data-testid="cortex-run" />
            </div>
          </form>
        </UCard>

        <UCard v-if="result" data-testid="cortex-run-result">
          <template #header>
            <h3 class="font-medium">{{ t('cortex.run.response') }}</h3>
          </template>
          <pre class="overflow-x-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-xs" data-testid="cortex-run-text">{{ result.text }}</pre>
          <div v-if="usage.length" class="mt-4">
            <h4 class="mb-2 text-sm font-semibold">{{ t('cortex.run.usage') }}</h4>
            <table class="w-full text-sm" data-testid="cortex-run-usage">
              <tbody class="divide-y divide-default">
                <tr v-for="row in usage" :key="row.key">
                  <td class="py-1">{{ row.key }}</td>
                  <td class="py-1 text-right tabular-nums">{{ row.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </CortexLoad>
  </CortexPage>
</template>
