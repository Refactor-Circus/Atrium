import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import Page from '../../../../app/pages/roster/permissions/index.vue'
import { settle } from '../../../support'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '../../support'
import { mountRosterPage, page, resetRosterPages, rosterCalls, screensApi } from '../users/support'
import { reportsExport, usersUpdate, usersView } from './support'

/*
 * `roster.permissions` (AC 54, 69): the permissions
 * (`roster.permissions.index`), page paged; v1's new-permission form (name
 * and description) posted to `roster.permissions.store`; each row's
 * description saved through `roster.permissions.update`; and delete
 * (`roster.permissions.destroy`) for a permission that is not built in.
 * Permissions are addressed by name. A 422 shows the field errors and a 403
 * the no-access state.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockNuxtImport('useAtriumApi', () => () => api)

function rosterWith(overrides: PackageRoutes<'roster'> = {}): void {
  mockPackageApi('roster', {
    'GET /permissions': page([reportsExport, usersUpdate, usersView]),
    ...overrides
  })
}

describe('roster.permissions', () => {
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

  it('lists the permissions and calls atrium.screens.show with its key', async () => {
    rosterWith()

    const wrapper = await mountRosterPage(Page, '/roster/permissions')

    expect(rosterCalls('GET', '/permissions')[0]?.query).toEqual({})
    expect(api).toHaveBeenCalledWith('/screens/roster.permissions', { query: { record: undefined, tab: undefined } })
    expect(wrapper.find('[data-testid="roster-permission-row-roster.users.view"]').text()).toContain('Built-in')
    expect(wrapper.find('[data-testid="roster-permission-row-reports.export"]').text()).not.toContain('Built-in')
    expect((wrapper.find('[data-testid="roster-permission-description-reports.export"]').element as HTMLInputElement).value).toBe('Export reports.')
  })

  it('pages by the page number the endpoint answers with', async () => {
    rosterWith({ 'GET /permissions': call => page([reportsExport], Number(call.query.page ?? 1), 2) })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')
    await wrapper.find('[data-testid="roster-permissions-next"]').trigger('click')
    await settle()

    expect(rosterCalls('GET', '/permissions').at(-1)?.query).toEqual({ page: '2' })
  })

  it('creates a permission with the old form\'s fields, then reloads', async () => {
    rosterWith({ 'POST /permissions': reply(201, { data: reportsExport }) })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')
    await wrapper.find('[data-testid="roster-permission-new-name"]').setValue('reports.export')
    await wrapper.find('[data-testid="roster-permission-new-description"]').setValue('Export reports.')
    await wrapper.find('[data-testid="roster-permission-new-form"]').trigger('submit')
    await settle()

    expect(rosterCalls('POST', '/permissions')[0]?.body).toEqual({ name: 'reports.export', description: 'Export reports.' })
    expect(rosterCalls('GET', '/permissions')).toHaveLength(2)
    expect((wrapper.find('[data-testid="roster-permission-new-name"]').element as HTMLInputElement).value).toBe('')
  })

  it('shows the field errors of a 422 on create', async () => {
    rosterWith({ 'POST /permissions': reply(422, { message: 'Invalid.', errors: { name: ['The name format is invalid.'] } }) })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')
    await wrapper.find('[data-testid="roster-permission-new-name"]').setValue('Not A Name')
    await wrapper.find('[data-testid="roster-permission-new-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="roster-permission-new-form"]').text()).toContain('The name format is invalid.')
  })

  it('saves a row\'s description by the permission\'s name, then reloads', async () => {
    rosterWith({ 'PATCH /permissions/{permission}': { data: { ...usersUpdate, description: 'Change users.' } } })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')
    await wrapper.find('[data-testid="roster-permission-description-roster.users.update"]').setValue('Change users.')
    await wrapper.find('[data-testid="roster-permission-save-roster.users.update"]').trigger('click')
    await settle()

    const [call] = rosterCalls('PATCH', '/permissions/{permission}')
    expect(call?.path).toBe('/permissions/roster.users.update')
    expect(call?.body).toEqual({ description: 'Change users.' })
    expect(rosterCalls('GET', '/permissions')).toHaveLength(2)
  })

  it('saves a cleared description as null', async () => {
    rosterWith({ 'PATCH /permissions/{permission}': { data: { ...reportsExport, description: null } } })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')
    await wrapper.find('[data-testid="roster-permission-description-reports.export"]').setValue('')
    await wrapper.find('[data-testid="roster-permission-save-reports.export"]').trigger('click')
    await settle()

    expect(rosterCalls('PATCH', '/permissions/{permission}')[0]?.body).toEqual({ description: null })
  })

  it('shows the field error of a 422 on the row it saved', async () => {
    rosterWith({ 'PATCH /permissions/{permission}': reply(422, { message: 'Invalid.', errors: { description: ['The description is too long.'] } }) })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')
    await wrapper.find('[data-testid="roster-permission-save-reports.export"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="roster-permission-row-reports.export"]').text()).toContain('The description is too long.')
    expect(wrapper.find('[data-testid="roster-permission-row-roster.users.view"]').text()).not.toContain('The description is too long.')
  })

  it('deletes a custom permission by its name, then reloads; a built-in one offers no delete', async () => {
    rosterWith({ 'DELETE /permissions/{permission}': reply(204) })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')

    expect(wrapper.find('[data-testid="roster-permission-delete-roster.users.view"]').exists()).toBe(false)

    await wrapper.find('[data-testid="roster-permission-delete-reports.export"]').trigger('click')
    await settle()

    const [call] = rosterCalls('DELETE', '/permissions/{permission}')
    expect(call?.path).toBe('/permissions/reports.export')
    expect(call?.body).toBeUndefined()
    expect(rosterCalls('GET', '/permissions')).toHaveLength(2)
  })

  it('shows the no-access notice when an action answers 403', async () => {
    rosterWith({ 'DELETE /permissions/{permission}': reply(403) })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')
    await wrapper.find('[data-testid="roster-permission-delete-reports.export"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows the no-access state on a 403', async () => {
    rosterWith({ 'GET /permissions': reply(403) })

    const wrapper = await mountRosterPage(Page, '/roster/permissions')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-permissions-table"]').exists()).toBe(false)
  })
})
