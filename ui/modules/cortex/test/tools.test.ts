import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/tools/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis } from '@refactor-circus/atrium/testing'
import { cortexCalls, mountCortexPage, screensApi, tools } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `cortex.tools` (AC 55): the registered tools (`tools.index`), narrowed by
 * tag as `?tag=` sent to the API, each linking to its description. The list
 * has no mutation of its own.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

describe('cortex.tools', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(async () => {
    resetPackageApis()
    await useRouter().replace('/')
  })

  it('loads the tools and the screen, each linking to its description', async () => {
    mockPackageApi('cortex', { 'GET /tools': { data: tools } as never })

    const wrapper = await mountCortexPage(Page, '/cortex/tools')

    expect(cortexCalls('GET', '/tools')[0]?.query).toEqual({})
    expect(api).toHaveBeenCalledWith('/screens/cortex.tools', { query: { record: undefined, tab: undefined } })
    expect(wrapper.find('[data-testid="cortex-tool-lookup-order"]').text()).toContain('Finds an order')
    expect(wrapper.find('[data-testid="cortex-describe-lookup-order"]').attributes('href')).toBe('/cortex/tools/lookup-order/description')
    expect(wrapper.find('[data-testid="cortex-tag-orders"]').exists()).toBe(true)
  })

  it('sends the chosen tag to tools.index', async () => {
    mockPackageApi('cortex', {
      'GET /tools': call => ({ data: call.query.tag ? tools.filter(tool => tool.tags.includes(call.query.tag!)) : tools }) as never
    })

    const wrapper = await mountCortexPage(Page, '/cortex/tools')
    await wrapper.find('[data-testid="cortex-tag-support"]').trigger('click')
    await settle()

    expect(useRouter().currentRoute.value.query.tag).toBe('support')
    expect(cortexCalls('GET', '/tools').some(call => call.query.tag === 'support')).toBe(true)
    expect(wrapper.find('[data-testid="cortex-tool-lookup-order"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="cortex-tool-create-ticket"]').exists()).toBe(true)
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', { 'GET /tools': reply(403) })

    const wrapper = await mountCortexPage(Page, '/cortex/tools')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
