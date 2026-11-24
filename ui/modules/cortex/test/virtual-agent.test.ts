import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/virtual-agents/[slug].vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, cortexCalls, mountCortexPage, screensApi, versions, virtualAgent } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `cortex.virtual-agent` (AC 55): the agent (`virtual-agents.show`), its
 * update (`virtual-agents.update`), its prompt versions: list, new version
 * and publish (`virtual-agents.versions.*`), and delete after a
 * confirmation (`virtual-agents.destroy`); a 422, 403 and 404.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'cortex'> = {}): PackageRoutes<'cortex'> {
  return {
    'GET /virtual-agents/{agent}': { data: virtualAgent },
    'GET /virtual-agents/{agent}/versions': { data: versions },
    ...overrides
  }
}

describe('cortex.virtual-agent', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(async () => {
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('loads the agent, its versions and its screen with the record', async () => {
    mockPackageApi('cortex', routes())

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/triage')

    expect(cortexCalls('GET', '/virtual-agents/{agent}')[0]?.path).toBe('/virtual-agents/triage')
    expect(cortexCalls('GET', '/virtual-agents/{agent}/versions')[0]?.query).toEqual({ per_page: '100' })
    expect(api).toHaveBeenCalledWith('/screens/cortex.virtual-agent', { query: { record: 'triage', tab: undefined } })
    expect((wrapper.find('[data-testid="cortex-agent-name"]').element as HTMLInputElement).value).toBe('Triage')
    expect(wrapper.find('[data-testid="cortex-version-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cortex-version-2"] [data-status="published"]').exists()).toBe(true)
  })

  it('saves the agent through virtual-agents.update, then reloads', async () => {
    mockPackageApi('cortex', routes({ 'PATCH /virtual-agents/{agent}': { data: virtualAgent } }))

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/triage')
    await wrapper.find('[data-testid="cortex-agent-name"]').setValue('Ticket triage')
    await wrapper.find('[data-testid="cortex-agent-form"]').trigger('submit')
    await settle()

    const [call] = cortexCalls('PATCH', '/virtual-agents/{agent}')
    expect(call?.path).toBe('/virtual-agents/triage')
    expect(call?.body).toEqual({
      name: 'Ticket triage',
      description: 'Sorts incoming tickets',
      instructions: 'You sort tickets.',
      provider: 'openai',
      model: 'gpt-5',
      settings: { temperature: 0.2 },
      tools: ['lookup-order'],
      sub_agents: [],
      concrete_sub_agents: []
    })
    expect(cortexCalls('GET', '/virtual-agents/{agent}')).toHaveLength(2)
  })

  it('shows the field errors of a 422 on update', async () => {
    mockPackageApi('cortex', routes({
      'PATCH /virtual-agents/{agent}': reply(422, { message: 'Invalid.', errors: { 'settings.temperature': ['The temperature must be between 0 and 2.'] } })
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/triage')
    await wrapper.find('[data-testid="cortex-agent-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The temperature must be between 0 and 2.')
  })

  it('saves a new prompt version, published by default', async () => {
    mockPackageApi('cortex', routes({ 'POST /virtual-agents/{agent}/versions': { data: versions[1]! } }))

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/triage')
    await wrapper.find('[data-testid="cortex-version-content"]').setValue('You sort every ticket.')
    await wrapper.find('[data-testid="cortex-new-version"] form').trigger('submit')
    await settle()

    const [call] = cortexCalls('POST', '/virtual-agents/{agent}/versions')
    expect(call?.path).toBe('/virtual-agents/triage/versions')
    expect(call?.body).toEqual({ content: 'You sort every ticket.', publish: true })
    expect(cortexCalls('GET', '/virtual-agents/{agent}')).toHaveLength(2)
  })

  it('publishes an earlier version', async () => {
    mockPackageApi('cortex', routes({ 'POST /virtual-agents/{agent}/versions/{version}/publish': { data: virtualAgent } }))

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/triage')
    await wrapper.find('[data-testid="cortex-publish-1"]').trigger('click')
    await settle()

    const [call] = cortexCalls('POST', '/virtual-agents/{agent}/versions/{version}/publish')
    expect(call?.path).toBe('/virtual-agents/triage/versions/1/publish')
    expect(call?.body).toBeUndefined()
  })

  it('deletes the agent after a confirmation, then returns to the list', async () => {
    confirmWith(true)
    mockPackageApi('cortex', routes({ 'DELETE /virtual-agents/{agent}': reply(204) }))

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/triage')
    await wrapper.find('[data-testid="cortex-delete-agent"]').trigger('click')
    await settle()

    expect(cortexCalls('DELETE', '/virtual-agents/{agent}')[0]?.path).toBe('/virtual-agents/triage')
    expect(useRouter().currentRoute.value.path).toBe('/cortex/virtual-agents')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', routes({ 'GET /virtual-agents/{agent}': reply(403) }))

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/triage')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cortex-agent-form"]').exists()).toBe(false)
  })

  it('shows a not-found state on a 404', async () => {
    mockPackageApi('cortex', routes({ 'GET /virtual-agents/{agent}': reply(404) }))

    const wrapper = await mountCortexPage(Page, '/cortex/virtual-agents/missing')

    expect(wrapper.find('[data-testid="cortex-not-found"]').exists()).toBe(true)
  })
})
