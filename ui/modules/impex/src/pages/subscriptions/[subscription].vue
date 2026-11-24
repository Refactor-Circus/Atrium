<script setup lang="ts">
import ImpexFlash from '../../components/ImpexFlash.vue'
import ImpexState from '../../components/ImpexState.vue'
import ImpexStatusBadge from '../../components/ImpexStatusBadge.vue'
import { endpointOf, formatDate, isOn, useImpexAction, useImpexResource } from '../../components/shared'
import type { components } from '../../../client/schema'

/**
 * `impex.subscription`: one subscription (`impex.subscriptions.show`) with
 * its recent deliveries (`impex.subscriptions.deliveries`), and v1's
 * actions: pause and resume (`impex.subscriptions.update` with `status`),
 * replay from an event (`update` with `replay_from`) and, for one that
 * pushes, ping (`impex.subscriptions.ping`). Each action reloads it.
 */
const { t } = useI18n()
const route = useRoute()

const id = computed(() => String(route.params.subscription ?? ''))

const subscription = useImpexResource(async client => integrationData(await client.GET('/subscriptions/{subscription}', { params: { path: { subscription: id.value } } })).data, id)

const deliveries = useImpexResource(async client => integrationData(await client.GET('/subscriptions/{subscription}/deliveries', { params: { path: { subscription: id.value }, query: { per_page: 20 } } })).data, id)

const action = useImpexAction()
const replayFrom = ref<string | number>('')

const endpoint = computed(() => endpointOf(subscription.data.value?.endpoint))
const lastError = computed(() => {
  const message = subscription.data.value?.last_error?.message

  return typeof message === 'string' ? message : null
})

async function reload(): Promise<void> {
  await Promise.all([subscription.reload(), deliveries.reload()])
}

async function update(body: components['schemas']['UpdateSubscriptionRequest'], notice: string): Promise<void> {
  const client = subscription.client

  if (!client) {
    return
  }

  await action.run(
    async () => integrationData(await client.PATCH('/subscriptions/{subscription}', { params: { path: { subscription: id.value } }, body })),
    async () => {
      await reload()
      return notice
    }
  )
}

async function pause(): Promise<void> {
  await update({ status: 'paused' }, t('impex.subscription.paused'))
}

async function resume(): Promise<void> {
  await update({ status: 'active' }, t('impex.subscription.resumed'))
}

async function replay(): Promise<void> {
  // A number input may hand back a number or the typed text.
  const raw = String(replayFrom.value).trim()
  const from = Number(raw)

  if (raw === '' || !Number.isInteger(from) || from < 0) {
    action.invalid('replay_from', t('impex.subscription.replay_invalid'))
    return
  }

  await update({ replay_from: from }, t('impex.subscription.replaying'))
  replayFrom.value = ''
}

async function ping(): Promise<void> {
  const client = subscription.client

  if (!client) {
    return
  }

  await action.run(
    async () => integrationData(await client.POST('/subscriptions/{subscription}/ping', { params: { path: { subscription: id.value } } })),
    async (answer) => {
      await reload()

      return isOn(answer.data.successful)
        ? t('impex.subscription.ping_succeeded')
        : t('impex.subscription.ping_failed', { error: String(answer.data.error ?? '') })
    }
  )
}
</script>

<template>
  <div class="space-y-4" data-testid="impex-subscription">
    <AtriumIntegrationScreen screen-key="impex.subscription" :record="id">
      <ImpexState :error="subscription.error.value" :ready="subscription.data.value !== null">
        <div v-if="subscription.data.value" class="space-y-4">
          <header class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-semibold">{{ subscription.data.value.stream }}</h1>
              <ImpexStatusBadge :status="subscription.data.value.status" />
            </div>
            <div class="flex gap-2">
              <UButton v-if="subscription.data.value.status === 'active'" variant="outline" icon="i-lucide-pause" :loading="action.busy.value" data-testid="impex-subscription-pause" @click="pause">
                {{ t('impex.subscription.pause') }}
              </UButton>
              <UButton v-else variant="outline" icon="i-lucide-play" :loading="action.busy.value" data-testid="impex-subscription-resume" @click="resume">
                {{ t('impex.subscription.resume') }}
              </UButton>
              <UButton v-if="endpoint" variant="outline" icon="i-lucide-send" :loading="action.busy.value" data-testid="impex-subscription-ping" @click="ping">
                {{ t('impex.subscription.ping') }}
              </UButton>
            </div>
          </header>

          <ImpexFlash :action="action" />

          <UCard>
            <dl class="grid gap-3 text-sm sm:grid-cols-2" data-testid="impex-subscription-details">
              <div><dt class="text-muted">{{ t('impex.subscription.topics') }}</dt><dd>{{ subscription.data.value.topics.join(', ') || t('impex.common.none') }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.subscription.selection') }}</dt><dd>{{ subscription.data.value.selection }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.subscription.format') }}</dt><dd>{{ subscription.data.value.format }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.subscriptions.endpoint') }}</dt><dd>{{ endpoint ?? t('impex.subscriptions.feed_only') }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.subscription.cursor') }}</dt><dd class="font-mono">{{ subscription.data.value.cursor }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.subscriptions.failures') }}</dt><dd class="tabular-nums">{{ subscription.data.value.failures }}</dd></div>
              <div v-if="subscription.data.value.paused_until"><dt class="text-muted">{{ t('impex.subscription.paused_until') }}</dt><dd>{{ formatDate(subscription.data.value.paused_until) }}</dd></div>
              <div v-if="lastError" class="sm:col-span-2"><dt class="text-muted">{{ t('impex.subscription.last_error') }}</dt><dd>{{ lastError }}</dd></div>
            </dl>
          </UCard>

          <UCard>
            <form class="flex flex-wrap items-end gap-3" data-testid="impex-subscription-replay" @submit.prevent="replay">
              <UFormField :label="t('impex.subscription.replay_from')" class="w-48">
                <UInput v-model="replayFrom" name="replay_from" type="number" min="0" />
              </UFormField>
              <UButton type="submit" icon="i-lucide-rotate-ccw" :loading="action.busy.value">{{ t('impex.subscription.replay') }}</UButton>
            </form>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-medium">{{ t('impex.subscription.deliveries') }}</h2>
            </template>
            <ImpexState :error="deliveries.error.value" :ready="deliveries.data.value !== null">
              <p v-if="(deliveries.data.value ?? []).length === 0" class="text-sm text-muted">{{ t('impex.subscription.no_deliveries') }}</p>
              <table v-else class="w-full text-left text-sm" data-testid="impex-subscription-deliveries">
                <thead class="text-muted">
                  <tr>
                    <th class="py-2 pr-3 font-medium">{{ t('impex.subscriptions.status') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('impex.subscription.events') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('impex.message.duration') }}</th>
                    <th class="py-2 font-medium">{{ t('impex.messages.when') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr v-for="delivery in deliveries.data.value" :key="delivery.id" :data-testid="`impex-delivery-${delivery.id}`">
                    <td class="py-2 pr-3"><ImpexStatusBadge :status="delivery.status" /> <span v-if="delivery.status_code" class="text-xs text-muted">{{ delivery.status_code }}</span></td>
                    <td class="py-2 pr-3 tabular-nums">{{ delivery.events }}</td>
                    <td class="py-2 pr-3">{{ delivery.duration_ms === null ? t('impex.common.none') : t('impex.message.milliseconds', { count: delivery.duration_ms }) }}</td>
                    <td class="py-2">
                      <RouterLink v-if="delivery.message_id" :to="`/impex/messages/${encodeURIComponent(delivery.message_id)}`" class="hover:underline">{{ formatDate(delivery.attempted_at) }}</RouterLink>
                      <span v-else>{{ formatDate(delivery.attempted_at) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </ImpexState>
          </UCard>
        </div>
      </ImpexState>
    </AtriumIntegrationScreen>
  </div>
</template>
