import createClient from 'openapi-fetch'
import type { components, paths } from '../../client/schema'
import { useAtrium } from '../../../../composables/useAtrium'
import { resolveIntegrationBase } from '../../../../composables/useAtriumIntegration'
import { useAtriumShellStore } from '../../../../stores/atriumShell'
import type { RosterClient } from '../users/users'

/*
 * The public invitation page (AC 70, D-038). The invitee is usually signed
 * out, so the page loads no shell: it reaches Roster through a client of its
 * own, not `useAtriumIntegration()` (which hands out a client only for an
 * integration the shell lists as active). Its active check is the lookup.
 */

/** `InvitationLookupResource` (the schema types its `teams` as `string | {}`): team names. */
export interface RosterInvitationLookup {
  email: string
  organization: { name: string }
  teams: string[]
  expires_at: string
}

/** `InvitationResource`, as accept and decline answer. */
export type RosterAnsweredInvitation = components['schemas']['InvitationResource']

/**
 * Roster's API base when nothing else names it: its default
 * `roster.routes.prefix`, as Atrium derives an integration's `api_base`
 * from it (AC 40).
 */
export const ROSTER_DEFAULT_API_BASE = '/roster'

/**
 * Where the page finds Roster's API, in the order of D-021, without loading
 * the shell: the host's `runtimeConfig.public.atrium.integrations.roster.apiBase`;
 * else the `api_base` of a shell this app already loaded (active or not);
 * else Roster's default prefix. A path resolves as an integration's does.
 */
export function invitationApiBase(override: string | undefined, shellBase: string | null | undefined, atriumApiBase: string, pageOrigin: string): string {
  return resolveIntegrationBase(override || shellBase || ROSTER_DEFAULT_API_BASE, atriumApiBase, pageOrigin)
}

/**
 * A Roster client for the public invitation page. Each request carries the
 * auth adapter's headers and credentials, so a signed-in invitee answers as
 * themselves, and `Accept: application/json`. A 401 calls nothing: the page
 * decides when to send the visitor to sign in (never for the lookup).
 */
export function useInvitationClient(): RosterClient {
  const atrium = useAtrium()
  const config = useRuntimeConfig().public.atrium as { apiBase: string, integrations?: Record<string, { apiBase?: string } | undefined> }
  const shellBase = useAtriumShellStore().integration('roster')?.api_base

  const client = createClient<paths>({
    baseUrl: invitationApiBase(config.integrations?.roster?.apiBase, shellBase, config.apiBase, window.location.origin),
    // Read at request time, so a fetch swapped in later (a test's) applies.
    fetch: (input: Request) => globalThis.fetch(input)
  })

  client.use({
    async onRequest({ request }) {
      const auth = atrium.auth()
      const headers = new Headers(request.headers)

      headers.set('Accept', 'application/json')

      for (const [name, value] of Object.entries((await auth.headers?.()) ?? {})) {
        headers.set(name, value)
      }

      return new Request(request, { headers, ...(auth.credentials ? { credentials: auth.credentials } : {}) })
    }
  })

  return client
}
