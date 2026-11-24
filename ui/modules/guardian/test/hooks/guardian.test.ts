import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { components } from '../../client/schema'
import GuardianAccessTab from '../../src/components/hooks/GuardianAccessTab.vue'
import GuardianScimTab from '../../src/components/hooks/GuardianScimTab.vue'
import GuardianSsoIdentitiesSection from '../../src/components/hooks/GuardianSsoIdentitiesSection.vue'
import GuardianSsoTab from '../../src/components/hooks/GuardianSsoTab.vue'
import GuardianUserSecurityTab from '../../src/components/hooks/GuardianUserSecurityTab.vue'
import { guardianAccessOf } from '../../src/components/hooks/hooks'
import { settle } from '@refactor-circus/atrium/testing'
import { integrationEntry, mockPackageApi, mountIntegration, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { assignment, editor, SCOPE_TYPES } from '../access/support'
import { asResource, identity, mountSso, oidc, scimToken, unmountSso } from '../sso/support'
import { confirmWith, cursorPage, guardianCalls, guardianScreensApi, page, resetGuardianPages, screenOptions } from '../support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * Guardian's hooks on Roster's screens (AC 97, 98): the `guardian.access`
 * tab on an organization (by scope) and on a user (by user, assigning in a
 * chosen scope); the `guardian.user-security` tab mounting group 33's
 * blocks; the SSO and SCIM tabs and the identities section wrapping group
 * 35's components; 403 on each; nothing without a record or Guardian.
 */

type Schemas = components['schemas']

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const session = {
  id: 'sess-1',
  current: false,
  ip: '203.0.113.5',
  user_agent: 'Firefox',
  device_id: null,
  device_name: 'Laptop',
  last_active_at: '2026-11-23T10:00:00+00:00',
  created_at: '2026-11-20T10:00:00+00:00'
} satisfies Schemas['SessionResource']

const orgAssignment = { ...assignment, scope_type: 'roster.organization', scope_id: 'acme' } satisfies Schemas['RoleAssignmentResource']

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /role-assignments': page([orgAssignment]) as never,
    'GET /roles': page([editor]) as never,
    'POST /role-assignments': { data: orgAssignment },
    'DELETE /role-assignments/{assignment}': reply(204),
    'GET /users/{user}/sessions': page([session]) as never,
    'GET /users/{user}/tokens': { data: [] },
    'GET /security-events': cursorPage([]) as never,
    'GET /organizations/{organization}/sso-connections': page([asResource(oidc)]) as never,
    'GET /organizations/{organization}/scim-tokens': page([scimToken]) as never,
    'GET /users/{user}/sso-identities': page([identity]) as never,
    ...overrides
  }
}

async function mountHook<T>(component: T, data: Record<string, unknown>, record: unknown, overrides: PackageRoutes<'guardian'> = {}) {
  mockPackageApi('guardian', routes(overrides))

  return mountSso(component, { props: { data, record }, roster: true })
}

describe('the Guardian hooks', () => {
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

  it('reads the access tab\'s mode from its data and record', () => {
    expect(guardianAccessOf({ scope_type: 'roster.organization' }, 'acme')).toEqual({ scopeType: 'roster.organization', scopeId: 'acme' })
    expect(guardianAccessOf({ scope_type: null }, 7)).toEqual({ user: '7' })
    expect(guardianAccessOf({}, '7')).toEqual({ user: '7' })
    expect(guardianAccessOf({ scope_type: 'roster.organization' }, null)).toBeNull()
  })

  describe('guardian.access on an organization', () => {
    it('lists the assignments in the organization\'s scope and links each role', async () => {
      const wrapper = await mountHook(GuardianAccessTab, { scope_type: 'roster.organization' }, 'acme')

      expect(guardianCalls('GET', '/role-assignments')[0]?.query).toEqual({ scope_type: 'roster.organization', scope_id: 'acme', per_page: '25' })
      expect(wrapper.find('[data-testid="guardian-assignment-role"]').attributes('href')).toBe('/guardian/roles/editor')
      expect(wrapper.find('[data-testid="guardian-assign-scope-type"]').exists()).toBe(false)
    })

    it('assigns a role to a user in that scope', async () => {
      const wrapper = await mountHook(GuardianAccessTab, { scope_type: 'roster.organization' }, 'acme')

      await wrapper.find('[data-testid="guardian-assign-user"]').setValue('9')
      await wrapper.find('[data-testid="guardian-assign-role"]').setValue('editor')
      await wrapper.find('[data-testid="guardian-assign-form"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/role-assignments')[0]?.body).toEqual({ user: '9', role: 'editor', scope_type: 'roster.organization', scope_id: 'acme' })
    })

    it('revokes an assignment once confirmed', async () => {
      confirmWith(true)
      const wrapper = await mountHook(GuardianAccessTab, { scope_type: 'roster.organization' }, 'acme')

      await wrapper.find('[data-testid="guardian-assignment-revoke-asg-1"]').trigger('click')
      await settle()

      expect(guardianCalls('DELETE', '/role-assignments/{assignment}')[0]?.path).toBe('/role-assignments/asg-1')
    })

    it('shows no access on a 403', async () => {
      const wrapper = await mountHook(GuardianAccessTab, { scope_type: 'roster.organization' }, 'acme', { 'GET /role-assignments': reply(403) })

      expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    })
  })

  describe('guardian.access on a user', () => {
    beforeEach(() => screenOptions('guardian.role-assignments', { scope_types: SCOPE_TYPES }))

    it('lists the user\'s assignments and assigns globally or in a chosen scope', async () => {
      const wrapper = await mountHook(GuardianAccessTab, { scope_type: null }, '7')

      expect(guardianCalls('GET', '/role-assignments')[0]?.query).toEqual({ user: '7', per_page: '25' })
      expect(api).toHaveBeenCalledWith('/screens/guardian.role-assignments')
      expect(wrapper.find('[data-testid="guardian-assign-user"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-testid="guardian-assign-scope-type"] option').map(option => option.attributes('value'))).toEqual(['', 'org', 'team'])

      await wrapper.find('[data-testid="guardian-assign-role"]').setValue('editor')
      await wrapper.find('[data-testid="guardian-assign-scope-type"]').setValue('org')
      await wrapper.find('[data-testid="guardian-assign-scope-id"]').setValue('acme')
      await wrapper.find('[data-testid="guardian-assign-form"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/role-assignments')[0]?.body).toEqual({ user: '7', role: 'editor', scope_type: 'org', scope_id: 'acme' })
    })

    it('assigns globally with no scope', async () => {
      const wrapper = await mountHook(GuardianAccessTab, { scope_type: null }, 7)

      await wrapper.find('[data-testid="guardian-assign-role"]').setValue('editor')
      await wrapper.find('[data-testid="guardian-assign-form"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/role-assignments')[0]?.body).toEqual({ user: '7', role: 'editor', scope_type: null, scope_id: null })
    })

    it('offers global only when the screen options cannot be read', async () => {
      api.mockImplementation(() => Promise.reject(new Error('403')))

      const wrapper = await mountHook(GuardianAccessTab, { scope_type: null }, '7')

      expect(wrapper.findAll('[data-testid="guardian-assign-scope-type"] option').map(option => option.attributes('value'))).toEqual([''])
    })

    it('shows no access on a 403', async () => {
      const wrapper = await mountHook(GuardianAccessTab, { scope_type: null }, '7', { 'GET /role-assignments': reply(403) })

      expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    })
  })

  describe('guardian.user-security', () => {
    it('mounts group 33\'s security blocks for the user record', async () => {
      const wrapper = await mountHook(GuardianUserSecurityTab, {}, '7')

      expect(wrapper.find('[data-testid="guardian-user-security"]').exists()).toBe(true)
      expect(guardianCalls('GET', '/users/{user}/sessions')[0]?.path).toBe('/users/7/sessions')
      expect(guardianCalls('GET', '/users/{user}/tokens')[0]?.path).toBe('/users/7/tokens')
      expect(guardianCalls('GET', '/security-events')[0]?.query).toMatchObject({ user: '7' })
      expect(wrapper.find('[data-testid="guardian-user-two-factor"]').exists()).toBe(true)
    })

    it('shows no access on a 403, block by block', async () => {
      const wrapper = await mountHook(GuardianUserSecurityTab, {}, '7', { 'GET /users/{user}/sessions': reply(403) })

      expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
      expect(guardianCalls('GET', '/users/{user}/tokens')).toHaveLength(1)
    })
  })

  describe('guardian.sso', () => {
    it('lists the organization record\'s connections', async () => {
      const wrapper = await mountHook(GuardianSsoTab, { scim_path: '/scim/v2' }, 'acme')

      expect(guardianCalls('GET', '/organizations/{organization}/sso-connections')[0]?.path).toBe('/organizations/acme/sso-connections')
      expect(wrapper.find('[data-testid="guardian-sso-connection-acme-okta"] a').attributes('href')).toBe('/guardian/sso-connections/acme-okta')
    })

    it('shows no access on a 403', async () => {
      const wrapper = await mountHook(GuardianSsoTab, { scim_path: '/scim/v2' }, 'acme', { 'GET /organizations/{organization}/sso-connections': reply(403) })

      expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    })
  })

  describe('guardian.scim', () => {
    it('lists the organization record\'s tokens, with the base URL from scim_path', async () => {
      const wrapper = await mountHook(GuardianScimTab, { scim_path: '/directory' }, 'acme')

      expect(guardianCalls('GET', '/organizations/{organization}/scim-tokens')[0]?.path).toBe('/organizations/acme/scim-tokens')
      expect(wrapper.find('[data-testid="guardian-scim-base-url"]').text()).toBe(`${window.location.origin}/directory/acme`)
      expect(wrapper.find('[data-testid="guardian-scim-token-scim-1"]').exists()).toBe(true)
    })

    it('shows no access on a 403', async () => {
      const wrapper = await mountHook(GuardianScimTab, { scim_path: '/scim/v2' }, 'acme', { 'GET /organizations/{organization}/scim-tokens': reply(403) })

      expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    })
  })

  describe('guardian.sso-identities', () => {
    it('lists the user record\'s identities, and renders nothing for none', async () => {
      const wrapper = await mountHook(GuardianSsoIdentitiesSection, {}, '7')

      expect(guardianCalls('GET', '/users/{user}/sso-identities')[0]?.path).toBe('/users/7/sso-identities')
      expect(wrapper.find('[data-testid="guardian-sso-identity-idn-1"]').exists()).toBe(true)
      unmountSso()
      resetPackageApis()
      clearAtriumData()

      const empty = await mountHook(GuardianSsoIdentitiesSection, {}, '7', { 'GET /users/{user}/sso-identities': page([]) as never })
      expect(empty.find('[data-testid="guardian-sso-identities"]').exists()).toBe(false)
    })

    it('shows no access on a 403', async () => {
      const wrapper = await mountHook(GuardianSsoIdentitiesSection, {}, '7', { 'GET /users/{user}/sso-identities': reply(403) })

      expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    })
  })

  it.each([
    ['guardian.access', GuardianAccessTab, { scope_type: 'roster.organization' }],
    ['guardian.user-security', GuardianUserSecurityTab, {}],
    ['guardian.sso', GuardianSsoTab, { scim_path: '/scim/v2' }],
    ['guardian.scim', GuardianScimTab, { scim_path: '/scim/v2' }],
    ['guardian.sso-identities', GuardianSsoIdentitiesSection, {}]
  ] as const)('renders %s as nothing without a record', async (_key, component, data) => {
    const wrapper = await mountHook(component, data, null)

    expect(wrapper.text().trim()).toBe('')
    expect(guardianCalls('GET', '/role-assignments')).toHaveLength(0)
  })

  it.each([
    ['guardian.access', GuardianAccessTab],
    ['guardian.user-security', GuardianUserSecurityTab],
    ['guardian.sso', GuardianSsoTab],
    ['guardian.scim', GuardianScimTab],
    ['guardian.sso-identities', GuardianSsoIdentitiesSection]
  ] as const)('renders %s as nothing while Guardian is not active', async (_key, component) => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountIntegration(component, 'roster', { props: { data: {}, record: '7' }, integrations: [integrationEntry('roster'), integrationEntry('guardian', { active: false })] } as never)
    await settle()

    expect(wrapper.text().trim()).toBe('')
    wrapper.unmount()
  })
})
