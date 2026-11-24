<script setup lang="ts">
import ImpexState from '../../../integrations/impex/components/ImpexState.vue'
import { CHANNEL_DIRECTIONS, formatDate, queryValue, useImpexList } from '../../../integrations/impex/components/shared'
import type { components } from '../../../integrations/impex/client/schema'

/**
 * `impex.messages`: everything that crossed the boundary, newest first,
 * filtered by direction and channel as v1 was (`impex.messages.index`), a
 * cursor page at a time. The filters live in the URL.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const filters = computed(() => ({
  direction: queryValue(route.query.direction) as components['schemas']['Direction'] | undefined,
  channel: queryValue(route.query.channel)
}))

const form = reactive({ ...filters.value })

watch(filters, (value) => {
  Object.assign(form, value)
})

const messages = useImpexList(
  async (client, cursor) => integrationData(await client.GET('/messages', { params: { query: { ...filters.value, cursor } } })),
  filters
)

const directionItems = computed(() => CHANNEL_DIRECTIONS.map(direction => ({ label: t(`impex.directions.${direction}`), value: direction })))

function filter(): void {
  router.replace({ query: { ...route.query, direction: form.direction || undefined, channel: form.channel || undefined } })
}

function clear(): void {
  router.replace({ query: { ...route.query, direction: undefined, channel: undefined } })
}
</script>

<template>
  <div class="space-y-4" data-testid="impex-messages">
    <h1 class="text-xl font-semibold">{{ t('impex.messages.title') }}</h1>

    <AtriumIntegrationScreen screen-key="impex.messages">
      <div class="space-y-4">
        <form class="atrium-querybar" data-testid="impex-messages-filters" @submit.prevent="filter">
          <USelect v-model="form.direction" :items="directionItems" :placeholder="t('impex.messages.all_directions')" class="w-44" :aria-label="t('impex.messages.direction')" />
          <UInput v-model="form.channel" name="channel" :placeholder="t('impex.messages.channel')" class="w-48" />
          <UButton type="submit" icon="i-lucide-filter" data-testid="impex-messages-filter">{{ t('impex.common.filter') }}</UButton>
          <UButton variant="ghost" data-testid="impex-messages-clear" @click="clear">{{ t('impex.common.clear') }}</UButton>
        </form>

        <ImpexState :error="messages.error.value" :ready="!messages.pending.value || messages.rows.value.length > 0">
          <p v-if="messages.rows.value.length === 0" class="atrium-empty" data-testid="impex-messages-empty">{{ t('impex.messages.empty') }}</p>
          <table v-else class="w-full text-left text-sm">
            <thead class="text-muted">
              <tr>
                <th class="py-2 pr-3 font-medium">{{ t('impex.messages.direction') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.messages.channel') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.messages.endpoint') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('impex.messages.status_code') }}</th>
                <th class="py-2 font-medium">{{ t('impex.messages.when') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="message in messages.rows.value" :key="message.id" :data-testid="`impex-message-row-${message.id}`">
                <td class="py-2 pr-3">
                  <NuxtLink :to="`/impex/messages/${encodeURIComponent(message.id)}`" class="font-medium hover:underline">
                    {{ t(`impex.directions.${message.direction}`) }}
                  </NuxtLink>
                </td>
                <td class="py-2 pr-3">{{ message.channel }}</td>
                <td class="max-w-xs truncate py-2 pr-3 font-mono text-xs">{{ message.method }} {{ message.endpoint }}</td>
                <td class="py-2 pr-3">{{ message.status_code ?? t('impex.common.none') }}</td>
                <td class="py-2">{{ formatDate(message.occurred_at) }}</td>
              </tr>
            </tbody>
          </table>

          <UButton v-if="messages.nextCursor.value" variant="outline" :loading="messages.pending.value" data-testid="impex-load-more" @click="messages.loadMore">
            {{ t('impex.common.load_more') }}
          </UButton>
        </ImpexState>
      </div>
    </AtriumIntegrationScreen>
  </div>
</template>
