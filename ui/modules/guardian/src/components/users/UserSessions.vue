<script setup lang="ts">
import GuardianActionError from '../two-factor/GuardianActionError.vue'
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianAction, useGuardianLoad, type GuardianPage } from '../two-factor/guardian'
import type { GuardianSession } from '../security/security'

/**
 * One user's sessions (AC 90): `guardian.users.sessions.index`, and "revoke
 * all" through `guardian.users.sessions.destroy` after a confirmation.
 */
const props = defineProps<{ user: string, name?: string | null }>()

const { t } = useI18n()
const action = useGuardianAction()
const notice = ref<string | null>(null)

const { client, data: sessions, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianSession>>(await guardian.GET('/users/{user}/sessions', { params: { path: { user: props.user }, query: { per_page: 50 } } })).data, () => props.user)

async function revokeAll(): Promise<void> {
  if (!client || !window.confirm(t('guardian.access.user.confirm_revoke_sessions', { user: props.name ?? props.user }))) {
    return
  }

  const result: { revoked: number }[] = []

  if (await action.run(async () => result.push(guardianData<{ revoked: number }>(await client.DELETE('/users/{user}/sessions', { params: { path: { user: props.user } } }))))) {
    notice.value = t('guardian.access.user.sessions_revoked', { count: result[0]?.revoked ?? 0 })
    await reload()
  }
}
</script>

<template>
  <UCard data-testid="guardian-user-sessions">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.access.user.sessions') }}</h2>
    </template>
    <GuardianState :ready="!pending && sessions !== null" :failed="failed" :status="status" compact>
      <div class="space-y-3">
        <UAlert v-if="notice" color="success" variant="subtle" :title="notice" data-testid="guardian-user-sessions-notice" />
        <GuardianActionError :action="action" />
        <ul class="divide-y divide-default text-sm">
          <li v-for="session in sessions ?? []" :key="session.id" class="py-2" :data-testid="`guardian-user-session-${session.id}`">
            <strong>{{ session.device_name ?? session.user_agent ?? '—' }}</strong>
            <span class="text-muted"> · {{ session.ip ?? '—' }} · {{ formatDate(session.last_active_at) }}</span>
          </li>
          <li v-if="(sessions ?? []).length === 0" class="py-2 text-muted">{{ t('guardian.access.user.no_sessions') }}</li>
        </ul>
        <UButton color="error" variant="soft" size="sm" icon="i-lucide-log-out" :loading="action.busy.value" data-testid="guardian-user-sessions-revoke" @click="revokeAll">
          {{ t('guardian.access.user.revoke_sessions') }}
        </UButton>
      </div>
    </GuardianState>
  </UCard>
</template>
