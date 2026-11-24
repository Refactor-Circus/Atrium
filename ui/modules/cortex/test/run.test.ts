import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/run.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { cortexCalls, mountCortexPage, runnableAgents, screensApi } from './support'
import { clearAtriumData, mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `cortex.run` (AC 55): the agents come from `runnable-agents.index`; a
 * virtual agent runs through `virtual-agents.run` and a concrete one through
 * `concrete-agents.run`, with the input; the response and usage render; a
 * 422 and 403.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const answer = { data: { text: 'Ticket routed to billing.', usage: { input_tokens: 12, output_tokens: 7 } } } as never

function routes(overrides: PackageRoutes<'cortex'> = {}): PackageRoutes<'cortex'> {
  return { 'GET /runnable-agents': { data: runnableAgents }, ...overrides }
}

async function runWith(wrapper: Awaited<ReturnType<typeof mountCortexPage>>, agent: string, input: string): Promise<void> {
  await wrapper.find('[data-testid="cortex-run-agent-select"]').setValue(agent)
  await wrapper.find('[data-testid="cortex-run-input"]').setValue(input)
  await wrapper.find('[data-testid="cortex-run-form"]').trigger('submit')
  await settle()
}

describe('cortex.run', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(() => resetPackageApis())

  it('lists the runnable agents and loads the screen', async () => {
    mockPackageApi('cortex', routes())

    const wrapper = await mountCortexPage(Page, '/cortex/run')

    expect(cortexCalls('GET', '/runnable-agents')).toHaveLength(1)
    expect(api).toHaveBeenCalledWith('/screens/cortex.run', { query: { record: undefined, tab: undefined } })
    expect(wrapper.findAll('[data-testid="cortex-run-agent-select"] option').map(option => option.attributes('value')))
      .toEqual(['', 'virtual:triage', 'concrete:support-triage'])
  })

  it('preselects the agent of ?agent=', async () => {
    mockPackageApi('cortex', routes())

    const wrapper = await mountCortexPage(Page, '/cortex/run?agent=concrete:support-triage')

    expect((wrapper.find('[data-testid="cortex-run-agent-select"]').element as HTMLSelectElement).value).toBe('concrete:support-triage')
  })

  it('runs a virtual agent through virtual-agents.run and shows the response', async () => {
    mockPackageApi('cortex', routes({ 'POST /virtual-agents/{agent}/run': answer }))

    const wrapper = await mountCortexPage(Page, '/cortex/run')
    await runWith(wrapper, 'virtual:triage', 'My order is late')

    const [call] = cortexCalls('POST', '/virtual-agents/{agent}/run')
    expect(call?.path).toBe('/virtual-agents/triage/run')
    expect(call?.body).toEqual({ input: 'My order is late' })
    expect(wrapper.find('[data-testid="cortex-run-text"]').text()).toBe('Ticket routed to billing.')
    expect(wrapper.find('[data-testid="cortex-run-usage"]').text()).toContain('output_tokens')
  })

  it('runs a concrete agent through concrete-agents.run', async () => {
    mockPackageApi('cortex', routes({ 'POST /concrete-agents/{agent}/run': answer }))

    const wrapper = await mountCortexPage(Page, '/cortex/run')
    await runWith(wrapper, 'concrete:support-triage', 'Hello')

    const [call] = cortexCalls('POST', '/concrete-agents/{agent}/run')
    expect(call?.path).toBe('/concrete-agents/support-triage/run')
    expect(call?.body).toEqual({ input: 'Hello' })
    expect(cortexCalls('POST', '/virtual-agents/{agent}/run')).toEqual([])
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('cortex', routes({
      'POST /virtual-agents/{agent}/run': reply(422, { message: 'Invalid.', errors: { input: ['The input field is required.'] } })
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/run')
    await runWith(wrapper, 'virtual:triage', '')

    expect(wrapper.text()).toContain('The input field is required.')
    expect(wrapper.find('[data-testid="cortex-run-result"]').exists()).toBe(false)
  })

  it('shows a forbidden run as no access', async () => {
    mockPackageApi('cortex', routes({ 'POST /virtual-agents/{agent}/run': reply(403) }))

    const wrapper = await mountCortexPage(Page, '/cortex/run')
    await runWith(wrapper, 'virtual:triage', 'Hello')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows the no-access state when the agents may not be listed', async () => {
    mockPackageApi('cortex', routes({ 'GET /runnable-agents': reply(403) }))

    const wrapper = await mountCortexPage(Page, '/cortex/run')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
