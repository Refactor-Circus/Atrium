import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../src/pages/redirect-domains.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis } from '@refactor-circus/atrium/testing'
import { cortexCalls, mountCortexPage, redirectDomain, screensApi } from './support'
import { clearAtriumData, mockAtriumApi } from '@refactor-circus/atrium/testing'

/*
 * `cortex.redirect-domains` (AC 55): the stored redirect domains
 * (`redirect-domains.index`), add (`redirect-domains.store`) and remove
 * (`redirect-domains.destroy`), then a reload; a 422 and 403.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const owned = { ...redirectDomain, id: '01JD7Z5K3X', domain: 'https://acme.test', owner_type: 'roster.organization', owner_id: 'acme' }

describe('cortex.redirect-domains', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(() => resetPackageApis())

  it('loads the domains and the screen', async () => {
    mockPackageApi('cortex', { 'GET /redirect-domains': { data: [redirectDomain, owned] } as never })

    const wrapper = await mountCortexPage(Page, '/cortex/redirect-domains')

    expect(cortexCalls('GET', '/redirect-domains')[0]?.query).toEqual({})
    expect(api).toHaveBeenCalledWith('/screens/cortex.redirect-domains', { query: { record: undefined, tab: undefined } })
    expect(wrapper.find(`[data-testid="cortex-domain-${redirectDomain.id}"]`).text()).toContain('https://claude.ai')
    expect(wrapper.find(`[data-testid="cortex-domain-${owned.id}"]`).text()).toContain('roster.organization')
  })

  it('adds a domain through redirect-domains.store, then reloads', async () => {
    mockPackageApi('cortex', {
      'GET /redirect-domains': { data: [] } as never,
      'POST /redirect-domains': { data: redirectDomain } as never
    })

    const wrapper = await mountCortexPage(Page, '/cortex/redirect-domains')
    await wrapper.find('[data-testid="cortex-domain"]').setValue('claude.ai')
    await wrapper.find('[data-testid="cortex-add-domain-form"]').trigger('submit')
    await settle()

    const [call] = cortexCalls('POST', '/redirect-domains')
    expect(call?.path).toBe('/redirect-domains')
    expect(call?.body).toEqual({ domain: 'claude.ai' })
    expect(cortexCalls('GET', '/redirect-domains')).toHaveLength(2)
  })

  it('shows the field errors of a 422', async () => {
    mockPackageApi('cortex', {
      'GET /redirect-domains': { data: [] } as never,
      'POST /redirect-domains': reply(422, { message: 'Invalid.', errors: { domain: ['The domain is not a valid origin.'] } })
    })

    const wrapper = await mountCortexPage(Page, '/cortex/redirect-domains')
    await wrapper.find('[data-testid="cortex-domain"]').setValue('javascript:alert(1)')
    await wrapper.find('[data-testid="cortex-add-domain-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The domain is not a valid origin.')
  })

  it('removes a domain through redirect-domains.destroy, then reloads', async () => {
    mockPackageApi('cortex', {
      'GET /redirect-domains': { data: [redirectDomain] } as never,
      'DELETE /redirect-domains/{domain}': reply(204)
    })

    const wrapper = await mountCortexPage(Page, '/cortex/redirect-domains')
    await wrapper.find(`[data-testid="cortex-remove-domain-${redirectDomain.id}"]`).trigger('click')
    await settle()

    const [call] = cortexCalls('DELETE', '/redirect-domains/{domain}')
    expect(call?.path).toBe(`/redirect-domains/${redirectDomain.id}`)
    expect(call?.body).toBeUndefined()
    expect(cortexCalls('GET', '/redirect-domains')).toHaveLength(2)
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', { 'GET /redirect-domains': reply(403) })

    const wrapper = await mountCortexPage(Page, '/cortex/redirect-domains')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows a forbidden add as no access', async () => {
    mockPackageApi('cortex', {
      'GET /redirect-domains': { data: [] } as never,
      'POST /redirect-domains': reply(403)
    })

    const wrapper = await mountCortexPage(Page, '/cortex/redirect-domains')
    await wrapper.find('[data-testid="cortex-domain"]').setValue('claude.ai')
    await wrapper.find('[data-testid="cortex-add-domain-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
