import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../../src/pages/role-assignments/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, guardianCalls, guardianScreensApi, mountGuardianPage, page, resetGuardianPages, screenOptions } from '../support'
import { assignment, editor, ESCALATION, globalAssignment, SCOPE_TYPES } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.role-assignments` (AC 89): the filters `user`, `role`,
 * `scope_type` and `scope_id`; paging as Guardian pages; assign (user, role,
 * scope type from the option, scope id); revoke after a confirmation; the
 * escalation guard's 422; links to the user and the role; 403.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /role-assignments': page([assignment, globalAssignment], 1, 3) as never,
    'GET /roles': page([editor]) as never,
    ...overrides
  }
}

describe('guardian.role-assignments', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
    screenOptions('guardian.role-assignments', { scope_types: SCOPE_TYPES })
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('lists the assignments, linking each user and role, with the scope by its key', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/role-assignments')
    const row = wrapper.find('[data-testid="guardian-assignment-asg-1"]')

    expect(guardianCalls('GET', '/role-assignments')[0]?.query).toEqual({ per_page: '25' })
    expect(row.find('[data-testid="guardian-assignment-user"]').attributes('href')).toBe('/guardian/users/7')
    expect(row.find('[data-testid="guardian-assignment-role"]').attributes('href')).toBe('/guardian/roles/editor')
    expect(row.text()).toContain('organization acme')
    expect(wrapper.find('[data-testid="guardian-assignment-asg-2"]').text()).toContain('Global')
  })

  it('filters by user, role, scope type and scope id', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/role-assignments')
    await wrapper.find('[data-testid="guardian-assignments-filter-user"]').setValue('7')
    await wrapper.find('[data-testid="guardian-assignments-filter-role"]').setValue('editor')
    await wrapper.find('[data-testid="guardian-assignments-filter-scope-type"]').setValue('org')
    await wrapper.find('[data-testid="guardian-assignments-filter-scope-id"]').setValue('acme')
    await wrapper.find('[data-testid="guardian-assignments-filters"]').trigger('submit')
    await settle()

    expect(guardianCalls('GET', '/role-assignments').at(-1)?.query).toEqual({ user: '7', role: 'editor', scope_type: 'org', scope_id: 'acme', per_page: '25' })

    await wrapper.find('[data-testid="guardian-assignments-clear"]').trigger('click')
    await settle()

    expect(guardianCalls('GET', '/role-assignments').at(-1)?.query).toEqual({ per_page: '25' })
  })

  it('pages as Guardian pages', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/role-assignments')

    expect(wrapper.find('[data-testid="guardian-assignments-page"]').text()).toContain('1 of 3')

    await wrapper.find('[data-testid="guardian-assignments-next"]').trigger('click')
    await settle()

    expect(guardianCalls('GET', '/role-assignments').at(-1)?.query).toEqual({ per_page: '25', page: '2' })
  })

  it('assigns a role in a scope', async () => {
    mockPackageApi('guardian', routes({ 'POST /role-assignments': { data: assignment } }))

    const wrapper = await mountGuardianPage(Page, '/guardian/role-assignments')
    await wrapper.find('[data-testid="guardian-assign-user"]').setValue('7')
    await wrapper.find('[data-testid="guardian-assign-role"]').setValue('editor')
    await wrapper.find('[data-testid="guardian-assign-scope-type"]').setValue('org')
    await settle()
    await wrapper.find('[data-testid="guardian-assign-scope-id"]').setValue('acme')
    await wrapper.find('[data-testid="guardian-assign-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('GET', '/roles')[0]?.query).toEqual({ per_page: '100' })
    expect(guardianCalls('POST', '/role-assignments')[0]?.body).toEqual({ user: '7', role: 'editor', scope_type: 'org', scope_id: 'acme' })
    expect(guardianCalls('GET', '/role-assignments')).toHaveLength(2)
  })

  it('assigns a role globally', async () => {
    mockPackageApi('guardian', routes({ 'POST /role-assignments': { data: globalAssignment } }))

    const wrapper = await mountGuardianPage(Page, '/guardian/role-assignments')
    await wrapper.find('[data-testid="guardian-assign-user"]').setValue('7')
    await wrapper.find('[data-testid="guardian-assign-role"]').setValue('editor')
    await wrapper.find('[data-testid="guardian-assign-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/role-assignments')[0]?.body).toEqual({ user: '7', role: 'editor', scope_type: null, scope_id: null })
  })

  it('lists the permissions the escalation guard names on a 422', async () => {
    mockPackageApi('guardian', routes({ 'POST /role-assignments': reply(422, ESCALATION) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/role-assignments')
    await wrapper.find('[data-testid="guardian-assign-user"]').setValue('7')
    await wrapper.find('[data-testid="guardian-assign-role"]').setValue('editor')
    await wrapper.find('[data-testid="guardian-assign-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="guardian-assign-errors"]').text()).toContain('posts.publish and posts.delete')
  })

  it('revokes only once confirmed, showing a refusal', async () => {
    const confirm = confirmWith(false)
    mockPackageApi('guardian', routes({ 'DELETE /role-assignments/{assignment}': reply(422, ESCALATION) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/role-assignments')
    await wrapper.find('[data-testid="guardian-assignment-revoke-asg-1"]').trigger('click')
    await settle()
    expect(guardianCalls('DELETE', '/role-assignments/{assignment}')).toHaveLength(0)

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="guardian-assignment-revoke-asg-1"]').trigger('click')
    await settle()

    expect(guardianCalls('DELETE', '/role-assignments/{assignment}')[0]?.path).toBe('/role-assignments/asg-1')
    expect(wrapper.find('[data-testid="guardian-revoke-errors"]').text()).toContain('posts.publish')
  })

  it('shows no access on a 403', async () => {
    mockPackageApi('guardian', routes({ 'GET /role-assignments': reply(403) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/role-assignments')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
