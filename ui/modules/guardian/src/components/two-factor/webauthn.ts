/*
 * The browser side of Guardian's passkeys (AC 87, D-052): Guardian sends
 * WebAuthn options as JSON (binary fields in base64url) and takes the
 * credential back as JSON. The browser's own `parseCreationOptionsFromJSON`,
 * `parseRequestOptionsFromJSON` and `toJSON` are used where they exist; this
 * converts by hand where they do not. No library.
 */

type Json = Record<string, unknown>

/** Whether this browser can run a passkey ceremony at all. */
export function passkeysSupported(): boolean {
  return typeof window !== 'undefined'
    && typeof window.PublicKeyCredential !== 'undefined'
    && typeof navigator !== 'undefined'
    && typeof navigator.credentials?.create === 'function'
}

/** base64url (padded or not) to bytes. */
export function base64urlToBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes.buffer
}

/** Bytes to unpadded base64url. */
export function bufferToBase64url(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function credentialList(list: unknown): PublicKeyCredentialDescriptor[] | undefined {
  if (!Array.isArray(list)) {
    return undefined
  }

  return list.map(item => ({ ...(item as Json), id: base64urlToBuffer(String((item as Json).id)) }) as PublicKeyCredentialDescriptor)
}

type ParsingCredential = typeof PublicKeyCredential & {
  parseCreationOptionsFromJSON?: (options: Json) => PublicKeyCredentialCreationOptions
  parseRequestOptionsFromJSON?: (options: Json) => PublicKeyCredentialRequestOptions
}

function nativeParser(): ParsingCredential | null {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined'
    ? window.PublicKeyCredential as ParsingCredential
    : null
}

/** Registration options from Guardian's JSON (`two-factor/passkeys/options`). */
export function creationOptions(json: Json): PublicKeyCredentialCreationOptions {
  const native = nativeParser()?.parseCreationOptionsFromJSON

  if (native) {
    return native(json)
  }

  const user = json.user as Json

  return {
    ...json,
    challenge: base64urlToBuffer(String(json.challenge)),
    user: { ...user, id: base64urlToBuffer(String(user.id)) },
    excludeCredentials: credentialList(json.excludeCredentials)
  } as unknown as PublicKeyCredentialCreationOptions
}

/** Assertion options from Guardian's JSON (`two-factor/challenge/passkey-options`). */
export function requestOptions(json: Json): PublicKeyCredentialRequestOptions {
  const native = nativeParser()?.parseRequestOptionsFromJSON

  if (native) {
    return native(json)
  }

  return {
    ...json,
    challenge: base64urlToBuffer(String(json.challenge)),
    allowCredentials: credentialList(json.allowCredentials)
  } as unknown as PublicKeyCredentialRequestOptions
}

type ResponseFields = AuthenticatorResponse & {
  attestationObject?: ArrayBuffer
  authenticatorData?: ArrayBuffer
  signature?: ArrayBuffer
  userHandle?: ArrayBuffer | null
  getTransports?: () => string[]
}

/** A new or asserted credential as the JSON Guardian verifies. */
export function credentialJSON(credential: PublicKeyCredential): Json {
  const withJson = credential as PublicKeyCredential & { toJSON?: () => Json }

  if (typeof withJson.toJSON === 'function') {
    return withJson.toJSON()
  }

  const response = credential.response as ResponseFields
  const encoded: Json = { clientDataJSON: bufferToBase64url(response.clientDataJSON) }

  if (response.attestationObject) {
    encoded.attestationObject = bufferToBase64url(response.attestationObject)
    encoded.transports = response.getTransports?.() ?? []
  }

  if (response.authenticatorData) {
    encoded.authenticatorData = bufferToBase64url(response.authenticatorData)
  }

  if (response.signature) {
    encoded.signature = bufferToBase64url(response.signature)
  }

  if (response.userHandle) {
    encoded.userHandle = bufferToBase64url(response.userHandle)
  }

  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? null,
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
    response: encoded
  }
}

/** Runs the registration ceremony with Guardian's options. */
export async function createPasskey(options: Json): Promise<Json> {
  const credential = await navigator.credentials.create({ publicKey: creationOptions(options) }) as PublicKeyCredential | null

  if (!credential) {
    throw new Error('No passkey was created.')
  }

  return credentialJSON(credential)
}

/** Runs the assertion ceremony with Guardian's options. */
export async function getPasskey(options: Json): Promise<Json> {
  const credential = await navigator.credentials.get({ publicKey: requestOptions(options) }) as PublicKeyCredential | null

  if (!credential) {
    throw new Error('No passkey was used.')
  }

  return credentialJSON(credential)
}
