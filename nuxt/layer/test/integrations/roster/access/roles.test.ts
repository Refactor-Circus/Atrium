import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import Page from '../../../../app/pages/roster/roles/index.vue'
import { settle } from '../../../support'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '../../support'
import { mountRosterPage, page, resetRosterPages, rosterCalls, screensApi } from '../users/support'
import { customRole, editorDetail, reportsExport, superRole, usersUpdate, usersView } from './support'

/*
 * `roster.roles` (AC 54, 69): the roles (`roster.roles.index`) with v1's
 * scope and organization filters sent as its query, page paging, and v1's
 * new-role form (name, scope, organization, description and permissions)
 * posted to `roster.roles.store`, then the new role's page. A 422 shows the
 * field errors and a 403 the no-access state.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockNuxtImport('useAtriumApi', () => () => api)

function rosterWith(overrides: PackageRoutes<'roster'> = {}): void {
  mockPackageApi('roster', {
    'GET /roles': page([editorDetail, customRole, superRole]),
    'GET /permissions': page([reportsExport, usersUpdate, usersView]),
    ...overrides
  })
}

describe('roster.roles', () => {
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

  it('lists the roles and calls atrium.screens.show with its key', async () => {
    rosterWith()

    const wrapper = await mountRosterPage(Page, '/roster/roles')

    expect(rosterCalls('GET', '/roles')[0]?.query).toEqual({})
    expect(api).toHaveBeenCalledWith('/screens/roster.roles', { query: { record: undefined, tab: undefined } })

    const editor = wrapper.find(`[data-testid="roster-role-row-${editorDetail.id}"]`)
    expect(editor.find('a').attributes('href')).toBe(`/roster/roles/${editorDetail.id}`)
    expect(editor.text()).toContain('Built-in')
    expect(editor.text()).toContain('Shared')
    expect(wrapper.find(`[data-testid="roster-role-permissions-${editorDetail.id}"]`).text()).toBe('2')
    expect(wrapper.find(`[data-testid="roster-role-row-${customRole.id}"]`).text()).toContain('acme')
    expect(wrapper.find(`[data-testid="roster-role-row-${superRole.id}"]`).text()).toContain('Super')
    expect(wrapper.find(`[data-testid="roster-role-permissions-${superRole.id}"]`).text()).toBe('Everything')
  })

  it('sends the scope and organization filters as the endpoint\'s query, from the form and the URL', async () => {
    rosterWith()

    const wrapper = await mountRosterPage(Page, '/roster/roles?scope=team&organization=acme')

    expect(rosterCalls('GET', '/roles')[0]?.query).toEqual({ scope: 'team', organization: 'acme' })

    await wrapper.find('[data-testid="roster-roles-scope"]').setValue('global')
    await wrapper.find('[data-testid="roster-roles-organization"]').setValue('')
    await wrapper.find('[data-testid="roster-roles-filters"]').trigger('submit')
    await settle()

    expect(rosterCalls('GET', '/roles').at(-1)?.query).toEqual({ scope: 'global' })

    await wrapper.find('[data-testid="roster-roles-clear"]').trigger('click')
    await settle()

    expect(rosterCalls('GET', '/roles').at(-1)?.query).toEqual({})
  })

  it('pages by the page number the endpoint answers with', async () => {
    rosterWith({ 'GET /roles': call => page([editorDetail], Number(call.query.page ?? 1), 2) })

    const wrapper = await mountRosterPage(Page, '/roster/roles')
    await wrapper.find('[data-testid="roster-roles-next"]').trigger('click')
    await settle()

    expect(rosterCalls('GET', '/roles').at(-1)?.query).toEqual({ page: '2' })
  })

  it('offers every permission in the new-role form, from roster.permissions.index', async () => {
    rosterWith()

    const wrapper = await mountRosterPage(Page, '/roster/roles')

    expect(rosterCalls('GET', '/permissions')[0]?.query).toEqual({ per_page: '200' })
    expect(wrapper.findAll('[data-testid="roster-role-new-form"] input[type="checkbox"]').map(box => box.attributes('value')))
      .toEqual(['reports.export', 'roster.users.update', 'roster.users.view'])
  })

  it('creates a role with the old form\'s fields, in the filtered organization, then opens its page', async () => {
    rosterWith({ 'POST /roles': reply(201, { data: customRole }) })

    const wrapper = await mountRosterPage(Page, '/roster/roles?organization=acme')

    expect((wrapper.find('[data-testid="roster-role-new-organization"]').element as HTMLInputElement).value).toBe('acme')

    await wrapper.find('[data-testid="roster-role-new-name"]').setValue('Support')
    await wrapper.find('[data-testid="roster-role-new-scope"]').setValue('organization')
    await wrapper.find('[data-testid="roster-role-new-description"]').setValue('Answers tickets.')
    await wrapper.find('[data-testid="roster-role-new-permission-roster.users.view"]').setValue(true)
    await wrapper.find('[data-testid="roster-role-new-form"]').trigger('submit')
    await settle()

    const [call] = rosterCalls('POST', '/roles')
    expect(call?.body).toEqual({
      name: 'Support',
      scope: 'organization',
      organization: 'acme',
      description: 'Answers tickets.',
      permissions: ['roster.users.view']
    })
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe(`/roster/roles/${customRole.id}`))
  })

  it('sends a blank organization and description as null', async () => {
    rosterWith({ 'POST /roles': reply(201, { data: customRole }) })

    const wrapper = await mountRosterPage(Page, '/roster/roles')
    await wrapper.find('[data-testid="roster-role-new-name"]').setValue('Viewer')
    await wrapper.find('[data-testid="roster-role-new-form"]').trigger('submit')
    await settle()

    expect(rosterCalls('POST', '/roles')[0]?.body).toEqual({
      name: 'Viewer',
      scope: 'global',
      organization: null,
      description: null,
      permissions: []
    })
  })

  it('shows the field errors of a 422 and stays on the list', async () => {
    rosterWith({ 'POST /roles': reply(422, { message: 'Invalid.', errors: { name: ['The name field is required.'], organization: ['The organization is unknown.'] } }) })

    const wrapper = await mountRosterPage(Page, '/roster/roles')
    await wrapper.find('[data-testid="roster-role-new-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The name field is required.')
    expect(wrapper.text()).toContain('The organization is unknown.')
    expect(useRouter().currentRoute.value.path).toBe('/roster/roles')
  })

  it('shows the no-access notice when creating answers 403', async () => {
    rosterWith({ 'POST /roles': reply(403) })

    const wrapper = await mountRosterPage(Page, '/roster/roles')
    await wrapper.find('[data-testid="roster-role-new-name"]').setValue('Viewer')
    await wrapper.find('[data-testid="roster-role-new-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })

  it('shows the no-access state on a 403', async () => {
    rosterWith({ 'GET /roles': reply(403) })

    const wrapper = await mountRosterPage(Page, '/roster/roles')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="roster-roles-table"]').exists()).toBe(false)
  })
})
