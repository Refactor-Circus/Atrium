<script setup lang="ts">
import ImpexState from '../../components/ImpexState.vue'
import ImpexStatusBadge from '../../components/ImpexStatusBadge.vue'
import { endpointOf, formatDate, queryValue, SUBSCRIPTION_STATUSES, subscriptionPath, useImpexList } from '../../components/shared'
import type { components } from '../../../client/schema'

/**
 * `impex.subscriptions`: every subscription the user may see, filtered by
 * stream and status as v1 was (`impex.subscriptions.index`), a cursor page at
 * a time. The filters live in the URL.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const filters = computed(() => ({
  stream: queryValue(route.query.stream),
  status: queryValue(route.query.status) as components['schemas']['SubscriptionStatus'] | undefined
}))

const form = reactive({ ...filters.value })

watch(filters, (value) => {
  Object.assign(form, value)
})

const subscriptions = useImpexList(
  async (client, cursor) => integrationData(await client.GET('/subscriptions', { params: { query: { ...filters.value, cursor } } })),
  filters
)

const statusItems = computed(() => SUBSCRIPTION_STATUSES.map(status => ({ label: t(`impex.statuses.${status}`), value: status })))

function filter(): void {
  router.replace({ query: { ...route.query, stream: form.stream || undefined, status: form.status || undefined } })
}

function clear(): void {
  router.replace({ query: { ...route.query, stream: undefined, status: undefined } })
}
</script>

<template>
  <div class="space-y-4" data-testid="impex-subscriptions">
    <h1 class="text-xl font-semibold">{{ t('impex.subscriptions.title') }}</h1>

    <AtriumIntegrationScreen screen-key="impex.subscriptions">
      <div class="space-y-4">
        <form class="atrium-querybar" data-testid="impex-subscriptions-filters" @submit.prevent="filter">
          <UInput v-model="form.stream" name="stream" :placeholder="t('impex.subscriptions.stream')" class="w-48" />
          <USelect v-model="form.status" :items="statusItems" :placeholder="t('impex.subscriptions.all_statuses')" class="w-44" :aria-label="t('impex.subscriptions.status')" />
          <UButton type="submit" icon="i-lucide-filter" data-testid="impex-subscriptions-filter">{{ t('impex.common.filter') }}</UButton>
          <UButton variant="ghost" data-testid="impex-subscriptions-clear" @click="clear">{{ t('impex.common.clear') }}</UButton>
        </form>

        <ImpexState :error="subscriptions.error.value" :ready="!subscriptions.pending.value || subscriptions.rows.value.length > 0">
          <p v-if="subscriptions.rows.value.length === 0" class="atrium-empty" data-testid="impex-subscriptions-empty">{{ t('impex.subscriptions.empty') }}</p>
          <table v-else class="w-full text-left text-sm">
            <thead class="text-muted">
              <tr>
                <th class="py-2 pr-3 font-medium">{{ t('impex.subscriptions.stream') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.subscriptions.subscriber') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.subscriptions.endpoint') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.subscriptions.status') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.subscriptions.failures') }}</th>
                <th class="py-2 font-medium">{{ t('impex.subscriptions.last_delivered') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="subscription in subscriptions.rows.value" :key="subscription.id" :data-testid="`impex-subscription-row-${subscription.id}`">
                <td class="py-2 pr-3">
                  <RouterLink :to="subscriptionPath(subscription.id)" class="font-medium hover:underline">{{ subscription.stream }}</RouterLink>
                </td>
                <td class="py-2 pr-3 font-mono text-xs">{{ subscription.subscriber_id }}</td>
                <td class="max-w-xs truncate py-2 pr-3">{{ endpointOf(subscription.endpoint) ?? t('impex.subscriptions.feed_only') }}</td>
                <td class="py-2 pr-3"><ImpexStatusBadge :status="subscription.status" /></td>
                <td class="py-2 pr-3 tabular-nums">{{ subscription.failures }}</td>
                <td class="py-2">{{ formatDate(subscription.last_delivered_at) ?? t('impex.common.none') }}</td>
              </tr>
            </tbody>
          </table>

          <UButton v-if="subscriptions.nextCursor.value" variant="outline" :loading="subscriptions.pending.value" data-testid="impex-load-more" @click="subscriptions.loadMore">
            {{ t('impex.common.load_more') }}
          </UButton>
        </ImpexState>
      </div>
    </AtriumIntegrationScreen>
  </div>
</template>
