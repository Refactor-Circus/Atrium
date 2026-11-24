import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MessagePage from '../src/pages/messages/[message].vue'
import { mockPackageApi, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, leaveImpex, message, mountImpexPage, resetImpex } from './support'
import { mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `impex.message` (AC 54, 56): one ledger entry from `impex.messages.show`,
 * with its body preview and the run it belongs to. It offers no actions.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

describe('impex.message', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('loads the message from impex.messages.show, linking to its run', async () => {
    const calls = mockPackageApi('impex', { 'GET /messages/{message}': { data: { ...message, signature_valid: true } } })

    const wrapper = await mountImpexPage(MessagePage, '/impex/messages/msg-1')

    expect(callsTo(calls, 'GET', '/messages/{message}').some(call => call.path === '/messages/msg-1')).toBe(true)
    expect(wrapper.find('[data-testid="impex-message-body"]').text()).toBe('{"ok":true}')
    expect(wrapper.find('[data-testid="impex-message-run"]').attributes('href')).toBe('/impex/runs/run-1')
    expect(wrapper.find('[data-testid="impex-message-signature"]').text()).toBe('Verified')
  })

  it('asks atrium.screens.show for impex.message with the message as record and the open tab', async () => {
    mockPackageApi('impex', { 'GET /messages/{message}': { data: message } })

    await mountImpexPage(MessagePage, '/impex/messages/msg-1?tab=keen.activity')

    expect(api).toHaveBeenCalledWith('/screens/impex.message', { query: { record: 'msg-1', tab: 'keen.activity' } })
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('impex', { 'GET /messages/{message}': reply(403) })

    const wrapper = await mountImpexPage(MessagePage, '/impex/messages/msg-1')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows the not-found state on a 404', async () => {
    mockPackageApi('impex', { 'GET /messages/{message}': reply(404) })

    const wrapper = await mountImpexPage(MessagePage, '/impex/messages/missing')

    expect(wrapper.find('[data-testid="impex-not-found"]').exists()).toBe(true)
  })
})
