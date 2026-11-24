<script setup lang="ts">
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianLoad, type GuardianCursorPage } from '../two-factor/guardian'
import type { GuardianSecurityEvent } from '../security/security'

/** One user's recent security events (AC 90): `guardian.security-events.index?user=`. */
const props = defineProps<{ user: string }>()

const { t } = useI18n()

const { data: page, pending, failed, status } = useGuardianLoad(async guardian =>
  guardianData<GuardianCursorPage<GuardianSecurityEvent>>(await guardian.GET('/security-events', { params: { query: { user: props.user, per_page: 20 } } })), () => props.user)
</script>

<template>
  <UCard data-testid="guardian-user-events">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.access.user.events') }}</h2>
    </template>
    <GuardianState :ready="!pending && page !== null" :failed="failed" :status="status" compact>
      <ul class="divide-y divide-default text-sm">
        <li v-for="event in page?.data ?? []" :key="event.id" class="flex flex-wrap justify-between gap-2 py-2" :data-testid="`guardian-user-event-${event.id}`">
          <RouterLink :to="`/guardian/security-events/${encodeURIComponent(event.id)}`" class="font-mono hover:underline">{{ event.type }}</RouterLink>
          <span class="text-muted">{{ event.ip ?? '—' }} · {{ formatDate(event.occurred_at) }}</span>
        </li>
        <li v-if="(page?.data ?? []).length === 0" class="py-2 text-muted">{{ t('guardian.access.user.no_events') }}</li>
      </ul>
    </GuardianState>
  </UCard>
</template>
