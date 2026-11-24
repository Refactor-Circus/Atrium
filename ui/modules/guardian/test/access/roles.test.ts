import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RolesPage from '../../src/pages/roles/index.vue'
import RolePage from '../../src/pages/roles/[role].vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, guardianCalls, guardianScreensApi, mountGuardianPage, page, resetGuardianPages, screenOptions } from '../support'
import { editor, ESCALATION, postsEdit, rolesView, SCOPE_TYPES, superAdmin } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.roles` and `guardian.role` (AC 89): list; create with name,
 * slug, scope (`global`, `any` and the `scope_types` option), description
 * and permissions; show; update with the permission picker; delete after a
 * confirmation; the escalation guard's 422 naming the missing permissions;
 * 403 and 404.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /roles': page([editor, superAdmin]) as never,
    'GET /roles/{role}': { data: editor },
    'GET /permissions': page([postsEdit, rolesView]) as never,
    ...overrides
  }
}

describe('guardian.roles', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
    screenOptions('guardian.roles', { scope_types: SCOPE_TYPES })
    screenOptions('guardian.role', { scope_types: SCOPE_TYPES })
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('lists the roles a page at a time, with their scopes', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(RolesPage, '/guardian/roles')

    expect(guardianCalls('GET', '/roles')[0]?.query).toEqual({ per_page: '25' })
    expect(wrapper.find('[data-testid="guardian-role-row-editor"]').text()).toContain('Any scope')
    expect(wrapper.find('[data-testid="guardian-role-row-super-admin"]').text()).toContain('Everything')
    expect(wrapper.find('[data-testid="guardian-role-row-editor"] a').attributes('href')).toBe('/guardian/roles/editor')
  })

  it('offers global, any and each scope type, and creates a role, then opens it', async () => {
    mockPackageApi('guardian', routes({ 'POST /roles': { data: { ...editor, slug: 'reviewer', name: 'Reviewer' } } }))

    const wrapper = await mountGuardianPage(RolesPage, '/guardian/roles')

    expect(wrapper.findAll('[data-testid="guardian-role-new-scope"] option').map(option => option.attributes('value'))).toEqual(['global', 'any', 'org', 'team'])

    await wrapper.find('[data-testid="guardian-role-new-name"]').setValue('Reviewer')
    await wrapper.find('[data-testid="guardian-role-new-slug"]').setValue('reviewer')
    await wrapper.find('[data-testid="guardian-role-new-scope"]').setValue('org')
    await wrapper.find('[data-testid="guardian-role-new-description"]').setValue('Reviews posts.')
    await wrapper.find('[data-testid="guardian-role-new-permission-posts.edit"]').setValue(true)
    await wrapper.find('[data-testid="guardian-role-new-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/roles')[0]?.body).toEqual({ name: 'Reviewer', slug: 'reviewer', scope: 'org', description: 'Reviews posts.', permissions: ['posts.edit'] })
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/guardian/roles/reviewer'))
  })

  it('sends a blank slug and description as null', async () => {
    mockPackageApi('guardian', routes({ 'POST /roles': { data: editor } }))

    const wrapper = await mountGuardianPage(RolesPage, '/guardian/roles')
    await wrapper.find('[data-testid="guardian-role-new-name"]').setValue('Editor')
    await wrapper.find('[data-testid="guardian-role-new-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/roles')[0]?.body).toEqual({ name: 'Editor', slug: null, scope: 'global', description: null, permissions: [] })
  })

  it('lists the permissions the escalation guard names on a 422', async () => {
    mockPackageApi('guardian', routes({ 'POST /roles': reply(422, ESCALATION) }))

    const wrapper = await mountGuardianPage(RolesPage, '/guardian/roles')
    await wrapper.find('[data-testid="guardian-role-new-name"]').setValue('Publisher')
    await wrapper.find('[data-testid="guardian-role-new-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="guardian-role-new-errors"]').text()).toContain('posts.publish and posts.delete')
    expect(useRouter().currentRoute.value.path).toBe('/guardian/roles')
  })

  it('shows no access on a 403', async () => {
    mockPackageApi('guardian', routes({ 'GET /roles': reply(403) }))

    const wrapper = await mountGuardianPage(RolesPage, '/guardian/roles')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})

describe('guardian.role', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
    screenOptions('guardian.role', { scope_types: SCOPE_TYPES })
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('shows the role, with its record on the screen call', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(RolePage, '/guardian/roles/editor')

    expect(guardianCalls('GET', '/roles/{role}')[0]?.path).toBe('/roles/editor')
    expect(api).toHaveBeenCalledWith('/screens/guardian.role', { query: { record: 'editor', tab: undefined } })
    expect(wrapper.find('[data-testid="guardian-role-slug"]').text()).toBe('editor')
    expect((wrapper.find('[data-testid="guardian-role-name"]').element as HTMLInputElement).value).toBe('Editor')
    expect((wrapper.find('[data-testid="guardian-role-permission-posts.edit"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('updates its name, description and permissions through the picker', async () => {
    mockPackageApi('guardian', routes({ 'PATCH /roles/{role}': { data: editor } }))

    const wrapper = await mountGuardianPage(RolePage, '/guardian/roles/editor')
    await wrapper.find('[data-testid="guardian-role-name"]').setValue('Senior editor')
    await wrapper.find('[data-testid="guardian-role-permission-guardian.roles.view"]').setValue(true)
    await wrapper.find('[data-testid="guardian-role-form"]').trigger('submit')
    await settle()

    const [call] = guardianCalls('PATCH', '/roles/{role}')
    expect(call?.path).toBe('/roles/editor')
    expect(call?.body).toEqual({ name: 'Senior editor', description: 'Edits content.', permissions: ['posts.edit', 'guardian.roles.view'] })
    expect(wrapper.find('[data-testid="guardian-role-saved"]').exists()).toBe(true)
  })

  it('sends no permission list for a super role', async () => {
    mockPackageApi('guardian', routes({ 'GET /roles/{role}': { data: superAdmin }, 'PATCH /roles/{role}': { data: superAdmin } }))

    const wrapper = await mountGuardianPage(RolePage, '/guardian/roles/super-admin')
    await wrapper.find('[data-testid="guardian-role-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('PATCH', '/roles/{role}')[0]?.body).toEqual({ name: 'Super admin', description: null })
  })

  it('lists the permissions the escalation guard names on a 422', async () => {
    mockPackageApi('guardian', routes({ 'PATCH /roles/{role}': reply(422, ESCALATION) }))

    const wrapper = await mountGuardianPage(RolePage, '/guardian/roles/editor')
    await wrapper.find('[data-testid="guardian-role-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="guardian-role-save-errors"]').text()).toContain('posts.publish')
  })

  it('deletes only once confirmed, then opens the roles list', async () => {
    const confirm = confirmWith(false)
    mockPackageApi('guardian', routes({ 'DELETE /roles/{role}': reply(204) }))

    const wrapper = await mountGuardianPage(RolePage, '/guardian/roles/editor')
    await wrapper.find('[data-testid="guardian-role-delete"]').trigger('click')
    await settle()
    expect(guardianCalls('DELETE', '/roles/{role}')).toHaveLength(0)

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="guardian-role-delete"]').trigger('click')
    await settle()

    expect(confirm.mock.calls[1]?.[0]).toContain('Editor')
    expect(guardianCalls('DELETE', '/roles/{role}')[0]?.path).toBe('/roles/editor')
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/guardian/roles'))
  })

  it.each([
    [403, 'atrium-no-access'],
    [404, 'guardian-not-found']
  ])('shows the %s state', async (status, testid) => {
    mockPackageApi('guardian', routes({ 'GET /roles/{role}': reply(status) }))

    const wrapper = await mountGuardianPage(RolePage, '/guardian/roles/missing')

    expect(wrapper.find(`[data-testid="${testid}"]`).exists()).toBe(true)
  })
})
