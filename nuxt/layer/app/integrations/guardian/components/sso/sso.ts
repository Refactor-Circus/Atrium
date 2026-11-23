import type { components } from '../../client/schema'

/*
 * What Guardian's SSO and SCIM components share (AC 96), ported from
 * Guardian v1's Atrium UI (`src/Atrium`, `resources/views/atrium`): payload
 * types, the protocols and the settings each one takes, paths, and the SCIM
 * base URL (D-058).
 */

type Schemas = components['schemas']

/** The non-secret settings Guardian sends back, by name. */
export type GuardianSsoSettings = Partial<Record<GuardianSsoField, string>>

/**
 * A connection as Guardian sends it. The vendored schema types `settings` as
 * a string, but Guardian sends an object of the non-secret settings.
 */
export type GuardianSsoConnection = Omit<Schemas['SsoConnectionResource'], 'settings'> & { settings: GuardianSsoSettings | null }
export type GuardianScimToken = Schemas['ScimTokenResource']
export type GuardianSsoIdentity = Schemas['SsoIdentityResource']

/** The protocols a connection speaks, in v1's order. */
export const SSO_PROTOCOLS = ['oidc', 'azure', 'saml'] as const

export type GuardianSsoProtocol = typeof SSO_PROTOCOLS[number]

/** Every protocol setting the vendored schema accepts. */
export type GuardianSsoField = 'issuer' | 'tenant' | 'client_id' | 'client_secret' | 'metadata_url' | 'entity_id' | 'sso_url' | 'certificate'

/** The settings each protocol takes (Guardian's `SsoConnectionRules::SETTINGS`), in v1's form order. */
export const PROTOCOL_FIELDS: Record<GuardianSsoProtocol, readonly GuardianSsoField[]> = {
  oidc: ['issuer', 'client_id', 'client_secret'],
  azure: ['tenant', 'client_id', 'client_secret'],
  saml: ['metadata_url', 'entity_id', 'sso_url', 'certificate']
}

/** The settings Guardian never sends back: a blank one keeps what is stored. */
export const SECRET_FIELDS: readonly GuardianSsoField[] = ['client_secret', 'certificate']

/** How many connections, tokens or identities a list loads at once (v1's page sizes). */
export const SSO_PAGE_SIZE = 25
export const IDENTITIES_PAGE_SIZE = 50

/** The most connections the SCIM token form offers to link. */
export const CONNECTION_CHOICES = 100

/** The fields of `protocol`, or none for one Guardian may add later. */
export function fieldsOf(protocol: string): readonly GuardianSsoField[] {
  return (SSO_PROTOCOLS as readonly string[]).includes(protocol) ? PROTOCOL_FIELDS[protocol as GuardianSsoProtocol] : []
}

/**
 * The settings of `protocol` to send: each non-blank value, trimmed. A blank
 * secret is left out, so Guardian keeps the stored one; any other blank
 * setting is sent as null to clear it when `clearBlank` (an update).
 */
export function settingsBody(protocol: string, values: Partial<Record<GuardianSsoField, string>>, clearBlank = false): Partial<Record<GuardianSsoField, string | null>> {
  const body: Partial<Record<GuardianSsoField, string | null>> = {}

  for (const field of fieldsOf(protocol)) {
    const value = (values[field] ?? '').trim()

    if (value !== '') {
      body[field] = value
    } else if (clearBlank && !SECRET_FIELDS.includes(field)) {
      body[field] = null
    }
  }

  return body
}

/** The layer path of a connection's page. */
export function connectionPath(slug: string): string {
  return `/guardian/sso-connections/${encodeURIComponent(slug)}`
}

/** The organization's SSO tab on Roster's organization screen. */
export function organizationSsoPath(organization: string): string {
  return `/roster/organizations/${encodeURIComponent(organization)}?tab=guardian.sso`
}

/**
 * The SCIM base URL an identity provider is given (D-058): the origin of
 * Guardian's API base, then the tab's `scim_path`, then `/` and the
 * organization. Null without an API base.
 */
export function scimBaseUrl(apiBase: string | null, scimPath: unknown, organization: string): string | null {
  if (!apiBase) {
    return null
  }

  let origin: string

  try {
    origin = new URL(apiBase).origin
  } catch {
    return null
  }

  const path = typeof scimPath === 'string' && scimPath.replace(/^\/+|\/+$/g, '') !== ''
    ? `/${scimPath.replace(/^\/+|\/+$/g, '')}`
    : '/scim/v2'

  return `${origin}${path}/${encodeURIComponent(organization)}`
}
