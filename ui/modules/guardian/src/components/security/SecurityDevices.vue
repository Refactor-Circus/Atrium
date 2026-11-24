<script setup lang="ts">
import GuardianActionError from '../two-factor/GuardianActionError.vue'
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianAction, useGuardianLoad, type GuardianPage } from '../two-factor/guardian'
import { SECURITY_PAGE_SIZE, type GuardianDevice } from './security'

/**
 * The devices section of `/guardian/security` (AC 88): the devices the user
 * signed in from (`guardian.devices.index`), and forgetting one
 * (`guardian.devices.destroy`) after a confirmation.
 */
const { t } = useI18n()
const action = useGuardianAction()

const { client, data: devices, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianDevice>>(await guardian.GET('/devices', { params: { query: { per_page: SECURITY_PAGE_SIZE } } })).data)

async function forget(device: GuardianDevice): Promise<void> {
  if (!client || !window.confirm(t('guardian.security.devices.confirm_forget'))) {
    return
  }

  if (await action.run(async () => guardianData(await client.DELETE('/devices/{device}', { params: { path: { device: device.id } } })))) {
    await reload()
  }
}
</script>

<template>
  <UCard data-testid="guardian-security-devices">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.security.devices.title') }}</h2>
    </template>
    <GuardianState :ready="!pending && devices !== null" :failed="failed" :status="status" compact>
      <GuardianActionError :action="action" />
      <ul class="divide-y divide-default text-sm">
        <li v-for="device in devices ?? []" :key="device.id" class="flex flex-wrap items-center justify-between gap-2 py-2" :data-testid="`guardian-device-${device.id}`">
          <span>
            <strong>{{ device.name ?? t('guardian.security.devices.unnamed') }}</strong>
            <span class="text-muted"> · {{ device.last_ip ?? '—' }} · {{ formatDate(device.last_seen_at) }}</span>
          </span>
          <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" :data-testid="`guardian-device-forget-${device.id}`" @click="forget(device)">
            {{ t('guardian.security.devices.forget') }}
          </UButton>
        </li>
        <li v-if="(devices ?? []).length === 0" class="py-2 text-muted">{{ t('guardian.security.devices.none') }}</li>
      </ul>
    </GuardianState>
  </UCard>
</template>
