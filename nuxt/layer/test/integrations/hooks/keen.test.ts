import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import KeenActivityTab from '../../../app/integrations/hooks/components/KeenActivityTab.vue'
import KeenHistorySection from '../../../app/integrations/hooks/components/KeenHistorySection.vue'
import { settle } from '../../support'
import { mockPackageApi, mountIntegration, reply, resetPackageApis, type PackageCall } from '../support'
import { keenEntry, keenPackages, keenPage } from '../keen/keen'

/*
 * The Keen hooks (AC 67): the `keen.history` section lists
 * `keen.entries.index` by `source`, narrowed to the record on a detail
 * screen; the `keen.activity` tab by `scope_type`/`scope_id` (or by subject
 * when not scoped). Either renders nothing for a package
 * `keen.packages.index` does not list, or on a 403.
 */

enableAutoUnmount(afterEach)

const entryGets = (calls: readonly PackageCall[]) => calls.filter(call => call.method === 'GET' && call.route === '/entries')

async function mountHook<T>(component: T, data: Record<string, unknown>, record: unknown = null) {
  const wrapper = await mountIntegration(component, 'keen', { props: { data, record } as never })
  await settle()

  return wrapper
}

describe('the keen.history section', () => {
  afterEach(() => resetPackageApis())

  it('filters a detail screen\'s history by the record', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': keenPage([keenEntry({ source: 'roster', subject: { type: 'roster.user', id: '7', label: 'Ada' } })])
    })

    const wrapper = await mountHook(KeenHistorySection, { source: 'roster', subject_type: 'roster.user' }, '7')

    expect(entryGets(calls)).toHaveLength(1)
    expect(entryGets(calls)[0]?.query).toEqual({ source: 'roster', subject_type: 'roster.user', subject_id: '7', per_page: '20' })
    expect(wrapper.findAll('[data-testid="keen-entry-row"]')).toHaveLength(1)
    // One record's history leaves out the record column.
    expect(wrapper.find('[data-testid="keen-entries"] thead').text()).not.toContain('Record')
  })

  it('sends source only on a list screen', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: [...keenPackages, { key: 'showroom', label: 'Showroom' }] },
      'GET /entries': keenPage([keenEntry()], 'next-page')
    })

    const wrapper = await mountHook(KeenHistorySection, { source: 'showroom' })

    expect(entryGets(calls)[0]?.query).toEqual({ source: 'showroom', per_page: '20' })
    expect(wrapper.find('[data-testid="hooks-keen-view-all"]').attributes('href')).toBe('/keen/history/showroom')
  })

  it('links to the record\'s full history when there is more', async () => {
    mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': keenPage([keenEntry()], 'next-page')
    })

    const wrapper = await mountHook(KeenHistorySection, { source: 'roster', subject_type: 'roster.user' }, '7')

    expect(wrapper.find('[data-testid="hooks-keen-view-all"]').attributes('href')).toBe('/keen/history/roster?subject_type=roster.user&subject_id=7')
  })

  it('renders nothing for a package keen.packages.index does not list, without loading entries', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': keenPage([keenEntry()])
    })

    const wrapper = await mountHook(KeenHistorySection, { source: 'cortex' })

    expect(wrapper.find('[data-testid="hooks-keen-history"]').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
    expect(entryGets(calls)).toEqual([])
  })

  it('renders nothing on a 403', async (context) => {
    for (const routes of [
      { 'GET /packages': reply(403) },
      { 'GET /packages': { data: keenPackages }, 'GET /entries': reply(403) }
    ] as const) {
      mockPackageApi('keen', routes as never)

      const wrapper = await mountHook(KeenHistorySection, { source: 'roster', subject_type: 'roster.user' }, '7')

      expect(wrapper.find('[data-testid="hooks-keen-history"]').exists(), context.task.name).toBe(false)
      expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(false)

      resetPackageApis()
    }
  })

  it('shows a failure other than 403', async () => {
    mockPackageApi('keen', { 'GET /packages': { data: keenPackages }, 'GET /entries': reply(500) })

    const wrapper = await mountHook(KeenHistorySection, { source: 'roster' })

    expect(wrapper.find('[data-testid="hooks-keen-failed"]').exists()).toBe(true)
  })
})

describe('the keen.activity tab', () => {
  afterEach(() => resetPackageApis())

  it('lists what was recorded within the record, by scope_type and scope_id', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': keenPage([keenEntry({ source: 'roster' })])
    })

    const wrapper = await mountHook(KeenActivityTab, { source: 'roster', subject_type: 'roster.organization', scope: true }, 'acme')

    expect(entryGets(calls)[0]?.query).toEqual({ source: 'roster', scope_type: 'roster.organization', scope_id: 'acme', per_page: '20' })
    expect(wrapper.findAll('[data-testid="keen-entry-row"]')).toHaveLength(1)
    // A scope's entries are about many records, so the record column stays.
    expect(wrapper.find('[data-testid="keen-entries"] thead').text()).toContain('Record')
  })

  it('lists the record\'s own history when not scoped', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': keenPage([])
    })

    await mountHook(KeenActivityTab, { source: 'roster', subject_type: 'roster.user', scope: false }, '7')

    expect(entryGets(calls)[0]?.query).toEqual({ source: 'roster', subject_type: 'roster.user', subject_id: '7', per_page: '20' })
  })

  it('renders nothing without a record, and on a 403', async () => {
    const calls = mockPackageApi('keen', { 'GET /packages': reply(403) })

    const unscoped = await mountHook(KeenActivityTab, { source: 'roster', subject_type: 'roster.organization', scope: true })

    expect(unscoped.find('[data-testid="hooks-keen-activity"]').exists()).toBe(false)
    expect(calls).toEqual([])

    const forbidden = await mountHook(KeenActivityTab, { source: 'roster', subject_type: 'roster.organization', scope: true }, 'acme')

    expect(forbidden.find('[data-testid="hooks-keen-activity"]').exists()).toBe(false)
  })
})
