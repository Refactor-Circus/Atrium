import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PasswordPage from '../../src/pages/password-policy/index.vue'
import Page from '../../src/pages/two-factor-policies/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { editor, SCOPE_TYPES } from '../access/support'
import { confirmWith, guardianCalls, guardianScreensApi, mountGuardianPage, page, resetGuardianPages, screenOptions } from '../support'
import { orgPolicy, passwordPolicy } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.password-policy` (AC 94), read-only, and
 * `guardian.two-factor-policies` (AC 95): list, create with every field,
 * update (`required`, `methods`, `grace_days`, D-071), delete after a
 * confirmation; 422 and 403.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /password-policy': { data: passwordPolicy },
    'GET /two-factor-policies': page([orgPolicy]) as never,
    'GET /roles': page([editor]) as never,
    'POST /two-factor-policies': { data: orgPolicy },
    'PATCH /two-factor-policies/{policy}': { data: orgPolicy },
    'DELETE /two-factor-policies/{policy}': reply(204),
    ...overrides
  }
}

describe('guardian.password-policy', () => {
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

  it('renders the policy read-only', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(PasswordPage, '/guardian/password-policy')
    const policy = wrapper.find('[data-testid="guardian-password-policy"]')

    expect(policy.find('[data-testid="guardian-password-length"]').text()).toBe('12 to 128 characters')
    expect(policy.find('[data-testid="guardian-password-mixed_case"]').text()).toBe('Yes')
    expect(policy.find('[data-testid="guardian-password-symbols"]').text()).toBe('No')
    expect(policy.find('[data-testid="guardian-password-uncompromised"]').text()).toContain('0 times')
    expect(policy.find('[data-testid="guardian-password-history"]').text()).toContain('5')
    expect(policy.find('[data-testid="guardian-password-max-age"]').text()).toBe('90 days')
    expect(policy.findAll('input, select, textarea, form, button')).toHaveLength(0)
    expect(guardianCalls('GET', '/password-policy')).toHaveLength(1)
  })

  it('says never for no maximum age and no for no history', async () => {
    mockPackageApi('guardian', routes({ 'GET /password-policy': { data: { ...passwordPolicy, history: 0, max_age_days: null, uncompromised: false } } }))

    const wrapper = await mountGuardianPage(PasswordPage, '/guardian/password-policy')

    expect(wrapper.find('[data-testid="guardian-password-max-age"]').text()).toBe('Never')
    expect(wrapper.find('[data-testid="guardian-password-history"]').text()).toBe('No')
    expect(wrapper.find('[data-testid="guardian-password-uncompromised"]').text()).toBe('No')
  })

  it('shows no access on a 403', async () => {
    mockPackageApi('guardian', routes({ 'GET /password-policy': reply(403) }))

    const wrapper = await mountGuardianPage(PasswordPage, '/guardian/password-policy')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})

describe('guardian.two-factor-policies', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
    screenOptions('guardian.two-factor-policies', { scope_types: SCOPE_TYPES })
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('lists the policies with their scope, role and settings', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')
    const row = wrapper.find('[data-testid="guardian-policy-pol-1"]')

    expect(guardianCalls('GET', '/two-factor-policies')[0]?.query).toEqual({ per_page: '25' })
    expect(row.text()).toContain('organization acme')
    expect(row.text()).toContain('editor')
    expect((row.find('[data-testid="guardian-policy-required"]').element as HTMLInputElement).checked).toBe(true)
    expect((row.find('[data-testid="guardian-policy-method-totp"]').element as HTMLInputElement).checked).toBe(true)
    expect((row.find('[data-testid="guardian-policy-method-email"]').element as HTMLInputElement).checked).toBe(false)
    expect((row.find('[data-testid="guardian-policy-grace"]').element as HTMLInputElement).value).toBe('7')
  })

  it('creates a policy with every field', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')

    expect(wrapper.findAll('[data-testid="guardian-policy-new-scope-type"] option').map(option => option.attributes('value'))).toEqual(['', 'org', 'team'])

    await wrapper.find('[data-testid="guardian-policy-new-scope-type"]').setValue('org')
    await wrapper.find('[data-testid="guardian-policy-new-scope-id"]').setValue('acme')
    await wrapper.find('[data-testid="guardian-policy-new-role"]').setValue('editor')
    await wrapper.find('[data-testid="guardian-policy-new-required"]').setValue(false)
    await wrapper.find('[data-testid="guardian-policy-new-method-passkey"]').setValue(true)
    await wrapper.find('[data-testid="guardian-policy-new-method-totp"]').setValue(true)
    await wrapper.find('[data-testid="guardian-policy-new-grace"]').setValue('14')
    await wrapper.find('[data-testid="guardian-policy-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/two-factor-policies')[0]?.body).toEqual({
      scope_type: 'org',
      scope_id: 'acme',
      role: 'editor',
      required: false,
      methods: ['totp', 'passkey'],
      grace_days: 14
    })
    expect(guardianCalls('GET', '/two-factor-policies')).toHaveLength(2)
  })

  it('creates an everyone policy with no methods as null', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')
    await wrapper.find('[data-testid="guardian-policy-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/two-factor-policies')[0]?.body).toEqual({
      scope_type: null,
      scope_id: null,
      role: null,
      required: true,
      methods: null,
      grace_days: 0
    })
  })

  it('shows every message of a 422 on create', async () => {
    mockPackageApi('guardian', routes({ 'POST /two-factor-policies': reply(422, { message: 'Invalid.', errors: { scope_id: ['The scope id field is required when scope type is present.'] } }) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')
    await wrapper.find('[data-testid="guardian-policy-new-scope-type"]').setValue('org')
    await wrapper.find('[data-testid="guardian-policy-form"]').trigger('submit')
    await settle()

    expect(wrapper.find('[data-testid="guardian-policy-create-errors"]').text()).toContain('The scope id field is required')
  })

  it('updates required, methods and grace days', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')
    const row = wrapper.find('[data-testid="guardian-policy-pol-1"]')
    await row.find('[data-testid="guardian-policy-required"]').setValue(false)
    await row.find('[data-testid="guardian-policy-method-totp"]').setValue(false)
    await row.find('[data-testid="guardian-policy-method-sms"]').setValue(true)
    await row.find('[data-testid="guardian-policy-grace"]').setValue('30')
    await row.find('[data-testid="guardian-policy-save"]').trigger('click')
    await settle()

    const [call] = guardianCalls('PATCH', '/two-factor-policies/{policy}')
    expect(call?.path).toBe('/two-factor-policies/pol-1')
    expect(call?.body).toEqual({ required: false, methods: ['sms', 'passkey'], grace_days: 30 })
  })

  it('sends methods null when every method is unticked', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')
    const row = wrapper.find('[data-testid="guardian-policy-pol-1"]')
    await row.find('[data-testid="guardian-policy-method-totp"]').setValue(false)
    await row.find('[data-testid="guardian-policy-method-passkey"]').setValue(false)
    await row.find('[data-testid="guardian-policy-save"]').trigger('click')
    await settle()

    expect(guardianCalls('PATCH', '/two-factor-policies/{policy}')[0]?.body).toEqual({ required: true, methods: null, grace_days: 7 })
  })

  it('shows the 422 of an update', async () => {
    mockPackageApi('guardian', routes({ 'PATCH /two-factor-policies/{policy}': reply(422, { message: 'Invalid.', errors: { grace_days: ['The grace days may not be greater than 3650.'] } }) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')
    await wrapper.find('[data-testid="guardian-policy-save"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="guardian-policy-update-errors"]').text()).toContain('3650')
  })

  it('deletes a policy once confirmed, and not when declined', async () => {
    const confirm = confirmWith(false)
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')
    await wrapper.find('[data-testid="guardian-policy-delete"]').trigger('click')
    await settle()
    expect(guardianCalls('DELETE', '/two-factor-policies/{policy}')).toHaveLength(0)

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="guardian-policy-delete"]').trigger('click')
    await settle()

    expect(confirm.mock.calls[0]?.[0]).toContain('organization acme')
    expect(guardianCalls('DELETE', '/two-factor-policies/{policy}')[0]?.path).toBe('/two-factor-policies/pol-1')
  })

  it('shows no access on a 403', async () => {
    mockPackageApi('guardian', routes({ 'GET /two-factor-policies': reply(403) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/two-factor-policies')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
