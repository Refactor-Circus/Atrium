import createClient from 'openapi-fetch'
import type { paths } from '../../client/schema'
import { useAtrium } from '../../../../composables/useAtrium'
import { resolveIntegrationBase } from '../../../../composables/useAtriumIntegration'
import { runResponseHandlers } from '../../../../plugins/atrium'
import { useAtriumShellStore } from '../../../../stores/atriumShell'
import type { GuardianClient } from './guardian'

/*
 * The client of the two-factor challenge and setup pages (AC 85, 86, D-050).
 * A user who owes a second factor cannot load the shell, so these pages
 * reach Guardian through a client of their own, not `useAtriumIntegration()`
 * (which hands out a client only for an integration the shell lists as
 * active). Guardian's enrolment, challenge and status routes are never
 * blocked by its own middleware.
 */

/**
 * Guardian's API base when nothing else names it: its default
 * `guardian.routes.prefix`, as Atrium derives an integration's `api_base`.
 */
export const GUARDIAN_DEFAULT_API_BASE = '/guardian'

/**
 * Where the pages find Guardian's API, in order: the host's
 * `runtimeConfig.public.atrium.integrations.guardian.apiBase`; else the
 * `api_base` of a shell this app already loaded (active or not); else
 * Guardian's default prefix. A path resolves as an integration's does.
 */
export function guardianApiBase(override: string | undefined, shellBase: string | null | undefined, atriumApiBase: string, pageOrigin: string): string {
  return resolveIntegrationBase(override || shellBase || GUARDIAN_DEFAULT_API_BASE, atriumApiBase, pageOrigin)
}

/**
 * A Guardian client for the two-factor pages. Each request carries the auth
 * adapter's headers and credentials and `Accept: application/json`; each
 * response goes to the response handlers; a 401 calls the adapter's
 * `onUnauthorized()`, even though the pages are public: they only ever act
 * for a signed-in user.
 */
export function useGuardianPageClient(): GuardianClient {
  const nuxtApp = useNuxtApp()
  const atrium = useAtrium()
  const config = useRuntimeConfig().public.atrium as { apiBase: string, integrations?: Record<string, { apiBase?: string } | undefined> }
  const shellBase = useAtriumShellStore().integration('guardian')?.api_base

  const client = createClient<paths>({
    baseUrl: guardianApiBase(config.integrations?.guardian?.apiBase, shellBase, config.apiBase, window.location.origin),
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
    },
    async onResponse({ request, response }) {
      await runResponseHandlers(nuxtApp, response, request)

      if (response.status === 401) {
        await atrium.auth().onUnauthorized?.()
      }
    }
  })

  return client
}
