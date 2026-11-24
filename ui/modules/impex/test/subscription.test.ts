import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SubscriptionPage from '../src/pages/subscriptions/[subscription].vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, type PackageBody, type PackageRoutes, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, delivery, leaveImpex, mountImpexPage, resetImpex, subscription } from './support'
import { mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `impex.subscription` (AC 54, 56): one subscription with its deliveries,
 * and v1's pause, resume, replay and ping, each through its v2 route.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const paused = { ...subscription, id: 'sub-2', status: 'paused' as const, endpoint: null }

// The vendored schema types the ping receipt's fields as strings (a loose
// Scramble type); the API sends a boolean and numbers.
const pinged = { data: { successful: 'true', status_code: '200', duration_ms: '12', error: '', message_id: 'msg-9' } } satisfies PackageBody<'impex', 'POST /subscriptions/{subscription}/ping'>

function routes(overrides: PackageRoutes<'impex'> = {}): PackageRoutes<'impex'> {
  return {
    'GET /subscriptions/{subscription}': call => ({ data: call.path === '/subscriptions/sub-2' ? paused : subscription }),
    'GET /subscriptions/{subscription}/deliveries': { data: [delivery] },
    'PATCH /subscriptions/{subscription}': { data: subscription },
    'POST /subscriptions/{subscription}/ping': pinged,
    ...overrides
  }
}

const replay = '[data-testid="impex-subscription-replay"]'

describe('impex.subscription', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('loads the subscription and its deliveries', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-1')

    expect(callsTo(calls, 'GET', '/subscriptions/{subscription}').some(call => call.path === '/subscriptions/sub-1')).toBe(true)
    expect(callsTo(calls, 'GET', '/subscriptions/{subscription}/deliveries').some(call => call.path === '/subscriptions/sub-1/deliveries')).toBe(true)
    expect(wrapper.find('h1').text()).toBe('products')
    expect(wrapper.find('[data-testid="impex-subscription-details"]').text()).toContain('https://partner.example.com/hook')
    expect(wrapper.find('[data-testid="impex-delivery-del-1"] a').attributes('href')).toBe('/impex/messages/msg-1')
  })

  it('asks atrium.screens.show for impex.subscription with the subscription as record and the open tab', async () => {
    mockPackageApi('impex', routes())

    await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-1?tab=keen.activity')

    expect(api).toHaveBeenCalledWith('/screens/impex.subscription', { query: { record: 'sub-1', tab: 'keen.activity' } })
  })

  it('pauses an active subscription', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-1')
    await wrapper.find('[data-testid="impex-subscription-pause"]').trigger('click')
    await settle()

    const patched = callsTo(calls, 'PATCH', '/subscriptions/{subscription}')

    expect(patched).toHaveLength(1)
    expect(patched[0]!.path).toBe('/subscriptions/sub-1')
    expect(patched[0]!.body).toEqual({ status: 'paused' })
    expect(wrapper.find('[data-testid="impex-notice"]').exists()).toBe(true)
  })

  it('resumes a paused subscription', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-2')
    await wrapper.find('[data-testid="impex-subscription-resume"]').trigger('click')
    await settle()

    const patched = callsTo(calls, 'PATCH', '/subscriptions/{subscription}')

    expect(patched).toHaveLength(1)
    expect(patched[0]!.path).toBe('/subscriptions/sub-2')
    expect(patched[0]!.body).toEqual({ status: 'active' })
  })

  it('replays from an event, changing nothing else', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-1')
    await wrapper.find(`${replay} input[name="replay_from"]`).setValue('100')
    await wrapper.find(replay).trigger('submit')
    await settle()

    expect(callsTo(calls, 'PATCH', '/subscriptions/{subscription}')[0]!.body).toEqual({ replay_from: 100 })
  })

  it('refuses a replay point that is not an event number, without a request', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-1')
    await wrapper.find(replay).trigger('submit')
    await settle()

    expect(callsTo(calls, 'PATCH', '/subscriptions/{subscription}')).toHaveLength(0)
    expect(wrapper.find('[data-testid="impex-field-errors"] [data-field="replay_from"]').exists()).toBe(true)
  })

  it('pings a subscription that pushes, and says how it went', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-1')
    await wrapper.find('[data-testid="impex-subscription-ping"]').trigger('click')
    await settle()

    const pings = callsTo(calls, 'POST', '/subscriptions/{subscription}/ping')

    expect(pings).toHaveLength(1)
    expect(pings[0]!.path).toBe('/subscriptions/sub-1/ping')
    expect(wrapper.find('[data-testid="impex-notice"]').text()).toBe('The endpoint answered.')
  })

  it('offers no ping for a feed-only subscription', async () => {
    mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-2')

    expect(wrapper.find('[data-testid="impex-subscription-ping"]').exists()).toBe(false)
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('impex', routes({ 'PATCH /subscriptions/{subscription}': reply(422, { message: 'Invalid.', errors: { replay_from: ['That event is gone.'] } }) }))

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-1')
    await wrapper.find(`${replay} input[name="replay_from"]`).setValue('1')
    await wrapper.find(replay).trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="impex-field-errors"]').text()).toContain('That event is gone.')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('impex', routes({ 'GET /subscriptions/{subscription}': reply(403) }))

    const wrapper = await mountImpexPage(SubscriptionPage, '/impex/subscriptions/sub-1')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
