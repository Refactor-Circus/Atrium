import type { components, operations } from '../../client/schema'
import { AtriumIntegrationError } from '@refactor-circus/atrium'

/*
 * Shared pieces of Keen's audit screens: the entry and package shapes Keen's
 * API answers with, the `keen.entries.index` filters the screens send, and
 * how a change renders. The Keen hooks (the `keen.history` section and the
 * `keen.activity` tab) use them too.
 */

/** One audit entry (`AuditEntryResource`). */
export type KeenAuditEntry = components['schemas']['AuditEntryResource']

/** One package whose history the caller may read (`keen.packages.index`). */
export type KeenAuditedPackage = components['schemas']['AuditedPackageResource']

/** The query `keen.entries.index` takes. */
export type KeenEntriesQuery = NonNullable<operations['keen.entries.index']['parameters']['query']>

/** A page of `keen.entries.index`. */
export type KeenEntriesPage = operations['keen.entries.index']['responses'][200]['content']['application/json']

/** The filters the audit screens offer, in the order they show. */
export const KEEN_FILTERS = ['source', 'action', 'subject_type', 'subject_id', 'actor_type', 'actor_id', 'since', 'until'] as const

export type KeenFilter = typeof KEEN_FILTERS[number]

/** The source of the application's own entries, as Keen records it. */
export const KEEN_APP_SOURCE = 'app'

/**
 * The `keen.entries.index` query in a route query: each filter and the
 * cursor, when set to a non-empty string.
 */
export function entriesQuery(query: Record<string, unknown>): KeenEntriesQuery {
  const result: KeenEntriesQuery = {}

  for (const name of [...KEEN_FILTERS, 'cursor'] as const) {
    const value = query[name]

    if (typeof value === 'string' && value !== '') {
      result[name] = value
    }
  }

  return result
}

/**
 * A changed value as Keen's v1 `audit.changes` component showed it, which
 * was PHP's `var_export()` for scalars and null, and JSON for the rest:
 * `'draft'`, `12`, `true`, `NULL`, `{"a":1}`.
 */
export function formatChange(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value)
}

/**
 * An entry's field changes as rows: each field with its old and new value,
 * from Keen's `field => [old, new]`.
 */
export function changeRows(changes: Record<string, unknown> | null | undefined): { field: string, before: string, after: string }[] {
  return Object.entries(changes ?? {}).map(([field, change]) => {
    const [before, after] = Array.isArray(change) ? change : [null, change]

    return { field, before: formatChange(before), after: formatChange(after) }
  })
}

/** The field errors of a 422 from Keen's API, by field; none for any other failure. */
export function fieldErrors(error: unknown): Record<string, string[]> {
  if (!(error instanceof AtriumIntegrationError) || error.status !== 422) {
    return {}
  }

  const errors = (error.body as { errors?: unknown } | null | undefined)?.errors

  return typeof errors === 'object' && errors !== null ? errors as Record<string, string[]> : {}
}
