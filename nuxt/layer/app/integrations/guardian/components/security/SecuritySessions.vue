<script setup lang="ts">
import GuardianActionError from '../two-factor/GuardianActionError.vue'
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, untypedBody, useGuardianAction, useGuardianLoad, type GuardianPage } from '../two-factor/guardian'
import { SECURITY_PAGE_SIZE, type GuardianSession } from './security'

/**
 * The sessions section of `/guardian/security` (AC 88): the user's sessions
 * (`guardian.sessions.index`), the current one flagged; revoking one
 * (`guardian.sessions.destroy`); and "sign out everywhere else"
 * (`guardian.sessions.others.destroy`), optionally revoking the user's API
 * tokens too (`tokens: true`). Each revocation asks for confirmation.
 */
const { t } = useI18n()
const action = useGuardianAction()
const alsoTokens = ref(false)
const notice = ref<string | null>(null)

const { client, data: sessions, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianSession>>(await guardian.GET('/sessions', { params: { query: { per_page: SECURITY_PAGE_SIZE } } })).data)

async function revoke(session: GuardianSession): Promise<void> {
  if (!client || !window.confirm(t('guardian.security.sessions.confirm_revoke'))) {
    return
  }

  if (await action.run(async () => guardianData(await client.DELETE('/sessions/{session}', { params: { path: { session: session.id } } })))) {
    await reload()
  }
}

async function revokeOthers(): Promise<void> {
  if (!client || !window.confirm(t(alsoTokens.value ? 'guardian.security.sessions.confirm_others_tokens' : 'guardian.security.sessions.confirm_others'))) {
    return
  }

  notice.value = null
  const result: { revoked: number, tokens_revoked: number | null }[] = []
  const ok = await action.run(async () => {
    result.push(guardianData<{ revoked: number, tokens_revoked: number | null }>(await client.DELETE('/sessions/others', alsoTokens.value ? { body: untypedBody({ tokens: true }) } : {})))
  })

  if (ok && result[0]) {
    notice.value = t('guardian.security.sessions.revoked', { count: result[0].revoked, tokens: result[0].tokens_revoked ?? 0 })
    await reload()
  }
}
</script>

<template>
  <UCard data-testid="guardian-security-sessions">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.security.sessions.title') }}</h2>
    </template>
    <GuardianState :ready="!pending && sessions !== null" :failed="failed" :status="status" compact>
      <div class="space-y-3">
        <UAlert v-if="notice" color="success" variant="subtle" :title="notice" data-testid="guardian-sessions-notice" />
        <GuardianActionError :action="action" />
        <ul class="divide-y divide-default text-sm">
          <li v-for="session in sessions ?? []" :key="session.id" class="flex flex-wrap items-center justify-between gap-2 py-2" :data-testid="`guardian-session-${session.id}`">
            <span>
              <strong>{{ session.device_name ?? session.user_agent ?? t('guardian.security.sessions.unknown') }}</strong>
              <span class="text-muted"> · {{ session.ip ?? '—' }} · {{ formatDate(session.last_active_at) }}</span>
              <UBadge v-if="session.current" color="primary" variant="subtle" class="ml-2" data-testid="guardian-session-current">{{ t('guardian.security.sessions.current') }}</UBadge>
            </span>
            <UButton v-if="!session.current" size="xs" color="error" variant="ghost" icon="i-lucide-log-out" :data-testid="`guardian-session-revoke-${session.id}`" @click="revoke(session)">
              {{ t('guardian.security.sessions.revoke') }}
            </UButton>
          </li>
        </ul>
        <div class="flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="alsoTokens" type="checkbox" class="accent-(--ui-primary)" data-testid="guardian-sessions-also-tokens">
            {{ t('guardian.security.sessions.also_tokens') }}
          </label>
          <UButton color="error" variant="soft" icon="i-lucide-log-out" :loading="action.busy.value" data-testid="guardian-sessions-others" @click="revokeOthers">
            {{ t('guardian.security.sessions.others') }}
          </UButton>
        </div>
      </div>
    </GuardianState>
  </UCard>
</template>
