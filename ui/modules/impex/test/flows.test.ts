import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FlowsPage from '../src/pages/flows/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, flow, leaveImpex, mountImpexPage, resetImpex, run } from './support'
import { mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `impex.flows` (AC 54, 56): every registered flow (`impex.flows.index`) with
 * v1's "run" form, which starts a run (`impex.flows.runs.store`) and opens it.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const form = '[data-testid="impex-flow-run-orders.sync"]'

describe('impex.flows', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('lists the flows from impex.flows.index', async () => {
    const calls = mockPackageApi('impex', { 'GET /flows': { data: [flow] } })

    const wrapper = await mountImpexPage(FlowsPage, '/impex/flows')

    expect(callsTo(calls, 'GET', '/flows').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-testid="impex-flow-row-orders.sync"]').text()).toContain('App\\Flows\\SyncOrders')
    expect(api).toHaveBeenCalledWith('/screens/impex.flows', { query: { record: undefined, tab: undefined } })
  })

  it('runs a flow with its JSON arguments, then opens the run', async () => {
    const calls = mockPackageApi('impex', {
      'GET /flows': { data: [flow] },
      'POST /flows/{flow}/runs': { data: run }
    })

    const wrapper = await mountImpexPage(FlowsPage, '/impex/flows')
    await wrapper.find(`${form} input[name="arguments"]`).setValue('{"since":"2026-11-01"}')
    await wrapper.find(form).trigger('submit')
    await settle()

    const started = callsTo(calls, 'POST', '/flows/{flow}/runs')

    expect(started).toHaveLength(1)
    expect(started[0]!.path).toBe('/flows/orders.sync/runs')
    expect(started[0]!.body).toEqual({ arguments: { since: '2026-11-01' } })
    expect(useRouter().currentRoute.value.path).toBe('/impex/runs/run-1')
  })

  it('runs a flow with no arguments', async () => {
    const calls = mockPackageApi('impex', {
      'GET /flows': { data: [flow] },
      'POST /flows/{flow}/runs': { data: run }
    })

    const wrapper = await mountImpexPage(FlowsPage, '/impex/flows')
    await wrapper.find(form).trigger('submit')
    await settle()

    expect(callsTo(calls, 'POST', '/flows/{flow}/runs')[0]!.body).toEqual({})
  })

  it('refuses arguments that are not a JSON array or object, without a request', async () => {
    const calls = mockPackageApi('impex', { 'GET /flows': { data: [flow] } })

    const wrapper = await mountImpexPage(FlowsPage, '/impex/flows')
    await wrapper.find(`${form} input[name="arguments"]`).setValue('"just text"')
    await wrapper.find(form).trigger('submit')
    await settle()

    expect(callsTo(calls, 'POST', '/flows/{flow}/runs')).toHaveLength(0)
    expect(wrapper.find('[data-testid="impex-field-errors"] [data-field="arguments"]').exists()).toBe(true)
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('impex', {
      'GET /flows': { data: [flow] },
      'POST /flows/{flow}/runs': reply(422, { message: 'Invalid.', errors: { arguments: ['The flow takes no arguments.'] } })
    })

    const wrapper = await mountImpexPage(FlowsPage, '/impex/flows')
    await wrapper.find(form).trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="impex-field-errors"]').text()).toContain('The flow takes no arguments.')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('impex', { 'GET /flows': reply(403) })

    const wrapper = await mountImpexPage(FlowsPage, '/impex/flows')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
