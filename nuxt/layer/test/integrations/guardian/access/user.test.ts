import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import type { components } from '../../../../app/integrations/guardian/client/schema'
import Page from '../../../../app/pages/guardian/users/[user].vue'
import { settle } from '../../../support'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '../../support'
import { confirmWith, cursorPage, guardianCalls, guardianScreensApi, mountGuardianPage, page, resetGuardianPages, screenOptions } from '../support'
import { assignment, editor, SCOPE_TYPES } from './support'

/*
 * `guardian.user` (AC 90, D-055): role assignments with assign and revoke;
 * abilities with and without a scope; sessions with "revoke all"; tokens
 * with "revoke all", hidden on 501; recent events; the two-factor reset,
 * confirmed by naming the user; and each block's own 403.
 */

type Schemas = components['schemas']

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockNuxtImport('useAtriumApi', () => () => api)

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

const token = { id: 'tok-1', name: 'CI', abilities: ['*'], last_used_at: null, expires_at: null, created_at: null } satisfies Schemas['TokenResource']

const event = { id: 'evt-1', type: 'login.failed', ip: '203.0.113.5', identifier_hash: null, context: {}, occurred_at: '2026-11-23T10:00:00+00:00' } as Schemas['SecurityEventResource']

const abilities = { user_id: '7', scope_type: null, scope_id: null, super_admin: false, abilities: ['posts.edit', 'posts.view'] } satisfies Schemas['UserAbilitiesResource']

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /role-assignments': page([assignment]) as never,
    'GET /roles': page([editor]) as never,
    'GET /users/{user}/abilities': { data: abilities },
    'GET /users/{user}/sessions': page([session]) as never,
    'GET /users/{user}/tokens': { data: [token] },
    'GET /security-events': cursorPage([event]) as never,
    ...overrides
  }
}

async function mountUser(overrides: PackageRoutes<'guardian'> = {}) {
  mockPackageApi('guardian', routes(overrides))

  return mountGuardianPage(Page, '/guardian/users/7')
}

describe('guardian.user', () => {
  beforeEach(() => {
    clearNuxtData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
    screenOptions('guardian.user', { scope_types: SCOPE_TYPES, token_abilities: ['*'] })
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('loads every block for the user, and the screen with the record', async () => {
    const wrapper = await mountUser()

    expect(api).toHaveBeenCalledWith('/screens/guardian.user', { query: { record: '7', tab: undefined } })
    expect(guardianCalls('GET', '/role-assignments')[0]?.query).toEqual({ user: '7', per_page: '25' })
    expect(guardianCalls('GET', '/users/{user}/abilities')[0]?.path).toBe('/users/7/abilities')
    expect(guardianCalls('GET', '/users/{user}/abilities')[0]?.query).toEqual({})
    expect(guardianCalls('GET', '/users/{user}/sessions')[0]?.path).toBe('/users/7/sessions')
    expect(guardianCalls('GET', '/users/{user}/tokens')[0]?.path).toBe('/users/7/tokens')
    expect(guardianCalls('GET', '/security-events')[0]?.query).toEqual({ user: '7', per_page: '20' })

    expect(wrapper.find('[data-testid="guardian-assignment-asg-1"]').text()).toContain('Editor')
    expect(wrapper.find('[data-testid="guardian-abilities-list"]').text()).toContain('posts.edit')
    expect(wrapper.find('[data-testid="guardian-user-session-sess-1"]').text()).toContain('Laptop')
    expect(wrapper.find('[data-testid="guardian-user-token-tok-1"]').text()).toContain('CI')
    expect(wrapper.find('[data-testid="guardian-user-event-evt-1"]').text()).toContain('login.failed')
    // No other user's two-factor status: Guardian has no route for it.
    expect(guardianCalls('GET', '/two-factor')).toHaveLength(0)
  })

  it('assigns a role to the user globally, and in a scope', async () => {
    const wrapper = await mountUser({ 'POST /role-assignments': { data: assignment } })

    expect(wrapper.find('[data-testid="guardian-assign-user"]').exists()).toBe(false)

    await wrapper.find('[data-testid="guardian-assign-role"]').setValue('editor')
    await wrapper.find('[data-testid="guardian-assign-form"]').trigger('submit')
    await settle()

    await wrapper.find('[data-testid="guardian-assign-role"]').setValue('editor')
    await wrapper.find('[data-testid="guardian-assign-scope-type"]').setValue('team')
    await settle()
    await wrapper.find('[data-testid="guardian-assign-scope-id"]').setValue('ops')
    await wrapper.find('[data-testid="guardian-assign-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/role-assignments').map(call => call.body)).toEqual([
      { user: '7', role: 'editor', scope_type: null, scope_id: null },
      { user: '7', role: 'editor', scope_type: 'team', scope_id: 'ops' }
    ])
  })

  it('revokes an assignment once confirmed', async () => {
    confirmWith(true)
    const wrapper = await mountUser({ 'DELETE /role-assignments/{assignment}': reply(204) })

    await wrapper.find('[data-testid="guardian-assignment-revoke-asg-1"]').trigger('click')
    await settle()

    expect(guardianCalls('DELETE', '/role-assignments/{assignment}')[0]?.path).toBe('/role-assignments/asg-1')
  })

  it('shows the abilities in a scope', async () => {
    const wrapper = await mountUser()

    await wrapper.find('[data-testid="guardian-abilities-scope-type"]').setValue('org')
    await settle()
    await wrapper.find('[data-testid="guardian-abilities-scope-id"]').setValue('acme')
    await wrapper.find('[data-testid="guardian-abilities-scope"]').trigger('submit')
    await settle()

    expect(guardianCalls('GET', '/users/{user}/abilities').at(-1)?.query).toEqual({ scope_type: 'org', scope_id: 'acme' })
  })

  it('says super admin for a super admin', async () => {
    const wrapper = await mountUser({ 'GET /users/{user}/abilities': { data: { ...abilities, super_admin: true, abilities: null } } })

    expect(wrapper.find('[data-testid="guardian-abilities-super"]').exists()).toBe(true)
  })

  it('revokes every session once confirmed', async () => {
    const confirm = confirmWith(true)
    const wrapper = await mountUser({ 'DELETE /users/{user}/sessions': { revoked: 3 } })

    await wrapper.find('[data-testid="guardian-user-sessions-revoke"]').trigger('click')
    await settle()

    expect(confirm.mock.calls[0]?.[0]).toContain('7')
    expect(guardianCalls('DELETE', '/users/{user}/sessions')[0]?.path).toBe('/users/7/sessions')
    expect(wrapper.find('[data-testid="guardian-user-sessions-notice"]').text()).toContain('3')
  })

  it('revokes every token once confirmed', async () => {
    confirmWith(true)
    const wrapper = await mountUser({ 'DELETE /users/{user}/tokens': { revoked: 1 } })

    await wrapper.find('[data-testid="guardian-user-tokens-revoke"]').trigger('click')
    await settle()

    expect(guardianCalls('DELETE', '/users/{user}/tokens')[0]?.path).toBe('/users/7/tokens')
    expect(guardianCalls('GET', '/users/{user}/tokens')).toHaveLength(2)
  })

  it('hides the tokens block on a 501', async () => {
    const wrapper = await mountUser({ 'GET /users/{user}/tokens': reply(501, { message: 'No API token driver is configured.' }) })

    expect(wrapper.find('[data-testid="guardian-user-tokens"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="guardian-user-sessions"]').exists()).toBe(true)
  })

  it('resets two-factor only once a confirmation naming the user is accepted', async () => {
    const confirm = confirmWith(false)
    const wrapper = await mountUser({ 'DELETE /users/{user}/two-factor': reply(204) })

    await wrapper.find('[data-testid="guardian-user-two-factor-reset"]').trigger('click')
    await settle()
    expect(guardianCalls('DELETE', '/users/{user}/two-factor')).toHaveLength(0)
    expect(confirm.mock.calls[0]?.[0]).toContain('7')

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="guardian-user-two-factor-reset"]').trigger('click')
    await settle()

    expect(guardianCalls('DELETE', '/users/{user}/two-factor')[0]?.path).toBe('/users/7/two-factor')
    expect(wrapper.find('[data-testid="guardian-user-two-factor-done"]').exists()).toBe(true)
  })

  it.each([
    ['assignments', 'GET /role-assignments', 'guardian-user-assignments'],
    ['abilities', 'GET /users/{user}/abilities', 'guardian-user-abilities'],
    ['sessions', 'GET /users/{user}/sessions', 'guardian-user-sessions'],
    ['tokens', 'GET /users/{user}/tokens', 'guardian-user-tokens'],
    ['events', 'GET /security-events', 'guardian-user-events']
  ] as const)('shows no access in the %s block only', async (_, route, block) => {
    const wrapper = await mountUser({ [route]: reply(403) } as PackageRoutes<'guardian'>)

    expect(wrapper.find(`[data-testid="${block}"] [data-testid="atrium-no-access"]`).exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="atrium-no-access"]')).toHaveLength(1)
  })

  it('shows no access in the two-factor block only when the reset answers 403', async () => {
    confirmWith(true)
    const wrapper = await mountUser({ 'DELETE /users/{user}/two-factor': reply(403) })

    await wrapper.find('[data-testid="guardian-user-two-factor-reset"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="guardian-user-two-factor"] [data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="atrium-no-access"]')).toHaveLength(1)
  })
})
