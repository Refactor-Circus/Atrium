<script setup lang="ts">
import PennantPlusSetValue from './PennantPlusSetValue.vue'
import {
  displayValue,
  loosely,
  pennantPlusData,
  usePennantPlus,
  usePennantPlusAction,
  type PennantPlusClient,
  type PennantPlusFeature,
  type PennantPlusList,
  type PennantPlusScopeType,
  type PennantPlusValue
} from './pennantplus'

/**
 * The body of `pennantplus.features`, ported from PennantPlus v1's
 * `atrium/index.blade.php`: the stored feature flag values, filtered by
 * feature, scope and scope id and paged as `values.index` pages, with v1's
 * changes:
 *
 * - set a value (<PennantPlusSetValue>, `values.update`),
 * - switch a stored value on or off from its row (`values.update`),
 * - forget a stored value (`values.destroy`), after a confirmation,
 * - purge the feature the list is filtered to (`features.destroy`), after
 *   v1's confirmation.
 *
 * v1 showed the screen only to users who manage feature flags
 * (`pennantplus.ability`); PennantPlus's API now answers them 403, which
 * hides every control and shows <AtriumNoAccess>.
 */
interface Filters {
  feature: string
  scope: string
  scope_id: string
}

const FEATURE_LIST = 'pennantplus-feature-options'

const { t, locale } = useI18n()
const client = usePennantPlus()
const action = usePennantPlusAction()

const features = shallowRef<PennantPlusFeature[]>([])
const scopeTypes = shallowRef<PennantPlusScopeType[]>([])
const values = shallowRef<PennantPlusValue[]>([])
const page = ref(1)
const lastPage = ref(1)
/** The first load has answered: later loads keep the controls in place. */
const loaded = ref(false)
const failed = ref(false)
const refused = ref(false)
const status = ref<string | null>(null)

const filters = reactive<Filters>({ feature: '', scope: '', scope_id: '' })
/** The filters the list shows: the purge offer follows these, not what is typed. */
const applied = ref<Filters>({ feature: '', scope: '', scope_id: '' })

const forbidden = computed(() => refused.value || action.forbidden.value)

const dates = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }))

function query(): { feature?: string, scope?: string, scope_id?: string, page?: number } {
  const { feature, scope, scope_id: scopeId } = applied.value

  return {
    ...(feature === '' ? {} : { feature }),
    ...(scope === '' ? {} : { scope }),
    ...(scopeId === '' ? {} : { scope_id: scopeId }),
    ...(page.value > 1 ? { page: page.value } : {})
  }
}

async function loadLists(pennantplus: PennantPlusClient): Promise<void> {
  const [known, types] = await Promise.all([
    pennantplus.GET('/features').then(result => pennantPlusData<PennantPlusList<PennantPlusFeature>>(result)),
    pennantplus.GET('/scopes').then(result => pennantPlusData<{ data: PennantPlusScopeType[] }>(result))
  ])

  features.value = known.data
  scopeTypes.value = types.data
}

async function loadValues(pennantplus: PennantPlusClient): Promise<void> {
  const list = pennantPlusData<PennantPlusList<PennantPlusValue>>(await pennantplus.GET('/values', { params: { query: query() } }))

  values.value = list.data
  page.value = list.meta?.current_page ?? page.value
  lastPage.value = list.meta?.last_page ?? 1
}

/** Loads the values, and the features and scope types too unless `valuesOnly`. */
async function load(valuesOnly = false): Promise<void> {
  if (!client) {
    // The route middleware shows the integration as unavailable instead.
    loaded.value = true
    return
  }

  try {
    await Promise.all([valuesOnly ? null : loadLists(client), loadValues(client)])
    failed.value = false
  } catch (error) {
    refused.value = atriumStatus(error) === 403
    failed.value = !refused.value
  } finally {
    loaded.value = true
  }
}

async function applyFilters(): Promise<void> {
  applied.value = { ...filters }
  page.value = 1
  await load(true)
}

async function resetFilters(): Promise<void> {
  Object.assign(filters, { feature: '', scope: '', scope_id: '' })
  await applyFilters()
}

async function goTo(target: number): Promise<void> {
  page.value = target
  await load(true)
}

/** Runs a change; on success shows `done` and reloads (everything, or just the values). */
async function change(run: (pennantplus: PennantPlusClient) => Promise<unknown>, done: string, valuesOnly = true): Promise<boolean> {
  status.value = null

  if (!client || !await action.run(() => run(client))) {
    return false
  }

  status.value = done
  await load(valuesOnly)

  return true
}

async function toggle(value: PennantPlusValue): Promise<void> {
  await change(async pennantplus => pennantPlusData(await pennantplus.PUT('/values', {
    body: { feature: value.feature, scope: value.scope, value: loosely<string>(!value.active) }
  })), t('pennantplus.features.value_saved'))
}

async function forget(value: PennantPlusValue): Promise<void> {
  if (!window.confirm(t('pennantplus.features.forget_confirm'))) {
    return
  }

  await change(async pennantplus => pennantPlusData(await pennantplus.DELETE('/values', {
    params: { query: { feature: value.feature, scope: value.scope } }
  })), t('pennantplus.features.value_forgotten'))
}

async function purge(): Promise<void> {
  const feature = applied.value.feature

  if (feature === '' || !window.confirm(t('pennantplus.features.purge_confirm'))) {
    return
  }

  const purged = await action.run(async () => pennantPlusData(await client!.DELETE('/features/{feature}', {
    params: { path: { feature }, query: { feature } }
  })))

  if (purged) {
    filters.feature = ''
    applied.value = { ...applied.value, feature: '' }
    page.value = 1
    status.value = t('pennantplus.features.feature_purged')
    await load()
  }
}

async function saved(): Promise<void> {
  status.value = t('pennantplus.features.value_saved')
  await load()
}

function updated(at: string | null): string {
  return at === null ? '' : dates.value.format(new Date(at))
}

void load()
</script>

<template>
  <div class="flex flex-col gap-5" data-testid="pennantplus-features">
    <AtriumNoAccess v-if="forbidden" />

    <USkeleton v-else-if="!loaded" class="h-32" />

    <div v-else-if="failed" class="flex items-center justify-between gap-3 rounded-md border border-default p-4 text-sm" role="alert" data-testid="pennantplus-load-error">
      <span>{{ t('pennantplus.features.load_failed') }}</span>
      <UButton size="sm" variant="outline" icon="i-lucide-refresh-cw" :label="t('pennantplus.features.retry')" @click="load()" />
    </div>

    <template v-else>
      <datalist :id="FEATURE_LIST" :data-testid="FEATURE_LIST">
        <option v-for="feature in features" :key="feature.name" :value="feature.name" />
      </datalist>

      <UAlert v-if="status" color="success" variant="subtle" icon="i-lucide-check" :title="status" data-testid="pennantplus-status" />
      <UAlert v-if="action.message.value" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="action.message.value" />

      <PennantPlusSetValue :scope-types="scopeTypes" :feature-list="FEATURE_LIST" @saved="saved" @forbidden="action.forbidden.value = true" />

      <form class="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="pennantplus-filters" @submit.prevent="applyFilters">
        <UFormField :label="t('pennantplus.features.feature')">
          <UInput
            v-model="filters.feature"
            :list="FEATURE_LIST"
            :placeholder="t('pennantplus.features.all_features')"
            autocomplete="off"
            class="w-full"
            data-testid="pennantplus-filter-feature"
          />
        </UFormField>
        <UFormField :label="t('pennantplus.features.scope')">
          <select v-model="filters.scope" class="w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="pennantplus-filter-scope">
            <option value="">{{ t('pennantplus.features.all_scopes') }}</option>
            <option v-for="scope in scopeTypes" :key="scope.type" :value="scope.type">{{ scope.label }}</option>
          </select>
        </UFormField>
        <UFormField :label="t('pennantplus.features.scope_id')">
          <UInput v-model="filters.scope_id" class="w-full" data-testid="pennantplus-filter-scope-id" />
        </UFormField>
        <div class="flex gap-2">
          <UButton type="submit" variant="outline" icon="i-lucide-funnel" :label="t('pennantplus.features.filter')" data-testid="pennantplus-filter" />
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" :label="t('pennantplus.features.reset')" data-testid="pennantplus-reset" @click="resetFilters" />
        </div>
      </form>

      <p v-if="values.length === 0" class="atrium-empty" data-testid="pennantplus-no-values">
        {{ t('pennantplus.features.no_values') }}
      </p>

      <div v-else class="overflow-x-auto rounded-md border border-default">
        <table class="w-full text-left text-sm" data-testid="pennantplus-values">
          <thead class="bg-elevated text-muted">
            <tr>
              <th class="px-3 py-2 font-medium">{{ t('pennantplus.features.feature') }}</th>
              <th class="px-3 py-2 font-medium">{{ t('pennantplus.features.scope') }}</th>
              <th class="px-3 py-2 font-medium">{{ t('pennantplus.features.value') }}</th>
              <th class="px-3 py-2 font-medium">{{ t('pennantplus.features.updated') }}</th>
              <th class="px-3 py-2"><span class="sr-only">{{ t('pennantplus.features.actions') }}</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="value in values" :key="`${value.feature}|${value.scope}`" data-testid="pennantplus-value">
              <td class="px-3 py-2 font-medium">{{ value.feature }}</td>
              <td class="px-3 py-2">
                <span :title="value.scope">{{ value.scope_label }}</span>
                <span v-if="value.title" class="block text-xs text-muted">{{ value.title }}</span>
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <UBadge
                    :color="value.active ? 'success' : 'neutral'"
                    variant="subtle"
                    :label="value.active ? t('pennantplus.features.active') : t('pennantplus.features.inactive')"
                    :data-status="value.active ? 'active' : 'inactive'"
                    data-testid="pennantplus-value-status"
                  />
                  <code v-if="typeof value.value !== 'boolean'" class="text-xs">{{ displayValue(value.value) }}</code>
                </div>
              </td>
              <td class="px-3 py-2 text-muted">{{ updated(value.updated_at) }}</td>
              <td class="px-3 py-2">
                <div class="flex justify-end gap-2">
                  <UButton
                    size="xs"
                    variant="outline"
                    :icon="value.active ? 'i-lucide-ban' : 'i-lucide-circle-check'"
                    :label="value.active ? t('pennantplus.features.deactivate') : t('pennantplus.features.activate')"
                    :loading="action.busy.value"
                    data-testid="pennantplus-toggle"
                    @click="toggle(value)"
                  />
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-x"
                    :label="t('pennantplus.features.forget')"
                    data-testid="pennantplus-forget"
                    @click="forget(value)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="lastPage > 1" class="flex items-center justify-between gap-3 text-sm">
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-left"
          :label="t('pennantplus.features.previous')"
          :disabled="page <= 1"
          data-testid="pennantplus-prev"
          @click="goTo(page - 1)"
        />
        <span class="text-muted" data-testid="pennantplus-page">{{ t('pennantplus.features.page', { page, pages: lastPage }) }}</span>
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-chevron-right"
          :label="t('pennantplus.features.next')"
          :disabled="page >= lastPage"
          data-testid="pennantplus-next"
          @click="goTo(page + 1)"
        />
      </div>

      <div v-if="applied.feature !== ''">
        <UButton
          color="error"
          variant="outline"
          size="sm"
          icon="i-lucide-trash"
          :label="t('pennantplus.features.purge', { feature: applied.feature })"
          :loading="action.busy.value"
          data-testid="pennantplus-purge"
          @click="purge"
        />
      </div>
    </template>
  </div>
</template>
