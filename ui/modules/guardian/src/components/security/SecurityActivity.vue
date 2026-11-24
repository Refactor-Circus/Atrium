<script setup lang="ts">
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianLoad, type GuardianCursorPage } from '../two-factor/guardian'
import { SECURITY_PAGE_SIZE, type GuardianSecurityEvent } from './security'

/**
 * The recent activity section of `/guardian/security` (AC 88): the user's
 * own security events (`guardian.me.security-events.index`), newest first, a
 * cursor page at a time ("older" follows `next_cursor`, "newer" goes back).
 */
const { t } = useI18n()

const cursor = ref<string | null>(null)
const previous = ref<(string | null)[]>([])

const { data: page, pending, failed, status } = useGuardianLoad(async guardian =>
  guardianData<GuardianCursorPage<GuardianSecurityEvent>>(await guardian.GET('/me/security-events', {
    params: { query: { per_page: SECURITY_PAGE_SIZE, ...(cursor.value ? { cursor: cursor.value } : {}) } }
  })), cursor)

function older(): void {
  const next = page.value?.meta?.next_cursor

  if (next) {
    previous.value = [...previous.value, cursor.value]
    cursor.value = next
  }
}

function newer(): void {
  cursor.value = previous.value.at(-1) ?? null
  previous.value = previous.value.slice(0, -1)
}
</script>

<template>
  <UCard data-testid="guardian-security-activity">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.security.activity.title') }}</h2>
    </template>
    <GuardianState :ready="!pending && page !== null" :failed="failed" :status="status" compact>
      <ul class="divide-y divide-default text-sm">
        <li v-for="event in page?.data ?? []" :key="event.id" class="flex flex-wrap justify-between gap-2 py-2" :data-testid="`guardian-activity-${event.id}`">
          <span class="font-mono">{{ event.type }}</span>
          <span class="text-muted">{{ event.ip ?? '—' }} · {{ formatDate(event.occurred_at) }}</span>
        </li>
        <li v-if="(page?.data ?? []).length === 0" class="py-2 text-muted">{{ t('guardian.security.activity.none') }}</li>
      </ul>
      <div class="mt-3 flex gap-2">
        <UButton v-if="previous.length > 0" size="xs" color="neutral" variant="soft" data-testid="guardian-activity-newer" @click="newer">{{ t('guardian.security.activity.newer') }}</UButton>
        <UButton v-if="page?.meta?.next_cursor" size="xs" color="neutral" variant="soft" data-testid="guardian-activity-older" @click="older">{{ t('guardian.security.activity.older') }}</UButton>
      </div>
    </GuardianState>
  </UCard>
</template>
