<script setup lang="ts">
import { atriumStatus } from '@refactor-circus/atrium'
import { integrationData, useAtriumIntegration } from '@refactor-circus/atrium'
import KeenEntriesTable from '../KeenEntriesTable.vue'
import type { KeenAuditEntry, KeenEntriesQuery } from '../entries'
import { KEEN_HOOK_LIMIT } from './hooks'

/**
 * The newest entries of one Keen history, as v1's `x-keen::audit-trail`
 * showed them on other packages' screens: Keen's entries table, and a link to
 * the package's full history when there are more.
 *
 * It first asks `keen.packages.index` whether the source is a package the
 * viewer may read, then lists `keen.entries.index` with `query`. It renders
 * nothing for a package Keen does not list, or when either request answers
 * 403, so a screen can carry it unconditionally (AC 67).
 */
const props = defineProps<{
  /** The `keen.entries.index` filters; nothing renders without them */
  query: KeenEntriesQuery | null
  /** One record's history: its column is left out */
  withoutSubject?: boolean
  /** Whether the full-history link may carry the query (the history page has no scope filter) */
  linkable?: boolean
}>()

const { t } = useI18n()
const { client } = useAtriumIntegration('keen')

/** What there is to show: entries, nothing at all, or a failure. */
const state = ref<'loading' | 'hidden' | 'failed' | 'ready'>('loading')
const entries = shallowRef<KeenAuditEntry[]>([])
const more = ref(false)

async function load(): Promise<void> {
  const query = props.query

  if (!client || !query?.source) {
    state.value = 'hidden'
    return
  }

  state.value = 'loading'

  try {
    const packages = integrationData(await client.GET('/packages')).data

    if (!packages.some(pkg => pkg.key === query.source)) {
      state.value = 'hidden'
      return
    }

    const page = integrationData(await client.GET('/entries', { params: { query: { ...query, per_page: KEEN_HOOK_LIMIT } } }))

    entries.value = page.data
    more.value = page.meta.next_cursor !== null
    state.value = 'ready'
  } catch (error) {
    state.value = atriumStatus(error) === 403 ? 'hidden' : 'failed'
  }
}

watch(() => JSON.stringify(props.query), () => void load(), { immediate: true })

/** The package's history page, filtered to this record when it can be. */
const historyLink = computed(() => {
  const query = props.query

  if (!query?.source) {
    return null
  }

  const filters = props.linkable && query.subject_type && query.subject_id
    ? { subject_type: query.subject_type, subject_id: query.subject_id }
    : {}

  return { path: `/keen/history/${encodeURIComponent(query.source)}`, query: filters }
})
</script>

<template>
  <UCard v-if="state !== 'hidden'" data-testid="hooks-keen-entries">
    <template #header>
      <h3 class="font-medium">{{ t('hooks.keen.history') }}</h3>
    </template>

    <USkeleton v-if="state === 'loading'" class="h-16" />
    <p v-else-if="state === 'failed'" class="text-sm text-error" data-testid="hooks-keen-failed">{{ t('hooks.keen.load_failed') }}</p>
    <KeenEntriesTable v-else :entries="entries" :without-subject="withoutSubject" />

    <template v-if="state === 'ready' && more && historyLink" #footer>
      <ULink :to="historyLink" class="text-sm hover:underline" data-testid="hooks-keen-view-all">{{ t('hooks.keen.view_all') }}</ULink>
    </template>
  </UCard>
</template>
