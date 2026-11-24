import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/virtual-agents/create.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis } from '@refactor-circus/atrium/testing'
import { concreteAgent, cortexCalls, mountCortexPage, screensApi, tools, virtualAgent } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `cortex.virtual-agent-create` (AC 55): the form loads its options
 * (`providers.index`, `tools.index`, `virtual-agents.index`,
 * `concrete-agents.index`) and posts the agent to `virtual-agents.store`,
 * showing a 422's field errors and a 403 as no access.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function options() {
  return {
    'GET /providers': { data: [{ name: 'openai', models: ['gpt-5'], default_model: 'gpt-5' }] } as never,
    'GET /tools': { data: tools } as never,
    'GET /virtual-agents': { data: [virtualAgent] },
    'GET /concrete-agents': { data: [concreteAgent] } as never
  }
}

async function fill(wrapper: Awaited<ReturnType<typeof mountCortexPage>>): Promise<void> {
  await wrapper.find('[data-testid="cortex-agent-name"]').setValue('Refunds')
  await wrapper.find('[data-testid="cortex-agent-slug"]').setValue('refunds')
  await wrapper.find('[data-testid="cortex-agent-instructions"]').setValue('You refund orders.')
  await wrapper.find('[data-testid="cortex-agent-provider"]').setValue('openai')
  await wrapper.find('[data-testid="cortex-agent-temperature"]').setValue('0.5')
  await wrapper.find('[data-testid="cortex-agent-tool-create-ticket"]').setValue(true)
  await wrapper.find('[data-testid="cortex-concrete-sub-agent-support-triage"]').setValue(true)
}

describe('cortex.virtual-agent-create', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(async () => {
    resetPackageApis()
    await useRouter().replace('/')
  })

  it('loads the form\'s options and the screen', async () => {
    mockPackageApi('cortex', options())

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/create')

    expect(cortexCalls('GET', '/providers')).toHaveLength(1)
    expect(cortexCalls('GET', '/tools')).toHaveLength(1)
    expect(cortexCalls('GET', '/virtual-agents')[0]?.query).toEqual({ per_page: '100' })
    expect(cortexCalls('GET', '/concrete-agents')).toHaveLength(1)
    expect(api).toHaveBeenCalledWith('/screens/cortex.virtual-agent-create', { query: { record: undefined, tab: undefined } })
    expect(wrapper.find('[data-testid="cortex-agent-slug"]').exists()).toBe(true)
  })

  it('posts the new agent to virtual-agents.store, then opens it', async () => {
    mockPackageApi('cortex', { ...options(), 'POST /virtual-agents': { data: { ...virtualAgent, name: 'Refunds', slug: 'refunds' } } })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/create')
    await fill(wrapper)
    await wrapper.find('[data-testid="cortex-agent-form"]').trigger('submit')
    await settle()

    const [call] = cortexCalls('POST', '/virtual-agents')
    expect(call?.path).toBe('/virtual-agents')
    expect(call?.body).toEqual({
      name: 'Refunds',
      slug: 'refunds',
      description: null,
      instructions: 'You refund orders.',
      provider: 'openai',
      model: 'gpt-5',
      settings: { temperature: 0.5 },
      tools: ['create-ticket'],
      sub_agents: [],
      concrete_sub_agents: ['support-triage']
    })
    expect(useRouter().currentRoute.value.path).toBe('/cortex/virtual-agents/refunds')
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('cortex', {
      ...options(),
      'POST /virtual-agents': reply(422, { message: 'The slug has already been taken.', errors: { slug: ['The slug has already been taken.'] } })
    })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/create')
    await fill(wrapper)
    await wrapper.find('[data-testid="cortex-agent-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The slug has already been taken.')
    expect(useRouter().currentRoute.value.path).toBe('/cortex/virtual-agents/create')
  })

  it('shows a 403 as no access', async () => {
    mockPackageApi('cortex', { ...options(), 'POST /virtual-agents': reply(403) })

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/create')
    await fill(wrapper)
    await wrapper.find('[data-testid="cortex-agent-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
