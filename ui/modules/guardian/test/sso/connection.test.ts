import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../../src/pages/sso-connections/[connection].vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, guardianCalls, guardianScreensApi, resetGuardianPages } from '../support'
import { asResource, mountSso, oidc, saml, unmountSso } from './support'
import { clearAtriumData, mockAtriumApi, mockNavigateTo, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.sso-connection` (AC 96): show; update with the name, the
 * flags and the protocol's settings (D-072), a blank secret keeping the
 * stored one; delete after a confirmation; the back link to the
 * organization's SSO tab only while Roster is active; 403, 404 and 422.
 */

const { api, navigate } = vi.hoisted(() => ({ api: vi.fn(), navigate: vi.fn() }))

mockAtriumApi(api)
mockNavigateTo(navigate)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /sso-connections/{connection}': { data: asResource(oidc) },
    'PATCH /sso-connections/{connection}': { data: asResource(oidc) },
    'DELETE /sso-connections/{connection}': reply(204),
    ...overrides
  }
}

async function mountPage(overrides: PackageRoutes<'guardian'> = {}, roster = false, slug = 'acme-okta') {
  mockPackageApi('guardian', routes(overrides))

  return mountSso(Page, { route: `/guardian/sso-connections/${slug}`, roster })
}

describe('guardian.sso-connection', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
    navigate.mockReset()
  })

  afterEach(async () => {
    unmountSso()
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('shows the connection, framed by its screen', async () => {
    const wrapper = await mountPage()

    expect(guardianCalls('GET', '/sso-connections/{connection}')[0]?.path).toBe('/sso-connections/acme-okta')
    expect(api).toHaveBeenCalledWith('/screens/guardian.sso-connection', expect.objectContaining({ query: expect.objectContaining({ record: 'acme-okta' }) }))
    expect(wrapper.find('[data-testid="guardian-sso-callback-url"]').text()).toBe(oidc.callback_url)
    expect(wrapper.find('[data-testid="guardian-sso-identities-count"]').text()).toBe('3')
    expect(wrapper.find('[data-testid="guardian-sso-metadata-url"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="guardian-sso-test-sign-in"]').attributes('href')).toBe(oidc.sign_in_url)
    expect((wrapper.find('[data-testid="guardian-sso-name"]').element as HTMLInputElement).value).toBe('Acme Okta')
    expect((wrapper.find('[data-testid="guardian-sso-issuer"]').element as HTMLInputElement).value).toBe('https://acme.okta.test')
    expect((wrapper.find('[data-testid="guardian-sso-client_secret"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('[data-testid="guardian-sso-jit"]').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.find('[data-testid="guardian-sso-enforced"]').element as HTMLInputElement).checked).toBe(false)
  })

  it('updates the name, flags and settings, keeping a blank secret', async () => {
    const wrapper = await mountPage()

    await wrapper.find('[data-testid="guardian-sso-name"]').setValue('Acme Okta SSO')
    await wrapper.find('[data-testid="guardian-sso-issuer"]').setValue('https://login.acme.test')
    await wrapper.find('[data-testid="guardian-sso-enforced"]').setValue(true)
    await wrapper.find('[data-testid="guardian-sso-jit"]').setValue(false)
    await wrapper.find('[data-testid="guardian-sso-enabled"]').setValue(false)
    await wrapper.find('[data-testid="guardian-sso-form"]').trigger('submit')
    await settle()

    const [call] = guardianCalls('PATCH', '/sso-connections/{connection}')
    expect(call?.path).toBe('/sso-connections/acme-okta')
    expect(call?.body).toEqual({
      name: 'Acme Okta SSO',
      enabled: false,
      enforced: true,
      jit: false,
      issuer: 'https://login.acme.test',
      client_id: 'client-1'
    })
    expect(wrapper.find('[data-testid="guardian-sso-saved"]').exists()).toBe(true)
  })

  it('sends a new secret, and clears a blanked setting', async () => {
    const wrapper = await mountPage()

    await wrapper.find('[data-testid="guardian-sso-client_secret"]').setValue('rotated')
    await wrapper.find('[data-testid="guardian-sso-client_id"]').setValue('')
    await wrapper.find('[data-testid="guardian-sso-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('PATCH', '/sso-connections/{connection}')[0]?.body).toMatchObject({ client_secret: 'rotated', client_id: null })
  })

  it('edits a SAML connection\'s own settings, the certificate as a textarea', async () => {
    const wrapper = await mountPage({ 'GET /sso-connections/{connection}': { data: asResource(saml) } }, false, 'acme-saml')

    expect(wrapper.find('[data-testid="guardian-sso-issuer"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="guardian-sso-metadata-url"]').text()).toBe(saml.metadata_url)
    expect(wrapper.find('[data-testid="guardian-sso-certificate"]').element.tagName).toBe('TEXTAREA')

    await wrapper.find('[data-testid="guardian-sso-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('PATCH', '/sso-connections/{connection}')[0]?.body).toEqual({
      name: 'Acme SAML',
      enabled: false,
      enforced: true,
      jit: true,
      metadata_url: null,
      entity_id: 'urn:acme',
      sso_url: 'https://idp.acme.test/sso'
    })
  })

  it('shows the field error of a 422', async () => {
    const wrapper = await mountPage({ 'PATCH /sso-connections/{connection}': reply(422, { message: 'Invalid.', errors: { issuer: ['The issuer must be a valid URL.'] } }) })

    await wrapper.find('[data-testid="guardian-sso-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The issuer must be a valid URL.')
    expect(wrapper.find('[data-testid="guardian-sso-saved"]').exists()).toBe(false)
  })

  it('links back to the organization\'s SSO tab only while Roster is active', async () => {
    const alone = await mountPage()
    expect(alone.find('[data-testid="guardian-sso-back"]').exists()).toBe(false)
    unmountSso()
    resetPackageApis()
    clearAtriumData()

    const withRoster = await mountPage({}, true)
    expect(withRoster.find('[data-testid="guardian-sso-back"]').attributes('href')).toBe('/roster/organizations/acme?tab=guardian.sso')
  })

  it('deletes the connection once confirmed, then returns to the organization', async () => {
    const confirm = confirmWith(false)
    const wrapper = await mountPage({}, true)

    await wrapper.find('[data-testid="guardian-sso-delete"]').trigger('click')
    await settle()
    expect(guardianCalls('DELETE', '/sso-connections/{connection}')).toHaveLength(0)

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="guardian-sso-delete"]').trigger('click')
    await settle()

    expect(confirm.mock.calls[0]?.[0]).toContain('Acme Okta')
    expect(guardianCalls('DELETE', '/sso-connections/{connection}')[0]?.path).toBe('/sso-connections/acme-okta')
    expect(navigate.mock.calls.map(call => call[0])).toEqual(['/roster/organizations/acme?tab=guardian.sso'])
  })

  it('goes home after a delete without Roster', async () => {
    confirmWith(true)
    const wrapper = await mountPage()

    await wrapper.find('[data-testid="guardian-sso-delete"]').trigger('click')
    await settle()

    expect(navigate.mock.calls.map(call => call[0])).toEqual(['/'])
  })

  it('shows no access when the delete answers 403', async () => {
    confirmWith(true)
    const wrapper = await mountPage({ 'DELETE /sso-connections/{connection}': reply(403) })

    await wrapper.find('[data-testid="guardian-sso-delete"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows no access on a 403 and not found on a 404', async () => {
    const denied = await mountPage({ 'GET /sso-connections/{connection}': reply(403) })
    expect(denied.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    unmountSso()
    resetPackageApis()
    clearAtriumData()

    const missing = await mountPage({ 'GET /sso-connections/{connection}': reply(404) }, false, 'nope')
    expect(missing.find('[data-testid="guardian-not-found"]').exists()).toBe(true)
  })

  it('never links a sign-in URL that is not http(s)', async () => {
    const wrapper = await mountPage({ 'GET /sso-connections/{connection}': { data: asResource({ ...oidc, sign_in_url: 'javascript:alert(1)' }) } })

    expect(wrapper.find('[data-testid="guardian-sso-test-sign-in"]').exists()).toBe(false)
  })
})
