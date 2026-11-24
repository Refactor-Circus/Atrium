import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/tools/[tool]/description.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, cortexCalls, mountCortexPage, screensApi, toolDescription, tools } from './support'
import { clearAtriumData, mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `cortex.tool-description` (AC 55): a tool's description override
 * (`tools.description.show`) with its versions, a new version, publish and
 * removal (`tools.description.*`); a 422, 403 and 404.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const published = { ...toolDescription, published_version: 1, published_content: 'Looks up an order by number.' }

function routes(description: typeof toolDescription | typeof published = toolDescription, overrides: PackageRoutes<'cortex'> = {}): PackageRoutes<'cortex'> {
  return {
    'GET /tools/{tool}/description': { data: description },
    'GET /tools/{tool}/description/versions': { data: [{ version: 1, content: 'Looks up an order by number.', created_at: null }] },
    'GET /tools': { data: tools } as never,
    ...overrides
  }
}

describe('cortex.tool-description', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(() => {
    resetPackageApis()
    vi.restoreAllMocks()
  })

  it('loads the override, its versions and its screen with the record', async () => {
    mockPackageApi('cortex', routes())

    const wrapper = await mountCortexPage(Page, '/cortex/tools/lookup-order/description')

    expect(cortexCalls('GET', '/tools/{tool}/description')[0]?.path).toBe('/tools/lookup-order/description')
    expect(cortexCalls('GET', '/tools/{tool}/description/versions')[0]?.path).toBe('/tools/lookup-order/description/versions')
    expect(api).toHaveBeenCalledWith('/screens/cortex.tool-description', { query: { record: 'lookup-order', tab: undefined } })
    expect(wrapper.find('[data-testid="cortex-live"]').text()).toContain('Finds an order')
    expect(wrapper.find('[data-status="from_code"]').exists()).toBe(true)
  })

  it('saves a new description version', async () => {
    mockPackageApi('cortex', routes(toolDescription, {
      'POST /tools/{tool}/description/versions': { data: { version: 2, content: 'Finds one order.', created_at: null } }
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/tools/lookup-order/description')
    await wrapper.find('[data-testid="cortex-version-content"]').setValue('Finds one order.')
    await wrapper.find('[data-testid="cortex-new-version"] form').trigger('submit')
    await settle()

    const [call] = cortexCalls('POST', '/tools/{tool}/description/versions')
    expect(call?.path).toBe('/tools/lookup-order/description/versions')
    expect(call?.body).toEqual({ content: 'Finds one order.', publish: true })
    expect(cortexCalls('GET', '/tools/{tool}/description')).toHaveLength(2)
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('cortex', routes(toolDescription, {
      'POST /tools/{tool}/description/versions': reply(422, { message: 'Invalid.', errors: { content: ['The content field is required.'] } })
    }))

    const wrapper = await mountCortexPage(Page, '/cortex/tools/lookup-order/description')
    await wrapper.find('[data-testid="cortex-new-version"] form').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The content field is required.')
  })

  it('publishes a version', async () => {
    mockPackageApi('cortex', routes(toolDescription, { 'POST /tools/{tool}/description/versions/{version}/publish': { data: published } }))

    const wrapper = await mountCortexPage(Page, '/cortex/tools/lookup-order/description')
    await wrapper.find('[data-testid="cortex-publish-1"]').trigger('click')
    await settle()

    expect(cortexCalls('POST', '/tools/{tool}/description/versions/{version}/publish')[0]?.path).toBe('/tools/lookup-order/description/versions/1/publish')
  })

  it('removes the override after a confirmation', async () => {
    confirmWith(true)
    mockPackageApi('cortex', routes(published, { 'DELETE /tools/{tool}/description': reply(204) }))

    const wrapper = await mountCortexPage(Page, '/cortex/tools/lookup-order/description')
    await wrapper.find('[data-testid="cortex-remove-override"]').trigger('click')
    await settle()

    expect(cortexCalls('DELETE', '/tools/{tool}/description')[0]?.path).toBe('/tools/lookup-order/description')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', routes(toolDescription, { 'GET /tools/{tool}/description': reply(403) }))

    const wrapper = await mountCortexPage(Page, '/cortex/tools/lookup-order/description')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows a not-found state on a 404', async () => {
    mockPackageApi('cortex', routes(toolDescription, { 'GET /tools/{tool}/description': reply(404) }))

    const wrapper = await mountCortexPage(Page, '/cortex/tools/missing/description')

    expect(wrapper.find('[data-testid="cortex-not-found"]').exists()).toBe(true)
  })
})
