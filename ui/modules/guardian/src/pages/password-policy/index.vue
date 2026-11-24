<script setup lang="ts">
import type { GuardianPasswordPolicy } from '../../components/admin/admin'
import GuardianState from '../../components/two-factor/GuardianState.vue'
import { guardianData, useGuardianLoad, type GuardianOne } from '../../components/two-factor/guardian'

/**
 * `guardian.password-policy` (AC 94): Guardian's password rules
 * (`guardian.password-policy.show`), read-only, since they come from
 * Guardian's config: the length bounds, the composition rules, the breach
 * check, the history and the maximum age.
 */
const { t } = useI18n()

useHead({ title: () => t('guardian.admin.password_policy.title') })

const { data: policy, pending, failed, status } = useGuardianLoad(async guardian =>
  guardianData<GuardianOne<GuardianPasswordPolicy>>(await guardian.GET('/password-policy')).data)

const composition = computed(() => {
  const current = policy.value

  return current
    ? (['letters', 'mixed_case', 'numbers', 'symbols'] as const).map(rule => ({ rule, on: current[rule] }))
    : []
})

function yesNo(value: boolean): string {
  return value ? t('guardian.admin.yes') : t('guardian.admin.no')
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('guardian.admin.password_policy.title')" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.password-policy">
        <GuardianState :ready="!pending && policy !== null" :failed="failed" :status="status">
          <UCard v-if="policy" data-testid="guardian-password-policy">
            <template #header>
              <p class="text-sm text-muted">{{ t('guardian.admin.password_policy.read_only') }}</p>
            </template>
            <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[16rem_1fr]">
              <dt class="text-muted">{{ t('guardian.admin.password_policy.length') }}</dt>
              <dd data-testid="guardian-password-length">{{ t('guardian.admin.password_policy.length_value', { min: policy.min_length, max: policy.max_length }) }}</dd>
              <template v-for="entry in composition" :key="entry.rule">
                <dt class="text-muted">{{ t(`guardian.admin.password_policy.rules.${entry.rule}`) }}</dt>
                <dd :data-testid="`guardian-password-${entry.rule}`">{{ yesNo(entry.on) }}</dd>
              </template>
              <dt class="text-muted">{{ t('guardian.admin.password_policy.uncompromised') }}</dt>
              <dd data-testid="guardian-password-uncompromised">
                {{ policy.uncompromised ? t('guardian.admin.password_policy.uncompromised_on', { threshold: policy.uncompromised_threshold }) : t('guardian.admin.no') }}
              </dd>
              <dt class="text-muted">{{ t('guardian.admin.password_policy.history') }}</dt>
              <dd data-testid="guardian-password-history">{{ policy.history > 0 ? t('guardian.admin.password_policy.history_value', { count: policy.history }) : t('guardian.admin.no') }}</dd>
              <dt class="text-muted">{{ t('guardian.admin.password_policy.max_age') }}</dt>
              <dd data-testid="guardian-password-max-age">{{ policy.max_age_days ? t('guardian.admin.password_policy.max_age_value', { days: policy.max_age_days }) : t('guardian.admin.never') }}</dd>
            </dl>
          </UCard>
        </GuardianState>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
