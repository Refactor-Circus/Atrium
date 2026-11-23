<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import {
  GLOBAL_SCOPE,
  OTHER_SCOPE,
  loosely,
  pennantPlusData,
  usePennantPlus,
  usePennantPlusAction,
  type PennantPlusScopeModel,
  type PennantPlusScopeType,
  type PennantPlusScopeTypeName
} from './pennantplus'

/**
 * v1's "Set a value" card: a feature (any name, with the known ones offered),
 * a scope, and a JSON value, stored through `values.update`.
 *
 * The scope is the global one, a record of a configured scope model (searched
 * through `scopes.models` and picked), or any other string. The value is typed
 * as JSON and sent decoded, as PennantPlus stores it. A 422 shows its field
 * errors; a 403 is passed up, so the screen hides every control.
 */
const props = defineProps<{
  scopeTypes: PennantPlusScopeType[]
  /** The id of the datalist offering the known features */
  featureList: string
}>()

const emit = defineEmits<{ saved: [], forbidden: [] }>()

const { t } = useI18n()
const client = usePennantPlus()
const action = usePennantPlusAction()

const feature = ref('')
const scopeType = ref(GLOBAL_SCOPE)
const scopeString = ref('')
const query = ref('')
const results = shallowRef<PennantPlusScopeModel[]>([])
const searched = ref(false)
const picked = shallowRef<PennantPlusScopeModel | null>(null)
const value = ref('true')
const jsonError = ref<string | null>(null)

/** Global, the configured models (whose records can be searched) and other strings. */
const scopes = computed(() => props.scopeTypes.filter(type => type.type === GLOBAL_SCOPE || type.type === OTHER_SCOPE || type.searchable))
const isModel = computed(() => scopeType.value !== GLOBAL_SCOPE && scopeType.value !== OTHER_SCOPE)

/** A scope id error with no id field to show it under goes under the scope. */
const scopeError = computed(() => action.error('scope_type') ?? action.error('scope') ?? (scopeType.value === GLOBAL_SCOPE ? action.error('scope_id') : undefined))

watch(() => action.forbidden.value, (forbidden) => {
  if (forbidden) {
    emit('forbidden')
  }
})

function clear(): void {
  scopeString.value = ''
  query.value = ''
  results.value = []
  searched.value = false
  picked.value = null
}

async function search(): Promise<void> {
  const term = query.value.trim()

  if (!client || term === '' || !isModel.value) {
    results.value = []
    searched.value = false
    return
  }

  const type = scopeType.value

  try {
    const found = pennantPlusData<{ data: PennantPlusScopeModel[] }>(await client.GET('/scopes/{type}/models', {
      params: { path: { type }, query: { type, q: term } }
    }))

    results.value = found.data
  } catch (error) {
    results.value = []

    if (atriumStatus(error) === 403) {
      emit('forbidden')
    }
  }

  searched.value = true
}

const searchSoon = useDebounceFn(search, 250)

function pick(model: PennantPlusScopeModel): void {
  picked.value = model
  results.value = []
  searched.value = false
}

async function submit(): Promise<void> {
  jsonError.value = null

  let decoded: unknown

  try {
    decoded = JSON.parse(value.value)
  } catch {
    jsonError.value = t('pennantplus.features.invalid_json')
    return
  }

  const scopeId = scopeType.value === OTHER_SCOPE ? scopeString.value : isModel.value ? picked.value?.id : undefined

  const saved = await action.run(async () => pennantPlusData(await client!.PUT('/values', {
    body: {
      feature: feature.value,
      scope_type: loosely<PennantPlusScopeTypeName>(scopeType.value),
      ...(scopeId === undefined ? {} : { scope_id: scopeId }),
      value: loosely<string>(decoded)
    }
  })))

  if (saved) {
    feature.value = ''
    scopeType.value = GLOBAL_SCOPE
    value.value = 'true'
    clear()
    emit('saved')
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-medium">{{ t('pennantplus.features.set_value') }}</h3>
    </template>

    <form class="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="pennantplus-set-value" @submit.prevent="submit">
      <UFormField :label="t('pennantplus.features.feature')" :error="action.error('feature')" required>
        <UInput v-model="feature" :list="featureList" autocomplete="off" class="w-full" data-testid="pennantplus-feature" />
      </UFormField>

      <UFormField :label="t('pennantplus.features.scope')" :error="scopeError">
        <select
          v-model="scopeType"
          class="w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm"
          data-testid="pennantplus-scope-type"
          @change="clear"
        >
          <option v-for="scope in scopes" :key="scope.type" :value="scope.type">{{ scope.label }}</option>
        </select>
      </UFormField>

      <div v-if="scopeType === GLOBAL_SCOPE" />

      <UFormField v-else-if="scopeType === OTHER_SCOPE" :label="t('pennantplus.features.scope_string')" :error="action.error('scope_id')">
        <UInput v-model="scopeString" class="w-full" data-testid="pennantplus-scope-string" />
      </UFormField>

      <UFormField v-else :label="t('pennantplus.features.find_model')" :error="action.error('scope_id')">
        <div v-if="picked" class="flex items-center justify-between gap-2 rounded-md border border-default px-3 py-1.5 text-sm">
          <span data-testid="pennantplus-scope-picked">{{ picked.title }} (#{{ picked.id }})</span>
          <UButton size="xs" color="neutral" variant="ghost" :label="t('pennantplus.features.clear')" @click="clear" />
        </div>
        <div v-else class="relative">
          <UInput
            v-model="query"
            autocomplete="off"
            icon="i-lucide-search"
            :placeholder="t('pennantplus.features.find_model_placeholder')"
            class="w-full"
            data-testid="pennantplus-scope-search"
            @update:model-value="searchSoon"
          />
          <ul
            v-if="searched"
            class="absolute top-full z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-md border border-default bg-default p-1 text-sm shadow-lg"
          >
            <li v-for="model in results" :key="model.id">
              <button
                type="button"
                class="flex w-full cursor-pointer justify-between gap-3 rounded px-2 py-1.5 text-left hover:bg-elevated"
                data-testid="pennantplus-scope-result"
                @click="pick(model)"
              >
                <span>{{ model.title }}</span>
                <span class="text-muted">#{{ model.id }}</span>
              </button>
            </li>
            <li v-if="results.length === 0" class="px-3 py-1.5 text-muted">{{ t('pennantplus.features.no_models') }}</li>
          </ul>
        </div>
      </UFormField>

      <UFormField
        :label="t('pennantplus.features.value')"
        :hint="t('pennantplus.features.value_hint')"
        :error="jsonError ?? action.error('value')"
        required
      >
        <UInput v-model="value" class="w-full font-mono" data-testid="pennantplus-value" />
      </UFormField>

      <div class="flex items-end sm:pt-6">
        <UButton type="submit" icon="i-lucide-check" :label="t('pennantplus.features.save')" :loading="action.busy.value" data-testid="pennantplus-save" />
      </div>
    </form>

    <p v-if="action.message.value" class="mt-3 text-sm text-error" role="alert">{{ action.message.value }}</p>
  </UCard>
</template>
