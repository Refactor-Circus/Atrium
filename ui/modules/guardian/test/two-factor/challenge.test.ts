import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../../src/pages/two-factor/challenge.vue'
import { screens } from '../../src/atrium'
import { guardianApiBase } from '../../src/components/two-factor/client'
import { guardedRedirect } from '../../src/components/two-factor/guardian'
import { settle, shell, withSetup } from '@refactor-circus/atrium/testing'
import { integrationEntry, mockPackageApi, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { enabledStatus, guardianCalls, leakSurfaces, stubWebAuthn, totpMethod, unstubWebAuthn } from './support'
import { useAtrium, useAtriumShellStore } from '@refactor-circus/atrium'
import { clearAtriumData, mockAtriumApi, mountSuspended, useRouter } from '@refactor-circus/atrium/testing'

/*
 * `guardian.two-factor-challenge` (AC 85, D-050): public, in the public
 * layout, with no shell call and no `atrium.screens.show`; a client of its
 * own whose base is a loaded shell's Guardian `api_base`, else the page
 * boot's, else `/guardian`; each method the user has (TOTP, email and
 * SMS with "send code", passkey through `navigator.credentials.get()`,
 * recovery); 204 reloading the shell and following a guarded `redirect`;
 * 422, 429 and 401; and the code kept out of the URL, the title and storage.
 */

const { api } = vi.hoisted(() => ({ api: vi.fn() }))

mockAtriumApi(api)

const CODE = '987654'
const onUnauthorized = vi.fn()
const mounted: { unmount: () => void }[] = []

function guardianWith(routes: PackageRoutes<'guardian'> = {}, base = '/guardian'): void {
  mockPackageApi('guardian', { 'GET /two-factor': { data: enabledStatus }, ...routes }, base)
}

async function mountPage(redirect: string | null = '/settings') {
  const wrapper = await mountSuspended(Page, { route: redirect === null ? '/guardian/two-factor/challenge' : `/guardian/two-factor/challenge?redirect=${encodeURIComponent(redirect)}` })
  mounted.push(wrapper)
  await settle()

  return wrapper
}

async function choose(wrapper: Awaited<ReturnType<typeof mountPage>>, method: string) {
  await wrapper.find(`[data-testid="guardian-challenge-method-${method}"]`).trigger('click')
  await settle()
}

async function answer(wrapper: Awaited<ReturnType<typeof mountPage>>, code = CODE) {
  await wrapper.find('[data-testid="guardian-challenge-code"]').setValue(code)
  await wrapper.find('[data-testid="guardian-challenge-form"]').trigger('submit')
  await settle()
}

describe('guardian.two-factor-challenge', () => {
  beforeEach(async () => {
    clearAtriumData()
    api.mockReset()
    api.mockResolvedValue({ data: shell() })
    onUnauthorized.mockReset()
    localStorage.clear()
    sessionStorage.clear()

    const store = await withSetup(() => useAtriumShellStore())
    store.shell = null

    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ onUnauthorized })
  })

  afterEach(async () => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount()
    }

    const atrium = await withSetup(() => useAtrium())
    atrium.auth({})
    resetPackageApis()
    unstubWebAuthn()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    await useRouter().replace('/')
  })

  it('is declared public (the app renders it in its public layout), at the path the screens map names', () => {
    const route = useRouter().getRoutes().find(candidate => candidate.name === screens['guardian.two-factor-challenge'])

    expect(route?.path).toBe('/guardian/two-factor/challenge')
    expect(route?.meta.atrium).toEqual({ public: true })
  })

  it('loads the status from Guardian\'s default /guardian, with no shell call and no screen frame', async () => {
    guardianWith()

    const wrapper = await mountPage()

    expect(guardianCalls('GET', '/two-factor')).toHaveLength(1)
    expect(api).not.toHaveBeenCalled()
    expect(wrapper.html()).not.toContain('screen-key')
    expect(wrapper.findAll('[data-testid^="guardian-challenge-method-"]').map(button => button.attributes('data-testid')))
      .toEqual(['totp', 'email', 'sms', 'recovery'].map(method => `guardian-challenge-method-${method}`))
  })

  it('finds Guardian at a loaded shell\'s api_base, even an inactive one', async () => {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = shell({ integrations: [integrationEntry('guardian', { active: false, api_base: '/security/api' })] })
    guardianWith({}, '/security/api')

    await mountPage()

    expect(guardianCalls('GET', '/two-factor')).toHaveLength(1)
  })

  it('takes the base in order: a loaded shell\'s api_base, the page boot\'s, then /guardian', () => {
    expect(guardianApiBase('https://guardian.example.test/api/', '/security/api', '/atrium/api', 'https://app.test')).toBe('https://guardian.example.test/api')
    expect(guardianApiBase('', '/security/api', '/atrium/api', 'https://app.test')).toBe('https://app.test/security/api')
    expect(guardianApiBase(undefined, null, '/atrium/api', 'https://app.test')).toBe('https://app.test/guardian')
    expect(guardianApiBase(undefined, undefined, 'https://api.example.test/atrium/api', 'https://app.test')).toBe('https://api.example.test/guardian')
  })

  it('passes with an authenticator code, reloads the shell and follows the redirect', async () => {
    guardianWith({ 'POST /two-factor/challenge': reply(204) })

    const wrapper = await mountPage('/settings?tab=profile')
    await answer(wrapper)

    expect(guardianCalls('POST', '/two-factor/challenge')[0]?.body).toEqual({ method: 'totp', code: CODE })
    expect(api).toHaveBeenCalledWith('/shell')
    // The first navigation to /settings loads its page, which takes a while.
    await vi.waitFor(() => expect(useRouter().currentRoute.value.fullPath).toBe('/settings?tab=profile'))
  })

  it.each(['email', 'sms'] as const)('sends a %s code, then passes with it', async (method) => {
    guardianWith({ 'POST /two-factor/challenge/send': reply(204), 'POST /two-factor/challenge': reply(204) })

    const wrapper = await mountPage()
    await choose(wrapper, method)
    await wrapper.find('[data-testid="guardian-challenge-send"]').trigger('click')
    await settle()

    expect(guardianCalls('POST', '/two-factor/challenge/send')[0]?.body).toEqual({ method })
    expect(wrapper.find('[data-testid="guardian-challenge-sent"]').exists()).toBe(true)

    await answer(wrapper)

    expect(guardianCalls('POST', '/two-factor/challenge')[0]?.body).toEqual({ method, code: CODE })
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/settings'))
  })

  it('passes with a recovery code', async () => {
    guardianWith({ 'POST /two-factor/challenge': reply(204) })

    const wrapper = await mountPage()
    await choose(wrapper, 'recovery')
    await answer(wrapper, 'aaaaa-11111')

    expect(guardianCalls('POST', '/two-factor/challenge')[0]?.body).toEqual({ method: 'recovery', code: 'aaaaa-11111' })
  })

  it('passes with a passkey: the options, navigator.credentials.get(), then the assertion', async () => {
    const { get } = stubWebAuthn()
    guardianWith({
      'POST /two-factor/challenge/passkey-options': { data: { challenge: 'AQID', rpId: 'app.test', allowCredentials: [{ id: 'Y3JlZC0x', type: 'public-key' }] } },
      'POST /two-factor/challenge': reply(204)
    })

    const wrapper = await mountPage()
    await choose(wrapper, 'passkey')
    await wrapper.find('[data-testid="guardian-challenge-passkey"]').trigger('click')
    await settle()

    const publicKey = (get.mock.calls[0] as unknown as [{ publicKey: PublicKeyCredentialRequestOptions }])[0].publicKey
    expect(new Uint8Array(publicKey.challenge as ArrayBuffer)).toEqual(new Uint8Array([1, 2, 3]))
    expect(new TextDecoder().decode(publicKey.allowCredentials![0]!.id as ArrayBuffer)).toBe('cred-1')
    expect(guardianCalls('POST', '/two-factor/challenge')[0]?.body).toEqual({
      method: 'passkey',
      assertion: { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: { clientDataJSON: 'e30', authenticatorData: 'YXV0aA', signature: 'c2ln' }, clientExtensionResults: {} }
    })
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/settings'))
  })

  it('offers no passkey without PublicKeyCredential, or while Guardian says passkeys are unavailable', async () => {
    guardianWith()
    let wrapper = await mountPage()
    expect(wrapper.find('[data-testid="guardian-challenge-method-passkey"]').exists()).toBe(false)

    stubWebAuthn()
    resetPackageApis()
    guardianWith({ 'GET /two-factor': { data: { ...enabledStatus, passkeys_available: false } } })
    wrapper = await mountPage()
    expect(wrapper.find('[data-testid="guardian-challenge-method-passkey"]').exists()).toBe(false)
  })

  it('offers only the methods the user has', async () => {
    guardianWith({ 'GET /two-factor': { data: { ...enabledStatus, methods: [totpMethod], passkeys: [], recovery_codes_remaining: 0 } } })

    const wrapper = await mountPage()

    expect(wrapper.findAll('[data-testid^="guardian-challenge-method-"]').map(button => button.text())).toEqual(['Authenticator app'])
  })

  it('shows the error of a 422 and stays', async () => {
    guardianWith({ 'POST /two-factor/challenge': reply(422, { message: 'Invalid.', errors: { code: ['That code is not valid.'] } }) })

    const wrapper = await mountPage()
    await answer(wrapper)

    expect(wrapper.find('[data-testid="guardian-challenge-error"]').text()).toBe('That code is not valid.')
    expect(useRouter().currentRoute.value.path).toBe('/guardian/two-factor/challenge')
    expect(api).not.toHaveBeenCalled()
  })

  it('shows a "too many attempts" state on a 429', async () => {
    guardianWith({ 'POST /two-factor/challenge': reply(429, { message: 'Too many.', code: 'too_many_attempts', retry_after: 42 }) })

    const wrapper = await mountPage()
    await answer(wrapper)

    expect(wrapper.find('[data-testid="guardian-challenge-throttled"]').text()).toContain('42')
    expect(wrapper.find('[data-testid="guardian-challenge-form"]').exists()).toBe(false)
  })

  it('calls onUnauthorized() on a 401', async () => {
    guardianWith({ 'GET /two-factor': reply(401) })

    await mountPage()

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it.each([
    ['an off-site URL', 'https://evil.test/steal'],
    ['a scheme-relative URL', '//evil.test/steal'],
    ['a backslash host', '/\\evil.test'],
    ['javascript:', 'javascript:alert(1)'],
    ['the challenge page itself', '/guardian/two-factor/challenge?redirect=/x']
  ])('falls back to / for %s', async (_, redirect) => {
    expect(guardedRedirect(redirect)).toBe('/')

    guardianWith({ 'POST /two-factor/challenge': reply(204) })

    const wrapper = await mountPage(redirect)
    await answer(wrapper)

    await vi.waitFor(() => expect(useRouter().currentRoute.value.fullPath).toBe('/'))
  })

  it('falls back to / with no redirect, and keeps an inside path', () => {
    expect(guardedRedirect(undefined)).toBe('/')
    expect(guardedRedirect(['/settings', '/x'])).toBe('/settings')
    expect(guardedRedirect('/roster/users?page=2')).toBe('/roster/users?page=2')
  })

  it('keeps the code out of the URL, the title and storage', async () => {
    guardianWith({ 'POST /two-factor/challenge': reply(422, { message: 'Invalid.', errors: { code: ['No.'] } }) })

    const wrapper = await mountPage()
    await wrapper.find('[data-testid="guardian-challenge-code"]').setValue(CODE)

    expect(wrapper.find('[data-testid="guardian-challenge-code"]').attributes('autocomplete')).toBe('one-time-code')
    expect(leakSurfaces()).not.toContain(CODE)

    await wrapper.find('[data-testid="guardian-challenge-form"]').trigger('submit')
    await settle()

    expect(guardianCalls('POST', '/two-factor/challenge')[0]?.query).toEqual({})
    expect(leakSurfaces()).not.toContain(CODE)
    expect((wrapper.find('[data-testid="guardian-challenge-code"]').element as HTMLInputElement).value).toBe('')
  })
})
