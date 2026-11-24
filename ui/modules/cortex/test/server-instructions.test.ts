import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/servers/[server]/instructions.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, cortexCalls, instruction, mountCortexPage, screensApi, server, tools } from './support'
import { clearAtriumData, mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `cortex.server-instructions` (AC 55): a server's instructions override
 * (`servers.instructions.show`: versions, new version, publish, removal) and
 * its toolset (`servers.tools.update`, restored by `servers.tools.destroy`);
 * saving no tool needs "Serve no tools"; a 422, 403 and 404.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'cortex'> = {}): PackageRoutes<'cortex'> {
  return {
    'GET /servers/{server}/instructions': { data: instruction },
    'GET /servers/{server}/instructions/versions': { data: [{ version: 1, content: 'Serve support tools carefully.', created_at: null }] },
    'GET /servers': { data: [server] },
    'GET /tools': { data: tools } as never,
    ...overrides
  }
}

describe('cortex.server-instructions', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(() => {
    resetPackageApis()
    vi.restoreAllMocks()
  })

  it('loads the instructions, their versions, the server and its screen with the record', async () => {
    mockPackageApi('cortex', routes())

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')

    expect(cortexCalls('GET', '/servers/{server}/instructions')[0]?.path).toBe('/servers/support/instructions')
    expect(cortexCalls('GET', '/servers/{server}/instructions/versions')[0]?.path).toBe('/servers/support/instructions/versions')
    expect(cortexCalls('GET', '/servers')).toHaveLength(1)
    expect(api).toHaveBeenCalledWith('/screens/cortex.server-instructions', { query: { record: 'support', tab: undefined } })
    expect(wrapper.find('[data-testid="cortex-live"]').text()).toContain('Serve support tools carefully.')
    expect(wrapper.find('[data-testid="cortex-server-tools"] [data-status="overridden"]').exists()).toBe(true)
  })

  it('saves a new instructions version', async () => {
    mockPackageApi('cortex', routes({
      'POST /servers/{server}/instructions/versions': { data: { version: 2, content: 'New', created_at: null } }
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')
    await wrapper.find('[data-testid="cortex-version-content"]').setValue('New')
    await wrapper.find('[data-testid="cortex-new-version"] form').trigger('submit')
    await settle()

    const [call] = cortexCalls('POST', '/servers/{server}/instructions/versions')
    expect(call?.path).toBe('/servers/support/instructions/versions')
    expect(call?.body).toEqual({ content: 'New', publish: true })
  })

  it('shows the field errors of a 422 on a new version', async () => {
    mockPackageApi('cortex', routes({
      'POST /servers/{server}/instructions/versions': reply(422, { message: 'Invalid.', errors: { content: ['The content field is required.'] } })
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')
    await wrapper.find('[data-testid="cortex-version-content"]').setValue('')
    await wrapper.find('[data-testid="cortex-new-version"] form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The content field is required.')
  })

  it('publishes a version and removes the override', async () => {
    confirmWith(true)
    mockPackageApi('cortex', routes({
      'GET /servers/{server}/instructions/versions': { data: [{ version: 1, content: 'a', created_at: null }, { version: 2, content: 'b', created_at: null }] },
      'POST /servers/{server}/instructions/versions/{version}/publish': { data: instruction },
      'DELETE /servers/{server}/instructions': reply(204)
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')
    await wrapper.find('[data-testid="cortex-publish-2"]').trigger('click')
    await settle()
    await wrapper.find('[data-testid="cortex-remove-override"]').trigger('click')
    await settle()

    expect(cortexCalls('POST', '/servers/{server}/instructions/versions/{version}/publish')[0]?.path).toBe('/servers/support/instructions/versions/2/publish')
    expect(cortexCalls('DELETE', '/servers/{server}/instructions')[0]?.path).toBe('/servers/support/instructions')
  })

  it('saves the picked tools through servers.tools.update', async () => {
    mockPackageApi('cortex', routes({ 'PUT /servers/{server}/tools': { data: instruction } }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')
    await wrapper.find('[data-testid="cortex-server-tool-create-ticket"]').setValue(true)
    await wrapper.find('[data-testid="cortex-save-tools"]').trigger('click')
    await settle()

    const [call] = cortexCalls('PUT', '/servers/{server}/tools')
    expect(call?.path).toBe('/servers/support/tools')
    expect(call?.body).toEqual({ tools: ['lookup-order', 'create-ticket'] })
  })

  it('saves no tools only with "Serve no tools" checked', async () => {
    mockPackageApi('cortex', routes({ 'PUT /servers/{server}/tools': { data: instruction } }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')
    await wrapper.find('[data-testid="cortex-server-tool-lookup-order"]').setValue(false)
    await wrapper.find('[data-testid="cortex-save-tools"]').trigger('click')
    await settle()

    expect(cortexCalls('PUT', '/servers/{server}/tools')).toEqual([])
    expect(wrapper.find('[data-testid="cortex-confirm-empty-needed"]').exists()).toBe(true)

    await wrapper.find('[data-testid="cortex-confirm-empty"]').setValue(true)
    await wrapper.find('[data-testid="cortex-save-tools"]').trigger('click')
    await settle()

    expect(cortexCalls('PUT', '/servers/{server}/tools')[0]?.body).toEqual({ tools: [] })
  })

  it('restores the code tools through servers.tools.destroy after a confirmation', async () => {
    confirmWith(true)
    mockPackageApi('cortex', routes({ 'DELETE /servers/{server}/tools': reply(204) }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')
    await wrapper.find('[data-testid="cortex-restore-tools"]').trigger('click')
    await settle()

    const [call] = cortexCalls('DELETE', '/servers/{server}/tools')
    expect(call?.path).toBe('/servers/support/tools')
    expect(call?.body).toBeUndefined()
  })

  it('shows the field errors of a 422 on the tools', async () => {
    mockPackageApi('cortex', routes({
      'PUT /servers/{server}/tools': reply(422, { message: 'Invalid.', errors: { tools: ['The tools field must be a list.'] } })
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')
    await wrapper.find('[data-testid="cortex-save-tools"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="cortex-tools-error"]').text()).toContain('The tools field must be a list.')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', routes({ 'GET /servers/{server}/instructions': reply(403) }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/support/instructions')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows a not-found state on a 404', async () => {
    mockPackageApi('cortex', routes({ 'GET /servers/{server}/instructions': reply(404) }))

    const wrapper = await mountCortexPage(Page, '/cortex/servers/missing/instructions')

    expect(wrapper.find('[data-testid="cortex-not-found"]').exists()).toBe(true)
  })
})
