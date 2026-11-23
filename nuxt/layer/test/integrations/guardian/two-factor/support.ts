import { vi } from 'vitest'
import type { components } from '../../../../app/integrations/guardian/client/schema'
import { packageCalls, type PackageCall } from '../../support'

/*
 * Shared payloads and helpers of the Guardian two-factor suites (AC 83 to
 * 87), typed with `satisfies` against the vendored `components`.
 */

type Schemas = components['schemas']

export const totpMethod = {
  id: '01JTOTP',
  type: 'totp',
  label: 'Phone',
  destination: null,
  confirmed_at: '2026-11-01T10:00:00+00:00',
  last_used_at: null,
  created_at: '2026-11-01T10:00:00+00:00'
} satisfies Schemas['TwoFactorMethodResource']

export const emailMethod = {
  ...totpMethod,
  id: '01JEMAIL',
  type: 'email',
  label: null,
  destination: 'a***@example.com'
} satisfies Schemas['TwoFactorMethodResource']

export const smsMethod = {
  ...totpMethod,
  id: '01JSMS',
  type: 'sms',
  label: null,
  destination: '+1******4567'
} satisfies Schemas['TwoFactorMethodResource']

export const passkey = {
  id: '01JPASSKEY',
  label: 'Laptop',
  transports: ['internal'],
  aaguid: null,
  last_used_at: null,
  created_at: '2026-11-01T10:00:00+00:00'
} satisfies Schemas['PasskeyResource']

/** A user with every factor confirmed. */
export const enabledStatus = {
  enabled: true,
  methods: [totpMethod, emailMethod, smsMethod],
  passkeys: [passkey],
  passkeys_available: true,
  recovery_codes_remaining: 8,
  required: false,
  allowed_methods: [],
  enrolment_deadline: null
} satisfies Schemas['TwoFactorStatusResource']

/** A user who must enrol, with TOTP or a passkey, by a deadline. */
export const pendingStatus = {
  enabled: false,
  methods: [],
  passkeys: [],
  passkeys_available: true,
  recovery_codes_remaining: 0,
  required: true,
  allowed_methods: ['totp', 'passkey'],
  enrolment_deadline: '2026-12-01T10:00:00+00:00'
} satisfies Schemas['TwoFactorStatusResource']

export const RECOVERY_CODES = ['aaaaa-11111', 'bbbbb-22222', 'ccccc-33333']

export const totpEnrolment = {
  method: { ...totpMethod, confirmed_at: null },
  secret: 'JBSWY3DPEHPK3PXP',
  otpauth_uri: 'otpauth://totp/Acme:ada@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme'
} satisfies Schemas['TotpEnrolmentResource']

/** The Guardian calls with `method` to the route template `route` (`/two-factor/totp`). */
export function guardianCalls(method: string, route: string): PackageCall[] {
  return packageCalls.filter(call => call.pkg === 'guardian' && call.method === method && call.route === route)
}

/** Every string a test could find a secret in: the URL, the title and storage. */
export function leakSurfaces(): string {
  const storage = (store: Storage) => Array.from({ length: store.length }, (_, index) => `${store.key(index)}=${store.getItem(store.key(index)!)}`).join('\n')

  return [window.location.href, document.title, storage(localStorage), storage(sessionStorage)].join('\n')
}

/** A stand-in `PublicKeyCredential` for the WebAuthn ceremonies. */
export function fakeCredential(kind: 'create' | 'get'): PublicKeyCredential {
  const json = kind === 'create'
    ? { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: { clientDataJSON: 'e30', attestationObject: 'o2M' }, clientExtensionResults: {} }
    : { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: { clientDataJSON: 'e30', authenticatorData: 'YXV0aA', signature: 'c2ln' }, clientExtensionResults: {} }

  return { id: 'cred-1', type: 'public-key', toJSON: () => json } as unknown as PublicKeyCredential
}

/**
 * Puts a browser with WebAuthn in place: `PublicKeyCredential` (without the
 * JSON parsers, so the layer's own conversion runs) and
 * `navigator.credentials` whose `create()` and `get()` answer `fakeCredential()`.
 */
export function stubWebAuthn() {
  const create = vi.fn(async () => fakeCredential('create'))
  const get = vi.fn(async () => fakeCredential('get'))

  vi.stubGlobal('PublicKeyCredential', function PublicKeyCredential() {})
  Object.defineProperty(navigator, 'credentials', { value: { create, get }, configurable: true })

  return { create, get }
}

/** Takes WebAuthn away again. */
export function unstubWebAuthn(): void {
  Reflect.deleteProperty(navigator, 'credentials')
}
