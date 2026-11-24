import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SubscriptionsPage from '../src/pages/subscriptions/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, leaveImpex, mountImpexPage, page, resetImpex, subscriptionRow as subscription } from './support'
import { mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `impex.subscriptions` (AC 54, 56): every subscription from
 * `impex.subscriptions.index`, filtered by stream and status from the URL as
 * v1 was, a cursor page at a time.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const feedOnly = { ...subscription, id: 'sub-2', stream: 'orders', status: 'paused' as const, endpoint: null }

describe('impex.subscriptions', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('lists the subscriptions from impex.subscriptions.index, each linking to its page', async () => {
    const calls = mockPackageApi('impex', { 'GET /subscriptions': page([subscription, feedOnly]) })

    const wrapper = await mountImpexPage(SubscriptionsPage, '/impex/subscriptions')

    expect(callsTo(calls, 'GET', '/subscriptions').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-testid="impex-subscription-row-sub-1"] a').attributes('href')).toBe('/impex/subscriptions/sub-1')
    expect(wrapper.find('[data-testid="impex-subscription-row-sub-1"]').text()).toContain('https://partner.example.com/hook')
    expect(wrapper.find('[data-testid="impex-subscription-row-sub-2"]').text()).toContain('Feed only')
    expect(api).toHaveBeenCalledWith('/screens/impex.subscriptions', { query: { record: undefined, tab: undefined } })
  })

  it('sends the stream and status filters from the URL as the endpoint\'s query', async () => {
    const calls = mockPackageApi('impex', { 'GET /subscriptions': page([feedOnly]) })

    await mountImpexPage(SubscriptionsPage, '/impex/subscriptions?stream=orders&status=paused')

    expect(callsTo(calls, 'GET', '/subscriptions').map(call => call.query)).toContainEqual({ stream: 'orders', status: 'paused' })
  })

  it('loads the next page by the cursor the last one gave', async () => {
    const calls = mockPackageApi('impex', {
      'GET /subscriptions': call => call.query.cursor === 'next-1' ? page([feedOnly]) : page([subscription], 'next-1')
    })

    const wrapper = await mountImpexPage(SubscriptionsPage, '/impex/subscriptions')
    await wrapper.find('[data-testid="impex-load-more"]').trigger('click')
    await settle()

    expect(callsTo(calls, 'GET', '/subscriptions').some(call => call.query.cursor === 'next-1')).toBe(true)
    expect(wrapper.find('[data-testid="impex-subscription-row-sub-2"]').exists()).toBe(true)
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('impex', { 'GET /subscriptions': reply(403) })

    const wrapper = await mountImpexPage(SubscriptionsPage, '/impex/subscriptions')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
