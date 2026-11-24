import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../../src/pages/permissions/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, guardianCalls, guardianScreensApi, mountGuardianPage, page, resetGuardianPages } from '../support'
import { postsEdit, rolesView } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.permissions` (AC 89): list and search; create, update and
 * delete; `system` rows with rename and delete disabled; 422 and 403.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return { 'GET /permissions': page([postsEdit, rolesView]) as never, ...overrides }
}

describe('guardian.permissions', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('lists the permissions and searches them', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/permissions')

    expect(guardianCalls('GET', '/permissions')[0]?.query).toEqual({ per_page: '50' })
    expect(wrapper.findAll('[data-testid^="guardian-permission-"][data-testid$="edit"], [data-testid="guardian-permission-guardian.roles.view"]')).toHaveLength(2)

    await wrapper.find('[data-testid="guardian-permissions-search-input"]').setValue('posts')
    await wrapper.find('[data-testid="guardian-permissions-search"]').trigger('submit')
    await settle()

    expect(guardianCalls('GET', '/permissions')[1]?.query).toEqual({ per_page: '50', search: 'posts' })
  })

  it('creates a permission', async () => {
    mockPackageApi('guardian', routes({ 'POST /permissions': { data: postsEdit } }))

    const wrapper = await mountGuardianPage(Page, '/guardian/permissions')
    await wrapper.find('[data-testid="guardian-permission-new-name"]').setValue('posts.publish')
    await wrapper.find('[data-testid="guardian-permission-new-description"]').setValue('Publish posts.')
    await wrapper.find('[data-testid="guardian-permission-new-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/permissions')[0]?.body).toEqual({ name: 'posts.publish', description: 'Publish posts.' })
    expect(guardianCalls('GET', '/permissions')).toHaveLength(2)
  })

  it('shows the field error of a 422 on create', async () => {
    mockPackageApi('guardian', routes({ 'POST /permissions': reply(422, { message: 'Invalid.', errors: { name: ['The name format is invalid.'] } }) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/permissions')
    await wrapper.find('[data-testid="guardian-permission-new-name"]').setValue('Bad Name')
    await wrapper.find('[data-testid="guardian-permission-new-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The name format is invalid.')
  })

  it('renames and describes a custom permission', async () => {
    mockPackageApi('guardian', routes({ 'PATCH /permissions/{permission}': { data: postsEdit } }))

    const wrapper = await mountGuardianPage(Page, '/guardian/permissions')
    const row = wrapper.find('[data-testid="guardian-permission-posts.edit"]')
    await row.find('[data-testid="guardian-permission-name"]').setValue('posts.update')
    await row.find('[data-testid="guardian-permission-description"]').setValue('Update posts.')
    await row.find('[data-testid="guardian-permission-save"]').trigger('click')
    await settle()

    const [call] = guardianCalls('PATCH', '/permissions/{permission}')
    expect(call?.path).toBe('/permissions/posts.edit')
    expect(call?.body).toEqual({ name: 'posts.update', description: 'Update posts.' })
  })

  it('locks a system permission\'s name and delete, and saves only its description', async () => {
    mockPackageApi('guardian', routes({ 'PATCH /permissions/{permission}': { data: rolesView } }))

    const wrapper = await mountGuardianPage(Page, '/guardian/permissions')
    const row = wrapper.find('[data-testid="guardian-permission-guardian.roles.view"]')

    expect(row.find('[data-testid="guardian-permission-name"]').attributes('disabled')).toBeDefined()
    expect(row.find('[data-testid="guardian-permission-delete"]').attributes('disabled')).toBeDefined()

    await row.find('[data-testid="guardian-permission-description"]').setValue('See roles.')
    await row.find('[data-testid="guardian-permission-save"]').trigger('click')
    await settle()

    expect(guardianCalls('PATCH', '/permissions/{permission}')[0]?.body).toEqual({ description: 'See roles.' })
  })

  it('deletes a custom permission once confirmed', async () => {
    const confirm = confirmWith(true)
    mockPackageApi('guardian', routes({ 'DELETE /permissions/{permission}': reply(204) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/permissions')
    await wrapper.find('[data-testid="guardian-permission-posts.edit"] [data-testid="guardian-permission-delete"]').trigger('click')
    await settle()

    expect(confirm.mock.calls[0]?.[0]).toContain('posts.edit')
    expect(guardianCalls('DELETE', '/permissions/{permission}')[0]?.path).toBe('/permissions/posts.edit')
  })

  it('shows no access on a 403', async () => {
    mockPackageApi('guardian', routes({ 'GET /permissions': reply(403) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/permissions')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
