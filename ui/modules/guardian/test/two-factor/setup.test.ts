import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../../src/pages/two-factor/setup.vue'
import { screens } from '../../src/atrium'
import { settle, shell, withSetup } from '@refactor-circus/atrium/testing'
import { mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { guardianCalls, pendingStatus, RECOVERY_CODES, totpEnrolment, totpMethod } from './support'
import { useAtriumShellStore } from '@refactor-circus/atrium'
import { clearAtriumData, mockAtriumApi, mountSuspended, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.two-factor-setup` (AC 86, D-050): public and shell-less like the
 * challenge page; it shows `allowed_methods` and `enrolment_deadline`,
 * offers only the allowed methods, and after the first confirmed method
 * shows the recovery codes once, then reloads the shell and continues to
 * the guarded `redirect`.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const mounted: { unmount: () => void }[] = []

function guardianWith(routes: PackageRoutes<'guardian'> = {}): void {
  mockPackageApi('guardian', { 'GET /two-factor': { data: pendingStatus }, ...routes }, '/guardian')
}

async function mountPage(redirect = '/settings') {
  const wrapper = await mountSuspended(Page, { route: `/guardian/two-factor/setup?redirect=${encodeURIComponent(redirect)}` })
  mounted.push(wrapper)
  await settle()

  return wrapper
}

async function enrolTotp(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  await wrapper.find('[data-testid="guardian-totp-start"]').trigger('submit')
  await settle()
  await wrapper.find('[data-testid="guardian-totp-code"]').setValue('123456')
  await wrapper.find('[data-testid="guardian-totp-confirm"]').trigger('submit')
  await settle()
}

describe('guardian.two-factor-setup', () => {
  beforeEach(async () => {
    clearAtriumData()
    api.mockReset()
    api.mockResolvedValue({ data: shell() })

    const store = await withSetup(() => useAtriumShellStore())
    store.shell = null
  })

  afterEach(async () => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount()
    }

    resetPackageApis()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('is declared public (the app renders it in its public layout), at the path the screens map names', () => {
    const route = useRouter().getRoutes().find(candidate => candidate.name === screens['guardian.two-factor-setup'])

    expect(route?.path).toBe('/guardian/two-factor/setup')
    expect(route?.meta.atrium).toEqual({ public: true })
  })

  it('shows the allowed methods and the deadline, and offers only those methods, with no shell call', async () => {
    guardianWith()

    const wrapper = await mountPage()

    expect(guardianCalls('GET', '/two-factor')).toHaveLength(1)
    expect(api).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="guardian-setup-allowed"]').text()).toContain('Authenticator app, Passkey')
    expect(wrapper.find('[data-testid="guardian-setup-deadline"]').text()).toContain(new Date(pendingStatus.enrolment_deadline).toLocaleString())
    expect(wrapper.find('[data-testid="guardian-totp"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guardian-passkeys"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guardian-one-time"]').exists()).toBe(false)
    // Enrolment only: no method list or removal here.
    expect(wrapper.find('[data-testid="guardian-recovery"]').exists()).toBe(false)
  })

  it('enrols TOTP, shows the recovery codes once, then reloads the shell and follows the redirect', async () => {
    guardianWith({
      'POST /two-factor/totp': { data: totpEnrolment },
      'POST /two-factor/totp/confirm': { data: { method: totpMethod, recovery_codes: RECOVERY_CODES } }
    })

    const wrapper = await mountPage('/settings?tab=security')
    await enrolTotp(wrapper)

    expect(guardianCalls('POST', '/two-factor/totp')[0]?.body).toEqual({ label: null })
    expect(guardianCalls('POST', '/two-factor/totp/confirm')[0]?.body).toEqual({ code: '123456' })
    expect(wrapper.findAll('[data-testid="guardian-recovery-code"]').map(code => code.text())).toEqual(RECOVERY_CODES)
    expect(api).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="guardian-recovery-done"]').trigger('click')
    await settle()

    expect(api).toHaveBeenCalledWith('/shell')
    await vi.waitFor(() => expect(useRouter().currentRoute.value.fullPath).toBe('/settings?tab=security'))
  })

  it('continues at once when the confirmation brings no recovery codes, to / for an off-site redirect', async () => {
    guardianWith({
      'POST /two-factor/totp': { data: totpEnrolment },
      'POST /two-factor/totp/confirm': { data: { method: totpMethod, recovery_codes: null } }
    })

    const wrapper = await mountPage('https://evil.test/')
    await enrolTotp(wrapper)

    expect(wrapper.find('[data-testid="guardian-recovery-codes"]').exists()).toBe(false)
    await vi.waitFor(() => expect(useRouter().currentRoute.value.fullPath).toBe('/'))
  })

  it('shows the no-access state on a 403', async () => {
    guardianWith({ 'GET /two-factor': reply(403) })

    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
  })
})
