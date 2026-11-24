import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChannelCreatePage from '../src/pages/channels/create.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply } from '@refactor-circus/atrium/testing'
import { atriumApi, callsTo, leaveImpex, mountImpexPage, resetImpex, storedChannel } from './support'
import { mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `impex.channel-create` (AC 54, 56): v1's "New channel" form, posting to
 * `impex.channels.store` and opening the channel.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const form = '[data-testid="impex-channel-create-form"]'

describe('impex.channel-create', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockImplementation(atriumApi)
    await resetImpex()
  })

  afterEach(leaveImpex)

  it('asks atrium.screens.show for impex.channel-create, and loads nothing from Impex', async () => {
    const calls = mockPackageApi('impex', {})

    await mountImpexPage(ChannelCreatePage, '/impex/channels/create')

    expect(api).toHaveBeenCalledWith('/screens/impex.channel-create', { query: { record: undefined, tab: undefined } })
    expect(calls.filter(call => call.method !== 'GET')).toEqual([])
  })

  it('creates the channel with v1\'s fields, then opens it', async () => {
    const calls = mockPackageApi('impex', { 'POST /channels': { data: storedChannel } })

    const wrapper = await mountImpexPage(ChannelCreatePage, '/impex/channels/create')
    await wrapper.find(`${form} input[name="name"]`).setValue('erp')
    await wrapper.find(`${form} input[name="signing_secret"]`).setValue('s3cret')
    await wrapper.find(`${form} textarea[name="options_json"]`).setValue('{"url":"https://erp.example.com"}')
    await wrapper.find(form).trigger('submit')
    await settle()

    const created = callsTo(calls, 'POST', '/channels')

    expect(created).toHaveLength(1)
    expect(created[0]!.body).toEqual({
      name: 'erp',
      direction: 'inbound',
      transport: 'http',
      status: 'active',
      body_policy: 'all',
      options: { url: 'https://erp.example.com' },
      credentials: { signing_secret: 's3cret' }
    })
    expect(useRouter().currentRoute.value.path).toBe('/impex/channels/erp')
  })

  it('sends no credentials when no signing secret is typed', async () => {
    const calls = mockPackageApi('impex', { 'POST /channels': { data: storedChannel } })

    const wrapper = await mountImpexPage(ChannelCreatePage, '/impex/channels/create')
    await wrapper.find(`${form} input[name="name"]`).setValue('erp')
    await wrapper.find(form).trigger('submit')
    await settle()

    expect(callsTo(calls, 'POST', '/channels')[0]!.body).not.toHaveProperty('credentials')
  })

  it('refuses options that are not a JSON object, without a request', async () => {
    const calls = mockPackageApi('impex', {})

    const wrapper = await mountImpexPage(ChannelCreatePage, '/impex/channels/create')
    await wrapper.find(`${form} input[name="name"]`).setValue('erp')
    await wrapper.find(`${form} textarea[name="options_json"]`).setValue('[1, 2]')
    await wrapper.find(form).trigger('submit')
    await settle()

    expect(callsTo(calls, 'POST', '/channels')).toHaveLength(0)
    expect(wrapper.find('[data-testid="impex-field-errors"] [data-field="options"]').exists()).toBe(true)
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('impex', { 'POST /channels': reply(422, { message: 'Invalid.', errors: { name: ['The name has already been taken.'] } }) })

    const wrapper = await mountImpexPage(ChannelCreatePage, '/impex/channels/create')
    await wrapper.find(`${form} input[name="name"]`).setValue('erp')
    await wrapper.find(form).trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="impex-field-errors"] [data-field="name"]').text()).toContain('The name has already been taken.')
    expect(useRouter().currentRoute.value.path).toBe('/impex/channels/create')
  })

  it('shows the no-access notice on a 403', async () => {
    mockPackageApi('impex', { 'POST /channels': reply(403) })

    const wrapper = await mountImpexPage(ChannelCreatePage, '/impex/channels/create')
    await wrapper.find(`${form} input[name="name"]`).setValue('erp')
    await wrapper.find(form).trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
