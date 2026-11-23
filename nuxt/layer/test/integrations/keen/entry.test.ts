import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import KeenChanges from '../../../app/integrations/keen/components/KeenChanges.vue'
import { changeRows, formatChange } from '../../../app/integrations/keen/components/entries'
import EntryPage from '../../../app/pages/keen/entries/[entry].vue'
import { settle } from '../../support'
import { mockPackageApi, mountIntegration, reply, resetPackageApis } from '../support'
import { keenEntry, keenScreenFor } from './keen'

/*
 * The `keen.entry` screen (AC 54, 57): one entry from `keen.entries.show`,
 * with its changes rendered as Keen's v1 `x-keen::audit.changes` did (PHP's
 * `var_export()` for scalars and null, JSON for the rest).
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: { query?: Record<string, unknown> }) => Promise<unknown>>()
}))

mockNuxtImport('useAtriumApi', () => () => api)

describe('formatChange()', () => {
  it('shows scalars and null as var_export() did, and the rest as JSON', () => {
    expect(formatChange('draft')).toBe('\'draft\'')
    expect(formatChange('it\'s')).toBe('\'it\\\'s\'')
    expect(formatChange(12)).toBe('12')
    expect(formatChange(1.5)).toBe('1.5')
    expect(formatChange(true)).toBe('true')
    expect(formatChange(false)).toBe('false')
    expect(formatChange(null)).toBe('NULL')
    expect(formatChange(undefined)).toBe('NULL')
    expect(formatChange({ a: 1 })).toBe('{"a":1}')
    expect(formatChange(['x', 'y'])).toBe('["x","y"]')
  })
})

describe('changeRows()', () => {
  it('lists each field with its value before and after', () => {
    expect(changeRows({ status: ['draft', 'published'], price: [null, 15] })).toEqual([
      { field: 'status', before: '\'draft\'', after: '\'published\'' },
      { field: 'price', before: 'NULL', after: '15' }
    ])
  })

  it('has no rows for no changes', () => {
    expect(changeRows({})).toEqual([])
    expect(changeRows(null)).toEqual([])
  })
})

describe('<KeenChanges>', () => {
  it('renders one row per changed field', async () => {
    const wrapper = await mountSuspended(KeenChanges, {
      props: { changes: { status: ['draft', 'published'], meta: [null, { tags: ['new'] }], visible: [false, true] } }
    })

    const rows = wrapper.findAll('[data-testid="keen-change"]')

    expect(rows).toHaveLength(3)
    expect(rows[0]!.text()).toContain('status')
    expect(rows[0]!.find('[data-testid="keen-change-before"]').text()).toBe('\'draft\'')
    expect(rows[0]!.find('[data-testid="keen-change-after"]').text()).toBe('\'published\'')
    expect(rows[1]!.find('[data-testid="keen-change-before"]').text()).toBe('NULL')
    expect(rows[1]!.find('[data-testid="keen-change-after"]').text()).toBe('{"tags":["new"]}')
    expect(rows[2]!.find('[data-testid="keen-change-after"]').text()).toBe('true')
  })

  it('says no fields changed when there are none', async () => {
    const wrapper = await mountSuspended(KeenChanges, { props: { changes: {} } })

    expect(wrapper.find('[data-testid="keen-no-changes"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="keen-changes"]').exists()).toBe(false)
  })
})

describe('the keen.entry screen', () => {
  beforeEach(() => {
    clearNuxtData()
    api.mockReset()
    api.mockImplementation(async (path, options) => keenScreenFor(path, options?.query?.record))
  })

  afterEach(async () => {
    resetPackageApis()
    await useRouter().replace('/')
  })

  it('loads the entry from keen.entries.show and renders its details and changes', async () => {
    const calls = mockPackageApi('keen', {
      'GET /entries/{entry}': {
        data: keenEntry({
          scope: { type: 'roster.organization', id: '3' },
          changes: { status: ['running', 'cancelled'], attempts: [1, 2] },
          context: { reason: 'operator' }
        })
      }
    })

    const wrapper = await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/5' })
    await settle()

    expect(calls.some(call => call.method === 'GET' && call.path === '/entries/5')).toBe(true)
    expect(wrapper.find('[data-testid="keen-entry-source"]').text()).toBe('impex')
    expect(wrapper.find('[data-testid="keen-entry-subject"]').text()).toBe('Run 12 impex.run 12')
    expect(wrapper.find('[data-testid="keen-entry-actor"]').text()).toBe('Ada')
    expect(wrapper.find('[data-testid="keen-entry-scope"]').text()).toBe('roster.organization 3')
    expect(wrapper.find('[data-testid="keen-entry-surface"]').text()).toBe('http')
    expect(wrapper.find('[data-testid="keen-entry-hash"]').text()).toBe('f3b2c1')
    expect(wrapper.find('[data-testid="keen-entry-context"]').text()).toContain('"reason": "operator"')

    const changes = wrapper.findAll('[data-testid="keen-change"]')

    expect(changes).toHaveLength(2)
    expect(changes[0]!.find('[data-testid="keen-change-before"]').text()).toBe('\'running\'')
    expect(changes[0]!.find('[data-testid="keen-change-after"]').text()).toBe('\'cancelled\'')
    expect(changes[1]!.find('[data-testid="keen-change-after"]').text()).toBe('2')
  })

  it('shows the application\'s own entry, by the system, with no changes', async () => {
    mockPackageApi('keen', {
      'GET /entries/{entry}': { data: keenEntry({ source: 'app', action: 'cache.cleared', actor: null, changes: {} }) }
    })

    const wrapper = await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/5' })
    await settle()

    expect(wrapper.find('[data-testid="keen-entry-source"]').text()).toBe('Application')
    expect(wrapper.find('[data-testid="keen-entry-actor"]').text()).toBe('System')
    expect(wrapper.find('[data-testid="keen-no-changes"]').exists()).toBe(true)
  })

  it('shows the IP address and user agent only when Keen sends them', async () => {
    mockPackageApi('keen', {
      'GET /entries/{entry}': call => ({
        data: call.path === '/entries/8'
          ? keenEntry({ id: 8, ip: '203.0.113.9', user_agent: 'Firefox' })
          : keenEntry()
      })
    })

    const full = await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/8' })
    await settle()

    expect(full.find('[data-testid="keen-entry-ip"]').text()).toBe('203.0.113.9')
    expect(full.find('[data-testid="keen-entry-user_agent"]').text()).toBe('Firefox')

    const redacted = await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/5' })
    await settle()

    expect(redacted.find('[data-testid="keen-entry-ip"]').exists()).toBe(false)
    expect(redacted.find('[data-testid="keen-entry-user_agent"]').exists()).toBe(false)
  })

  it('shows a not-found state on a 404', async () => {
    mockPackageApi('keen', { 'GET /entries/{entry}': reply(404) })

    const wrapper = await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/404' })
    await settle()

    expect(wrapper.find('[data-testid="keen-entry-not-found"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="keen-entry"]').exists()).toBe(false)
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('keen', { 'GET /entries/{entry}': reply(403) })

    const wrapper = await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/5' })
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="keen-entry"]').exists()).toBe(false)
  })

  it('shows an error when the entry fails to load otherwise', async () => {
    mockPackageApi('keen', { 'GET /entries/{entry}': reply(500) })

    const wrapper = await mountIntegration(EntryPage, 'keen', { route: '/keen/entries/5' })
    await settle()

    expect(wrapper.find('[data-testid="keen-entry-failed"]').exists()).toBe(true)
  })
})
