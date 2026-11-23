<script setup lang="ts">
import ImpexState from '../../../integrations/impex/components/ImpexState.vue'
import ImpexStatusBadge from '../../../integrations/impex/components/ImpexStatusBadge.vue'
import { formatDate, queryValue, RUN_STATUSES, RUN_TRIGGERS, runPath, useImpexList } from '../../../integrations/impex/components/shared'
import type { components } from '../../../integrations/impex/client/schema'

/**
 * `impex.runs`: every run the user may see, newest first, filtered by
 * status, trigger and flow as v1 was (`impex.runs.index`), a cursor page at
 * a time. The filters live in the URL.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const filters = computed(() => ({
  status: queryValue(route.query.status) as components['schemas']['RunStatus'] | undefined,
  trigger: queryValue(route.query.trigger) as components['schemas']['RunTrigger'] | undefined,
  flow: queryValue(route.query.flow)
}))

const form = reactive({ ...filters.value })

watch(filters, (value) => {
  Object.assign(form, value)
})

const runs = useImpexList(
  async (client, cursor) => integrationData(await client.GET('/runs', { params: { query: { ...filters.value, cursor } } })),
  filters
)

const statusItems = computed(() => RUN_STATUSES.map(status => ({ label: t(`impex.statuses.${status}`), value: status })))
const triggerItems = computed(() => RUN_TRIGGERS.map(trigger => ({ label: trigger, value: trigger })))

function filter(): void {
  router.replace({ query: { ...route.query, status: form.status || undefined, trigger: form.trigger || undefined, flow: form.flow || undefined } })
}

function clear(): void {
  router.replace({ query: { ...route.query, status: undefined, trigger: undefined, flow: undefined } })
}
</script>

<template>
  <div class="space-y-4" data-testid="impex-runs">
    <h1 class="text-xl font-semibold">{{ t('impex.runs.title') }}</h1>

    <AtriumIntegrationScreen screen-key="impex.runs">
      <div class="space-y-4">
        <form class="flex flex-wrap items-end gap-3" data-testid="impex-runs-filters" @submit.prevent="filter">
          <USelect v-model="form.status" :items="statusItems" :placeholder="t('impex.runs.all_statuses')" class="w-44" :aria-label="t('impex.runs.status')" />
          <USelect v-model="form.trigger" :items="triggerItems" :placeholder="t('impex.runs.all_triggers')" class="w-40" :aria-label="t('impex.runs.trigger')" />
          <UInput v-model="form.flow" name="flow" :placeholder="t('impex.runs.flow')" class="w-48" />
          <UButton type="submit" icon="i-lucide-filter" data-testid="impex-runs-filter">{{ t('impex.common.filter') }}</UButton>
          <UButton variant="ghost" data-testid="impex-runs-clear" @click="clear">{{ t('impex.common.clear') }}</UButton>
        </form>

        <ImpexState :error="runs.error.value" :ready="!runs.pending.value || runs.rows.value.length > 0">
          <p v-if="runs.rows.value.length === 0" class="text-sm text-muted" data-testid="impex-runs-empty">{{ t('impex.runs.empty') }}</p>
          <table v-else class="w-full text-left text-sm">
            <thead class="text-muted">
              <tr>
                <th class="py-2 pr-3 font-medium">{{ t('impex.runs.flow') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.runs.status') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.runs.trigger') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.runs.started') }}</th>
                <th class="py-2 font-medium">{{ t('impex.runs.finished') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="run in runs.rows.value" :key="run.id" :data-testid="`impex-run-row-${run.id}`">
                <td class="py-2 pr-3">
                  <NuxtLink :to="runPath(run.id)" class="font-medium hover:underline">{{ run.flow }}</NuxtLink>
                </td>
                <td class="py-2 pr-3"><ImpexStatusBadge :status="run.status" /></td>
                <td class="py-2 pr-3">{{ run.trigger }}</td>
                <td class="py-2 pr-3">{{ formatDate(run.started_at) ?? t('impex.common.none') }}</td>
                <td class="py-2">{{ formatDate(run.finished_at) ?? t('impex.common.none') }}</td>
              </tr>
            </tbody>
          </table>

          <UButton v-if="runs.nextCursor.value" variant="outline" :loading="runs.pending.value" data-testid="impex-load-more" @click="runs.loadMore">
            {{ t('impex.common.load_more') }}
          </UButton>
        </ImpexState>
      </div>
    </AtriumIntegrationScreen>
  </div>
</template>
