<script setup lang="ts">
import { contextValue } from '../../components/admin/admin'
import { userPath } from '../../components/access/access'
import type { GuardianSecurityEvent } from '../../components/security/security'
import GuardianState from '../../components/two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianLoad, type GuardianOne } from '../../components/two-factor/guardian'

/**
 * `guardian.security-event`: one security event
 * (`guardian.security-events.show`, AC 91): its type, user, address, agent,
 * identifier hash and time, and its context as key-value rows.
 */
const { t } = useI18n()
const route = useRoute()

const id = computed(() => String(route.params.event))

const { data: event, pending, failed, status } = useGuardianLoad(async guardian =>
  guardianData<GuardianOne<GuardianSecurityEvent>>(await guardian.GET('/security-events/{event}', { params: { path: { event: id.value } } })).data, id)

const context = computed(() => Object.entries(event.value?.context ?? {}))

useHead({ title: () => event.value?.type ?? t('guardian.admin.event.title') })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="event?.type ?? t('guardian.admin.event.title')">
        <template #leading>
          <UButton to="/guardian/security-events" variant="ghost" icon="i-lucide-arrow-left" :aria-label="t('guardian.admin.events.title')" data-testid="guardian-event-back" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.security-event" :record="id">
        <GuardianState :ready="!pending && event !== null" :failed="failed" :status="status" :not-found="t('guardian.admin.event.not_found')">
          <div v-if="event" class="space-y-4" data-testid="guardian-security-event">
            <UCard>
              <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
                <dt class="text-muted">{{ t('guardian.admin.events.fields.type') }}</dt>
                <dd class="font-mono" data-testid="guardian-event-type">{{ event.type }}</dd>
                <dt class="text-muted">{{ t('guardian.admin.events.fields.user') }}</dt>
                <dd data-testid="guardian-event-user">
                  <RouterLink v-if="event.user_id" :to="userPath(event.user_id)" class="hover:underline">{{ event.user_id }}</RouterLink>
                  <span v-else>—</span>
                </dd>
                <dt class="text-muted">{{ t('guardian.admin.events.fields.ip') }}</dt>
                <dd>{{ event.ip ?? '—' }}</dd>
                <dt class="text-muted">{{ t('guardian.admin.event.user_agent') }}</dt>
                <dd class="break-all">{{ event.user_agent ?? '—' }}</dd>
                <dt class="text-muted">{{ t('guardian.admin.event.identifier_hash') }}</dt>
                <dd class="break-all font-mono text-xs">{{ event.identifier_hash ?? '—' }}</dd>
                <dt class="text-muted">{{ t('guardian.admin.events.fields.occurred_at') }}</dt>
                <dd>{{ formatDate(event.occurred_at) }}</dd>
              </dl>
            </UCard>
            <UCard>
              <template #header>
                <h2 class="font-semibold">{{ t('guardian.admin.event.context') }}</h2>
              </template>
              <p v-if="context.length === 0" class="atrium-empty" data-testid="guardian-event-context-empty">{{ t('guardian.admin.event.no_context') }}</p>
              <dl v-else class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]" data-testid="guardian-event-context">
                <template v-for="[key, value] in context" :key="key">
                  <dt class="font-mono text-muted">{{ key }}</dt>
                  <dd class="break-all" :data-testid="`guardian-event-context-${key}`">{{ contextValue(value) }}</dd>
                </template>
              </dl>
            </UCard>
          </div>
        </GuardianState>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
