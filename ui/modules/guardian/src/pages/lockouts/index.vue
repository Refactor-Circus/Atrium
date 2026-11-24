<script setup lang="ts">
import GuardianErrors from '../../components/access/GuardianErrors.vue'
import GuardianEventList from '../../components/admin/GuardianEventList.vue'
import { LOCKED_OUT_EVENT } from '../../components/admin/admin'
import { guardianData, untypedBody, useGuardianAction, useGuardian } from '../../components/two-factor/guardian'

/**
 * `guardian.lockouts` (AC 92, D-056): Guardian has no route that lists
 * lockouts, so the screen clears one by identifier (`DELETE lockouts`,
 * `guardian.lockouts.destroy`), after a confirmation, and lists the recent
 * `login.locked_out` events below. The identifier, often an email address,
 * goes in the request body rather than the query string (D-070).
 */
const { t } = useI18n()
const client = useGuardian()
const clear = useGuardianAction()

useHead({ title: () => t('guardian.admin.lockouts.title') })

const identifier = ref('')
const cleared = ref<string | null>(null)
const filters = { type: LOCKED_OUT_EVENT }

async function submit(): Promise<void> {
  const value = identifier.value.trim()
  cleared.value = null

  if (!client || value === '' || !window.confirm(t('guardian.admin.lockouts.confirm', { identifier: value }))) {
    return
  }

  if (await clear.run(async () => guardianData(await client.DELETE('/lockouts', untypedBody({ body: { identifier: value } }))))) {
    cleared.value = value
    identifier.value = ''
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('guardian.admin.lockouts.title')" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.lockouts">
        <div class="space-y-4" data-testid="guardian-lockouts">
          <UCard>
            <template #header>
              <h2 class="font-semibold">{{ t('guardian.admin.lockouts.clear') }}</h2>
              <p class="text-sm text-muted">{{ t('guardian.admin.lockouts.hint') }}</p>
            </template>
            <form class="flex flex-wrap items-end gap-3" data-testid="guardian-lockout-form" @submit.prevent="submit">
              <UFormField :label="t('guardian.admin.lockouts.identifier')" :error="clear.error('identifier')" required>
                <UInput v-model="identifier" class="w-72" autocomplete="off" data-testid="guardian-lockout-identifier" />
              </UFormField>
              <UButton type="submit" icon="i-lucide-lock-open" :loading="clear.busy.value" data-testid="guardian-lockout-submit">{{ t('guardian.admin.lockouts.submit') }}</UButton>
            </form>
            <UAlert v-if="cleared" class="mt-3" color="success" variant="subtle" :title="t('guardian.admin.lockouts.cleared', { identifier: cleared })" data-testid="guardian-lockout-cleared" />
            <div class="mt-3">
              <GuardianErrors v-if="clear.errors.value.identifier === undefined" :action="clear" testid="guardian-lockout" />
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="font-semibold">{{ t('guardian.admin.lockouts.recent') }}</h2>
            </template>
            <GuardianEventList :filters="filters" testid="guardian-lockout-events" />
          </UCard>
        </div>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
