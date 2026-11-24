import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChannelsPage from '../src/pages/channels/index.vue'
import { mockPackageApi, type PackageBody, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, configuredChannel, leaveImpex, mountImpexPage, resetImpex, storedChannel } from './support'
import { mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `impex.channels` (AC 54, 56): every channel, configured or stored
 * (`impex.channels.index`), each opening its page, and v1's "New channel".
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

// The list documents `options` as an empty object (a loose Scramble type).
const stored = { ...storedChannel, options: {} } satisfies PackageBody<'impex', 'GET /channels'>['data'][number]
const configured = { ...configuredChannel, options: {} } satisfies PackageBody<'impex', 'GET /channels'>['data'][number]

describe('impex.channels', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('lists the channels from impex.channels.index, stored and configured', async () => {
    const calls = mockPackageApi('impex', { 'GET /channels': { data: [stored, configured] } })

    const wrapper = await mountImpexPage(ChannelsPage, '/impex/channels')

    expect(callsTo(calls, 'GET', '/channels').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-testid="impex-channel-row-erp"] a').attributes('href')).toBe('/impex/channels/erp')
    expect(wrapper.find('[data-testid="impex-channel-row-erp"]').text()).toContain('Stored')
    expect(wrapper.find('[data-testid="impex-channel-row-webhooks.in"]').text()).toContain('From config')
    expect(api).toHaveBeenCalledWith('/screens/impex.channels', { query: { record: undefined, tab: undefined } })
  })

  it('links to the new channel form', async () => {
    mockPackageApi('impex', { 'GET /channels': { data: [] } })

    const wrapper = await mountImpexPage(ChannelsPage, '/impex/channels')

    expect(wrapper.find('[data-testid="impex-new-channel"]').attributes('href')).toBe('/impex/channels/create')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('impex', { 'GET /channels': reply(403) })

    const wrapper = await mountImpexPage(ChannelsPage, '/impex/channels')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
