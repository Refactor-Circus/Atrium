import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import Page from '../../../../app/pages/roster/users/[user].vue'
import { settle } from '../../../support'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '../../support'
import {
  acme,
  ada,
  assignment,
  auditor,
  confirmWith,
  editor,
  effective,
  globex,
  grace,
  impersonation,
  mountRosterPage,
  ops,
  page,
  resetRosterPages,
  rosterCalls,
  screensApi
} from './support'

/*
 * `roster.user` (AC 54, 69): the user (`users.show`), its memberships
 * (`organizations.index?user=`), role assignments, assignable roles and
 * effective permissions; then every v1 action, each asserted by method, path
 * and body: the account and profile updates, approve, reject, suspend,
 * deactivate and reactivate (v1's status form, per Roster AC 6), delete
 * (confirmed), restore, purge (confirmed), impersonate, switch context, domain
 * join, and role assign and revoke; a 422, 403 and 404.
 */

const { api, navigate } = vi.hoisted(() => ({ api: vi.fn(), navigate: vi.fn() }))

mockNuxtImport('useAtriumApi', () => () => api)
mockNuxtImport('navigateTo', () => navigate)

function routes(overrides: PackageRoutes<'roster'> = {}): PackageRoutes<'roster'> {
  return {
    'GET /users/{user}': { data: ada },
    'GET /organizations': page([acme, globex]),
    'GET /organizations/{organization}/teams': page([ops]),
    'GET /users/{user}/roles': page([assignment]),
    'GET /roles': page([editor, auditor]),
    'GET /users/{user}/permissions': { data: effective } as never,
    ...overrides
  }
}

async function mountUser(path = '/roster/users/7') {
  return mountRosterPage(Page, path)
}

describe('roster.user', () => {
  beforeEach(() => {
    clearNuxtData()
    api.mockReset()
    api.mockImplementation(screensApi)
    navigate.mockReset()
  })

  afterEach(async () => {
    resetRosterPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('loads the user, its memberships, roles and permissions, and its screen with the record', async () => {
    mockPackageApi('roster', routes())

    const wrapper = await mountUser()

    expect(rosterCalls('GET', '/users/{user}')[0]?.path).toBe('/users/7')
    expect(rosterCalls('GET', '/organizations')[0]?.query).toEqual({ user: '7', per_page: '100' })
    expect(rosterCalls('GET', '/users/{user}/roles')[0]?.query).toEqual({ per_page: '100' })
    expect(rosterCalls('GET', '/roles')[0]?.query).toEqual({ per_page: '100' })
    expect(rosterCalls('GET', '/users/{user}/permissions')[0]?.path).toBe('/users/7/permissions')
    expect(api).toHaveBeenCalledWith('/screens/roster.user', { query: { record: '7', tab: undefined } })

    expect(wrapper.find('[data-testid="roster-user-title"]').text()).toBe('Ada L.')
    expect(wrapper.find('[data-testid="roster-user-status-badge"]').text()).toBe('Active')
    expect(wrapper.find('[data-testid="roster-membership-acme"]').text()).toContain('Current')
    expect(wrapper.find('[data-testid="roster-assignment-01JASSIGNMENT"]').text()).toContain('Editor')
    expect(wrapper.find('[data-testid="roster-user-permissions"]').text()).toContain('roster.users.update')
    // Only shared roles and those of the user's organizations can be assigned.
    const roles = wrapper.findAll('[data-testid="roster-assign-role"] option').map(option => option.attributes('value'))
    expect(roles).toContain(editor.id)
    expect(roles).not.toContain(auditor.id)
  })

  it('updates the account through users.update, leaving out a blank password, then reloads', async () => {
    mockPackageApi('roster', routes({ 'PATCH /users/{user}': { data: ada } }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-account-email"]').setValue('ada@lovelace.dev')
    await wrapper.find('[data-testid="roster-user-account-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('PATCH', '/users/{user}')
    expect(call?.path).toBe('/users/7')
    expect(call?.body).toEqual({ name: 'Ada Lovelace', email: 'ada@lovelace.dev' })
    expect(rosterCalls('GET', '/users/{user}')).toHaveLength(2)
  })

  it('shows the field errors of a 422 on the account', async () => {
    mockPackageApi('roster', routes({ 'PATCH /users/{user}': reply(422, { message: 'Invalid.', errors: { password: ['The password must be at least 8 characters.'] } }) }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-account-password"]').setValue('short')
    await wrapper.find('[data-testid="roster-user-account-form"]').trigger('submit')
    await settle()

    expect(rosterCalls('PATCH', '/users/{user}')[0]?.body).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'short' })
    expect(wrapper.text()).toContain('The password must be at least 8 characters.')
  })

  it('updates the profile through users.profile.update, then reloads', async () => {
    mockPackageApi('roster', routes({ 'PATCH /users/{user}/profile': { data: ada } }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-profile-bio"]').setValue('Wrote the first program.')
    await wrapper.find('[data-testid="roster-user-profile-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('PATCH', '/users/{user}/profile')
    expect(call?.path).toBe('/users/7/profile')
    expect(call?.body).toEqual({ display_name: 'Ada L.', avatar_url: null, timezone: 'Europe/London', locale: 'en', bio: 'Wrote the first program.' })
    expect(rosterCalls('GET', '/users/{user}')).toHaveLength(2)
  })

  it('approves a pending user', async () => {
    mockPackageApi('roster', routes({ 'GET /users/{user}': { data: grace }, 'POST /users/{user}/approve': { data: ada } }))

    const wrapper = await mountUser('/roster/users/8')
    await wrapper.find('[data-testid="roster-user-approve"]').trigger('click')
    await settle()

    const [call] = rosterCalls('POST', '/users/{user}/approve')
    expect(call?.path).toBe('/users/8/approve')
    expect(call?.body).toBeUndefined()
    expect(rosterCalls('GET', '/users/{user}')).toHaveLength(2)
  })

  it('rejects a pending user with a reason', async () => {
    mockPackageApi('roster', routes({ 'GET /users/{user}': { data: grace }, 'POST /users/{user}/reject': { data: grace } }))

    const wrapper = await mountUser('/roster/users/8')
    await wrapper.find('[data-testid="roster-user-reject-reason"]').setValue('Unknown applicant')
    await wrapper.find('[data-testid="roster-user-reject-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('POST', '/users/{user}/reject')
    expect(call?.path).toBe('/users/8/reject')
    expect(call?.body).toEqual({ reason: 'Unknown applicant' })
  })

  it('offers no approval to an active user', async () => {
    mockPackageApi('roster', routes())

    const wrapper = await mountUser()

    expect(wrapper.find('[data-testid="roster-user-approval"]').exists()).toBe(false)
  })

  it('suspends the user with a reason, through users.suspend', async () => {
    mockPackageApi('roster', routes({ 'POST /users/{user}/suspend': { data: ada } }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-user-new-status"]').setValue('suspended')
    await wrapper.find('[data-testid="roster-user-status-reason"]').setValue('Chargeback')
    await wrapper.find('[data-testid="roster-user-status-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('POST', '/users/{user}/suspend')
    expect(call?.path).toBe('/users/7/suspend')
    expect(call?.body).toEqual({ reason: 'Chargeback' })
    expect(rosterCalls('GET', '/users/{user}')).toHaveLength(2)
  })

  it('deactivates the user with a reason, through users.deactivate', async () => {
    mockPackageApi('roster', routes({ 'POST /users/{user}/deactivate': { data: ada } }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-user-new-status"]').setValue('deactivated')
    await wrapper.find('[data-testid="roster-user-status-reason"]').setValue('Left the company')
    await wrapper.find('[data-testid="roster-user-status-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('POST', '/users/{user}/deactivate')
    expect(call?.path).toBe('/users/7/deactivate')
    expect(call?.body).toEqual({ reason: 'Left the company' })
  })

  it('reactivates a suspended user through users.reactivate, with no body', async () => {
    mockPackageApi('roster', routes({
      'GET /users/{user}': { data: { ...ada, status: 'suspended', status_reason: 'Chargeback' } },
      'POST /users/{user}/reactivate': { data: ada }
    }))

    const wrapper = await mountUser()

    expect(wrapper.text()).toContain('Chargeback')
    const choices = wrapper.findAll('[data-testid="roster-user-new-status"] option').map(option => option.attributes('value'))
    expect(choices).toEqual(['active', 'deactivated'])

    await wrapper.find('[data-testid="roster-user-new-status"]').setValue('active')
    await wrapper.find('[data-testid="roster-user-status-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('POST', '/users/{user}/reactivate')
    expect(call?.path).toBe('/users/7/reactivate')
    expect(call?.body).toBeUndefined()
  })

  it('switches the user\'s context through users.context.update', async () => {
    mockPackageApi('roster', routes({ 'PUT /users/{user}/context': { data: ada } }))

    const wrapper = await mountUser()

    expect((wrapper.find('[data-testid="roster-user-context-organization"]').element as HTMLSelectElement).value).toBe('acme')
    expect(rosterCalls('GET', '/organizations/{organization}/teams')[0]?.path).toBe('/organizations/acme/teams')

    await wrapper.find('[data-testid="roster-user-context-team"]').setValue('ops')
    await wrapper.find('[data-testid="roster-user-context-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('PUT', '/users/{user}/context')
    expect(call?.path).toBe('/users/7/context')
    expect(call?.body).toEqual({ organization: 'acme', team: 'ops' })
    expect(rosterCalls('GET', '/users/{user}')).toHaveLength(2)
  })

  it('runs the domain join and says how many organizations it joined', async () => {
    mockPackageApi('roster', routes({ 'POST /users/{user}/domain-join': { data: [globex] } }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-user-domain-join"]').trigger('click')
    await settle()

    const [call] = rosterCalls('POST', '/users/{user}/domain-join')
    expect(call?.path).toBe('/users/7/domain-join')
    expect(call?.body).toBeUndefined()
    expect(wrapper.find('[data-testid="roster-user-notice"]').text()).toContain('1')
    expect(rosterCalls('GET', '/organizations')).toHaveLength(2)
  })

  it('assigns a role in an organization and team through users.roles.store', async () => {
    mockPackageApi('roster', routes({ 'POST /users/{user}/roles': { data: assignment } }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-assign-role"]').setValue(editor.id)
    await wrapper.find('[data-testid="roster-assign-organization"]').setValue('acme')
    await settle()
    await wrapper.find('[data-testid="roster-assign-team"]').setValue('ops')
    await wrapper.find('[data-testid="roster-user-assign-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('POST', '/users/{user}/roles')
    expect(call?.path).toBe('/users/7/roles')
    expect(call?.body).toEqual({ role: editor.id, organization: 'acme', team: 'ops' })
    expect(rosterCalls('GET', '/users/{user}/roles')).toHaveLength(2)
  })

  it('assigns a role globally, with no organization or team', async () => {
    mockPackageApi('roster', routes({ 'POST /users/{user}/roles': { data: assignment } }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-assign-role"]').setValue(editor.id)
    await wrapper.find('[data-testid="roster-user-assign-form"]').trigger('submit')
    await settle()

    expect(rosterCalls('POST', '/users/{user}/roles')[0]?.body).toEqual({ role: editor.id, organization: null, team: null })
  })

  it('shows the field errors of a 422 on assign', async () => {
    mockPackageApi('roster', routes({ 'POST /users/{user}/roles': reply(422, { message: 'Invalid.', errors: { role: ['This role cannot be assigned globally.'] } }) }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-assign-role"]').setValue(editor.id)
    await wrapper.find('[data-testid="roster-user-assign-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('This role cannot be assigned globally.')
  })

  it('revokes a role assignment through users.roles.destroy', async () => {
    mockPackageApi('roster', routes({ 'DELETE /users/{user}/roles/{assignment}': reply(204) }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-revoke-01JASSIGNMENT"]').trigger('click')
    await settle()

    const [call] = rosterCalls('DELETE', '/users/{user}/roles/{assignment}')
    expect(call?.path).toBe('/users/7/roles/01JASSIGNMENT')
    expect(call?.body).toBeUndefined()
    expect(rosterCalls('GET', '/users/{user}/roles')).toHaveLength(2)
  })

  it('impersonates the user with a reason, then follows the one-time link', async () => {
    mockPackageApi('roster', routes({ 'POST /users/{user}/impersonate': { data: impersonation, url: 'https://app.test/roster/impersonate/abc' } as never }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-user-impersonation-reason"]').setValue('Ticket 42')
    await wrapper.find('[data-testid="roster-user-impersonate-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('POST', '/users/{user}/impersonate')
    expect(call?.path).toBe('/users/7/impersonate')
    expect(call?.body).toEqual({ reason: 'Ticket 42' })
    expect(navigate).toHaveBeenCalledWith('https://app.test/roster/impersonate/abc', { external: true })
  })

  it('deletes the user only after a confirmation, then offers restore', async () => {
    const confirm = confirmWith(false)
    mockPackageApi('roster', routes({ 'DELETE /users/{user}': reply(204), 'POST /users/{user}/restore': { data: ada } }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-user-delete"]').trigger('click')
    await settle()

    expect(rosterCalls('DELETE', '/users/{user}')).toHaveLength(0)

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="roster-user-delete"]').trigger('click')
    await settle()

    expect(rosterCalls('DELETE', '/users/{user}')[0]?.path).toBe('/users/7')
    expect(rosterCalls('DELETE', '/users/{user}')[0]?.body).toBeUndefined()
    expect(wrapper.find('[data-testid="roster-user-deleted"]').exists()).toBe(true)

    await wrapper.find('[data-testid="roster-user-restore"]').trigger('click')
    await settle()

    const [restore] = rosterCalls('POST', '/users/{user}/restore')
    expect(restore?.path).toBe('/users/7/restore')
    expect(restore?.body).toBeUndefined()
    expect(rosterCalls('GET', '/users/{user}')).toHaveLength(2)
    expect(wrapper.find('[data-testid="roster-user-deleted"]').exists()).toBe(false)
  })

  it('purges a deleted user after a confirmation, then shows the deleted users', async () => {
    confirmWith(true)
    mockPackageApi('roster', routes({ 'DELETE /users/{user}': reply(204), 'DELETE /users/{user}/purge': reply(204) }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-user-delete"]').trigger('click')
    await settle()
    await wrapper.find('[data-testid="roster-user-purge"]').trigger('click')
    await settle()

    const [call] = rosterCalls('DELETE', '/users/{user}/purge')
    expect(call?.path).toBe('/users/7/purge')
    expect(call?.body).toBeUndefined()
    await vi.waitFor(() => expect(useRouter().currentRoute.value.fullPath).toBe('/roster/users?trashed=only'))
  })

  it('shows the no-access notice when an action answers 403', async () => {
    mockPackageApi('roster', routes({ 'POST /users/{user}/suspend': reply(403) }))

    const wrapper = await mountUser()
    await wrapper.find('[data-testid="roster-user-new-status"]').setValue('suspended')
    await wrapper.find('[data-testid="roster-user-status-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-user-account-form"]').exists()).toBe(true)
  })

  it('shows the roles card as no access when the roles answer 403', async () => {
    mockPackageApi('roster', routes({ 'GET /users/{user}/roles': reply(403) }))

    const wrapper = await mountUser()

    expect(wrapper.find('[data-testid="roster-user-roles"] [data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-user-assign-form"]').exists()).toBe(false)
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('roster', routes({ 'GET /users/{user}': reply(403) }))

    const wrapper = await mountUser()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-user-account-form"]').exists()).toBe(false)
  })

  it('shows a not-found state on a 404', async () => {
    mockPackageApi('roster', routes({ 'GET /users/{user}': reply(404) }))

    const wrapper = await mountUser('/roster/users/404')

    expect(wrapper.find('[data-testid="roster-not-found"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-user-account-form"]').exists()).toBe(false)
  })
})
