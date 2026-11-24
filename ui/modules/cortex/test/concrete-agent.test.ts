import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/concrete-agents/[agent].vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { concreteAgent, confirmWith, cortexCalls, mountCortexPage, screensApi, tools } from './support'
import { clearAtriumData, mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `cortex.concrete-agent` (AC 55): the agent (`concrete-agents.show`), its
 * prompt override: versions, a new version, publish and removal
 * (`concrete-agents.versions.*`, `concrete-agents.override.destroy`), and
 * its toolset through `concrete-agents.tools.update` (`tools: null`
 * restores the code's); a 422, 403 and 404.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const overridden = { ...concreteAgent, published_version: 1, instructions: 'You triage, kindly.', tools_overridden: true }

const override = {
  agent: 'support-triage',
  published_version: 1,
  published_content: 'You triage, kindly.',
  tools: ['lookup-order'],
  created_at: null,
  updated_at: null
}

function routes(agent: typeof concreteAgent | typeof overridden = concreteAgent, overrides: PackageRoutes<'cortex'> = {}): PackageRoutes<'cortex'> {
  return {
    'GET /concrete-agents/{agent}': { data: agent } as never,
    'GET /concrete-agents/{agent}/versions': { data: [{ version: 1, content: 'You triage, kindly.', created_at: null }] },
    'GET /tools': { data: tools } as never,
    ...overrides
  }
}

describe('cortex.concrete-agent', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(() => {
    resetPackageApis()
    vi.restoreAllMocks()
  })

  it('loads the agent, its versions, the tools and its screen with the record', async () => {
    mockPackageApi('cortex', routes())

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')

    expect(cortexCalls('GET', '/concrete-agents/{agent}')[0]?.path).toBe('/concrete-agents/support-triage')
    expect(cortexCalls('GET', '/concrete-agents/{agent}/versions')[0]?.path).toBe('/concrete-agents/support-triage/versions')
    expect(cortexCalls('GET', '/tools')).toHaveLength(1)
    expect(api).toHaveBeenCalledWith('/screens/cortex.concrete-agent', { query: { record: 'support-triage', tab: undefined } })
    expect(wrapper.find('[data-testid="cortex-live"]').text()).toContain('You triage support.')
    expect(wrapper.find('[data-testid="cortex-agent-tool-lookup-order"]').exists()).toBe(true)
  })

  it('saves a new override version without publishing it', async () => {
    mockPackageApi('cortex', routes(concreteAgent, {
      'POST /concrete-agents/{agent}/versions': { data: { version: 2, content: 'Draft', created_at: null } }
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-version-content"]').setValue('Draft')
    await wrapper.find('[data-testid="cortex-version-publish"]').setValue(false)
    await wrapper.find('[data-testid="cortex-new-version"] form').trigger('submit')
    await settle()

    const [call] = cortexCalls('POST', '/concrete-agents/{agent}/versions')
    expect(call?.path).toBe('/concrete-agents/support-triage/versions')
    expect(call?.body).toEqual({ content: 'Draft', publish: false })
  })

  it('shows the field errors of a 422 on a new version', async () => {
    mockPackageApi('cortex', routes(concreteAgent, {
      'POST /concrete-agents/{agent}/versions': reply(422, { message: 'Invalid.', errors: { content: ['The content field is required.'] } })
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-version-content"]').setValue('')
    await wrapper.find('[data-testid="cortex-new-version"] form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The content field is required.')
  })

  it('publishes a version', async () => {
    mockPackageApi('cortex', routes(concreteAgent, { 'POST /concrete-agents/{agent}/versions/{version}/publish': { data: override } }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-publish-1"]').trigger('click')
    await settle()

    expect(cortexCalls('POST', '/concrete-agents/{agent}/versions/{version}/publish')[0]?.path).toBe('/concrete-agents/support-triage/versions/1/publish')
    expect(cortexCalls('GET', '/concrete-agents/{agent}')).toHaveLength(2)
  })

  it('removes the override after a confirmation', async () => {
    confirmWith(true)
    mockPackageApi('cortex', routes(overridden, { 'DELETE /concrete-agents/{agent}/override': reply(204) }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-remove-override"]').trigger('click')
    await settle()

    expect(cortexCalls('DELETE', '/concrete-agents/{agent}/override')[0]?.path).toBe('/concrete-agents/support-triage/override')
  })

  it('keeps the override when the confirmation is declined', async () => {
    confirmWith(false)
    mockPackageApi('cortex', routes(overridden))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-remove-override"]').trigger('click')
    await settle()

    expect(cortexCalls('DELETE', '/concrete-agents/{agent}/override')).toEqual([])
  })

  it('saves the picked tools through concrete-agents.tools.update', async () => {
    mockPackageApi('cortex', routes(concreteAgent, { 'PUT /concrete-agents/{agent}/tools': { data: override } }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-agent-tool-create-ticket"]').setValue(true)
    await wrapper.find('[data-testid="cortex-save-tools"]').trigger('click')
    await settle()

    const [call] = cortexCalls('PUT', '/concrete-agents/{agent}/tools')
    expect(call?.path).toBe('/concrete-agents/support-triage/tools')
    expect(call?.body).toEqual({ tools: ['lookup-order', 'create-ticket'] })
  })

  it('restores the code tools with tools: null after a confirmation', async () => {
    confirmWith(true)
    mockPackageApi('cortex', routes(overridden, { 'PUT /concrete-agents/{agent}/tools': { data: override } }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-restore-tools"]').trigger('click')
    await settle()

    expect(cortexCalls('PUT', '/concrete-agents/{agent}/tools')[0]?.body).toEqual({ tools: null })
  })

  it('shows the field errors of a 422 on the tools', async () => {
    mockPackageApi('cortex', routes(concreteAgent, {
      'PUT /concrete-agents/{agent}/tools': reply(422, { message: 'Invalid.', errors: { 'tools.0': ['The selected tool is invalid.'] } })
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-save-tools"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="cortex-tools-error"]').text()).toContain('The selected tool is invalid.')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', routes(concreteAgent, { 'GET /concrete-agents/{agent}': reply(403) }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows a forbidden tool save as no access', async () => {
    mockPackageApi('cortex', routes(concreteAgent, { 'PUT /concrete-agents/{agent}/tools': reply(403) }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/support-triage')
    await wrapper.find('[data-testid="cortex-save-tools"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows a not-found state on a 404', async () => {
    mockPackageApi('cortex', routes(concreteAgent, { 'GET /concrete-agents/{agent}': reply(404) }))

    const wrapper = await mountCortexPage(Page, '/cortex/concrete-agents/missing')

    expect(wrapper.find('[data-testid="cortex-not-found"]').exists()).toBe(true)
  })
})
