import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { components } from '../../client/schema'
import Page from '../../src/pages/security/index.vue'
import { screens } from '../../src/atrium'
import { expiryOf, isoDay, latestExpiry, securityOptions } from '../../src/components/security/security'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, cursorPage, guardianCalls, guardianScreensApi, mountGuardianPage, page, resetGuardianPages, screenOptions } from '../support'
import { enabledStatus, leakSurfaces } from '../two-factor/support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.security` (AC 88): five sections, each loading and handling its
 * own 403. Every call is asserted by method, path and body: the two-factor
 * status with the shared components; sessions (the current one flagged,
 * revoke one, "sign out everywhere else" with and without `tokens: true`,
 * each confirmed); devices (forget, confirmed); API tokens (list, issue with
 * abilities from the screen option and the expiry capped, the plain token
 * shown once and kept out of storage, revoke, and the 501 state); and recent
 * activity, cursor-paged.
 */

type Schemas = components['schemas']

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const current = {
  id: 'sess-current',
  current: true,
  ip: '203.0.113.5',
  user_agent: 'Firefox',
  device_id: 'dev-1',
  device_name: 'Laptop',
  last_active_at: '2026-11-23T10:00:00+00:00',
  created_at: '2026-11-20T10:00:00+00:00'
} satisfies Schemas['SessionResource']

const other = { ...current, id: 'sess-other', current: false, device_name: 'Phone' } satisfies Schemas['SessionResource']

const device = {
  id: 'dev-1',
  name: 'Laptop',
  first_seen_at: '2026-11-01T10:00:00+00:00',
  last_seen_at: '2026-11-23T10:00:00+00:00',
  last_ip: '203.0.113.5'
} satisfies Schemas['DeviceResource']

const token = {
  id: 'tok-1',
  name: 'CI',
  abilities: ['read'],
  last_used_at: null,
  expires_at: null,
  created_at: '2026-11-01T10:00:00+00:00'
} satisfies Schemas['TokenResource']

const event = {
  id: 'evt-1',
  type: 'login.succeeded',
  ip: '203.0.113.5',
  identifier_hash: null,
  context: {},
  occurred_at: '2026-11-23T10:00:00+00:00'
} as Schemas['SecurityEventResource']

const PLAIN = '1|plain-token-value-xyz'

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /two-factor': { data: enabledStatus },
    'GET /sessions': page([current, other]) as never,
    'GET /devices': page([device]) as never,
    'GET /tokens': { data: [token] },
    'GET /me/security-events': cursorPage([event], 'cursor-2') as never,
    ...overrides
  }
}

async function mountSecurity(overrides: PackageRoutes<'guardian'> = {}) {
  mockPackageApi('guardian', routes(overrides))

  return mountGuardianPage(Page, '/guardian/security')
}

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`.
const here = import.meta.url

describe('guardian.security', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('has a page at the declared path, framed with its screen key', () => {
    const route = useRouter().getRoutes().find(candidate => candidate.name === screens['guardian.security'])
    const source = readFileSync(fileURLToPath(new URL('../../../../app/pages/guardian/security/index.vue', here)), 'utf8')

    expect(route?.path).toBe('/guardian/security')
    expect(source).toContain('screen-key="guardian.security"')
  })

  it('loads every section and the screen', async () => {
    const wrapper = await mountSecurity()

    expect(guardianCalls('GET', '/two-factor')).toHaveLength(1)
    expect(guardianCalls('GET', '/sessions')[0]?.query).toEqual({ per_page: '50' })
    expect(guardianCalls('GET', '/devices')[0]?.query).toEqual({ per_page: '50' })
    expect(guardianCalls('GET', '/tokens')).toHaveLength(1)
    expect(guardianCalls('GET', '/me/security-events')[0]?.query).toEqual({ per_page: '50' })
    expect(api).toHaveBeenCalledWith('/screens/guardian.security', { query: { record: undefined, tab: undefined } })

    expect(wrapper.find('[data-testid="guardian-security-two-factor-state"]').text()).toBe('On')
    expect(wrapper.find('[data-testid="guardian-two-factor-methods"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guardian-recovery-remaining"]').text()).toContain('8')
  })

  describe('sessions', () => {
    it('flags the current session, which cannot be revoked here', async () => {
      const wrapper = await mountSecurity()

      expect(wrapper.find('[data-testid="guardian-session-sess-current"] [data-testid="guardian-session-current"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="guardian-session-revoke-sess-current"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="guardian-session-sess-other"] [data-testid="guardian-session-current"]').exists()).toBe(false)
    })

    it('revokes one only once confirmed, then reloads', async () => {
      const confirm = confirmWith(false)
      const wrapper = await mountSecurity({ 'DELETE /sessions/{session}': reply(204) })

      await wrapper.find('[data-testid="guardian-session-revoke-sess-other"]').trigger('click')
      await settle()
      expect(confirm).toHaveBeenCalledOnce()
      expect(guardianCalls('DELETE', '/sessions/{session}')).toHaveLength(0)

      confirm.mockReturnValue(true)
      await wrapper.find('[data-testid="guardian-session-revoke-sess-other"]').trigger('click')
      await settle()

      const [call] = guardianCalls('DELETE', '/sessions/{session}')
      expect(call?.path).toBe('/sessions/sess-other')
      expect(call?.body).toBeUndefined()
      expect(guardianCalls('GET', '/sessions')).toHaveLength(2)
    })

    it('signs out everywhere else, without the tokens', async () => {
      confirmWith(true)
      const wrapper = await mountSecurity({ 'DELETE /sessions/others': { revoked: 2, tokens_revoked: null } })

      await wrapper.find('[data-testid="guardian-sessions-others"]').trigger('click')
      await settle()

      const [call] = guardianCalls('DELETE', '/sessions/others')
      expect(call?.body).toBeUndefined()
      expect(call?.query).toEqual({})
      expect(wrapper.find('[data-testid="guardian-sessions-notice"]').text()).toContain('2')
    })

    it('signs out everywhere else and revokes the API tokens with tokens: true', async () => {
      const confirm = confirmWith(true)
      const wrapper = await mountSecurity({ 'DELETE /sessions/others': { revoked: 1, tokens_revoked: 3 } })

      await wrapper.find('[data-testid="guardian-sessions-also-tokens"]').setValue(true)
      await settle()
      await wrapper.find('[data-testid="guardian-sessions-others"]').trigger('click')
      await settle()

      expect(confirm.mock.calls[0]?.[0]).toContain('API tokens')
      expect(guardianCalls('DELETE', '/sessions/others')[0]?.body).toEqual({ tokens: true })
    })

    it('does nothing when the confirmation is declined', async () => {
      confirmWith(false)
      const wrapper = await mountSecurity()

      await wrapper.find('[data-testid="guardian-sessions-others"]').trigger('click')
      await settle()

      expect(guardianCalls('DELETE', '/sessions/others')).toHaveLength(0)
    })
  })

  describe('devices', () => {
    it('forgets a device once confirmed', async () => {
      const confirm = confirmWith(true)
      const wrapper = await mountSecurity({ 'DELETE /devices/{device}': reply(204) })

      expect(wrapper.find('[data-testid="guardian-device-dev-1"]').text()).toContain('Laptop')

      await wrapper.find('[data-testid="guardian-device-forget-dev-1"]').trigger('click')
      await settle()

      expect(confirm).toHaveBeenCalledOnce()
      expect(guardianCalls('DELETE', '/devices/{device}')[0]?.path).toBe('/devices/dev-1')
      expect(guardianCalls('GET', '/devices')).toHaveLength(2)
    })
  })

  describe('API tokens', () => {
    it('lists the tokens', async () => {
      const wrapper = await mountSecurity()

      expect(wrapper.find('[data-testid="guardian-token-tok-1"]').text()).toContain('CI')
    })

    it('issues a token with abilities from the screen option, shows the plain token once, and keeps it out of storage', async () => {
      screenOptions('guardian.security', { token_abilities: ['read', 'write'], token_max_lifetime_days: 30 })
      const wrapper = await mountSecurity({ 'POST /tokens': { data: token, plain_text_token: PLAIN } })

      expect(wrapper.findAll('[data-testid^="guardian-token-ability-"]').map(box => box.attributes('data-testid'))).toEqual(['guardian-token-ability-read', 'guardian-token-ability-write'])

      const day = latestExpiry(30)!
      await wrapper.find('[data-testid="guardian-token-name"]').setValue('Deploys')
      await wrapper.find('[data-testid="guardian-token-ability-write"]').setValue(false)
      await wrapper.find('[data-testid="guardian-token-expires"]').setValue(day)
      await wrapper.find('[data-testid="guardian-token-form"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/tokens')[0]?.body).toEqual({ name: 'Deploys', abilities: ['read'], expires_at: expiryOf(day) })
      expect(wrapper.find('[data-testid="guardian-token-plain-value"]').text()).toBe(PLAIN)
      expect(leakSurfaces()).not.toContain(PLAIN)
      expect(guardianCalls('GET', '/tokens')).toHaveLength(2)

      await wrapper.find('[data-testid="guardian-token-hide"]').trigger('click')
      expect(wrapper.find('[data-testid="guardian-token-plain"]').exists()).toBe(false)
      expect(wrapper.html()).not.toContain(PLAIN)
    })

    it('refuses an expiry past the maximum lifetime without calling Guardian', async () => {
      screenOptions('guardian.security', { token_abilities: ['*'], token_max_lifetime_days: 30 })
      const wrapper = await mountSecurity()

      const late = new Date()
      late.setDate(late.getDate() + 31)

      expect(wrapper.find('[data-testid="guardian-token-expires"]').attributes('max')).toBe(latestExpiry(30))

      await wrapper.find('[data-testid="guardian-token-name"]').setValue('Too long')
      await wrapper.find('[data-testid="guardian-token-expires"]').setValue(isoDay(late))
      await wrapper.find('[data-testid="guardian-token-form"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/tokens')).toHaveLength(0)
      expect(wrapper.text()).toContain('at most 30 days')
    })

    it('issues a token with no expiry and every ability by default', async () => {
      const wrapper = await mountSecurity({ 'POST /tokens': { data: token, plain_text_token: PLAIN } })

      await wrapper.find('[data-testid="guardian-token-name"]').setValue('Script')
      await wrapper.find('[data-testid="guardian-token-form"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/tokens')[0]?.body).toEqual({ name: 'Script', abilities: ['*'], expires_at: null })
    })

    it('shows the field errors of a 422', async () => {
      const wrapper = await mountSecurity({ 'POST /tokens': reply(422, { message: 'Invalid.', errors: { name: ['The name field is required.'] } }) })

      await wrapper.find('[data-testid="guardian-token-form"]').trigger('submit')
      await settle()

      expect(wrapper.text()).toContain('The name field is required.')
    })

    it('revokes a token once confirmed', async () => {
      const confirm = confirmWith(true)
      const wrapper = await mountSecurity({ 'DELETE /tokens/{token}': reply(204) })

      await wrapper.find('[data-testid="guardian-token-revoke-tok-1"]').trigger('click')
      await settle()

      expect(confirm.mock.calls[0]?.[0]).toContain('CI')
      expect(guardianCalls('DELETE', '/tokens/{token}')[0]?.path).toBe('/tokens/tok-1')
    })

    it('says API tokens are not enabled on a 501, with no form', async () => {
      const wrapper = await mountSecurity({ 'GET /tokens': reply(501, { message: 'No token driver.' }) })

      expect(wrapper.find('[data-testid="guardian-tokens-disabled"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="guardian-token-form"]').exists()).toBe(false)
    })
  })

  describe('recent activity', () => {
    it('pages by cursor, older and back newer', async () => {
      const wrapper = await mountSecurity()

      expect(wrapper.find('[data-testid="guardian-activity-evt-1"]').text()).toContain('login.succeeded')
      expect(wrapper.find('[data-testid="guardian-activity-newer"]').exists()).toBe(false)

      await wrapper.find('[data-testid="guardian-activity-older"]').trigger('click')
      await settle()

      expect(guardianCalls('GET', '/me/security-events')[1]?.query).toEqual({ per_page: '50', cursor: 'cursor-2' })

      await wrapper.find('[data-testid="guardian-activity-newer"]').trigger('click')
      await settle()

      expect(guardianCalls('GET', '/me/security-events')[2]?.query).toEqual({ per_page: '50' })
    })
  })

  describe('each section\'s own 403', () => {
    it.each([
      ['two-factor', 'GET /two-factor', 'guardian-security-two-factor'],
      ['sessions', 'GET /sessions', 'guardian-security-sessions'],
      ['devices', 'GET /devices', 'guardian-security-devices'],
      ['tokens', 'GET /tokens', 'guardian-security-tokens'],
      ['activity', 'GET /me/security-events', 'guardian-security-activity']
    ] as const)('shows no access in the %s section only', async (_, route, section) => {
      const wrapper = await mountSecurity({ [route]: reply(403) } as PackageRoutes<'guardian'>)

      expect(wrapper.find(`[data-testid="${section}"] [data-testid="atrium-no-access"]`).exists()).toBe(true)
      expect(wrapper.findAll('[data-testid="atrium-no-access"]')).toHaveLength(1)
      expect(wrapper.find('[data-testid="guardian-security-devices"]').text().length).toBeGreaterThan(0)
    })
  })

  describe('the screen options', () => {
    it('fall back to Guardian\'s defaults, and pass a null lifetime through', () => {
      expect(securityOptions(undefined)).toEqual({ tokenAbilities: ['*'], tokenMaxLifetimeDays: 365 })
      expect(securityOptions({ token_abilities: ['read', 5], token_max_lifetime_days: null })).toEqual({ tokenAbilities: ['read'], tokenMaxLifetimeDays: null })
      expect(latestExpiry(null)).toBeNull()
    })
  })
})
