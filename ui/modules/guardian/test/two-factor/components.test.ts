import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGuardianPageClient } from '../../src/components/two-factor/client'
import type { GuardianClient } from '../../src/components/two-factor/guardian'
import GuardianFactorRemoval from '../../src/components/two-factor/GuardianFactorRemoval.vue'
import GuardianOneTimeCodes from '../../src/components/two-factor/GuardianOneTimeCodes.vue'
import GuardianPasskeys from '../../src/components/two-factor/GuardianPasskeys.vue'
import GuardianRecoveryCodes from '../../src/components/two-factor/GuardianRecoveryCodes.vue'
import GuardianTotpEnrol from '../../src/components/two-factor/GuardianTotpEnrol.vue'
import GuardianTwoFactorMethods from '../../src/components/two-factor/GuardianTwoFactorMethods.vue'
import { base64urlToBuffer, bufferToBase64url, credentialJSON } from '../../src/components/two-factor/webauthn'
import { settle, withSetup } from '@refactor-circus/atrium/testing'
import { mockPackageApi, packageCalls, reply, resetPackageApis, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { useAtriumShellStore } from '@refactor-circus/atrium'
import { mountSuspended } from '@refactor-circus/atrium/testing'
import {
  emailMethod,
  enabledStatus,
  guardianCalls,
  leakSurfaces,
  passkey,
  pendingStatus,
  RECOVERY_CODES,
  stubWebAuthn,
  totpEnrolment,
  totpMethod,
  unstubWebAuthn
} from './support'

/*
 * The shared two-factor components (AC 87): each request's method, path and
 * body; the TOTP QR code drawn as SVG with no request beyond Guardian's, and
 * the secret dropped on unmount; recovery codes shown once, with copy,
 * download and regenerate after a confirmation; passkeys (options, a mocked
 * `create()`, store, list, remove, hidden on `passkeys_available` false, on
 * 501 and without `PublicKeyCredential`); email and SMS (enrol, confirm, a
 * 422 `method_unavailable` hiding the type, a 429 resend); removal needing
 * another factor's code, and a 422 `two_factor_required`; the policy's
 * methods only when two-factor is required.
 */

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

let client: GuardianClient
const mounted: Wrapper[] = []

function guardianWith(routes: PackageRoutes<'guardian'>): void {
  mockPackageApi('guardian', routes, '/guardian')
}

async function mount<T>(component: T, props: Record<string, unknown>): Promise<Wrapper> {
  const wrapper = await mountSuspended(component, { props: { client, ...props } } as never)
  mounted.push(wrapper)
  await settle()

  return wrapper
}

describe('the two-factor components', () => {
  beforeEach(async () => {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = null
    client = await withSetup(() => useGuardianPageClient())
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount()
    }

    resetPackageApis()
    unstubWebAuthn()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('TOTP', () => {
    beforeEach(() => {
      guardianWith({
        'POST /two-factor/totp': { data: totpEnrolment },
        'POST /two-factor/totp/confirm': { data: { method: totpMethod, recovery_codes: RECOVERY_CODES } }
      })
    })

    it('starts with a label and draws the URI as an inline SVG QR code, fetching nothing but Guardian', async () => {
      const wrapper = await mount(GuardianTotpEnrol, {})
      await wrapper.find('[data-testid="guardian-totp-label"]').setValue('Phone')
      await wrapper.find('[data-testid="guardian-totp-start"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/two-factor/totp')[0]?.body).toEqual({ label: 'Phone' })
      expect(wrapper.find('[data-testid="guardian-qr"] svg').exists()).toBe(true)
      expect(wrapper.find('[data-testid="guardian-qr"]').html()).not.toContain(totpEnrolment.secret)
      expect(wrapper.find('[data-testid="guardian-totp-secret"]').text()).toBe(totpEnrolment.secret)
      expect(wrapper.find('img').exists()).toBe(false)

      const urls = vi.mocked(globalThis.fetch).mock.calls.map(([input]) => input instanceof Request ? input.url : String(input))
      expect(urls.length).toBeGreaterThan(0)
      expect(urls.every(url => new URL(url).pathname.startsWith('/guardian/'))).toBe(true)
      expect(packageCalls.every(call => call.pkg === 'guardian')).toBe(true)
    })

    it('confirms with the code and hands over the recovery codes, then forgets the secret', async () => {
      const wrapper = await mount(GuardianTotpEnrol, {})
      await wrapper.find('[data-testid="guardian-totp-start"]').trigger('submit')
      await settle()
      await wrapper.find('[data-testid="guardian-totp-code"]').setValue('123456')
      await wrapper.find('[data-testid="guardian-totp-confirm"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/two-factor/totp/confirm')[0]?.body).toEqual({ code: '123456' })
      expect(wrapper.emitted('confirmed')).toEqual([[RECOVERY_CODES]])
      expect(wrapper.find('[data-testid="guardian-totp-secret"]').exists()).toBe(false)
      expect(leakSurfaces()).not.toContain(totpEnrolment.secret)
    })

    it('drops the secret and URI when it unmounts', async () => {
      const wrapper = await mount(GuardianTotpEnrol, {})
      await wrapper.find('[data-testid="guardian-totp-start"]').trigger('submit')
      await settle()

      const state = (wrapper.vm as unknown as { $: { setupState: { secret: string | null, uri: string | null } } }).$.setupState
      expect(state.secret).toBe(totpEnrolment.secret)

      wrapper.unmount()
      mounted.splice(mounted.indexOf(wrapper), 1)

      expect(state.secret).toBeNull()
      expect(state.uri).toBeNull()
    })

    it('shows the field error of a wrong code', async () => {
      resetPackageApis()
      guardianWith({
        'POST /two-factor/totp': { data: totpEnrolment },
        'POST /two-factor/totp/confirm': reply(422, { message: 'Invalid.', errors: { code: ['That code is not valid.'] } })
      })

      const wrapper = await mount(GuardianTotpEnrol, {})
      await wrapper.find('[data-testid="guardian-totp-start"]').trigger('submit')
      await settle()
      await wrapper.find('[data-testid="guardian-totp-code"]').setValue('000000')
      await wrapper.find('[data-testid="guardian-totp-confirm"]').trigger('submit')
      await settle()

      expect(wrapper.text()).toContain('That code is not valid.')
      expect(wrapper.emitted('confirmed')).toBeUndefined()
    })
  })

  describe('recovery codes', () => {
    it('shows the codes once, with copy and an in-browser .txt download', async () => {
      const writeText = vi.fn(async () => {})
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      const createObjectURL = vi.fn(() => 'blob:codes')
      vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }))
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

      const wrapper = await mount(GuardianRecoveryCodes, { codes: RECOVERY_CODES })

      expect(wrapper.findAll('[data-testid="guardian-recovery-code"]').map(code => code.text())).toEqual(RECOVERY_CODES)

      await wrapper.find('[data-testid="guardian-recovery-copy"]').trigger('click')
      await settle()
      expect(writeText).toHaveBeenCalledWith(`${RECOVERY_CODES.join('\n')}\n`)

      await wrapper.find('[data-testid="guardian-recovery-download"]').trigger('click')
      const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0]
      expect(await blob.text()).toBe(`${RECOVERY_CODES.join('\n')}\n`)
      expect(click).toHaveBeenCalledOnce()

      await wrapper.find('[data-testid="guardian-recovery-done"]').trigger('click')
      expect(wrapper.emitted('done')).toHaveLength(1)
      expect(leakSurfaces()).not.toContain(RECOVERY_CODES[0])

      Reflect.deleteProperty(navigator, 'clipboard')
    })

    it('shows only the remaining count, and regenerates after a confirmation, showing the new codes once', async () => {
      guardianWith({ 'POST /two-factor/recovery-codes': { data: { recovery_codes: RECOVERY_CODES } } })
      const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true)
      vi.stubGlobal('confirm', confirm)

      const wrapper = await mount(GuardianTwoFactorMethods, { status: enabledStatus })

      expect(wrapper.find('[data-testid="guardian-recovery-remaining"]').text()).toContain('8')
      expect(wrapper.find('[data-testid="guardian-recovery-codes"]').exists()).toBe(false)

      await wrapper.find('[data-testid="guardian-recovery-regenerate"]').trigger('click')
      await settle()
      expect(guardianCalls('POST', '/two-factor/recovery-codes')).toHaveLength(0)

      await wrapper.find('[data-testid="guardian-recovery-regenerate"]').trigger('click')
      await settle()
      expect(guardianCalls('POST', '/two-factor/recovery-codes')).toHaveLength(1)
      expect(wrapper.findAll('[data-testid="guardian-recovery-code"]').map(code => code.text())).toEqual(RECOVERY_CODES)

      await wrapper.find('[data-testid="guardian-recovery-done"]').trigger('click')
      expect(wrapper.find('[data-testid="guardian-recovery-codes"]').exists()).toBe(false)
    })
  })

  describe('passkeys', () => {
    it('lists them, then registers one: the options, navigator.credentials.create(), then the store with a label', async () => {
      const { create } = stubWebAuthn()
      guardianWith({
        'GET /two-factor/passkeys': { data: [passkey] },
        'POST /two-factor/passkeys/options': { data: { challenge: 'AQID', rp: { id: 'app.test', name: 'Acme' }, user: { id: 'dXNlcg', name: 'ada', displayName: 'Ada' }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }], excludeCredentials: [{ id: 'Y3JlZC0x', type: 'public-key' }] } },
        'POST /two-factor/passkeys': { data: { passkey, recovery_codes: null } }
      })

      const wrapper = await mount(GuardianPasskeys, { available: true })

      expect(wrapper.find(`[data-testid="guardian-passkey-${passkey.id}"]`).text()).toContain('Laptop')

      await wrapper.find('[data-testid="guardian-passkey-label"]').setValue('Desk key')
      await wrapper.find('[data-testid="guardian-passkey-register"]').trigger('submit')
      await settle()

      const publicKey = (create.mock.calls[0] as unknown as [{ publicKey: PublicKeyCredentialCreationOptions }])[0].publicKey
      expect(new Uint8Array(publicKey.challenge as ArrayBuffer)).toEqual(new Uint8Array([1, 2, 3]))
      expect(new TextDecoder().decode(publicKey.user.id as ArrayBuffer)).toBe('user')
      expect(new TextDecoder().decode(publicKey.excludeCredentials![0]!.id as ArrayBuffer)).toBe('cred-1')
      expect(guardianCalls('POST', '/two-factor/passkeys/options')).toHaveLength(1)
      expect(guardianCalls('POST', '/two-factor/passkeys')[0]?.body).toEqual({
        credential: { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: { clientDataJSON: 'e30', attestationObject: 'o2M' }, clientExtensionResults: {} },
        label: 'Desk key'
      })
      expect(wrapper.emitted('confirmed')).toEqual([[null]])
    })

    it('removes one with a code from another factor', async () => {
      stubWebAuthn()
      guardianWith({ 'GET /two-factor/passkeys': { data: [passkey] }, 'DELETE /two-factor/passkeys/{passkey}': reply(204) })

      const wrapper = await mount(GuardianPasskeys, { available: true })
      await wrapper.find('[data-testid="guardian-remove-open"]').trigger('click')
      await wrapper.find('[data-testid="guardian-remove-code"]').setValue('123456')
      await wrapper.find('[data-testid="guardian-remove-form"]').trigger('submit')
      await settle()

      const [call] = guardianCalls('DELETE', '/two-factor/passkeys/{passkey}')
      expect(call?.path).toBe(`/two-factor/passkeys/${passkey.id}`)
      expect(call?.body).toEqual({ code: '123456' })
      expect(call?.query).toEqual({})
      expect(wrapper.emitted('changed')).toHaveLength(1)
    })

    it('hides behind a note while Guardian says passkeys are unavailable', async () => {
      stubWebAuthn()
      guardianWith({ 'GET /two-factor/passkeys': { data: [passkey] } })

      const wrapper = await mount(GuardianPasskeys, { available: false })

      expect(wrapper.find('[data-testid="guardian-passkeys-unavailable"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="guardian-passkey-register"]').exists()).toBe(false)
      expect(guardianCalls('GET', '/two-factor/passkeys')).toHaveLength(0)
    })

    it('hides behind a note when a passkey endpoint answers 501', async () => {
      stubWebAuthn()
      guardianWith({ 'GET /two-factor/passkeys': reply(501, { message: 'Install web-auth/webauthn-lib.' }) })

      const wrapper = await mount(GuardianPasskeys, { available: true })

      expect(wrapper.find('[data-testid="guardian-passkeys-unavailable"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="guardian-passkey-register"]').exists()).toBe(false)
    })

    it('hides behind a note without PublicKeyCredential', async () => {
      guardianWith({ 'GET /two-factor/passkeys': { data: [passkey] } })

      const wrapper = await mount(GuardianPasskeys, { available: true })

      expect(wrapper.find('[data-testid="guardian-passkeys-unavailable"]').exists()).toBe(true)
      expect(guardianCalls('GET', '/two-factor/passkeys')).toHaveLength(0)
    })
  })

  describe('email and SMS codes', () => {
    it('enrols an email code: send to the destination, then confirm', async () => {
      guardianWith({
        'POST /two-factor/one-time-codes': { data: emailMethod },
        'POST /two-factor/one-time-codes/confirm': { data: { method: emailMethod, recovery_codes: RECOVERY_CODES } }
      })

      const wrapper = await mount(GuardianOneTimeCodes, { types: ['email', 'sms'] })
      await wrapper.find('[data-testid="guardian-one-time-destination"]').setValue('ada@example.com')
      await wrapper.find('[data-testid="guardian-one-time-send"]').trigger('submit')
      await settle()
      await wrapper.find('[data-testid="guardian-one-time-code"]').setValue('654321')
      await wrapper.find('[data-testid="guardian-one-time-confirm"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/two-factor/one-time-codes')[0]?.body).toEqual({ type: 'email', destination: 'ada@example.com' })
      expect(guardianCalls('POST', '/two-factor/one-time-codes/confirm')[0]?.body).toEqual({ type: 'email', code: '654321' })
      expect(wrapper.emitted('confirmed')).toEqual([[RECOVERY_CODES]])
    })

    it('says "not available on this site" for a 422 method_unavailable, and hides that type', async () => {
      guardianWith({ 'POST /two-factor/one-time-codes': reply(422, { message: 'SMS codes are not available.', code: 'method_unavailable' }) })

      const wrapper = await mount(GuardianOneTimeCodes, { types: ['email', 'sms'] })
      await wrapper.find('[data-testid="guardian-one-time-type"]').setValue('sms')
      await wrapper.find('[data-testid="guardian-one-time-destination"]').setValue('+15551234567')
      await wrapper.find('[data-testid="guardian-one-time-send"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/two-factor/one-time-codes')[0]?.body).toEqual({ type: 'sms', destination: '+15551234567' })
      expect(wrapper.find('[data-testid="guardian-one-time-unavailable"]').text()).toContain('not available on this site')
      expect(wrapper.findAll('[data-testid="guardian-one-time-type"] option').map(option => option.attributes('value'))).toEqual(['email'])
    })

    it('shows the wait of a 429 on a resend', async () => {
      let sends = 0
      guardianWith({
        'POST /two-factor/one-time-codes': () => ++sends === 1 ? { data: emailMethod } : reply(429, { message: 'Too many.', code: 'too_many_attempts', retry_after: 37 })
      })

      const wrapper = await mount(GuardianOneTimeCodes, { types: ['email'] })
      await wrapper.find('[data-testid="guardian-one-time-destination"]').setValue('ada@example.com')
      await wrapper.find('[data-testid="guardian-one-time-send"]').trigger('submit')
      await settle()
      await wrapper.find('[data-testid="guardian-one-time-send"]').trigger('submit')
      await settle()

      expect(guardianCalls('POST', '/two-factor/one-time-codes')).toHaveLength(2)
      expect(wrapper.find('[data-testid="guardian-throttled"]').text()).toContain('37')
      expect(wrapper.find('[data-testid="guardian-one-time-confirm"]').exists()).toBe(true)
    })
  })

  describe('removal', () => {
    it('removes a method with another factor\'s code, in the body', async () => {
      guardianWith({ 'DELETE /two-factor/methods/{method}': reply(204) })

      const wrapper = await mount(GuardianFactorRemoval, { kind: 'method', id: totpMethod.id, name: 'Authenticator app' })
      await wrapper.find('[data-testid="guardian-remove-open"]').trigger('click')
      await wrapper.find('[data-testid="guardian-remove-code"]').setValue('aaaaa-11111')
      await wrapper.find('[data-testid="guardian-remove-form"]').trigger('submit')
      await settle()

      const [call] = guardianCalls('DELETE', '/two-factor/methods/{method}')
      expect(call?.path).toBe(`/two-factor/methods/${totpMethod.id}`)
      expect(call?.body).toEqual({ code: 'aaaaa-11111' })
      expect(call?.query).toEqual({})
      expect(wrapper.emitted('removed')).toHaveLength(1)
    })

    it('says why on a 422 two_factor_required', async () => {
      guardianWith({ 'DELETE /two-factor/methods/{method}': reply(422, { message: 'Two-factor is required.', code: 'two_factor_required' }) })

      const wrapper = await mount(GuardianFactorRemoval, { kind: 'method', id: totpMethod.id, name: 'Authenticator app' })
      await wrapper.find('[data-testid="guardian-remove-open"]').trigger('click')
      await wrapper.find('[data-testid="guardian-remove-code"]').setValue('123456')
      await wrapper.find('[data-testid="guardian-remove-form"]').trigger('submit')
      await settle()

      expect(wrapper.find('[data-testid="guardian-remove-required"]').text()).toContain('cannot be removed')
      expect(wrapper.emitted('removed')).toBeUndefined()
    })

    it('shows the field error when the code proves no other factor', async () => {
      guardianWith({ 'DELETE /two-factor/methods/{method}': reply(422, { message: 'Invalid.', errors: { code: ['Enter a code from another method.'] } }) })

      const wrapper = await mount(GuardianFactorRemoval, { kind: 'method', id: totpMethod.id, name: 'Authenticator app' })
      await wrapper.find('[data-testid="guardian-remove-open"]').trigger('click')
      await wrapper.find('[data-testid="guardian-remove-form"]').trigger('submit')
      await settle()

      expect(wrapper.text()).toContain('Enter a code from another method.')
    })
  })

  describe('the methods, by policy', () => {
    it('lists the confirmed methods, each removable, and offers every method when not required', async () => {
      stubWebAuthn()
      guardianWith({ 'GET /two-factor/passkeys': { data: [passkey] } })

      const wrapper = await mount(GuardianTwoFactorMethods, { status: enabledStatus })

      for (const method of enabledStatus.methods) {
        expect(wrapper.find(`[data-testid="guardian-method-${method.id}"] [data-testid="guardian-remove-open"]`).exists(), method.id).toBe(true)
      }

      expect(wrapper.find('[data-testid="guardian-totp"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="guardian-one-time"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="guardian-passkeys"]').exists()).toBe(true)
    })

    it('offers only allowed_methods while two-factor is required', async () => {
      const wrapper = await mount(GuardianTwoFactorMethods, { status: { ...pendingStatus, allowed_methods: ['email'] } })

      expect(wrapper.find('[data-testid="guardian-totp"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="guardian-passkeys"]').exists()).toBe(false)
      expect(wrapper.findAll('[data-testid="guardian-one-time-type"] option').map(option => option.attributes('value'))).toEqual(['email'])
    })
  })

  describe('the base64url helper', () => {
    it('converts both ways, padded or not', () => {
      expect(bufferToBase64url(base64urlToBuffer('AQID'))).toBe('AQID')
      expect(new TextDecoder().decode(base64urlToBuffer('Y3JlZC0x'))).toBe('cred-1')
      expect(bufferToBase64url(new Uint8Array([251, 255]))).toBe('-_8')
      expect(new Uint8Array(base64urlToBuffer('-_8='))).toEqual(new Uint8Array([251, 255]))
    })

    it('encodes a credential without toJSON() by hand', () => {
      const bytes = (text: string) => new TextEncoder().encode(text).buffer
      const credential = {
        id: 'cred-1',
        rawId: bytes('cred-1'),
        type: 'public-key',
        authenticatorAttachment: 'platform',
        getClientExtensionResults: () => ({}),
        response: { clientDataJSON: bytes('{}'), authenticatorData: bytes('auth'), signature: bytes('sig'), userHandle: null }
      } as unknown as PublicKeyCredential

      expect(credentialJSON(credential)).toEqual({
        id: 'cred-1',
        rawId: 'Y3JlZC0x',
        type: 'public-key',
        authenticatorAttachment: 'platform',
        clientExtensionResults: {},
        response: { clientDataJSON: 'e30', authenticatorData: 'YXV0aA', signature: 'c2ln' }
      })
    })
  })
})
