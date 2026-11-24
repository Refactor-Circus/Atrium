import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/servers/index.vue'
import { mockPackageApi, reply, resetPackageApis } from '@refactor-circus/atrium/testing'
import { cortexCalls, mountCortexPage, screensApi, server } from './support'
import { clearAtriumData, mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `cortex.servers` (AC 55): the MCP servers (`servers.index`), with their
 * tools and any missing ones, each linking to its instructions and tools.
 * The list has no mutation of its own.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

describe('cortex.servers', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(() => resetPackageApis())

  it('loads the servers and the screen', async () => {
    mockPackageApi('cortex', { 'GET /servers': { data: [{ ...server, missing_tools: ['old-tool'] }] } })

    const wrapper = await mountCortexPage(Page, '/cortex/servers')

    expect(cortexCalls('GET', '/servers')).toHaveLength(1)
    expect(api).toHaveBeenCalledWith('/screens/cortex.servers', { query: { record: undefined, tab: undefined } })
    expect(wrapper.find('[data-testid="cortex-missing-tools"]').text()).toContain('old-tool')
    expect(wrapper.find('[data-testid="cortex-instructions-support"]').attributes('href')).toBe('/cortex/servers/support/instructions')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', { 'GET /servers': reply(403) })

    const wrapper = await mountCortexPage(Page, '/cortex/servers')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
