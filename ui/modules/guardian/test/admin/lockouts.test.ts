import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../../src/pages/lockouts/index.vue'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { confirmWith, cursorPage, guardianCalls, guardianScreensApi, mountGuardianPage, resetGuardianPages } from '../support'
import { lockedOut } from './support'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.lockouts` (AC 92, D-056, D-070): clearing an identifier's
 * lockout (`DELETE lockouts`, `{identifier}` in the body, never the URL)
 * after a confirmation, its 422, and the recent `login.locked_out` events.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

function routes(overrides: PackageRoutes<'guardian'> = {}): PackageRoutes<'guardian'> {
  return {
    'GET /security-events': cursorPage([lockedOut]) as never,
    'DELETE /lockouts': reply(204),
    ...overrides
  }
}

async function clear(wrapper: Awaited<ReturnType<typeof mountGuardianPage>>, identifier: string) {
  await wrapper.find('[data-testid="guardian-lockout-identifier"]').setValue(identifier)
  await wrapper.find('[data-testid="guardian-lockout-form"]').trigger('submit')
  await settle()
}

describe('guardian.lockouts', () => {
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

  it('lists the recent login.locked_out events', async () => {
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/lockouts')

    expect(guardianCalls('GET', '/security-events')[0]?.query).toEqual({ type: 'login.locked_out', per_page: '50' })
    expect(wrapper.find('[data-testid="guardian-event-evt-2"]').exists()).toBe(true)
  })

  it('clears an identifier once confirmed, with the identifier in the body only', async () => {
    const confirm = confirmWith(true)
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/lockouts')
    await clear(wrapper, ' jane@example.test ')

    const [call] = guardianCalls('DELETE', '/lockouts')
    expect(confirm.mock.calls[0]?.[0]).toContain('jane@example.test')
    expect(call?.body).toEqual({ identifier: 'jane@example.test' })
    expect(call?.query).toEqual({})
    expect(wrapper.find('[data-testid="guardian-lockout-cleared"]').text()).toContain('jane@example.test')
    expect((wrapper.find('[data-testid="guardian-lockout-identifier"]').element as HTMLInputElement).value).toBe('')
  })

  it('does nothing when the confirmation is declined', async () => {
    confirmWith(false)
    mockPackageApi('guardian', routes())

    const wrapper = await mountGuardianPage(Page, '/guardian/lockouts')
    await clear(wrapper, 'jane@example.test')

    expect(guardianCalls('DELETE', '/lockouts')).toHaveLength(0)
  })

  it('shows the field error of a 422', async () => {
    confirmWith(true)
    mockPackageApi('guardian', routes({ 'DELETE /lockouts': reply(422, { message: 'Invalid.', errors: { identifier: ['The identifier field is too long.'] } }) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/lockouts')
    await clear(wrapper, 'x')

    expect(wrapper.text()).toContain('The identifier field is too long.')
    expect(wrapper.find('[data-testid="guardian-lockout-cleared"]').exists()).toBe(false)
  })

  it('shows no access when clearing answers 403, and on the events list', async () => {
    confirmWith(true)
    mockPackageApi('guardian', routes({ 'DELETE /lockouts': reply(403), 'GET /security-events': reply(403) }))

    const wrapper = await mountGuardianPage(Page, '/guardian/lockouts')
    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)

    await clear(wrapper, 'jane@example.test')

    expect(wrapper.findAll('[data-testid="atrium-no-access"]').length).toBeGreaterThanOrEqual(2)
  })
})
