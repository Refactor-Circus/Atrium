import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import openapi from '../../../../app/integrations/guardian/client/openapi.json'
import { SECURITY_EVENT_TYPES } from '../../../../app/integrations/guardian/components/admin/admin'
import EventPage from '../../../../app/pages/guardian/security-events/[event].vue'
import Page from '../../../../app/pages/guardian/security-events/index.vue'
import { settle } from '../../../support'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '../../support'
import { cursorPage, guardianCalls, guardianScreensApi, mountGuardianPage, resetGuardianPages } from '../support'
import { failedLogin, lockedOut } from './support'

/*
 * `guardian.security-events` and `guardian.security-event` (AC 91): the
 * `type` select from the schema's enum (D-069), the `user`, `from` and `to`
 * filters, cursor paging, the detail with its context rows, and 403.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockNuxtImport('useAtriumApi', () => () => api)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /security-events': call => (call.query.cursor === 'c2' ? cursorPage([lockedOut], null, 'c1') : cursorPage([failedLogin], 'c2')) as never,
    'GET /security-events/{event}': { data: failedLogin },
    ...overrides
  }
}

describe('guardian.security-events', () => {
  beforeEach(() => {
    clearNuxtData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('offers every SecurityEventType of the vendored schema, in its order', () => {
    const schemas = (openapi as { components: { schemas: Record<string, { enum?: string[] }> } }).components.schemas

    expect([...SECURITY_EVENT_TYPES]).toEqual(schemas.SecurityEventType!.enum)
  })

  it('lists the newest events and links each to its page', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/security-events')

    expect(guardianCalls('GET', '/security-events')[0]?.query).toEqual({ per_page: '50' })
    expect(wrapper.find('[data-testid="guardian-event-evt-1"]').text()).toContain('login.failed')
    expect(wrapper.find('[data-testid="guardian-event-evt-1"] a').attributes('href')).toBe('/guardian/security-events/evt-1')
    expect(wrapper.findAll('[data-testid="guardian-events-filter-type"] option').map(option => option.attributes('value')))
      .toEqual(['', ...SECURITY_EVENT_TYPES])
  })

  it('filters by type, user, from and to', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/security-events')
    await wrapper.find('[data-testid="guardian-events-filter-type"]').setValue('login.locked_out')
    await wrapper.find('[data-testid="guardian-events-filter-user"]').setValue('7')
    await wrapper.find('[data-testid="guardian-events-filter-from"]').setValue('2026-11-01')
    await wrapper.find('[data-testid="guardian-events-filter-to"]').setValue('2026-11-02')
    await wrapper.find('[data-testid="guardian-events-filters"]').trigger('submit')
    await settle()

    expect(guardianCalls('GET', '/security-events').at(-1)?.query).toEqual({
      type: 'login.locked_out',
      user: '7',
      from: new Date('2026-11-01T00:00:00.000').toISOString(),
      to: new Date('2026-11-02T23:59:59.999').toISOString(),
      per_page: '50'
    })

    await wrapper.find('[data-testid="guardian-events-clear"]').trigger('click')
    await settle()

    expect(guardianCalls('GET', '/security-events').at(-1)?.query).toEqual({ per_page: '50' })
  })

  it('pages older and newer by cursor', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/security-events')
    await wrapper.find('[data-testid="guardian-events-older"]').trigger('click')
    await settle()

    expect(guardianCalls('GET', '/security-events').at(-1)?.query).toEqual({ per_page: '50', cursor: 'c2' })
    expect(wrapper.find('[data-testid="guardian-event-evt-2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guardian-events-older"]').exists()).toBe(false)

    await wrapper.find('[data-testid="guardian-events-newer"]').trigger('click')
    await settle()

    expect(guardianCalls('GET', '/security-events').at(-1)?.query).toEqual({ per_page: '50' })
    expect(wrapper.find('[data-testid="guardian-event-evt-1"]').exists()).toBe(true)
  })

  it('shows no access on a 403', async () => {
    mockPackageApi('guardian', routes({ 'GET /security-events': reply(403) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/security-events')

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})

describe('guardian.security-event', () => {
  beforeEach(() => {
    clearNuxtData()
    api.mockReset()
    api.mockImplementation(guardianScreensApi)
  })

  afterEach(async () => {
    resetGuardianPages()
    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('shows the event and its context as key-value rows', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(EventPage, '/guardian/security-events/evt-1')

    expect(guardianCalls('GET', '/security-events/{event}')[0]?.path).toBe('/security-events/evt-1')
    expect(wrapper.find('[data-testid="guardian-event-type"]').text()).toBe('login.failed')
    expect(wrapper.find('[data-testid="guardian-event-user"] a').attributes('href')).toBe('/guardian/users/7')
    expect(wrapper.find('[data-testid="guardian-event-context-guard"]').text()).toBe('web')
    expect(wrapper.find('[data-testid="guardian-event-context-attempts"]').text()).toBe('3')
    expect(wrapper.find('[data-testid="guardian-event-context-reasons"]').text()).toBe('["password"]')
  })

  it('says when the event has no context', async () => {
    mockPackageApi('guardian', routes({ 'GET /security-events/{event}': { data: lockedOut } }))

    const wrapper = await mountGuardianPage(EventPage, '/guardian/security-events/evt-2')

    expect(wrapper.find('[data-testid="guardian-event-context-empty"]').exists()).toBe(true)
  })

  it('shows no access on a 403 and not found on a 404', async () => {
    mockPackageApi('guardian', routes({ 'GET /security-events/{event}': reply(403) }))

    const denied = await mountGuardianPage(EventPage, '/guardian/security-events/evt-1')
    expect(denied.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    resetGuardianPages()
    clearNuxtData()

    mockPackageApi('guardian', routes({ 'GET /security-events/{event}': reply(404) }))

    const missing = await mountGuardianPage(EventPage, '/guardian/security-events/nope')
    expect(missing.find('[data-testid="guardian-not-found"]').exists()).toBe(true)
  })
})
