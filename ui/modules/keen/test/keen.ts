import type { components } from '../client/schema'
import type { KeenAuditEntry, KeenAuditedPackage, KeenEntriesPage } from '../src/components/entries'
import type { AtriumIntegrationScreenData } from '@refactor-circus/atrium'

/*
 * Payloads for the Keen suites, typed against the vendored Keen schema
 * (`app/integrations/keen/client/schema.d.ts`), and the `atrium.screens.show`
 * answer each Keen page asks for.
 */

/** One audit entry, as `keen.entries.index` and `keen.entries.show` send it. */
export function keenEntry(overrides: Partial<KeenAuditEntry> = {}): KeenAuditEntry {
  return {
    id: 5,
    source: 'impex',
    action: 'run.cancelled',
    actor: { type: 'user', id: '1', label: 'Ada' },
    subject: { type: 'impex.run', id: '12', label: 'Run 12' },
    scope: null,
    surface: 'http',
    changes: { status: ['running', 'cancelled'] },
    context: {},
    hash: 'f3b2c1',
    created_at: '2026-11-20T10:00:00Z',
    ...overrides
  } satisfies components['schemas']['AuditEntryResource']
}

/** A cursor page of `keen.entries.index`. */
export function keenPage(entries: KeenAuditEntry[], next: string | null = null, prev: string | null = null): KeenEntriesPage {
  return {
    data: entries,
    links: { first: null, last: null, prev: prev ? `?cursor=${prev}` : null, next: next ? `?cursor=${next}` : null },
    meta: { path: '/keen/api/entries', per_page: 25, next_cursor: next, prev_cursor: prev }
  } satisfies KeenEntriesPage
}

/** The packages `keen.packages.index` lists. */
export const keenPackages = [
  { key: 'impex', label: 'Impex' },
  { key: 'roster', label: 'Roster' }
] satisfies KeenAuditedPackage[]

/** `atrium.screens.show` for a Keen screen, with no extension registered. */
export function keenScreen(key: string, kind: 'list' | 'detail', path: string, record: string | null = null): { data: AtriumIntegrationScreenData } {
  return {
    data: {
      key,
      kind,
      path,
      subject_type: null,
      record,
      open_tab: 'overview',
      tabs: [{ key: 'overview', label: 'Overview', icon: null, built_in: true, component: null }],
      sections: { 'header.actions': [], 'before': [], 'after': [], 'aside': [] },
      rows: {}
    }
  }
}

/** The Keen screen `atrium.screens.show` would answer for `path` (`/screens/keen.entry`). */
export function keenScreenFor(path: string, record: unknown): { data: AtriumIntegrationScreenData } {
  const key = decodeURIComponent(path.replace(/^\/screens\//, ''))
  const value = typeof record === 'string' ? record : null

  if (key === 'keen.entry') {
    return keenScreen(key, 'detail', '/keen/entries/:entry', value)
  }

  return keenScreen(key, 'list', key === 'keen.history' ? '/keen/history/:package' : '/keen/entries')
}
