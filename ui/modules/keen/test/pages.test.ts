import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screens } from '../src/atrium'
import EntryPage from '../src/pages/entries/[entry].vue'
import EntriesPage from '../src/pages/entries/index.vue'
import HistoryPage from '../src/pages/history/[package].vue'
import keenFixture from '@refactor-circus/atrium/fixtures/integrations/keen.json'
import { settle } from '@refactor-circus/atrium/testing'
import { missingI18nKeys, mockPackageApi, mountIntegration, resetPackageApis } from '@refactor-circus/atrium/testing'
import { keenEntry, keenPackages, keenPage, keenScreenFor } from './keen'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * Keen's pages against the PHP declarations (AC 49, 53): every screen in
 * `fixtures/integrations/keen.json` has a layer page at its declared path,
 * each page asks `atrium.screens.show` for its key, record and tab, and
 * every string the pages use exists in `keen.en.json`.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: { query?: Record<string, unknown> }) => Promise<unknown>>()
}))

mockAtriumApi(api)

/** A Nuxt route path in the declarations' form: `/keen/entries/:entry()` is `/keen/entries/:entry`. */
const declared = (path: string) => path.replace(/\(\)/g, '')

describe('the Keen fixture', () => {
  it('declares the three Keen screens, and the index maps each to a route', () => {
    expect(keenFixture.screens.map(screen => screen.key)).toEqual(['keen.entries', 'keen.entry', 'keen.history'])
    expect(Object.keys(screens).sort()).toEqual(keenFixture.screens.map(screen => screen.key).sort())
  })

  it.each(keenFixture.screens.map((screen): [string, string] => [screen.key, screen.path]))('has a page for %s at %s', (key, path) => {
    const name = screens[key]
    const route = useRouter().getRoutes().find(candidate => candidate.name === name)

    expect(route, `${key} → ${String(name)}`).toBeDefined()
    expect(declared(route!.path)).toBe(path)
  })

  it('links the audit-log nav item to the keen.entries page', () => {
    const auditLog = keenFixture.navigation.find(item => item.label === 'Audit log')

    expect(auditLog?.link?.path).toBe(keenFixture.screens.find(screen => screen.key === 'keen.entries')?.path)
  })

  it('gives the History item the keen.history live key', () => {
    const history = keenFixture.navigation.find(item => item.label === 'History')

    expect(history?.live?.key).toBe('keen.history')
    expect(history?.live?.options).toMatchObject({ exclude: [], sort: 90 })
  })
})

describe('each Keen page asks atrium.screens.show for its screen', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(async (path, options) => keenScreenFor(path, options?.query?.record))

    mockPackageApi('keen', {
      'GET /entries': keenPage([keenEntry()]),
      'GET /entries/{entry}': { data: keenEntry() },
      'GET /packages': { data: keenPackages }
    })
  })

  afterEach(async () => {
    resetPackageApis()
    await useRouter().replace('/')
  })

  it('keen.entries, with no record', async () => {
    await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    expect(api).toHaveBeenCalledWith('/screens/keen.entries', { query: { record: undefined, tab: undefined } })
  })

  it('keen.entry, with the entry as its record', async () => {
    await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/5' })
    await settle()

    expect(api).toHaveBeenCalledWith('/screens/keen.entry', { query: { record: '5', tab: undefined } })
  })

  it('keen.history, with no record', async () => {
    await mountIntegration(HistoryPage, 'keen', { route: '/keen/history/impex' })
    await settle()

    expect(api).toHaveBeenCalledWith('/screens/keen.history', { query: { record: undefined, tab: undefined } })
  })

  it('sends the open tab', async () => {
    await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/5?tab=acme.notes' })
    await settle()

    expect(api).toHaveBeenCalledWith('/screens/keen.entry', { query: { record: '5', tab: 'acme.notes' } })
  })
})

describe('the Keen strings', () => {
  it('has every t() key the Keen pages and components use', () => {
    expect(missingI18nKeys('keen')).toEqual([])
  })
})
