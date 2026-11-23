import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import Page from '../../../../app/pages/roster/roles/[role].vue'
import { settle } from '../../../support'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '../../support'
import { mountRosterPage, page, resetRosterPages, rosterCalls, screensApi } from '../users/support'
import { customRole, editorDetail, reportsExport, superRole, usersUpdate, usersView } from './support'

/*
 * `roster.role` (AC 54, 69): one role (`roster.roles.show`) with v1's edit
 * form (name, description and the permission checkboxes) saved through
 * `roster.roles.update`, and delete (`roster.roles.destroy`) for a role that
 * is not built in, then the roles list. A super role shows v1's hint instead
 * of the form. A 422 shows the field errors, a 403 no access and a 404 not
 * found.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockNuxtImport('useAtriumApi', () => () => api)

const PATH = `/roster/roles/${customRole.id}`

function rosterWith(overrides: PackageRoutes<'roster'> = {}): void {
  mockPackageApi('roster', {
    'GET /roles/{role}': call => ({ data: [customRole, editorDetail, superRole].find(role => call.path === `/roles/${role.id}`) ?? customRole }),
    'GET /permissions': page([reportsExport, usersUpdate, usersView]),
    ...overrides
  })
}

describe('roster.role', () => {
  beforeEach(() => {
    clearNuxtData()
    api.mockReset()
    api.mockImplementation(screensApi)
  })

  afterEach(async () => {
    resetRosterPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('loads the role, ticks its permissions, and calls atrium.screens.show with its key and record', async () => {
    rosterWith()

    const wrapper = await mountRosterPage(Page, PATH)

    expect(rosterCalls('GET', '/roles/{role}')[0]?.path).toBe(`/roles/${customRole.id}`)
    expect(api).toHaveBeenCalledWith('/screens/roster.role', expect.objectContaining({ query: expect.objectContaining({ record: customRole.id }) }))
    expect(wrapper.find('[data-testid="roster-role-title"]').text()).toBe('Support')
    expect(wrapper.find('[data-testid="roster-role-scope"]').text()).toContain('acme')
    expect((wrapper.find('[data-testid="roster-role-name"]').element as HTMLInputElement).value).toBe('Support')
    expect((wrapper.find('[data-testid="roster-role-permission-roster.users.view"]').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.find('[data-testid="roster-role-permission-reports.export"]').element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.find('[data-testid="roster-role-back"]').attributes('href')).toBe('/roster/roles')
  })

  it('updates the role with the old form\'s fields, then reloads', async () => {
    rosterWith({ 'PATCH /roles/{role}': { data: customRole } })

    const wrapper = await mountRosterPage(Page, PATH)
    await wrapper.find('[data-testid="roster-role-name"]').setValue('Helpdesk')
    await wrapper.find('[data-testid="roster-role-description"]').setValue('Answers tickets.')
    await wrapper.find('[data-testid="roster-role-permission-reports.export"]').setValue(true)
    await wrapper.find('[data-testid="roster-role-permission-roster.users.view"]').setValue(false)
    await wrapper.find('[data-testid="roster-role-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('PATCH', '/roles/{role}')
    expect(call?.path).toBe(`/roles/${customRole.id}`)
    expect(call?.body).toEqual({ name: 'Helpdesk', description: 'Answers tickets.', permissions: ['reports.export'] })
    expect(rosterCalls('GET', '/roles/{role}')).toHaveLength(2)
  })

  it('sends no permissions when every box is cleared, so the role loses them all', async () => {
    rosterWith({ 'PATCH /roles/{role}': { data: customRole } })

    const wrapper = await mountRosterPage(Page, PATH)
    await wrapper.find('[data-testid="roster-role-permission-roster.users.view"]').setValue(false)
    await wrapper.find('[data-testid="roster-role-form"]').trigger('submit')
    await settle()

    expect(rosterCalls('PATCH', '/roles/{role}')[0]?.body).toEqual({ name: 'Support', description: null, permissions: [] })
  })

  it('shows the field errors of a 422 on update', async () => {
    rosterWith({ 'PATCH /roles/{role}': reply(422, { message: 'Invalid.', errors: { name: ['The name has already been taken.'] } }) })

    const wrapper = await mountRosterPage(Page, PATH)
    await wrapper.find('[data-testid="roster-role-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The name has already been taken.')
  })

  it('deletes a custom role, then returns to the roles list', async () => {
    rosterWith({ 'DELETE /roles/{role}': reply(204) })

    const wrapper = await mountRosterPage(Page, PATH)
    await wrapper.find('[data-testid="roster-role-delete"]').trigger('click')
    await settle()

    const [call] = rosterCalls('DELETE', '/roles/{role}')
    expect(call?.path).toBe(`/roles/${customRole.id}`)
    expect(call?.body).toBeUndefined()
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/roster/roles'))
  })

  it('offers no delete for a built-in role', async () => {
    rosterWith()

    const wrapper = await mountRosterPage(Page, `/roster/roles/${editorDetail.id}`)

    expect(wrapper.find('[data-testid="roster-role-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-role-delete"]').exists()).toBe(false)
  })

  it('shows the super role hint instead of the form', async () => {
    rosterWith()

    const wrapper = await mountRosterPage(Page, `/roster/roles/${superRole.id}`)

    expect(wrapper.find('[data-testid="roster-role-super"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-role-form"]').exists()).toBe(false)
  })

  it('shows the no-access notice when an action answers 403', async () => {
    rosterWith({ 'DELETE /roles/{role}': reply(403) })

    const wrapper = await mountRosterPage(Page, PATH)
    await wrapper.find('[data-testid="roster-role-delete"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(useRouter().currentRoute.value.path).toBe(PATH)
  })

  it('shows the no-access state on a 403', async () => {
    rosterWith({ 'GET /roles/{role}': reply(403) })

    const wrapper = await mountRosterPage(Page, PATH)

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-role-form"]').exists()).toBe(false)
  })

  it('shows the not-found state on a 404', async () => {
    rosterWith({ 'GET /roles/{role}': reply(404) })

    const wrapper = await mountRosterPage(Page, PATH)

    expect(wrapper.find('[data-testid="roster-not-found"]').text()).toContain('This role was not found.')
  })
})
