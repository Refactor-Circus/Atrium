<script setup lang="ts">
import GuardianActionError from '../two-factor/GuardianActionError.vue'
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianAction, useGuardianLoad } from '../two-factor/guardian'
import type { GuardianToken } from '../security/security'

/**
 * One user's API tokens (AC 90, D-054): `guardian.users.tokens.index`, and
 * "revoke all" through `guardian.users.tokens.destroy` after a confirmation.
 * The whole block hides when Guardian has no token driver (501).
 */
const props = defineProps<{ user: string, name?: string | null }>()

const { t } = useI18n()
const action = useGuardianAction()

const { client, data: tokens, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<{ data: GuardianToken[] }>(await guardian.GET('/users/{user}/tokens', { params: { path: { user: props.user } } })).data, () => props.user)

const hidden = computed(() => failed.value && status.value === 501)

async function revokeAll(): Promise<void> {
  if (!client || !window.confirm(t('guardian.access.user.confirm_revoke_tokens', { user: props.name ?? props.user }))) {
    return
  }

  if (await action.run(async () => guardianData(await client.DELETE('/users/{user}/tokens', { params: { path: { user: props.user } } })))) {
    await reload()
  }
}
</script>

<template>
  <UCard v-if="!hidden" data-testid="guardian-user-tokens">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.access.user.tokens') }}</h2>
    </template>
    <GuardianState :ready="!pending && tokens !== null" :failed="failed" :status="status" compact>
      <div class="space-y-3">
        <GuardianActionError :action="action" />
        <ul class="divide-y divide-default text-sm">
          <li v-for="token in tokens ?? []" :key="token.id" class="py-2" :data-testid="`guardian-user-token-${token.id}`">
            <strong>{{ token.name }}</strong>
            <span class="text-muted"> · {{ token.abilities.join(', ') }} · {{ formatDate(token.last_used_at) ?? t('guardian.access.user.never_used') }}</span>
          </li>
          <li v-if="(tokens ?? []).length === 0" class="py-2 text-muted">{{ t('guardian.access.user.no_tokens') }}</li>
        </ul>
        <UButton color="error" variant="soft" size="sm" icon="i-lucide-key-round" :loading="action.busy.value" data-testid="guardian-user-tokens-revoke" @click="revokeAll">
          {{ t('guardian.access.user.revoke_tokens') }}
        </UButton>
      </div>
    </GuardianState>
  </UCard>
</template>
