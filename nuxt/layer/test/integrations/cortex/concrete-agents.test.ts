import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#imports'
import Page from '../../../app/pages/cortex/concrete-agents/index.vue'
import { mockPackageApi, reply, resetPackageApis } from '../support'
import { concreteAgent, cortexCalls, mountCortexPage, screensApi } from './support'

/*
 * `cortex.concrete-agents` (AC 55): the code-declared agents
 * (`concrete-agents.index`), each linking to its page and to the run form.
 * The list has no mutation of its own.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockNuxtImport('useAtriumApi', () => () => api)

describe('cortex.concrete-agents', () => {
  beforeEach(() => {
    clearNuxtData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(() => resetPackageApis())

  it('loads the agents and the screen', async () => {
    mockPackageApi('cortex', {
      'GET /concrete-agents': { data: [concreteAgent, { ...concreteAgent, name: 'refund-agent', published_version: 3, tools_overridden: true }] } as never
    })

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents')

    expect(cortexCalls('GET', '/concrete-agents')).toHaveLength(1)
    expect(api).toHaveBeenCalledWith('/screens/cortex.concrete-agents', { query: { record: undefined, tab: undefined } })
    expect(wrapper.find('[data-testid="cortex-agent-support-triage"] [data-status="from_code"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cortex-agent-refund-agent"] [data-status="overridden"]').text()).toContain('v3')
    expect(wrapper.find('[data-testid="cortex-run-support-triage"]').attributes('href')).toBe('/cortex/run?agent=concrete:support-triage')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', { 'GET /concrete-agents': reply(403) })

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
