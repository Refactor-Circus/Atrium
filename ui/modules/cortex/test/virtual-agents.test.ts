import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/virtual-agents/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis } from '@refactor-circus/atrium/testing'
import { confirmWith, cortexCalls, mountCortexPage, screensApi, virtualAgent } from './support'
import { clearAtriumData, mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `cortex.virtual-agents` (AC 55): the list pages through
 * `virtual-agents.index?page=`, and delete calls `virtual-agents.destroy`
 * after a confirmation, then reloads.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

describe('cortex.virtual-agents', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(() => {
    resetPackageApis()
    vi.restoreAllMocks()
  })

  it('loads the agents, with the screen\'s extensions', async () => {
    mockPackageApi('cortex', { 'GET /virtual-agents': { data: [virtualAgent] } })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents')

    expect(cortexCalls('GET', '/virtual-agents')[0]?.query).toEqual({ page: '1' })
    expect(api).toHaveBeenCalledWith('/screens/cortex.virtual-agents', { query: { record: undefined, tab: undefined } })
    expect(wrapper.find('[data-testid="cortex-agent-triage"]').text()).toContain('Triage')
    expect(wrapper.find('[data-testid="cortex-agent-triage"]').text()).toContain('v2')
  })

  it('sends the page it is on', async () => {
    mockPackageApi('cortex', { 'GET /virtual-agents': { data: [virtualAgent], meta: { current_page: 2, last_page: 3 } } as never })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents?page=2')

    expect(cortexCalls('GET', '/virtual-agents')[0]?.query).toEqual({ page: '2' })
    expect(wrapper.find('[data-testid="cortex-pages"]').text()).toContain('2')
  })

  it('deletes an agent after a confirmation, then reloads', async () => {
    confirmWith(true)
    mockPackageApi('cortex', {
      'GET /virtual-agents': { data: [virtualAgent] },
      'DELETE /virtual-agents/{agent}': reply(204)
    })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents')
    await wrapper.find('[data-testid="cortex-delete-triage"]').trigger('click')
    await settle()

    const [call] = cortexCalls('DELETE', '/virtual-agents/{agent}')
    expect(call?.path).toBe('/virtual-agents/triage')
    expect(call?.body).toBeUndefined()
    expect(cortexCalls('GET', '/virtual-agents')).toHaveLength(2)
  })

  it('deletes nothing when the confirmation is declined', async () => {
    confirmWith(false)
    mockPackageApi('cortex', { 'GET /virtual-agents': { data: [virtualAgent] } })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents')
    await wrapper.find('[data-testid="cortex-delete-triage"]').trigger('click')
    await settle()

    expect(cortexCalls('DELETE', '/virtual-agents/{agent}')).toEqual([])
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', { 'GET /virtual-agents': reply(403) })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cortex-virtual-agents"]').exists()).toBe(false)
  })

  it('shows a forbidden delete as no access', async () => {
    confirmWith(true)
    mockPackageApi('cortex', {
      'GET /virtual-agents': { data: [virtualAgent] },
      'DELETE /virtual-agents/{agent}': reply(403)
    })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents')
    await wrapper.find('[data-testid="cortex-delete-triage"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
