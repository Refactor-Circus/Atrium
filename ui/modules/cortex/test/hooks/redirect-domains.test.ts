import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import CortexRedirectDomains from '../../src/components/hooks/CortexRedirectDomains.vue'
import type { CortexRedirectDomain } from '../../src/components/cortex'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, mountIntegration, reply, resetPackageApis, type PackageCall } from '@refactor-circus/atrium/testing'

/*
 * The Cortex redirect-domains hook (AC 65): the `cortex.mcp` tab on
 * `roster.organization` and the `cortex.redirect-domains` section in
 * `roster.user`'s aside render this component with `{owner_type}` and the
 * record key. It lists the owner's domains, adds and removes one, and shows a
 * 422's field errors and a 403's no-access state.
 */

enableAutoUnmount(afterEach)

const owned = {
  id: '01JD7Z5K3X',
  domain: 'https://acme.test',
  owner_type: 'roster.organization',
  owner_id: 'acme',
  created_at: '2026-11-01T10:00:00+00:00',
  updated_at: '2026-11-01T10:00:00+00:00'
} satisfies CortexRedirectDomain

const calls = (all: readonly PackageCall[], method: string, route: string) => all.filter(call => call.method === method && call.route === route)

async function mountHook(record: unknown = 'acme', data: Record<string, unknown> = { owner_type: 'roster.organization' }) {
  const wrapper = await mountIntegration(CortexRedirectDomains, 'cortex', { props: { data, record } })
  await settle()

  return wrapper
}

describe('the Cortex redirect-domains hook', () => {
  afterEach(() => resetPackageApis())

  it('lists the domains of the record, by owner_type and owner_id', async () => {
    const api = mockPackageApi('cortex', { 'GET /redirect-domains': { data: [owned] } as never })

    const wrapper = await mountHook()

    expect(calls(api, 'GET', '/redirect-domains')[0]?.query).toEqual({ owner_type: 'roster.organization', owner_id: 'acme' })
    expect(wrapper.find(`[data-testid="hooks-redirect-domain-${owned.id}"]`).text()).toContain('https://acme.test')
  })

  it('sends a numeric record key as the owner id', async () => {
    const api = mockPackageApi('cortex', { 'GET /redirect-domains': { data: [] } as never })

    const wrapper = await mountHook(7, { owner_type: 'roster.user' })

    expect(calls(api, 'GET', '/redirect-domains')[0]?.query).toEqual({ owner_type: 'roster.user', owner_id: '7' })
    expect(wrapper.find('[data-testid="hooks-redirect-domains-empty"]').exists()).toBe(true)
  })

  it('adds a domain for the owner through redirect-domains.store, then reloads', async () => {
    const api = mockPackageApi('cortex', {
      'GET /redirect-domains': { data: [] } as never,
      'POST /redirect-domains': { data: owned } as never
    })

    const wrapper = await mountHook()
    await wrapper.find('[data-testid="hooks-redirect-domain"]').setValue('https://acme.test')
    await wrapper.find('[data-testid="hooks-add-redirect-domain-form"]').trigger('submit')
    await settle()

    const [call] = calls(api, 'POST', '/redirect-domains')
    expect(call?.body).toEqual({ domain: 'https://acme.test', owner_type: 'roster.organization', owner_id: 'acme' })
    expect(calls(api, 'GET', '/redirect-domains')).toHaveLength(2)
  })

  it('removes a domain through redirect-domains.destroy, then reloads', async () => {
    const api = mockPackageApi('cortex', {
      'GET /redirect-domains': { data: [owned] } as never,
      'DELETE /redirect-domains/{domain}': reply(204)
    })

    const wrapper = await mountHook()
    await wrapper.find(`[data-testid="hooks-remove-redirect-domain-${owned.id}"]`).trigger('click')
    await settle()

    const [call] = calls(api, 'DELETE', '/redirect-domains/{domain}')
    expect(call?.path).toBe(`/redirect-domains/${owned.id}`)
    expect(calls(api, 'GET', '/redirect-domains')).toHaveLength(2)
  })

  it('shows the field errors of a 422 and does not reload', async () => {
    const api = mockPackageApi('cortex', {
      'GET /redirect-domains': { data: [] } as never,
      'POST /redirect-domains': reply(422, { message: 'Invalid.', errors: { domain: ['The domain is not a valid origin.'] } })
    })

    const wrapper = await mountHook()
    await wrapper.find('[data-testid="hooks-redirect-domain"]').setValue('javascript:alert(1)')
    await wrapper.find('[data-testid="hooks-add-redirect-domain-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The domain is not a valid origin.')
    expect(calls(api, 'GET', '/redirect-domains')).toHaveLength(1)
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('cortex', { 'GET /redirect-domains': reply(403) })

    const wrapper = await mountHook()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="hooks-add-redirect-domain-form"]').exists()).toBe(false)
  })

  it('renders nothing and calls nothing without a record or an owner type', async () => {
    for (const [record, data] of [[null, { owner_type: 'roster.user' }], ['acme', {}]] as const) {
      const api = mockPackageApi('cortex', { 'GET /redirect-domains': { data: [] } as never })

      const wrapper = await mountHook(record, data)

      expect(wrapper.find('[data-testid="hooks-redirect-domains"]').exists()).toBe(false)
      expect(api).toEqual([])

      resetPackageApis()
    }
  })
})
