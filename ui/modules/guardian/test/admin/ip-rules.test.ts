import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../../src/pages/ip-rules/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, guardianCalls, guardianScreensApi, mountGuardianPage, page, resetGuardianPages, screenOptions } from '../support'
import { allowRule, denyRule } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.ip-rules` (AC 93): list; create, with a 422 for an invalid
 * CIDR; delete after a confirmation; the `mode` option, with the allowlist
 * warning and the extra confirmation before deleting an allow rule.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /ip-rules': page([denyRule, allowRule]) as never,
    'POST /ip-rules': { data: denyRule },
    'DELETE /ip-rules/{rule}': reply(204),
    ...overrides
  }
}

describe('guardian.ip-rules', () => {
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

  it('lists the rules and shows the denylist mode without a warning', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')

    expect(guardianCalls('GET', '/ip-rules')[0]?.query).toEqual({ per_page: '25' })
    expect(wrapper.find('[data-testid="guardian-ip-rule-rule-1"]').text()).toContain('198.51.100.0/24')
    expect(wrapper.find('[data-testid="guardian-ip-rule-rule-2"]').text()).toContain('Office')
    expect(wrapper.find('[data-testid="guardian-ip-rules-mode"]').text()).toContain('denylist')
    expect(wrapper.find('[data-testid="guardian-ip-rules-allowlist"]').exists()).toBe(false)
  })

  it('creates a rule with every field', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')
    await wrapper.find('[data-testid="guardian-ip-rule-cidr"]').setValue(' 203.0.113.0/24 ')
    await wrapper.find('[data-testid="guardian-ip-rule-action"]').setValue('allow')
    await wrapper.find('[data-testid="guardian-ip-rule-description"]').setValue('Office')
    await wrapper.find('[data-testid="guardian-ip-rule-expires"]').setValue('2026-12-31')
    await wrapper.find('[data-testid="guardian-ip-rule-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/ip-rules')[0]?.body).toEqual({
      cidr: '203.0.113.0/24',
      action: 'allow',
      description: 'Office',
      expires_at: new Date('2026-12-31T23:59:59.999').toISOString()
    })
    expect(guardianCalls('GET', '/ip-rules')).toHaveLength(2)
  })

  it('sends no expiry or description when left blank', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')
    await wrapper.find('[data-testid="guardian-ip-rule-cidr"]').setValue('198.51.100.7')
    await wrapper.find('[data-testid="guardian-ip-rule-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/ip-rules')[0]?.body).toEqual({ cidr: '198.51.100.7', action: 'deny', description: null, expires_at: null })
  })

  it('shows the 422 of an invalid CIDR', async () => {
    mockPackageApi('guardian', routes({ 'POST /ip-rules': reply(422, { message: 'Invalid.', errors: { cidr: ['The cidr must be a valid IP address or CIDR range.'] } }) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')
    await wrapper.find('[data-testid="guardian-ip-rule-cidr"]').setValue('not-an-ip')
    await wrapper.find('[data-testid="guardian-ip-rule-form"]').trigger('submit')
    await settle()

    expect(wrapper.text()).toContain('The cidr must be a valid IP address or CIDR range.')
    expect(guardianCalls('GET', '/ip-rules')).toHaveLength(1)
  })

  it('deletes a rule once confirmed, and not when declined', async () => {
    const confirm = confirmWith(false)
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')
    await wrapper.find('[data-testid="guardian-ip-rule-delete-rule-1"]').trigger('click')
    await settle()
    expect(guardianCalls('DELETE', '/ip-rules/{rule}')).toHaveLength(0)

    confirm.mockReturnValue(true)
    await wrapper.find('[data-testid="guardian-ip-rule-delete-rule-1"]').trigger('click')
    await settle()

    expect(confirm.mock.calls[1]?.[0]).toContain('198.51.100.0/24')
    expect(guardianCalls('DELETE', '/ip-rules/{rule}')[0]?.path).toBe('/ip-rules/rule-1')
  })

  it('asks once only to delete an allow rule in denylist mode', async () => {
    const confirm = confirmWith(true)
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')
    await wrapper.find('[data-testid="guardian-ip-rule-delete-rule-2"]').trigger('click')
    await settle()

    expect(confirm).toHaveBeenCalledTimes(1)
    expect(guardianCalls('DELETE', '/ip-rules/{rule}')).toHaveLength(1)
  })

  describe('in allowlist mode', () => {
    beforeEach(() => screenOptions('guardian.ip-rules', { mode: 'allowlist' }))

    it('warns that a request matching no allow rule is refused', async () => {
      mockPackageApi('guardian', routes())

      const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')

      expect(wrapper.find('[data-testid="guardian-ip-rules-mode"]').text()).toContain('allowlist')
      expect(wrapper.find('[data-testid="guardian-ip-rules-allowlist"]').text()).toContain('a request matching no allow rule is refused')
    })

    it('asks a second time, naming the risk, before deleting an allow rule', async () => {
      const confirm = confirmWith(true)
      confirm.mockReturnValueOnce(true).mockReturnValueOnce(false)
      mockPackageApi('guardian', routes())

      const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')
      await wrapper.find('[data-testid="guardian-ip-rule-delete-rule-2"]').trigger('click')
      await settle()

      expect(confirm).toHaveBeenCalledTimes(2)
      expect(confirm.mock.calls[1]?.[0]).toContain('allowlist')
      expect(confirm.mock.calls[1]?.[0]).toContain('203.0.113.0/24')
      expect(guardianCalls('DELETE', '/ip-rules/{rule}')).toHaveLength(0)

      await wrapper.find('[data-testid="guardian-ip-rule-delete-rule-2"]').trigger('click')
      await settle()

      expect(guardianCalls('DELETE', '/ip-rules/{rule}')[0]?.path).toBe('/ip-rules/rule-2')
    })

    it('asks once only to delete a deny rule', async () => {
      const confirm = confirmWith(true)
      mockPackageApi('guardian', routes())

      const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')
      await wrapper.find('[data-testid="guardian-ip-rule-delete-rule-1"]').trigger('click')
      await settle()

      expect(confirm).toHaveBeenCalledTimes(1)
      expect(guardianCalls('DELETE', '/ip-rules/{rule}')).toHaveLength(1)
    })
  })

  it('shows no access on a 403', async () => {
    mockPackageApi('guardian', routes({ 'GET /ip-rules': reply(403) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/ip-rules')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
