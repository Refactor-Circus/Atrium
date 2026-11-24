<script setup lang="ts">
import GuardianState from '../two-factor/GuardianState.vue'
import GuardianTwoFactorMethods from '../two-factor/GuardianTwoFactorMethods.vue'
import { formatDate, guardianData, useGuardianLoad, type GuardianOne, type GuardianTwoFactorStatus } from '../two-factor/guardian'

/**
 * The two-factor section of `/guardian/security` (AC 88): the status of
 * `GET two-factor` (on or off, required, the enrolment deadline) and the
 * shared two-factor components, reloaded after each change.
 */
const { t } = useI18n()

const { client, data: status, pending, failed, status: httpStatus, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianOne<GuardianTwoFactorStatus>>(await guardian.GET('/two-factor')).data)
</script>

<template>
  <UCard data-testid="guardian-security-two-factor">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.security.two_factor.title') }}</h2>
    </template>
    <GuardianState :ready="!pending && status !== null" :failed="failed" :status="httpStatus" compact>
      <div v-if="status && client" class="space-y-4">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <UBadge :color="status.enabled ? 'success' : 'neutral'" variant="subtle" data-testid="guardian-security-two-factor-state">
            {{ status.enabled ? t('guardian.security.two_factor.on') : t('guardian.security.two_factor.off') }}
          </UBadge>
          <span v-if="status.required">{{ t('guardian.security.two_factor.required') }}</span>
          <span v-if="status.enrolment_deadline" data-testid="guardian-security-two-factor-deadline">
            {{ t('guardian.security.two_factor.deadline', { deadline: formatDate(status.enrolment_deadline) ?? status.enrolment_deadline }) }}
          </span>
        </div>
        <GuardianTwoFactorMethods :client="client" :status="status" @changed="reload" />
      </div>
    </GuardianState>
  </UCard>
</template>
