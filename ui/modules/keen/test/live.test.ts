import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { historyChildren, historyOptions, keenHistory } from '../src/components/history'
import type { AtriumLiveResult, AtriumNavItem, AtriumNavSection } from '@refactor-circus/atrium'
import { withSetup } from '@refactor-circus/atrium/testing'
import { integrationEntry, integrationShell, mockPackageApi, reply, resetPackageApis, useShell } from '@refactor-circus/atrium/testing'
import { useAtrium } from '@refactor-circus/atrium'

/*
 * The `keen.history` live resolver (AC 64): the History nav item's children,
 * a link to `/keen/history/:key` for each package `keen.packages.index`
 * lists, minus `nav.exclude`, grouped under `nav.groups` and ordered by
 * label.
 */

const packages = [
  { key: 'showroom', label: 'Showroom' },
  { key: 'roster', label: 'Roster' },
  { key: 'atrium', label: 'Atrium' },
  { key: 'pennantplus', label: 'PennantPlus' },
  { key: 'impex', label: 'Impex' }
]

const sections: AtriumNavSection[] = [{
  key: 'group-showroom',
  label: 'Catalog',
  icon: null,
  grouped: true,
  link: null,
  items: []
}]

/** Labels and links of `items`, nested. */
function outline(items: readonly AtriumNavItem[]): unknown[] {
  return items.map(item => item.children.length > 0
    ? { label: item.label, children: outline(item.children) }
    : { label: item.label, path: item.link?.path ?? null })
}

/** Runs the resolver in the app, and settles it, so a rejection is caught here. */
async function resolveHistory(options: Record<string, unknown>): Promise<{ result?: AtriumLiveResult, error?: unknown }> {
  return withSetup(() => keenHistory(options).then(result => ({ result }), (error: unknown) => ({ error })))
}

describe('the keen.history live resolver', () => {
  beforeEach(async () => {
    await useShell(integrationShell([integrationEntry('keen')], { navigation: structuredClone(sections) }))
  })

  afterEach(() => {
    resetPackageApis()
  })

  it('is registered by the Keen integration', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.liveResolvers.get('keen.history')).toBe(keenHistory)
  })

  it('lists every package from keen.packages.index, linking to its history, ordered by label', async () => {
    const calls = mockPackageApi('keen', { 'GET /packages': { data: packages } })

    const { result } = await resolveHistory({ exclude: [], groups: {}, sort: 90 })

    expect(calls.length).toBeGreaterThan(0)
    expect(calls.every(call => call.method === 'GET' && call.path === '/packages')).toBe(true)
    expect(outline(result?.children ?? [])).toEqual([
      { label: 'Atrium', path: '/keen/history/atrium' },
      { label: 'Impex', path: '/keen/history/impex' },
      { label: 'PennantPlus', path: '/keen/history/pennantplus' },
      { label: 'Roster', path: '/keen/history/roster' },
      { label: 'Showroom', path: '/keen/history/showroom' }
    ])
    expect(result?.badge).toBeUndefined()
  })

  it('leaves out the excluded packages', async () => {
    mockPackageApi('keen', { 'GET /packages': { data: packages } })

    const { result } = await resolveHistory({ exclude: ['atrium', 'roster'], groups: {}, sort: 90 })

    expect((result?.children ?? []).map(item => item.label)).toEqual(['Impex', 'PennantPlus', 'Showroom'])
  })

  it('groups packages under the Atrium nav group each names, by the group\'s label', async () => {
    mockPackageApi('keen', { 'GET /packages': { data: packages } })

    const { result } = await resolveHistory({
      exclude: ['atrium'],
      groups: { showroom: 'showroom', pennantplus: 'showroom', impex: 'operations' },
      sort: 90
    })

    expect(outline(result?.children ?? [])).toEqual([
      { label: 'Catalog', children: [
        { label: 'PennantPlus', path: '/keen/history/pennantplus' },
        { label: 'Showroom', path: '/keen/history/showroom' }
      ] },
      { label: 'operations', children: [{ label: 'Impex', path: '/keen/history/impex' }] },
      { label: 'Roster', path: '/keen/history/roster' }
    ])
  })

  it('rejects when Keen\'s API fails, so the navigation keeps the item as sent', async () => {
    mockPackageApi('keen', { 'GET /packages': reply(500) })

    const { result, error } = await resolveHistory({ exclude: [], groups: {}, sort: 90 })

    expect(result).toBeUndefined()
    expect(error).toMatchObject({ status: 500 })
  })

  it('rejects on a 403', async () => {
    mockPackageApi('keen', { 'GET /packages': reply(403) })

    const { error } = await resolveHistory({ exclude: [], groups: {}, sort: 90 })

    expect(error).toMatchObject({ status: 403 })
  })
})

describe('historyOptions()', () => {
  it('reads the nav settings from the item\'s live options', () => {
    expect(historyOptions({ exclude: ['atrium'], groups: { showroom: 'showroom' }, sort: 40 }))
      .toEqual({ exclude: ['atrium'], groups: { showroom: 'showroom' }, sort: 40 })
  })

  it('ignores anything malformed', () => {
    expect(historyOptions({ exclude: ['atrium', 5], groups: { showroom: '', impex: 3, roster: 'people' }, sort: 'soon' }))
      .toEqual({ exclude: ['atrium'], groups: { roster: 'people' }, sort: 90 })
    expect(historyOptions({})).toEqual({ exclude: [], groups: {}, sort: 90 })
    expect(historyOptions({ groups: ['showroom'] })).toEqual({ exclude: [], groups: {}, sort: 90 })
  })
})

describe('historyChildren()', () => {
  it('sorts packages and groups together, case-insensitively', () => {
    const children = historyChildren(
      [{ key: 'b', label: 'beta' }, { key: 'a', label: 'Alpha' }, { key: 'c', label: 'Gamma' }],
      { exclude: [], groups: { c: 'Extras' }, sort: 90 }
    )

    expect(children.map(item => item.label)).toEqual(['Alpha', 'beta', 'Extras'])
    expect(children[2]!.link).toBeNull()
  })

  it('encodes the package key in the link', () => {
    const [child] = historyChildren([{ key: 'acme/blog', label: 'Blog' }], { exclude: [], groups: {}, sort: 90 })

    expect(child!.link).toEqual({ path: '/keen/history/acme%2Fblog', external: false })
  })
})
