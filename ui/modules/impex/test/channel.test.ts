import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChannelPage from '../src/pages/channels/[name].vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, type PackageRoutes, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, configuredChannel, leaveImpex, mountImpexPage, resetImpex, storedChannel } from './support'
import { mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `impex.channel` (AC 54, 56): one channel from `impex.channels.show`. A
 * stored one offers v1's update, rotate secret and delete (confirmed first);
 * a configured one shows its options.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'impex'> = {}): PackageRoutes<'impex'> {
  return {
    'GET /channels/{name}': call => ({ data: call.path === '/channels/webhooks.in' ? configuredChannel : storedChannel }),
    'PATCH /channels/{channel}': { data: storedChannel },
    'POST /channels/{channel}/rotate-secret': { data: storedChannel, secret: 'new-secret-123' },
    'DELETE /channels/{channel}': reply(204),
    ...overrides
  }
}

const update = '[data-testid="impex-channel-update"]'

describe('impex.channel', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('loads the channel from impex.channels.show', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/erp')

    expect(callsTo(calls, 'GET', '/channels/{name}').some(call => call.path === '/channels/erp')).toBe(true)
    expect(wrapper.find('h1').text()).toBe('erp')
    expect(wrapper.find('[data-testid="impex-channel-details"]').text()).toContain('Stored')
  })

  it('asks atrium.screens.show for impex.channel with the name as record and the open tab', async () => {
    mockPackageApi('impex', routes())

    await mountImpexPage(ChannelPage, '/impex/channels/erp?tab=keen.activity')

    expect(api).toHaveBeenCalledWith('/screens/impex.channel', { query: { record: 'erp', tab: 'keen.activity' } })
  })

  it('updates a stored channel with its fields, keeping the secret when none is typed', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/erp')
    await wrapper.find(`${update} textarea[name="options_json"]`).setValue('{"url":"https://erp.example.com/v2"}')
    await wrapper.find(update).trigger('submit')
    await settle()

    const patched = callsTo(calls, 'PATCH', '/channels/{channel}')

    expect(patched).toHaveLength(1)
    expect(patched[0]!.path).toBe('/channels/erp')
    expect(patched[0]!.body).toEqual({
      transport: 'http',
      status: 'active',
      body_policy: 'all',
      options: { url: 'https://erp.example.com/v2' }
    })
    expect(wrapper.find('[data-testid="impex-notice"]').exists()).toBe(true)
  })

  it('sends a new signing secret when one is typed', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/erp')
    await wrapper.find(`${update} input[name="signing_secret"]`).setValue('rotated-by-hand')
    await wrapper.find(update).trigger('submit')
    await settle()

    expect(callsTo(calls, 'PATCH', '/channels/{channel}')[0]!.body).toMatchObject({ credentials: { signing_secret: 'rotated-by-hand' } })
  })

  it('rotates the secret and shows the new one once', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/erp')
    await wrapper.find('[data-testid="impex-channel-rotate"]').trigger('click')
    await settle()

    const rotated = callsTo(calls, 'POST', '/channels/{channel}/rotate-secret')

    expect(rotated).toHaveLength(1)
    expect(rotated[0]!.path).toBe('/channels/erp/rotate-secret')
    expect(wrapper.find('[data-testid="impex-notice"]').text()).toContain('new-secret-123')
  })

  it('deletes the channel only once confirmed, then goes back to the list', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/erp')
    await wrapper.find('[data-testid="impex-channel-delete"]').trigger('click')
    await settle()

    expect(callsTo(calls, 'DELETE', '/channels/{channel}')).toHaveLength(0)

    await wrapper.find('[data-testid="impex-channel-delete-confirm"]').trigger('click')
    await settle()

    const deleted = callsTo(calls, 'DELETE', '/channels/{channel}')

    expect(deleted).toHaveLength(1)
    expect(deleted[0]!.path).toBe('/channels/erp')
    // The list page loads lazily on its first visit; wait for the navigation.
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/impex/channels'))
  })

  it('keeps a channel whose deletion is cancelled', async () => {
    const calls = mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/erp')
    await wrapper.find('[data-testid="impex-channel-delete"]').trigger('click')
    await settle()
    await wrapper.find('[data-testid="impex-channel-delete-cancel"]').trigger('click')
    await settle()

    expect(callsTo(calls, 'DELETE', '/channels/{channel}')).toHaveLength(0)
    expect(wrapper.find('[data-testid="impex-channel-delete"]').exists()).toBe(true)
  })

  it('shows a configured channel\'s options, with no edit, rotate or delete', async () => {
    mockPackageApi('impex', routes())

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/webhooks.in')

    expect(wrapper.find('[data-testid="impex-channel-options"]').text()).toContain('https://erp.example.com')
    expect(wrapper.find(update).exists()).toBe(false)
    expect(wrapper.find('[data-testid="impex-channel-rotate"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="impex-channel-delete"]').exists()).toBe(false)
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('impex', routes({ 'PATCH /channels/{channel}': reply(422, { message: 'Invalid.', errors: { transport: ['Unknown transport.'] } }) }))

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/erp')
    await wrapper.find(update).trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="impex-field-errors"] [data-field="transport"]').text()).toContain('Unknown transport.')
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('impex', routes({ 'GET /channels/{name}': reply(403) }))

    const wrapper = await mountImpexPage(ChannelPage, '/impex/channels/erp')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
