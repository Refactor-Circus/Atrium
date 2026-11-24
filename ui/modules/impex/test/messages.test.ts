import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MessagesPage from '../src/pages/messages/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, leaveImpex, message, mountImpexPage, page, resetImpex } from './support'
import { mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `impex.messages` (AC 54, 56): the ledger from `impex.messages.index`,
 * filtered by direction and channel from the URL as v1 was, a cursor page at
 * a time.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const inbound = { ...message, id: 'msg-2', direction: 'inbound', channel: 'webhooks.in' } as const

describe('impex.messages', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('lists the messages from impex.messages.index, each linking to its page', async () => {
    const calls = mockPackageApi('impex', { 'GET /messages': page([message, inbound]) })

    const wrapper = await mountImpexPage(MessagesPage, '/impex/messages')

    expect(callsTo(calls, 'GET', '/messages').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-testid="impex-message-row-msg-1"] a').attributes('href')).toBe('/impex/messages/msg-1')
    expect(wrapper.find('[data-testid="impex-message-row-msg-2"]').text()).toContain('webhooks.in')
    expect(api).toHaveBeenCalledWith('/screens/impex.messages', { query: { record: undefined, tab: undefined } })
  })

  it('sends the direction and channel filters from the URL as the endpoint\'s query', async () => {
    const calls = mockPackageApi('impex', { 'GET /messages': page([inbound]) })

    await mountImpexPage(MessagesPage, '/impex/messages?direction=inbound&channel=webhooks.in')

    expect(callsTo(calls, 'GET', '/messages').map(call => call.query)).toContainEqual({ direction: 'inbound', channel: 'webhooks.in' })
  })

  it('loads the next page by the cursor the last one gave', async () => {
    const calls = mockPackageApi('impex', {
      'GET /messages': call => call.query.cursor === 'next-1' ? page([inbound]) : page([message], 'next-1')
    })

    const wrapper = await mountImpexPage(MessagesPage, '/impex/messages')
    await wrapper.find('[data-testid="impex-load-more"]').trigger('click')
    await settle()

    expect(callsTo(calls, 'GET', '/messages').some(call => call.query.cursor === 'next-1')).toBe(true)
    expect(wrapper.find('[data-testid="impex-message-row-msg-2"]').exists()).toBe(true)
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('impex', { 'GET /messages': reply(403) })

    const wrapper = await mountImpexPage(MessagesPage, '/impex/messages')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
