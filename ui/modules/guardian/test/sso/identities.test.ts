import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GuardianSsoIdentities from '../../src/components/sso/GuardianSsoIdentities.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, guardianCalls, guardianScreensApi, page, resetGuardianPages } from '../support'
import { identity, mountSso, unmountSso } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * The `guardian.sso-identities` section's component (AC 96): a user's
 * identities, nothing at all when there are none, unlinking after a
 * confirmation, 403 and 422.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /users/{user}/sso-identities': page([identity]) as never,
    'DELETE /sso-identities/{identity}': reply(204),
    ...overrides
  }
}

async function mountSection(overrides: PackageRoutes<'guardian'> = {}) {
  mockPackageApi('guardian', routes(overrides))

  return mountSso(GuardianSsoIdentities, { props: { user: '7' } })
}

describe('the guardian.sso-identities section', () => {
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

  it('lists the user\'s identities', async () => {
    const wrapper = await mountSection()

    const [call] = guardianCalls('GET', '/users/{user}/sso-identities')
    expect(call?.path).toBe('/users/7/sso-identities')
    expect(call?.query).toEqual({ per_page: '50' })
    expect(wrapper.find('[data-testid="guardian-sso-identity-idn-1"]').text()).toContain('acme-okta')
    expect(wrapper.find('[data-testid="guardian-sso-identity-idn-1"]').text()).toContain('jane@acme.test')
  })

  it('renders nothing when the user has no identity', async () => {
    const wrapper = await mountSection({ 'GET /users/{user}/sso-identities': page([]) as never })

    expect(wrapper.find('[data-testid="guardian-sso-identities"]').exists()).toBe(false)
    expect(wrapper.text().trim()).toBe('')
  })

  it('unlinks an identity once confirmed, and not when declined', async () => {
    const confirm = confirmWith(false)
    const wrapper = await mountSection()

    await wrapper.find('[data-testid="guardian-sso-identity-unlink-idn-1"]').trigger('click')
    await settle()
    expect(guardianCalls('DELETE', '/sso-identities/{identity}')).toHaveLength(0)

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="guardian-sso-identity-unlink-idn-1"]').trigger('click')
    await settle()

    expect(confirm.mock.calls[0]?.[0]).toContain('jane@acme.test')
    expect(guardianCalls('DELETE', '/sso-identities/{identity}')[0]?.path).toBe('/sso-identities/idn-1')
    expect(guardianCalls('GET', '/users/{user}/sso-identities')).toHaveLength(2)
  })

  it('shows the message of a 422 and of a 403 on unlink', async () => {
    confirmWith(true)
    const wrapper = await mountSection({ 'DELETE /sso-identities/{identity}': reply(422, { message: 'This identity cannot be unlinked.', errors: { identity: ['The only way this user signs in.'] } }) })

    await wrapper.find('[data-testid="guardian-sso-identity-unlink-idn-1"]').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('The only way this user signs in.')
    unmountSso()
    resetPackageApis()
    clearAtriumData()

    const denied = await mountSection({ 'DELETE /sso-identities/{identity}': reply(403) })
    await denied.find('[data-testid="guardian-sso-identity-unlink-idn-1"]').trigger('click')
    await settle()

    expect(denied.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows no access when the list answers 403', async () => {
    const wrapper = await mountSection({ 'GET /users/{user}/sso-identities': reply(403) })

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
