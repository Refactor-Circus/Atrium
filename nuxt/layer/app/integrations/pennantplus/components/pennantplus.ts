import { ref } from 'vue'
import type { components } from '../client/schema'
import { AtriumIntegrationError, useAtriumIntegration, type AtriumIntegrationClient } from '../../../composables/useAtriumIntegration'
import { atriumStatus } from '../../../utils/atriumStatus'

/*
 * Shared pieces of the feature flags screen: the payload types, the client,
 * and a runner that turns an answer into data or a typed failure.
 *
 * The types come from the vendored `client/schema.d.ts` where it is right.
 * Scramble types some of PennantPlus's answers loosely (`features.index` and
 * `values.index` as `data: string[]`, the scope routes as `data: string`, a
 * stored value as `string`), so those are declared here as PennantPlus's
 * actions and resources build them; the gaps are PennantPlus's to fix in its
 * `schema()` declarations.
 */

type Schemas = components['schemas']

export type PennantPlusClient = AtriumIntegrationClient<'pennantplus'>

/** One stored value: `FeatureValueResource`, which the schema types right. */
export type PennantPlusValue = Schemas['FeatureValueResource']

/** The part of `FeatureResource` the screen reads: the feature's name. */
export type PennantPlusFeature = Pick<Schemas['FeatureResource'], 'name'>

/** One entry of `scopes.index` (the schema types the list as `string`). */
export interface PennantPlusScopeType {
  /** `global`, `other`, or a model's morph class */
  type: string
  label: string
  /** A configured scope model, whose records `scopes.models` searches */
  searchable: boolean
}

/** One entry of `scopes.models` (the schema types the list as `string`). */
export interface PennantPlusScopeModel {
  id: string
  title: string
  scope: string
}

/** A list, with Laravel's paginator `meta` when it pages (`values.index`). */
export interface PennantPlusList<T> {
  data: T[]
  meta?: { current_page?: number, last_page?: number, total?: number }
}

/** The scope type of the global scope, and of any other string scope. */
export const GLOBAL_SCOPE = 'global'
export const OTHER_SCOPE = 'other'

/** The `scope_type` the vendored schema enumerates from its workbench's models. */
export type PennantPlusScopeTypeName = NonNullable<Schemas['UpdateFeatureValueRequest']['scope_type']>

/**
 * The PennantPlus client, signed by the app's auth adapter; null while the
 * integration is not active (the page then shows as unavailable).
 */
export function usePennantPlus(): PennantPlusClient | null {
  return useAtriumIntegration('pennantplus').client
}

/**
 * The data of an `openapi-fetch` answer as `T`, or an `AtriumIntegrationError`
 * carrying its status and body. For the answers the vendored schema types
 * loosely, the screen names the shape PennantPlus really sends.
 */
export function pennantPlusData<T>(result: { data?: unknown, error?: unknown, response: Response }): T {
  if (!result.response.ok) {
    throw new AtriumIntegrationError(result.response.status, result.error)
  }

  return result.data as T
}

/**
 * A value the vendored schema types too narrowly, sent as PennantPlus
 * validates it: a stored value is any JSON value, and a scope type any
 * configured model's morph class.
 */
export function loosely<T>(value: unknown): T {
  return value as T
}

/**
 * Runs a mutation against PennantPlus. A 422 fills `errors` (by field), a 403
 * sets `forbidden`, and any other failure sets `message`; `run()` resolves
 * whether the mutation succeeded, so the screen reloads only then.
 */
export function usePennantPlusAction() {
  const errors = ref<Record<string, string[]>>({})
  const message = ref<string | null>(null)
  const forbidden = ref(false)
  const busy = ref(false)

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    busy.value = true
    errors.value = {}
    message.value = null

    try {
      await action()
      return true
    } catch (error) {
      const status = atriumStatus(error)
      const body = (error instanceof AtriumIntegrationError ? error.body : null) as { message?: unknown, errors?: Record<string, string[]> } | null

      if (status === 403) {
        forbidden.value = true
      } else if (status === 422 && body?.errors) {
        errors.value = body.errors
      } else {
        message.value = typeof body?.message === 'string' ? body.message : error instanceof Error ? error.message : String(error)
      }

      return false
    } finally {
      busy.value = false
    }
  }

  /** The first error of `field`. */
  function error(field: string): string | undefined {
    return errors.value[field]?.[0]
  }

  return { errors, message, forbidden, busy, run, error }
}

/** A stored value as v1 showed it beside its status: JSON, cut at 60 characters. */
export function displayValue(value: unknown): string {
  const text = JSON.stringify(value) ?? 'null'

  return text.length > 60 ? `${text.slice(0, 57)}...` : text
}
