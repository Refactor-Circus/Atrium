<script setup lang="ts">
import { KEEN_APP_SOURCE, type KeenAuditEntry } from './entries'

/**
 * Audit entries as Keen's v1 `x-keen::audit.entries` listed them: when (a
 * link to the entry), the action with an "App" badge for the application's
 * own, the record, who acted and through what. Shared by Keen's pages and
 * its hooks (`withoutSubject` hides the record column for one record's
 * history).
 */
const props = withDefaults(defineProps<{ entries: readonly KeenAuditEntry[], withoutSubject?: boolean }>(), { withoutSubject: false })

const { t, locale } = useI18n()

function when(entry: KeenAuditEntry): string {
  const date = new Date(entry.created_at)

  return Number.isNaN(date.getTime()) ? entry.created_at : date.toLocaleString(locale.value)
}

const rows = computed(() => props.entries.map(entry => ({
  entry,
  when: when(entry),
  subject: entry.subject?.label ?? t('keen.entries.none'),
  actor: entry.actor?.label ?? t('keen.entries.system')
})))
</script>

<template>
  <p v-if="rows.length === 0" class="atrium-empty" data-testid="keen-entries-empty">
    {{ t('keen.entries.empty') }}
  </p>
  <div v-else class="overflow-x-auto">
    <table class="w-full text-sm" data-testid="keen-entries">
      <thead>
        <tr class="border-b border-default text-left text-muted">
          <th class="py-2 pe-4 font-medium">{{ t('keen.entries.when') }}</th>
          <th class="py-2 pe-4 font-medium">{{ t('keen.entries.action') }}</th>
          <th v-if="!withoutSubject" class="py-2 pe-4 font-medium">{{ t('keen.entries.subject') }}</th>
          <th class="py-2 pe-4 font-medium">{{ t('keen.entries.actor') }}</th>
          <th class="py-2 font-medium">{{ t('keen.entries.surface') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-for="row in rows" :key="row.entry.id" data-testid="keen-entry-row">
          <td class="py-2 pe-4 whitespace-nowrap">
            <ULink :to="`/keen/entries/${row.entry.id}`" :title="row.entry.created_at" class="hover:underline">
              {{ row.when }}
            </ULink>
          </td>
          <td class="py-2 pe-4">
            <code>{{ row.entry.action }}</code>
            <UBadge v-if="row.entry.source === KEEN_APP_SOURCE" color="info" variant="subtle" size="sm" class="ms-2">
              {{ t('keen.entries.app_badge') }}
            </UBadge>
          </td>
          <td v-if="!withoutSubject" class="py-2 pe-4">{{ row.subject }}</td>
          <td class="py-2 pe-4">{{ row.actor }}</td>
          <td class="py-2">
            <UBadge color="neutral" variant="subtle" size="sm">{{ row.entry.surface }}</UBadge>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
