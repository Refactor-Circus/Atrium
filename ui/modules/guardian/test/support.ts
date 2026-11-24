import { vi } from 'vitest'
import type { AtriumIntegrationScreenData } from '@refactor-circus/atrium'
import fixture from '@refactor-circus/atrium/fixtures/integrations/guardian.json'
import { settle } from '@refactor-circus/atrium/testing'
import { mountIntegration, packageCalls, type PackageCall } from '@refactor-circus/atrium/testing'

/*
 * Shared helpers of the Guardian screen suites (AC 88 to 98): the
 * `atrium.screens.show` answer, with each screen's static options as the PHP
 * integration declares them (`fixtures/integrations/guardian.json`) unless a
 * test overrides them; a page mounter; and the call filter.
 */

/** Options a test puts on a screen, by key, in place of the fixture's. */
const optionOverrides = new Map<string, Record<string, unknown>>()

/** Answers `key`'s screen with `options` until `resetGuardianPages()`. */
export function screenOptions(key: string, options: Record<string, unknown>): void {
  optionOverrides.set(key, options)
}

/** The `atrium.screens.show` answer for a Guardian screen with no extensions. */
export function guardianScreen(key: string, record: string | null = null): { data: AtriumIntegrationScreenData } {
  const declared = fixture.screens.find(screen => screen.key === key)

  return {
    data: {
      key,
      kind: (declared?.kind ?? 'list') as AtriumIntegrationScreenData['kind'],
      path: declared?.path ?? '/guardian',
      subject_type: null,
      record,
      open_tab: 'overview',
      tabs: [],
      sections: {},
      rows: {},
      options: (optionOverrides.get(key) ?? declared?.options ?? {}) as AtriumIntegrationScreenData['options']
    }
  }
}

/** A `useAtriumApi()` stand-in answering `/screens/{key}` with `guardianScreen()`. */
export function guardianScreensApi(path: string, options?: { query?: Record<string, unknown> }): Promise<unknown> {
  const match = /^\/screens\/(.+)$/.exec(path)
  const record = options?.query?.record

  return match
    ? Promise.resolve(guardianScreen(decodeURIComponent(match[1]!), typeof record === 'string' ? record : null))
    : Promise.reject(new Error(`Unexpected Atrium API call: ${path}`))
}

const mounted: { unmount: () => void }[] = []

/** Mounts a Guardian page at `route`, with Guardian active in the shell, and lets it load. */
export async function mountGuardianPage<T>(page: T, route: string) {
  const wrapper = await mountIntegration(page, 'guardian', { route })
  mounted.push(wrapper)
  await settle()

  return wrapper
}

/** Unmounts every page `mountGuardianPage()` mounted, and drops the stubbed globals and option overrides. */
export function resetGuardianPages(): void {
  for (const wrapper of mounted.splice(0)) {
    wrapper.unmount()
  }

  optionOverrides.clear()
  vi.unstubAllGlobals()
}

/** The Guardian calls with `method` to the route template `route`. */
export function guardianCalls(method: string, route: string): PackageCall[] {
  return packageCalls.filter(call => call.pkg === 'guardian' && call.method === method && call.route === route)
}

/** Answers every `window.confirm()` with `answer`. */
export function confirmWith(answer: boolean) {
  const confirm = vi.fn<(message?: string) => boolean>().mockReturnValue(answer)
  vi.stubGlobal('confirm', confirm)

  return confirm
}

/** A page of a paged list, as Laravel's paginator answers. */
export function page<T>(data: T[], current = 1, last = 1) {
  return { data, links: { first: null, last: null, prev: null, next: null }, meta: { current_page: current, last_page: last, total: data.length, from: 1, to: data.length, path: '', per_page: 50, links: [] } }
}

/** A cursor page, as Laravel's cursor paginator answers. */
export function cursorPage<T>(data: T[], next: string | null = null, prev: string | null = null) {
  return { data, links: { first: null, last: null, prev: null, next: null }, meta: { next_cursor: next, prev_cursor: prev, path: '', per_page: 50 } }
}
