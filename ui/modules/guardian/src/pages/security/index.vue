<script setup lang="ts">
import SecurityActivity from '../../components/security/SecurityActivity.vue'
import SecurityDevices from '../../components/security/SecurityDevices.vue'
import SecuritySessions from '../../components/security/SecuritySessions.vue'
import SecurityTokens from '../../components/security/SecurityTokens.vue'
import SecurityTwoFactor from '../../components/security/SecurityTwoFactor.vue'
import { securityOptions } from '../../components/security/security'

/**
 * `guardian.security`: the current user's security settings (AC 88), in
 * five sections that each load and handle their own 403: two-factor,
 * sessions, devices, API tokens and recent activity. The token form's
 * abilities and longest lifetime are the screen's static options (D-054).
 */
const { t } = useI18n()

useHead({ title: () => t('guardian.security.title') })

// The same request `<AtriumIntegrationScreen>` makes, shared by its key.
const { data: screen, status: screenStatus } = useAtriumScreen('guardian.security')

// The token form starts from the screen's options, so it waits for the
// screen (or its failure) instead of mounting with the defaults and again.
const screenSettled = computed(() => screenStatus.value === 'success' || screenStatus.value === 'error')

const options = computed(() => securityOptions(screen.value?.data.options as Record<string, unknown> | undefined))
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('guardian.security.title')" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.security">
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="lg:col-span-2">
            <SecurityTwoFactor />
          </div>
          <SecuritySessions />
          <SecurityDevices />
          <div v-if="screenSettled" class="lg:col-span-2">
            <SecurityTokens :key="options.tokenAbilities.join('|')" :abilities="options.tokenAbilities" :max-days="options.tokenMaxLifetimeDays" />
          </div>
          <div class="lg:col-span-2">
            <SecurityActivity />
          </div>
        </div>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
