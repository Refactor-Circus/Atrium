<script setup lang="ts">
import ImpexFlash from '../../components/ImpexFlash.vue'
import ImpexState from '../../components/ImpexState.vue'
import { looseBody, parseJson, runPath, useImpexAction, useImpexResource } from '../../components/shared'
import type { components } from '../../../client/schema'

/**
 * `impex.flows`: every registered flow (`impex.flows.index`), each with v1's
 * "run" form, which starts a run with optional JSON arguments
 * (`impex.flows.runs.store`) and opens it.
 */
const { t } = useI18n()
const router = useRouter()

const flows = useImpexResource(async client => integrationData(await client.GET('/flows')).data)
const action = useImpexAction()
const args = reactive<Record<string, string>>({})

async function start(flow: string): Promise<void> {
  const client = flows.client
  const parsed = parseJson(args[flow] ?? '')

  if (!client) {
    return
  }

  const value = parsed && 'value' in parsed ? parsed.value : undefined

  // As in v1, arguments are a JSON array or object.
  if (parsed && (typeof value !== 'object' || value === null)) {
    action.invalid('arguments', t('impex.flows.arguments_invalid'))
    return
  }

  const body = looseBody<components['schemas']['StoreFlowRunRequest']>(value === undefined ? {} : { arguments: value })

  await action.run(
    async () => integrationData(await client.POST('/flows/{flow}/runs', { params: { path: { flow } }, body })),
    async (answer) => {
      args[flow] = ''
      await router.push(runPath(answer.data.id))
    }
  )
}
</script>

<template>
  <div class="space-y-4" data-testid="impex-flows">
    <h1 class="text-xl font-semibold">{{ t('impex.flows.title') }}</h1>

    <AtriumIntegrationScreen screen-key="impex.flows">
      <div class="space-y-4">
        <ImpexFlash :action="action" />

        <ImpexState :error="flows.error.value" :ready="flows.data.value !== null">
          <p v-if="(flows.data.value ?? []).length === 0" class="text-sm text-muted">{{ t('impex.flows.empty') }}</p>
          <table v-else class="w-full text-left text-sm">
            <thead class="text-muted">
              <tr>
                <th class="py-2 pr-3 font-medium">{{ t('impex.flows.slug') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.flows.schedule') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.flows.state') }}</th>
                <th class="py-2 font-medium">{{ t('impex.flows.run') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="flow in flows.data.value" :key="flow.slug" :data-testid="`impex-flow-row-${flow.slug}`">
                <td class="py-2 pr-3">
                  <p class="font-medium">{{ flow.slug }}</p>
                  <p class="font-mono text-xs text-muted">{{ flow.class }}</p>
                </td>
                <td class="py-2 pr-3 font-mono text-xs">{{ flow.schedule ?? t('impex.common.none') }}</td>
                <td class="py-2 pr-3">
                  <UBadge :color="flow.enabled ? 'success' : 'neutral'" variant="subtle">
                    {{ flow.enabled ? t('impex.flows.enabled') : t('impex.flows.disabled') }}
                  </UBadge>
                </td>
                <td class="py-2">
                  <form class="flex items-center gap-2" :data-testid="`impex-flow-run-${flow.slug}`" @submit.prevent="start(flow.slug)">
                    <UInput v-model="args[flow.slug]" name="arguments" :placeholder="t('impex.flows.arguments')" size="sm" class="w-56" />
                    <UButton type="submit" size="sm" icon="i-lucide-play" :loading="action.busy.value">{{ t('impex.flows.run') }}</UButton>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
        </ImpexState>
      </div>
    </AtriumIntegrationScreen>
  </div>
</template>
