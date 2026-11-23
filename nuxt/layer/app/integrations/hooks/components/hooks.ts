import type { KeenEntriesQuery } from '../../keen/components/entries'

/*
 * What the cross-package hooks read from their extension's static `data`
 * (sent by Atrium's `src/Integrations/Hooks`) and its `record` (the record
 * key the screen passes, or a row's id in a row slot).
 */

/** How many entries a Keen hook shows, as v1's audit trail did. */
export const KEEN_HOOK_LIMIT = 20

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
export function ownerOf(data: Record<string, unknown>, record: unknown): { type: string, id: string } | null {
  const type = text(data.owner_type)
  const id = recordKey(record)

  return type && id ? { type, id } : null
}

/** The page of one Impex run, for the run link. Null without a run id. */
export function runLinkPath(record: unknown): string | null {
  const id = recordKey(record)

  return id === null ? null : `/impex/runs/${encodeURIComponent(id)}`
}

/**
 * The `keen.entries.index` query of the `keen.history` section: the
 * package's history (`source`), narrowed to the record on a detail screen,
 * whose `subject_type` Atrium sends and whose key is the record. A list
 * screen sends `source` only. Null without a source.
 */
export function historyQuery(data: Record<string, unknown>, record: unknown): KeenEntriesQuery | null {
  const source = text(data.source)

  if (source === null) {
    return null
  }

  const subjectType = text(data.subject_type)
  const subjectId = recordKey(record)

  return subjectType && subjectId
    ? { source, subject_type: subjectType, subject_id: subjectId }
    : { source }
}

/**
 * The `keen.entries.index` query of the `keen.activity` tab: with `scope`,
 * everything recorded within the record (`scope_type`/`scope_id`), and
 * otherwise the record's own history (`subject_type`/`subject_id`). Null
 * without a source, a record type or a record.
 */
export function activityQuery(data: Record<string, unknown>, record: unknown): KeenEntriesQuery | null {
  const source = text(data.source)
  const type = text(data.subject_type)
  const id = recordKey(record)

  if (source === null || type === null || id === null) {
    return null
  }

  return data.scope === false
    ? { source, subject_type: type, subject_id: id }
    : { source, scope_type: type, scope_id: id }
}
