<script setup lang="ts">
import ImpexFlash from '../../../integrations/impex/components/ImpexFlash.vue'
import ImpexState from '../../../integrations/impex/components/ImpexState.vue'
import ImpexStatusBadge from '../../../integrations/impex/components/ImpexStatusBadge.vue'
import { formatDate, looseBody, parseJson, runPath, useImpexAction, useImpexResource } from '../../../integrations/impex/components/shared'
import type { components } from '../../../integrations/impex/client/schema'

/**
 * `impex.run`: one run with its steps (`impex.runs.steps.index`) and the
 * messages it sent and received, and v1's actions: cancel, retry and send a
 * signal. Each action reloads the run.
 */
const { t } = useI18n()
const route = useRoute()

const id = computed(() => String(route.params.run ?? ''))

const run = useImpexResource(async client => integrationData(await client.GET('/runs/{run}', { params: { path: { run: id.value } } })).data, id)

const steps = useImpexResource(async client => integrationData(await client.GET('/runs/{run}/steps', { params: { path: { run: id.value } } })).data, id)

const messages = useImpexResource(async client => integrationData(await client.GET('/messages', { params: { query: { run: id.value } } })).data, id)

const action = useImpexAction()
const signal = reactive({ name: '', payload: '' })

const finished = computed(() => ['completed', 'failed', 'cancelled'].includes(run.data.value?.status ?? ''))

async function reload(): Promise<void> {
  await Promise.all([run.reload(), steps.reload(), messages.reload()])
}

async function cancel(): Promise<void> {
  const client = run.client

  if (!client) {
    return
  }

  await action.run(
    async () => integrationData(await client.POST('/runs/{run}/cancel', { params: { path: { run: id.value } }, body: { reason: t('impex.run.cancelled_from_dashboard') } })),
    async () => {
      await reload()
      return t('impex.run.cancelled')
    }
  )
}

async function retry(): Promise<void> {
  const client = run.client

  if (!client) {
    return
  }

  await action.run(
    async () => integrationData(await client.POST('/runs/{run}/retry', { params: { path: { run: id.value } } })),
    async () => {
      await reload()
      return t('impex.run.retried')
    }
  )
}

async function sendSignal(): Promise<void> {
  const client = run.client
  const payload = parseJson(signal.payload)

  if (!client) {
    return
  }

  if (payload && !('value' in payload)) {
    action.invalid('payload', t('impex.run.payload_invalid'))
    return
  }

  const body = looseBody<components['schemas']['StoreRunSignalRequest']>({
    name: signal.name,
    ...(payload && 'value' in payload ? { payload: payload.value } : {})
  })

  await action.run(
    async () => integrationData(await client.POST('/runs/{run}/signals', { params: { path: { run: id.value } }, body })),
    async (answer) => {
      signal.name = ''
      signal.payload = ''
      await reload()
      // A finished run answers with a message and no signal.
      return 'data' in answer && answer.data ? t('impex.run.signal_sent') : t('impex.run.signal_ignored')
    }
  )
}
</script>

<template>
  <div class="space-y-4" data-testid="impex-run">
    <AtriumIntegrationScreen screen-key="impex.run" :record="id">
      <ImpexState :error="run.error.value" :ready="run.data.value !== null">
        <div v-if="run.data.value" class="space-y-4">
          <header class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-semibold">{{ run.data.value.flow }}</h1>
              <ImpexStatusBadge :status="run.data.value.status" />
            </div>
            <div class="flex gap-2">
              <UButton v-if="!finished" variant="outline" icon="i-lucide-circle-stop" :loading="action.busy.value" data-testid="impex-run-cancel" @click="cancel">
                {{ t('impex.run.cancel') }}
              </UButton>
              <UButton v-if="run.data.value.status === 'failed'" variant="outline" icon="i-lucide-rotate-cw" :loading="action.busy.value" data-testid="impex-run-retry" @click="retry">
                {{ t('impex.run.retry') }}
              </UButton>
            </div>
          </header>

          <ImpexFlash :action="action" />

          <UCard>
            <dl class="grid gap-3 text-sm sm:grid-cols-2" data-testid="impex-run-details">
              <div><dt class="text-muted">{{ t('impex.run.id') }}</dt><dd class="font-mono">{{ run.data.value.id }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.runs.trigger') }}</dt><dd>{{ run.data.value.trigger }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.runs.started') }}</dt><dd>{{ formatDate(run.data.value.started_at) ?? t('impex.common.none') }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.runs.finished') }}</dt><dd>{{ formatDate(run.data.value.finished_at) ?? t('impex.common.none') }}</dd></div>
              <div v-if="run.data.value.idempotency_key"><dt class="text-muted">{{ t('impex.run.idempotency_key') }}</dt><dd class="font-mono">{{ run.data.value.idempotency_key }}</dd></div>
              <div v-if="run.data.value.parent_run_id">
                <dt class="text-muted">{{ t('impex.run.parent') }}</dt>
                <dd><NuxtLink :to="runPath(run.data.value.parent_run_id)" class="font-mono hover:underline">{{ run.data.value.parent_run_id }}</NuxtLink></dd>
              </div>
              <div v-if="run.data.value.tags && Object.keys(run.data.value.tags).length" class="sm:col-span-2">
                <dt class="text-muted">{{ t('impex.run.tags') }}</dt>
                <dd class="flex flex-wrap gap-1">
                  <UBadge v-for="(value, name) in run.data.value.tags" :key="name" variant="outline" color="neutral">{{ name }}: {{ value }}</UBadge>
                </dd>
              </div>
              <div v-if="run.data.value.error" class="sm:col-span-2">
                <dt class="text-muted">{{ t('impex.run.error') }}</dt>
                <dd><pre class="overflow-x-auto rounded-md bg-elevated p-2 text-xs">{{ JSON.stringify(run.data.value.error, null, 2) }}</pre></dd>
              </div>
            </dl>
          </UCard>

          <UCard v-if="!finished">
            <template #header>
              <h2 class="font-medium">{{ t('impex.run.signal_title') }}</h2>
            </template>
            <form class="flex flex-wrap items-end gap-3" data-testid="impex-run-signal" @submit.prevent="sendSignal">
              <UInput v-model="signal.name" name="name" :placeholder="t('impex.run.signal_name')" required class="w-56" />
              <UInput v-model="signal.payload" name="payload" :placeholder="t('impex.run.signal_payload')" class="w-72" />
              <UButton type="submit" icon="i-lucide-send" :loading="action.busy.value">{{ t('impex.run.send') }}</UButton>
            </form>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-medium">{{ t('impex.run.steps') }}</h2>
            </template>
            <ImpexState :error="steps.error.value" :ready="steps.data.value !== null">
              <p v-if="(steps.data.value ?? []).length === 0" class="text-sm text-muted">{{ t('impex.run.no_steps') }}</p>
              <ol v-else class="divide-y divide-default text-sm" data-testid="impex-run-steps">
                <li v-for="step in steps.data.value" :key="step.id" class="flex flex-wrap items-center justify-between gap-2 py-2" :data-testid="`impex-step-${step.sequence}`">
                  <span class="flex items-center gap-2">
                    <span class="text-muted tabular-nums">{{ step.sequence }}</span>
                    <span class="font-medium">{{ step.name }}</span>
                    <span class="text-xs text-muted">{{ step.type }}</span>
                    <UBadge v-if="step.phase === 'rollback'" variant="outline" color="warning">{{ t('impex.run.rollback') }}</UBadge>
                    <UBadge v-if="step.undone" variant="outline" color="neutral">{{ t('impex.run.undone') }}</UBadge>
                  </span>
                  <span class="flex items-center gap-2 text-xs text-muted">
                    <span>{{ t('impex.run.attempts', { count: step.attempts }) }}</span>
                    <span v-if="step.resumptions > 0">{{ t('impex.run.resumed', { count: step.resumptions }) }}</span>
                    <span v-if="step.result_artifact_id">{{ t('impex.run.result_on_disk') }}</span>
                    <ImpexStatusBadge :status="step.status" />
                  </span>
                </li>
              </ol>
            </ImpexState>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-medium">{{ t('impex.run.messages') }}</h2>
            </template>
            <ImpexState :error="messages.error.value" :ready="messages.data.value !== null">
              <p v-if="(messages.data.value ?? []).length === 0" class="text-sm text-muted">{{ t('impex.run.no_messages') }}</p>
              <ul v-else class="divide-y divide-default text-sm" data-testid="impex-run-messages">
                <li v-for="message in messages.data.value" :key="message.id" class="flex justify-between gap-2 py-2">
                  <NuxtLink :to="`/impex/messages/${encodeURIComponent(message.id)}`" class="hover:underline">
                    {{ message.direction }} · {{ message.channel }}
                  </NuxtLink>
                  <span class="text-xs text-muted">{{ formatDate(message.occurred_at) }}</span>
                </li>
              </ul>
            </ImpexState>
          </UCard>
        </div>
      </ImpexState>
    </AtriumIntegrationScreen>
  </div>
</template>
