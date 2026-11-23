import type { components } from '../../../../app/integrations/guardian/client/schema'
import type { GuardianSsoConnection } from '../../../../app/integrations/guardian/components/sso/sso'
import { settle } from '../../../support'
import { integrationEntry, mountIntegration } from '../../support'

/*
 * Shared payloads and mounting of the Guardian SSO and SCIM suites (AC 96).
 */

type Schemas = components['schemas']

export const oidc = {
  slug: 'acme-okta',
  name: 'Acme Okta',
  protocol: 'oidc',
  organization: 'acme',
  settings: { client_id: 'client-1', issuer: 'https://acme.okta.test' },
  client_secret: 'set',
  certificate: null,
  jit: true,
  enforced: false,
  enabled: true,
  sign_in_url: 'https://app.test/guardian/sso/acme-okta',
  callback_url: 'https://app.test/guardian/sso/acme-okta/callback',
  metadata_url: null,
  identities_count: 3,
  created_at: '2026-11-01T10:00:00+00:00'
} satisfies GuardianSsoConnection

export const saml = {
  ...oidc,
  slug: 'acme-saml',
  name: 'Acme SAML',
  protocol: 'saml',
  settings: { entity_id: 'urn:acme', sso_url: 'https://idp.acme.test/sso' },
  client_secret: null,
  certificate: 'set',
  enforced: true,
  enabled: false,
  metadata_url: 'https://app.test/guardian/sso/acme-saml/metadata',
  identities_count: 0
} satisfies GuardianSsoConnection

export const scimToken = {
  id: 'scim-1',
  name: 'Okta sync',
  organization: 'acme',
  sso_connection: 'acme-okta',
  base_url: null,
  usable: true,
  last_used_at: null,
  expires_at: null,
  revoked_at: null,
  created_at: '2026-11-01T10:00:00+00:00'
} satisfies Schemas['ScimTokenResource']

export const revokedToken = { ...scimToken, id: 'scim-2', name: 'Old sync', usable: false, revoked_at: '2026-11-10T10:00:00+00:00' } satisfies Schemas['ScimTokenResource']

export const identity = {
  id: 'idn-1',
  connection: 'acme-okta',
  organization: 'acme',
  user: null,
  subject: 'sub-123',
  email: 'jane@acme.test',
  last_login_at: null,
  linked_at: '2026-11-01T10:00:00+00:00'
} satisfies Schemas['SsoIdentityResource']

/** The connection as `settings` arrives untyped from the vendored schema. */
export function asResource(connection: GuardianSsoConnection): Schemas['SsoConnectionResource'] {
  return connection as unknown as Schemas['SsoConnectionResource']
}

const mounted: { unmount: () => void }[] = []

/** Mounts a Guardian component (or page) with Guardian active, and Roster too when `roster`. */
export async function mountSso<T>(component: T, options: { props?: Record<string, unknown>, route?: string, roster?: boolean } = {}) {
  const integrations = [integrationEntry('guardian'), ...(options.roster ? [integrationEntry('roster')] : [])]
  const wrapper = await mountIntegration(component, 'guardian', { integrations, props: options.props, route: options.route } as never)
  mounted.push(wrapper)
  await settle()

  return wrapper
}

/** Unmounts everything `mountSso()` mounted. */
export function unmountSso(): void {
  for (const wrapper of mounted.splice(0)) {
    wrapper.unmount()
  }
}
