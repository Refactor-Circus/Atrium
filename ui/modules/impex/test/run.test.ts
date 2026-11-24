import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { components } from '../client/schema'
import RunPage from '../src/pages/runs/[run].vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, type PackageRoutes, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, failedRun, leaveImpex, message, mountImpexPage, page, resetImpex, run, step } from './support'
import { mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `impex.run` (AC 54, 56): one run with its steps (`impex.runs.steps.index`)
 * and messages, and v1's cancel, retry and signal actions, each reloading it.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const signal = { id: 'sig-1', run_id: 'run-1', name: 'approve', delivered_at: '2026-11-20T10:01:00Z', consumed_at: null, consumed_sequence: null } satisfies components['schemas']['SignalResource']

function routes(overrides: PackageRoutes<'impex'> = {}): PackageRoutes<'impex'> {
  return {
    'GET /runs/{run}': call => ({ data: call.path === '/runs/run-2' ? failedRun : run }),
    'GET /runs/{run}/steps': { data: [step] },
    'GET /messages': page([message]),
    'POST /runs/{run}/cancel': { data: { ...run, status: 'cancelled' } },
    'POST /runs/{run}/retry': { data: { ...failedRun, status: 'pending' } },
    'POST /runs/{run}/signals': { data: signal },
    ...overrides
  }
}

describe('impex.run', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('loads the run, its steps and its messages', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/run-1')

    expect(callsTo(calls, 'GET', '/runs/{run}').some(call => call.path === '/runs/run-1')).toBe(true)
    expect(callsTo(calls, 'GET', '/runs/{run}/steps').some(call => call.path === '/runs/run-1/steps')).toBe(true)
    expect(callsTo(calls, 'GET', '/messages').some(call => call.query.run === 'run-1')).toBe(true)
    expect(wrapper.find('h1').text()).toBe('orders.sync')
    expect(wrapper.find('[data-testid="impex-step-1"]').text()).toContain('fetch-orders')
    expect(wrapper.find('[data-testid="impex-run-messages"] a').attributes('href')).toBe('/impex/messages/msg-1')
  })

  it('asks atrium.screens.show for impex.run with the run as record and the open tab', async () => {
    mockPackageApi('impex', routes())

    await mountImpexPage(RunPage, '/impex/runs/run-1?tab=keen.activity')

    expect(api).toHaveBeenCalledWith('/screens/impex.run', { query: { record: 'run-1', tab: 'keen.activity' } })
  })

  it('cancels the run with a reason, then reloads it', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/run-1')
    const loads = callsTo(calls, 'GET', '/runs/{run}').length

    await wrapper.find('[data-testid="impex-run-cancel"]').trigger('click')
    await settle()

    const cancel = callsTo(calls, 'POST', '/runs/{run}/cancel')

    expect(cancel).toHaveLength(1)
    expect(cancel[0]!.path).toBe('/runs/run-1/cancel')
    expect(cancel[0]!.body).toEqual({ reason: 'Cancelled from the dashboard.' })
    expect(callsTo(calls, 'GET', '/runs/{run}').length).toBeGreaterThan(loads)
    expect(wrapper.find('[data-testid="impex-notice"]').exists()).toBe(true)
  })

  it('retries a failed run', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/run-2')
    await wrapper.find('[data-testid="impex-run-retry"]').trigger('click')
    await settle()

    const retry = callsTo(calls, 'POST', '/runs/{run}/retry')

    expect(retry).toHaveLength(1)
    expect(retry[0]!.path).toBe('/runs/run-2/retry')
  })

  it('offers no cancel on a finished run, and no retry on one that did not fail', async () => {
    mockPackageApi('impex', routes())

    const running = await mountImpexPage(RunPage, '/impex/runs/run-1')
    expect(running.find('[data-testid="impex-run-retry"]').exists()).toBe(false)
    running.unmount()

    const failed = await mountImpexPage(RunPage, '/impex/runs/run-2')
    expect(failed.find('[data-testid="impex-run-cancel"]').exists()).toBe(false)
  })

  it('sends a signal with its name and JSON payload', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/run-1')
    await wrapper.find('[data-testid="impex-run-signal"] input[name="name"]').setValue('approve')
    await wrapper.find('[data-testid="impex-run-signal"] input[name="payload"]').setValue('{"approved":true}')
    await wrapper.find('[data-testid="impex-run-signal"]').trigger('submit')
    await settle()

    const signals = callsTo(calls, 'POST', '/runs/{run}/signals')

    expect(signals).toHaveLength(1)
    expect(signals[0]!.path).toBe('/runs/run-1/signals')
    expect(signals[0]!.body).toEqual({ name: 'approve', payload: { approved: true } })
  })

  it('refuses a payload that is not JSON, without a request', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/run-1')
    await wrapper.find('[data-testid="impex-run-signal"] input[name="name"]').setValue('approve')
    await wrapper.find('[data-testid="impex-run-signal"] input[name="payload"]').setValue('{nope')
    await wrapper.find('[data-testid="impex-run-signal"]').trigger('submit')
    await settle()

    expect(callsTo(calls, 'POST', '/runs/{run}/signals')).toHaveLength(0)
    expect(wrapper.find('[data-testid="impex-field-errors"] [data-field="payload"]').exists()).toBe(true)
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('impex', routes({ 'POST /runs/{run}/cancel': reply(422, { message: 'Invalid.', errors: { reason: ['The reason is too long.'] } }) }))

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/run-1')
    await wrapper.find('[data-testid="impex-run-cancel"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="impex-field-errors"]').text()).toContain('The reason is too long.')
  })

  it('shows the no-access notice when an action answers 403', async () => {
    mockPackageApi('impex', routes({ 'POST /runs/{run}/cancel': reply(403) }))

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/run-1')
    await wrapper.find('[data-testid="impex-run-cancel"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows the no-access state when the run answers 403', async () => {
    mockPackageApi('impex', routes({ 'GET /runs/{run}': reply(403) }))

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/run-1')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="impex-run-details"]').exists()).toBe(false)
  })

  it('shows the not-found state on a 404', async () => {
    mockPackageApi('impex', routes({ 'GET /runs/{run}': reply(404) }))

    const wrapper = await mountImpexPage(RunPage, '/impex/runs/missing')

    expect(wrapper.find('[data-testid="impex-not-found"]').exists()).toBe(true)
  })
})
