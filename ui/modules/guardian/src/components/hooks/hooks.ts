/*
 * What the cross-package hooks read from their extension's static `data`
 * (sent by Atrium's `src/Integrations/Hooks`) and its `record` (the record
 * key the screen passes, or a row's id in a row slot).
 */

/** A record key as a non-empty string, or null. */
export function recordKey(record: unknown): string | null {
  if (typeof record === 'number' && Number.isFinite(record)) {
    return String(record)
  }

  return typeof record === 'string' && record !== '' ? record : null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

/**
 * The owner of the redirect domains: the screen's record, typed by the
 * `owner_type` Atrium sends. Null without either.
 */
/** The page of one Impex run, for the run link. Null without a run id. */
/**
 * The `keen.entries.index` query of the `keen.history` section: the
 * package's history (`source`), narrowed to the record on a detail screen,
 * whose `subject_type` Atrium sends and whose key is the record. A list
 * screen sends `source` only. Null without a source.
 */
/**
 * The `keen.entries.index` query of the `keen.activity` tab: with `scope`,
 * everything recorded within the record (`scope_type`/`scope_id`), and
 * otherwise the record's own history (`subject_type`/`subject_id`). Null
 * without a source, a record type or a record.
 */
/**
 * What the `guardian.access` hook lists (AC 98): in the scope the record is,
 * when Atrium sends that scope's `scope_type`; else the record's own
 * assignments, as a user. Null without a record.
 */
export function guardianAccessOf(data: Record<string, unknown>, record: unknown): { scopeType: string, scopeId: string } | { user: string } | null {
  const key = recordKey(record)

  if (key === null) {
    return null
  }

  const scopeType = text(data.scope_type)

  return scopeType === null ? { user: key } : { scopeType, scopeId: key }
}
