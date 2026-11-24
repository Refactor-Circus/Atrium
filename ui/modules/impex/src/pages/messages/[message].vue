<script setup lang="ts">
import ImpexState from '../../components/ImpexState.vue'
import { formatDate, runPath, useImpexResource } from '../../components/shared'

/**
 * `impex.message`: one ledger entry (`impex.messages.show`), with its
 * headers, its body preview and the run it belongs to.
 */
const { t } = useI18n()
const route = useRoute()

const id = computed(() => String(route.params.message ?? ''))

const message = useImpexResource(async client => integrationData(await client.GET('/messages/{message}', { params: { path: { message: id.value } } })).data, id)

const signature = computed(() => {
  const valid = message.data.value?.signature_valid

  return valid === true ? t('impex.message.verified') : valid === false ? t('impex.message.bad_signature') : t('impex.message.unsigned')
})
</script>

<template>
  <div class="space-y-4" data-testid="impex-message">
    <AtriumIntegrationScreen screen-key="impex.message" :record="id">
      <ImpexState :error="message.error.value" :ready="message.data.value !== null">
        <div v-if="message.data.value" class="space-y-4">
          <header>
            <h1 class="text-xl font-semibold">{{ t(`impex.directions.${message.data.value.direction}`) }} · {{ message.data.value.channel }}</h1>
            <p class="font-mono text-sm text-muted">{{ message.data.value.method }} {{ message.data.value.endpoint }}</p>
          </header>

          <UCard>
            <dl class="grid gap-3 text-sm sm:grid-cols-2" data-testid="impex-message-details">
              <div><dt class="text-muted">{{ t('impex.messages.when') }}</dt><dd>{{ formatDate(message.data.value.occurred_at) }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.messages.transport') }}</dt><dd>{{ message.data.value.transport }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.messages.status_code') }}</dt><dd>{{ message.data.value.status_code ?? t('impex.common.none') }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.message.duration') }}</dt><dd>{{ message.data.value.duration_ms === null ? t('impex.common.none') : t('impex.message.milliseconds', { count: message.data.value.duration_ms }) }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.message.size') }}</dt><dd>{{ t('impex.message.bytes', { count: message.data.value.bytes }) }}</dd></div>
              <div><dt class="text-muted">{{ t('impex.message.signature') }}</dt><dd data-testid="impex-message-signature">{{ signature }}</dd></div>
              <div v-if="message.data.value.run_id" class="sm:col-span-2">
                <dt class="text-muted">{{ t('impex.message.run') }}</dt>
                <dd><RouterLink :to="runPath(message.data.value.run_id)" class="font-mono hover:underline" data-testid="impex-message-run">{{ message.data.value.run_id }}</RouterLink></dd>
              </div>
            </dl>
          </UCard>

          <UCard v-if="message.data.value.headers && Object.keys(message.data.value.headers).length">
            <template #header>
              <h2 class="font-medium">{{ t('impex.message.headers') }}</h2>
            </template>
            <pre class="overflow-x-auto text-xs">{{ JSON.stringify(message.data.value.headers, null, 2) }}</pre>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-medium">{{ t('impex.message.body') }}</h2>
            </template>
            <pre class="overflow-x-auto whitespace-pre-wrap text-xs" data-testid="impex-message-body">{{ message.data.value.body_preview || t('impex.message.empty_body') }}</pre>
            <p v-if="message.data.value.body_artifact_id" class="mt-2 text-sm text-muted">
              {{ t('impex.message.body_on_disk', { id: message.data.value.body_artifact_id }) }}
            </p>
          </UCard>

          <UCard v-if="message.data.value.error">
            <template #header>
              <h2 class="font-medium">{{ t('impex.run.error') }}</h2>
            </template>
            <pre class="overflow-x-auto text-xs">{{ JSON.stringify(message.data.value.error, null, 2) }}</pre>
          </UCard>
        </div>
      </ImpexState>
    </AtriumIntegrationScreen>
  </div>
</template>
