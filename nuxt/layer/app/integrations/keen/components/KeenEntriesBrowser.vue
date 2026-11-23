<script setup lang="ts">
import type { LocationQueryRaw } from 'vue-router'
import { integrationData, useAtriumIntegration } from '../../../composables/useAtriumIntegration'
import KeenEntriesTable from './KeenEntriesTable.vue'
import { entriesQuery, fieldErrors, KEEN_FILTERS, type KeenAuditEntry, type KeenEntriesPage, type KeenFilter } from './entries'

/**
 * Keen's audit log, a cursor page at a time (`keen.entries.index`), with the
 * filters of the v1 screens: source, action, record, actor and dates. The
 * filters and the cursor live in the route query, so a filtered page can be
 * linked and the browser's back button works.
 *
 * With `source` set (one package's history) the source is fixed and its
 * filter hidden. A 403 shows <AtriumNoAccess>; a 422 shows the field errors
 * under the filters.
 */
const props = defineProps<{
  /** Fixes the source: one package's history */
  source?: string | null
  /** The source filter's choices; the application's own `app` is added */
  sources?: readonly { value: string, label: string }[]
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { client } = useAtriumIntegration('keen')

/** The source choice that means every source; Reka's select needs a non-empty value. */
const ALL_SOURCES = '*'

const LABELS: Record<KeenFilter, string> = {
  source: t('keen.filters.source'),
  action: t('keen.filters.action'),
  subject_type: t('keen.filters.subject_type'),
  subject_id: t('keen.filters.subject_id'),
  actor_type: t('keen.filters.actor_type'),
  actor_id: t('keen.filters.actor_id'),
  since: t('keen.filters.since'),
  until: t('keen.filters.until')
}

const TEXT_FILTERS = KEEN_FILTERS.filter(name => name !== 'source')

const query = computed(() => {
  const value = entriesQuery(route.query)

  if (props.source) {
    value.source = props.source
  }

  return value
})

const form = reactive<Record<KeenFilter, string>>(Object.fromEntries(KEEN_FILTERS.map(name => [name, ''])) as Record<KeenFilter, string>)

watch(query, (value) => {
  for (const name of KEEN_FILTERS) {
    form[name] = value[name] ?? ''
  }
}, { immediate: true })

const sourceItems = computed(() => [
  { value: ALL_SOURCES, label: t('keen.filters.all_sources') },
  ...(props.sources ?? []),
  { value: 'app', label: t('keen.filters.source_app') }
])

const sourceChoice = computed({
  get: () => form.source === '' ? ALL_SOURCES : form.source,
  set: (value: string) => {
    form.source = value === ALL_SOURCES ? '' : value
  }
})

const entries = shallowRef<KeenAuditEntry[]>([])
const meta = shallowRef<KeenEntriesPage['meta'] | null>(null)
const error = shallowRef<unknown>(null)
const pending = ref(false)

const forbidden = computed(() => atriumStatus(error.value) === 403)
const errors = computed(() => fieldErrors(error.value))
const failed = computed(() => error.value !== null && !forbidden.value && Object.keys(errors.value).length === 0)

async function load(): Promise<void> {
  if (!client) {
    return
  }

  pending.value = true
  error.value = null

  try {
    const page = integrationData(await client.GET('/entries', { params: { query: query.value } }))

    entries.value = page.data
    meta.value = page.meta
  } catch (e) {
    error.value = e
    entries.value = []
    meta.value = null
  } finally {
    pending.value = false
  }
}

watch(() => JSON.stringify(query.value), () => void load(), { immediate: true })

/** The route query without the filters and cursor: the open tab and the like. */
function others(): LocationQueryRaw {
  const rest: LocationQueryRaw = { ...route.query }

  for (const name of [...KEEN_FILTERS, 'cursor']) {
    delete rest[name]
  }

  return rest
}

function apply(): void {
  const filters: Record<string, string> = {}

  for (const name of KEEN_FILTERS) {
    if (form[name] !== '' && !(name === 'source' && props.source)) {
      filters[name] = form[name]
    }
  }

  void router.replace({ query: { ...others(), ...filters } })
}

function clear(): void {
  void router.replace({ query: others() })
}

function page(cursor: string | null): void {
  const rest: LocationQueryRaw = { ...route.query }

  delete rest.cursor

  void router.replace({ query: cursor ? { ...rest, cursor } : rest })
}

defineExpose({ reload: load })
</script>

<template>
  <AtriumNoAccess v-if="forbidden" />
  <div v-else class="space-y-4">
    <UCard>
      <form class="flex flex-wrap items-start gap-3" data-testid="keen-filters" @submit.prevent="apply">
        <UFormField v-if="!source" :label="LABELS.source" name="source" :error="errors.source?.[0]" class="w-44">
          <USelect v-model="sourceChoice" :items="sourceItems" class="w-full" data-testid="keen-filter-source" />
        </UFormField>
        <UFormField
          v-for="name in TEXT_FILTERS"
          :key="name"
          :label="LABELS[name]"
          :name="name"
          :hint="name === 'action' ? t('keen.filters.action_hint') : undefined"
          :error="errors[name]?.[0]"
          :class="name === 'action' ? 'w-56' : 'w-44'"
        >
          <UInput
            v-model="form[name]"
            :type="name === 'since' || name === 'until' ? 'date' : 'text'"
            class="w-full"
            :data-testid="`keen-filter-${name}`"
          />
        </UFormField>
        <div class="flex gap-2 self-end">
          <UButton type="submit" icon="i-lucide-funnel" data-testid="keen-filter-apply">{{ t('keen.filters.apply') }}</UButton>
          <UButton type="button" icon="i-lucide-x" color="neutral" variant="ghost" data-testid="keen-filter-clear" @click="clear">
            {{ t('keen.filters.clear') }}
          </UButton>
        </div>
      </form>
    </UCard>

    <UAlert v-if="failed" color="error" :title="t('keen.entries.load_failed')" data-testid="keen-entries-failed" />
    <USkeleton v-else-if="pending && entries.length === 0" class="h-32" />
    <UCard v-else>
      <KeenEntriesTable :entries="entries" />
    </UCard>

    <nav
      v-if="meta && (query.cursor || meta.next_cursor)"
      class="flex items-center justify-end gap-2"
      :aria-label="t('keen.entries.pagination')"
      data-testid="keen-pages"
    >
      <UButton v-if="query.cursor" color="neutral" variant="outline" size="sm" data-testid="keen-page-newest" @click="page(null)">
        {{ t('keen.entries.newest') }}
      </UButton>
      <UButton v-if="query.cursor && meta.prev_cursor" color="neutral" variant="outline" size="sm" data-testid="keen-page-newer" @click="page(meta.prev_cursor)">
        {{ t('keen.entries.newer') }}
      </UButton>
      <UButton v-if="meta.next_cursor" color="neutral" variant="outline" size="sm" data-testid="keen-page-older" @click="page(meta.next_cursor)">
        {{ t('keen.entries.older') }}
      </UButton>
    </nav>
  </div>
</template>
