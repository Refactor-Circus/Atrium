import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EntriesPage from '../src/pages/entries/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, mountIntegration, reply, resetPackageApis, type PackageCall } from '@refactor-circus/atrium/testing'
import { keenEntry, keenPackages, keenPage, keenScreenFor } from './keen'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * The `keen.entries` screen (AC 54, 57): every package's audit log from
 * `keen.entries.index`, with the v1 filters sent as its query and cursor
 * paging, and the "Record an event" form posting to `keen.entries.store`.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: { query?: Record<string, unknown> }) => Promise<unknown>>()
}))

mockAtriumApi(api)

const entryGets = (calls: readonly PackageCall[]) => calls.filter(call => call.method === 'GET' && call.route === '/entries')
const lastEntryGet = (calls: readonly PackageCall[]) => entryGets(calls).at(-1)

describe('the keen.entries screen', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(async (path, options) => keenScreenFor(path, options?.query?.record))
  })

  afterEach(async () => {
    resetPackageApis()
    await useRouter().replace('/')
  })

  it('loads the newest entries and the packages for the source filter', async () => {
    const calls = mockPackageApi('keen', {
      'GET /entries': keenPage([keenEntry(), keenEntry({ id: 6, source: 'app', action: 'invoice.paid', subject: null, actor: null })]),
      'GET /packages': { data: keenPackages }
    })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    expect(lastEntryGet(calls)?.query).toEqual({})
    expect(calls.some(call => call.method === 'GET' && call.route === '/packages')).toBe(true)

    const rows = wrapper.findAll('[data-testid="keen-entry-row"]')

    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('run.cancelled')
    expect(rows[0]!.text()).toContain('Run 12')
    expect(rows[0]!.text()).toContain('Ada')
    expect(rows[0]!.find('a').attributes('href')).toBe('/keen/entries/5')
    expect(rows[1]!.text()).toContain('App')
    expect(rows[1]!.text()).toContain('System')
  })

  it('says so when nothing has been recorded', async () => {
    mockPackageApi('keen', { 'GET /entries': keenPage([]), 'GET /packages': { data: [] } })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    expect(wrapper.find('[data-testid="keen-entries-empty"]').exists()).toBe(true)
  })

  it('sends the filters in the route query as the keen.entries.index query', async () => {
    const calls = mockPackageApi('keen', { 'GET /entries': keenPage([keenEntry()]), 'GET /packages': { data: keenPackages } })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries?source=impex&action=run.&since=2026-11-01' })
    await settle()

    expect(lastEntryGet(calls)?.query).toEqual({ source: 'impex', action: 'run.', since: '2026-11-01' })
    expect((wrapper.find('[data-testid="keen-filter-action"]').element as HTMLInputElement).value).toBe('run.')
    expect((wrapper.find('[data-testid="keen-filter-since"]').element as HTMLInputElement).value).toBe('2026-11-01')
  })

  it('applies the record, actor and date filters, and clears them', async () => {
    const calls = mockPackageApi('keen', { 'GET /entries': keenPage([keenEntry()]), 'GET /packages': { data: keenPackages } })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    await wrapper.find('[data-testid="keen-filter-subject_type"]').setValue('impex.run')
    await wrapper.find('[data-testid="keen-filter-subject_id"]').setValue('12')
    await wrapper.find('[data-testid="keen-filter-actor_type"]').setValue('user')
    await wrapper.find('[data-testid="keen-filter-actor_id"]').setValue('1')
    await wrapper.find('[data-testid="keen-filter-until"]').setValue('2026-11-30')
    await wrapper.find('[data-testid="keen-filters"]').trigger('submit')
    await settle()

    const filters = { subject_type: 'impex.run', subject_id: '12', actor_type: 'user', actor_id: '1', until: '2026-11-30' }

    expect(useRouter().currentRoute.value.query).toEqual(filters)
    expect(lastEntryGet(calls)?.query).toEqual(filters)

    await wrapper.find('[data-testid="keen-filter-clear"]').trigger('click')
    await settle()

    expect(useRouter().currentRoute.value.query).toEqual({})
    expect(lastEntryGet(calls)?.query).toEqual({})
  })

  it('pages by cursor: older, newer and back to the newest', async () => {
    const calls = mockPackageApi('keen', {
      'GET /entries': (call) => {
        if (call.query.cursor === 'older-1') {
          return keenPage([keenEntry({ id: 4, action: 'run.started' })], 'older-2', 'newer-1')
        }

        return keenPage([keenEntry()], 'older-1')
      },
      'GET /packages': { data: keenPackages }
    })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries?action=run.' })
    await settle()

    expect(wrapper.find('[data-testid="keen-page-newest"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="keen-page-newer"]').exists()).toBe(false)

    await wrapper.find('[data-testid="keen-page-older"]').trigger('click')
    await settle()

    expect(lastEntryGet(calls)?.query).toEqual({ action: 'run.', cursor: 'older-1' })
    expect(wrapper.find('[data-testid="keen-entry-row"]').text()).toContain('run.started')

    await wrapper.find('[data-testid="keen-page-newer"]').trigger('click')
    await settle()

    expect(lastEntryGet(calls)?.query).toEqual({ action: 'run.', cursor: 'newer-1' })

    await wrapper.find('[data-testid="keen-page-newest"]').trigger('click')
    await settle()

    expect(useRouter().currentRoute.value.query).toEqual({ action: 'run.' })
    expect(lastEntryGet(calls)?.query).toEqual({ action: 'run.' })
  })

  it('shows the field errors of a 422 under the filters', async () => {
    mockPackageApi('keen', {
      'GET /entries': reply(422, { message: 'The since field must be a valid date.', errors: { since: ['The since field must be a valid date.'] } }),
      'GET /packages': { data: keenPackages }
    })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries?since=yesterday' })
    await settle()

    expect(wrapper.find('[data-testid="keen-filters"]').text()).toContain('The since field must be a valid date.')
    expect(wrapper.find('[data-testid="keen-entries-failed"]').exists()).toBe(false)
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('keen', { 'GET /entries': reply(403), 'GET /packages': reply(403) })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    expect(wrapper.find('[data-testid="keen-entries-page"] [data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="keen-filters"]').exists()).toBe(false)
  })

  it('shows an error when the log fails to load otherwise', async () => {
    mockPackageApi('keen', { 'GET /entries': reply(500), 'GET /packages': { data: keenPackages } })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    expect(wrapper.find('[data-testid="keen-entries-failed"]').exists()).toBe(true)
  })
})

describe('the record form on keen.entries', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(async (path, options) => keenScreenFor(path, options?.query?.record))
  })

  afterEach(async () => {
    resetPackageApis()
    await useRouter().replace('/')
  })

  it('posts the action, record and note to keen.entries.store, then reloads the log', async () => {
    const calls = mockPackageApi('keen', {
      'GET /entries': keenPage([keenEntry()]),
      'GET /packages': { data: keenPackages },
      'POST /entries': { data: keenEntry({ id: 7, source: 'app', action: 'invoice.paid' }) }
    })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    const loads = entryGets(calls).length

    await wrapper.find('[data-testid="keen-record-action"]').setValue('invoice.paid')
    await wrapper.find('[data-testid="keen-record-subject"]').setValue('INV-1')
    await wrapper.find('[data-testid="keen-record-note"]').setValue('Paid by card')
    await wrapper.find('[data-testid="keen-record-form"]').trigger('submit')
    await settle()

    const posts = calls.filter(call => call.method === 'POST')

    expect(posts).toHaveLength(1)
    expect(posts[0]!.path).toBe('/entries')
    expect(posts[0]!.body).toEqual({ action: 'invoice.paid', subject_label: 'INV-1', context: { note: 'Paid by card' } })
    expect(wrapper.find('[data-testid="keen-record-done"]').exists()).toBe(true)
    expect((wrapper.find('[data-testid="keen-record-action"]').element as HTMLInputElement).value).toBe('')
    expect(entryGets(calls).length).toBeGreaterThan(loads)
  })

  it('sends only the action when the record and note are empty', async () => {
    const calls = mockPackageApi('keen', {
      'GET /entries': keenPage([]),
      'GET /packages': { data: [] },
      'POST /entries': { data: keenEntry({ source: 'app', action: 'cache.cleared' }) }
    })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    await wrapper.find('[data-testid="keen-record-action"]').setValue('cache.cleared')
    await wrapper.find('[data-testid="keen-record-form"]').trigger('submit')
    await settle()

    expect(calls.find(call => call.method === 'POST')?.body).toEqual({ action: 'cache.cleared' })
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('keen', {
      'GET /entries': keenPage([]),
      'GET /packages': { data: [] },
      'POST /entries': reply(422, { message: 'The action format is invalid.', errors: { action: ['The action format is invalid.'] } })
    })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    await wrapper.find('[data-testid="keen-record-action"]').setValue('Invoice Paid')
    await wrapper.find('[data-testid="keen-record-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="keen-record"]').text()).toContain('The action format is invalid.')
    expect(wrapper.find('[data-testid="keen-record-done"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="keen-record-failed"]').exists()).toBe(false)
    expect((wrapper.find('[data-testid="keen-record-action"]').element as HTMLInputElement).value).toBe('Invoice Paid')
  })

  it('shows a no-access notice on a 403', async () => {
    mockPackageApi('keen', {
      'GET /entries': keenPage([]),
      'GET /packages': { data: [] },
      'POST /entries': reply(403)
    })

    const wrapper = await mountIntegration(EntriesPage, 'keen', { route: '/keen/entries' })
    await settle()

    await wrapper.find('[data-testid="keen-record-action"]').setValue('invoice.paid')
    await wrapper.find('[data-testid="keen-record-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="keen-record"] [data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
