import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scimBaseUrl } from '../../src/components/sso/sso'
import GuardianScimTokens from '../../src/components/sso/GuardianScimTokens.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, guardianCalls, guardianScreensApi, page, resetGuardianPages } from '../support'
import { asResource, mountSso, oidc, revokedToken, scimToken, unmountSso } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * The `guardian.scim` tab's component (AC 96, D-058): the tokens; a new
 * token (`name`, `expires_in_days`, `sso_connection`) whose plain value
 * shows once and is never stored; revoking after a confirmation; the base
 * URL from Guardian's API origin, `scim_path` and the record; 403 and 422.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const PLAIN = 'scim_plain_0123456789abcdef'

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /organizations/{organization}/scim-tokens': page([scimToken, revokedToken]) as never,
    'GET /organizations/{organization}/sso-connections': page([asResource(oidc)]) as never,
    'POST /organizations/{organization}/scim-tokens': { data: scimToken, token: PLAIN },
    'DELETE /scim-tokens/{token}': { data: { ...scimToken, revoked_at: '2026-11-23T10:00:00+00:00' } },
    ...overrides
  }
}

async function mountTab(overrides: PackageRoutes<'guardian'> = {}, scimPath: string | null = '/scim/v2') {
  mockPackageApi('guardian', routes(overrides))

  return mountSso(GuardianScimTokens, { props: { organization: 'acme', scimPath } })
}

function storageHolds(value: string): boolean {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)!

      if (key.includes(value) || (storage.getItem(key) ?? '').includes(value)) {
        return true
      }
    }
  }

  return false
}

describe('the guardian.scim tab', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
  })

  afterEach(async () => {
    unmountSso()
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('builds the base URL from Guardian\'s API origin, the scim path and the organization', () => {
    expect(scimBaseUrl('https://api.example.test/guardian', '/scim/v2', 'acme')).toBe('https://api.example.test/scim/v2/acme')
    expect(scimBaseUrl('https://api.example.test/guardian', 'directory/', 'acme corp')).toBe('https://api.example.test/directory/acme%20corp')
    expect(scimBaseUrl('https://api.example.test/guardian', null, 'acme')).toBe('https://api.example.test/scim/v2/acme')
    expect(scimBaseUrl(null, '/scim/v2', 'acme')).toBeNull()
  })

  it('lists the tokens and shows the base URL', async () => {
    const wrapper = await mountTab()

    const [call] = guardianCalls('GET', '/organizations/{organization}/scim-tokens')
    expect(call?.path).toBe('/organizations/acme/scim-tokens')
    expect(call?.query).toEqual({ per_page: '25' })
    expect(wrapper.find('[data-testid="guardian-scim-base-url"]').text()).toBe(`${window.location.origin}/scim/v2/acme`)
    expect(wrapper.find('[data-testid="guardian-scim-token-scim-1"]').text()).toContain('Okta sync')
    expect(wrapper.find('[data-testid="guardian-scim-token-scim-2"]').text()).toContain('Revoked')
    expect(wrapper.find('[data-testid="guardian-scim-revoke-scim-2"]').exists()).toBe(false)
  })

  it('issues a token with every field, shows the plain token once and never stores it', async () => {
    const wrapper = await mountTab()

    expect(wrapper.findAll('[data-testid="guardian-scim-connection"] option').map(option => option.attributes('value'))).toEqual(['', 'acme-okta'])

    await wrapper.find('[data-testid="guardian-scim-name"]').setValue(' Okta sync ')
    await wrapper.find('[data-testid="guardian-scim-expires"]').setValue('90')
    await wrapper.find('[data-testid="guardian-scim-connection"]').setValue('acme-okta')
    await wrapper.find('[data-testid="guardian-scim-form"]').trigger('submit')
    await settle()

    const [call] = guardianCalls('POST', '/organizations/{organization}/scim-tokens')
    expect(call?.path).toBe('/organizations/acme/scim-tokens')
    expect(call?.body).toEqual({ name: 'Okta sync', expires_in_days: 90, sso_connection: 'acme-okta' })
    expect(wrapper.find('[data-testid="guardian-scim-plain-token"]').text()).toBe(PLAIN)
    expect(storageHolds(PLAIN)).toBe(false)
    expect(window.location.href).not.toContain(PLAIN)
    expect(guardianCalls('GET', '/organizations/{organization}/scim-tokens')).toHaveLength(2)

    unmountSso()
    resetPackageApis()
    clearAtriumData()

    const again = await mountTab()
    expect(again.find('[data-testid="guardian-scim-plain"]').exists()).toBe(false)
    expect(again.text()).not.toContain(PLAIN)
  })

  it('sends no expiry or connection when left blank', async () => {
    const wrapper = await mountTab()

    await wrapper.find('[data-testid="guardian-scim-name"]').setValue('Plain')
    await wrapper.find('[data-testid="guardian-scim-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/organizations/{organization}/scim-tokens')[0]?.body).toEqual({ name: 'Plain', expires_in_days: null, sso_connection: null })
    expect(wrapper.find('[data-testid="guardian-scim-plain"]').exists()).toBe(true)
  })

  it('shows the field error of a 422 and no token', async () => {
    const wrapper = await mountTab({ 'POST /organizations/{organization}/scim-tokens': reply(422, { message: 'Invalid.', errors: { expires_in_days: ['The expires in days must be at least 1.'] } }) })

    await wrapper.find('[data-testid="guardian-scim-name"]').setValue('Bad')
    await wrapper.find('[data-testid="guardian-scim-expires"]').setValue('0')
    await wrapper.find('[data-testid="guardian-scim-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The expires in days must be at least 1.')
    expect(wrapper.find('[data-testid="guardian-scim-plain"]').exists()).toBe(false)
  })

  it('revokes a token once confirmed, and not when declined', async () => {
    const confirm = confirmWith(false)
    const wrapper = await mountTab()

    await wrapper.find('[data-testid="guardian-scim-revoke-scim-1"]').trigger('click')
    await settle()
    expect(guardianCalls('DELETE', '/scim-tokens/{token}')).toHaveLength(0)

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="guardian-scim-revoke-scim-1"]').trigger('click')
    await settle()

    expect(confirm.mock.calls[0]?.[0]).toContain('Okta sync')
    expect(guardianCalls('DELETE', '/scim-tokens/{token}')[0]?.path).toBe('/scim-tokens/scim-1')
  })

  it('shows no access when revoking answers 403', async () => {
    confirmWith(true)
    const wrapper = await mountTab({ 'DELETE /scim-tokens/{token}': reply(403) })

    await wrapper.find('[data-testid="guardian-scim-revoke-scim-1"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows no access when the list answers 403', async () => {
    const wrapper = await mountTab({ 'GET /organizations/{organization}/scim-tokens': reply(403) })

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
