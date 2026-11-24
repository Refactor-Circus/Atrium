<script setup lang="ts">
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianLoad, type GuardianCursorPage } from '../two-factor/guardian'
import type { GuardianSecurityEvent } from '../security/security'
import { eventPath, EVENTS_PAGE_SIZE } from './admin'

/**
 * Security events (`guardian.security-events.index`, AC 91, 92), newest
 * first, a cursor page at a time: "older" follows `next_cursor`, "newer"
 * goes back. The filters come from the parent (the events screen's form, or
 * the lockouts screen's fixed `login.locked_out`); a change starts again at
 * the newest page. Each row links to the event's page.
 */
const props = defineProps<{ filters: Record<string, string | null>, testid: string }>()

const { t } = useI18n()

const cursor = ref<string | null>(null)
const previous = ref<(string | null)[]>([])

const query = computed(() => ({
  ...Object.fromEntries(Object.entries(props.filters).filter(([, value]) => value !== null && value !== '')),
  per_page: EVENTS_PAGE_SIZE,
  ...(cursor.value ? { cursor: cursor.value } : {})
}))

watch(() => props.filters, () => {
  cursor.value = null
  previous.value = []
}, { deep: true })

const { data: page, pending, failed, status } = useGuardianLoad(async guardian =>
  guardianData<GuardianCursorPage<GuardianSecurityEvent>>(await guardian.GET('/security-events', { params: { query: query.value as never } })), query)

const events = computed(() => page.value?.data ?? [])

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
  <GuardianState :ready="!pending && page !== null" :failed="failed" :status="status">
    <div class="space-y-3" :data-testid="testid">
      <p v-if="events.length === 0" class="text-sm text-muted" :data-testid="`${testid}-empty`">{{ t('guardian.admin.events.empty') }}</p>
      <table v-else class="w-full text-left text-sm">
        <thead class="text-muted">
          <tr>
            <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.events.fields.type') }}</th>
            <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.events.fields.user') }}</th>
            <th class="py-2 pr-3 font-medium">{{ t('guardian.admin.events.fields.ip') }}</th>
            <th class="py-2 font-medium">{{ t('guardian.admin.events.fields.occurred_at') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="event in events" :key="event.id" :data-testid="`guardian-event-${event.id}`">
            <td class="py-2 pr-3">
              <RouterLink :to="eventPath(event.id)" class="font-mono hover:underline" data-testid="guardian-event-link">{{ event.type }}</RouterLink>
            </td>
            <td class="py-2 pr-3">{{ event.user_id ?? '—' }}</td>
            <td class="py-2 pr-3 text-muted">{{ event.ip ?? '—' }}</td>
            <td class="py-2 text-muted">{{ formatDate(event.occurred_at) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="flex gap-2">
        <UButton v-if="previous.length > 0" size="xs" color="neutral" variant="soft" :data-testid="`${testid}-newer`" @click="newer">{{ t('guardian.admin.events.newer') }}</UButton>
        <UButton v-if="page?.meta?.next_cursor" size="xs" color="neutral" variant="soft" :data-testid="`${testid}-older`" @click="older">{{ t('guardian.admin.events.older') }}</UButton>
      </div>
    </div>
  </GuardianState>
</template>
