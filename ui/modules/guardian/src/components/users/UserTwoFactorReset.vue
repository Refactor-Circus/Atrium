<script setup lang="ts">
import GuardianActionError from '../two-factor/GuardianActionError.vue'
import { guardianData, useGuardian, useGuardianAction } from '../two-factor/guardian'

/**
 * Resets one user's two-factor (AC 90): `DELETE users/{user}/two-factor`,
 * after a confirmation that names the user. Guardian has no route for
 * another user's two-factor status, so none is shown (D-055).
 */
const props = defineProps<{ user: string, name?: string | null }>()

const { t } = useI18n()
const client = useGuardian()
const action = useGuardianAction()
const done = ref(false)

async function reset(): Promise<void> {
  if (!client || !window.confirm(t('guardian.access.user.confirm_reset_two_factor', { user: props.name ?? props.user }))) {
    return
  }

  done.value = await action.run(async () => guardianData(await client.DELETE('/users/{user}/two-factor', { params: { path: { user: props.user } } })))
}
</script>

<template>
  <UCard data-testid="guardian-user-two-factor">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.access.user.two_factor') }}</h2>
    </template>
    <div class="space-y-3">
      <p class="text-sm text-muted">{{ t('guardian.access.user.reset_two_factor_hint') }}</p>
      <UAlert v-if="done" color="success" variant="subtle" :title="t('guardian.access.user.two_factor_reset')" data-testid="guardian-user-two-factor-done" />
      <GuardianActionError :action="action" />
      <UButton color="error" variant="soft" size="sm" icon="i-lucide-shield-off" :loading="action.busy.value" data-testid="guardian-user-two-factor-reset" @click="reset">
        {{ t('guardian.access.user.reset_two_factor') }}
      </UButton>
    </div>
  </UCard>
</template>
