import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GuardianSsoConnections from '../../src/components/sso/GuardianSsoConnections.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { guardianCalls, guardianScreensApi, page, resetGuardianPages } from '../support'
import { asResource, mountSso, oidc, saml, unmountSso } from './support'
import { clearAtriumData, mockAtriumApi, mockNavigateTo, useRouter } from '@refactor-circus/atrium/testing'

/*
 * The `guardian.sso` tab's component (AC 96): the organization's
 * connections, each linked to its page; a new connection with its name,
 * protocol and that protocol's settings (D-072); 403 and 422.
 */

const { api, navigate } = vi.hoisted(() => ({ api: vi.fn(), navigate: vi.fn() }))

mockAtriumApi(api)
mockNavigateTo(navigate)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /organizations/{organization}/sso-connections': page([asResource(oidc), asResource(saml)]) as never,
    'POST /organizations/{organization}/sso-connections': { data: asResource(oidc) },
    ...overrides
  }
}

async function mountTab(overrides: PackageRoutes<'guardian'> = {}) {
  mockPackageApi('guardian', routes(overrides))

  return mountSso(GuardianSsoConnections, { props: { organization: 'acme' } })
}

describe('the guardian.sso tab', () => {
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

  it('lists the organization\'s connections, each linked to its page', async () => {
    const wrapper = await mountTab()

    const [call] = guardianCalls('GET', '/organizations/{organization}/sso-connections')
    expect(call?.path).toBe('/organizations/acme/sso-connections')
    expect(call?.query).toEqual({ per_page: '25' })

    const row = wrapper.find('[data-testid="guardian-sso-connection-acme-okta"]')
    expect(row.text()).toContain('OpenID Connect')
    expect(row.text()).toContain('3')
    expect(row.find('a').attributes('href')).toBe('/guardian/sso-connections/acme-okta')

    const disabled = wrapper.find('[data-testid="guardian-sso-connection-acme-saml"]')
    expect(disabled.text()).toContain('Enforced')
    expect(disabled.text()).toContain('Disabled')
  })

  it('says when the organization has no connections', async () => {
    const wrapper = await mountTab({ 'GET /organizations/{organization}/sso-connections': page([]) as never })

    expect(wrapper.find('[data-testid="guardian-sso-connections-empty"]').exists()).toBe(true)
  })

  it('creates a connection with its name, protocol and settings, then opens it', async () => {
    const wrapper = await mountTab()

    expect(wrapper.find('[data-testid="guardian-sso-new-issuer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guardian-sso-new-tenant"]').exists()).toBe(false)

    await wrapper.find('[data-testid="guardian-sso-new-name"]').setValue(' Acme Entra ')
    await wrapper.find('[data-testid="guardian-sso-new-protocol"]').setValue('azure')

    expect(wrapper.find('[data-testid="guardian-sso-new-issuer"]').exists()).toBe(false)

    await wrapper.find('[data-testid="guardian-sso-new-tenant"]').setValue('acme.onmicrosoft.com')
    await wrapper.find('[data-testid="guardian-sso-new-client_id"]').setValue('client-2')
    await wrapper.find('[data-testid="guardian-sso-new-client_secret"]').setValue('s3cret')
    await wrapper.find('[data-testid="guardian-sso-new-form"]').trigger('submit')
    await settle()

    const [call] = guardianCalls('POST', '/organizations/{organization}/sso-connections')
    expect(call?.path).toBe('/organizations/acme/sso-connections')
    expect(call?.body).toEqual({ name: 'Acme Entra', protocol: 'azure', tenant: 'acme.onmicrosoft.com', client_id: 'client-2', client_secret: 's3cret' })
    expect(navigate.mock.calls.map(call => call[0])).toEqual(['/guardian/sso-connections/acme-okta'])
  })

  it('creates a SAML connection with its own fields only', async () => {
    const wrapper = await mountTab()

    await wrapper.find('[data-testid="guardian-sso-new-name"]').setValue('Acme SAML')
    await wrapper.find('[data-testid="guardian-sso-new-protocol"]').setValue('saml')
    await wrapper.find('[data-testid="guardian-sso-new-metadata_url"]').setValue('https://idp.acme.test/metadata')
    await wrapper.find('[data-testid="guardian-sso-new-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/organizations/{organization}/sso-connections')[0]?.body).toEqual({ name: 'Acme SAML', protocol: 'saml', metadata_url: 'https://idp.acme.test/metadata' })
  })

  it('shows the field error of a 422 and stays', async () => {
    const wrapper = await mountTab({ 'POST /organizations/{organization}/sso-connections': reply(422, { message: 'Invalid.', errors: { issuer: ['The issuer setting is required.'] } }) })

    await wrapper.find('[data-testid="guardian-sso-new-name"]').setValue('Acme')
    await wrapper.find('[data-testid="guardian-sso-new-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The issuer setting is required.')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows no access when creating answers 403', async () => {
    const wrapper = await mountTab({ 'POST /organizations/{organization}/sso-connections': reply(403) })

    await wrapper.find('[data-testid="guardian-sso-new-name"]').setValue('Acme')
    await wrapper.find('[data-testid="guardian-sso-new-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows no access when the list answers 403', async () => {
    const wrapper = await mountTab({ 'GET /organizations/{organization}/sso-connections': reply(403) })

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guardian-sso-new-form"]').exists()).toBe(false)
  })
})
