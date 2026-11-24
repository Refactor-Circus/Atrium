<script setup lang="ts">
import ImpexState from '../../components/ImpexState.vue'
import ImpexStatusBadge from '../../components/ImpexStatusBadge.vue'
import { useImpexResource } from '../../components/shared'

/**
 * `impex.channels`: every channel, configured or stored
 * (`impex.channels.index`), each opening its page, and v1's "New channel".
 */
const { t } = useI18n()

const channels = useImpexResource(async client => integrationData(await client.GET('/channels')).data)
</script>

<template>
  <div class="space-y-4" data-testid="impex-channels">
    <header class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-semibold">{{ t('impex.channels.title') }}</h1>
      <UButton to="/impex/channels/create" icon="i-lucide-plus" data-testid="impex-new-channel">{{ t('impex.channels.new') }}</UButton>
    </header>

    <AtriumIntegrationScreen screen-key="impex.channels">
      <ImpexState :error="channels.error.value" :ready="channels.data.value !== null">
        <p v-if="(channels.data.value ?? []).length === 0" class="text-sm text-muted">{{ t('impex.channels.empty') }}</p>
        <table v-else class="w-full text-left text-sm">
          <thead class="text-muted">
            <tr>
              <th class="py-2 pr-3 font-medium">{{ t('impex.channels.name') }}</th>
              <th class="py-2 pr-3 font-medium">{{ t('impex.channels.direction') }}</th>
              <th class="py-2 pr-3 font-medium">{{ t('impex.channels.transport') }}</th>
              <th class="py-2 pr-3 font-medium">{{ t('impex.channels.status') }}</th>
              <th class="py-2 font-medium">{{ t('impex.channels.source') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="channel in channels.data.value" :key="channel.name" :data-testid="`impex-channel-row-${channel.name}`">
              <td class="py-2 pr-3">
                <RouterLink :to="`/impex/channels/${encodeURIComponent(channel.name)}`" class="font-medium hover:underline">{{ channel.name }}</RouterLink>
              </td>
              <td class="py-2 pr-3">{{ t(`impex.directions.${channel.direction}`) }}</td>
              <td class="py-2 pr-3">{{ channel.transport }}</td>
              <td class="py-2 pr-3"><ImpexStatusBadge :status="channel.status" /></td>
              <td class="py-2">{{ channel.stored ? t('impex.channels.stored') : t('impex.channels.from_config') }}</td>
            </tr>
          </tbody>
        </table>
      </ImpexState>
    </AtriumIntegrationScreen>
  </div>
</template>
