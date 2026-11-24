import createClient from 'openapi-fetch'
import type { paths } from '../../../client/schema'
import { pageOrigin, resolveIntegrationBase, runResponseHandlers, signRequest, useAtrium, useAtriumBoot, useAtriumShellStore } from '@refactor-circus/atrium'
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
 * Where the pages find Guardian's API, in order: the `api_base` of a shell
 * this app already loaded (active or not); else the one the page's boot data
 * lists; else Guardian's default prefix. A path resolves as an
 * integration's does.
 */
export function guardianApiBase(shellBase: string | null | undefined, bootBase: string | null | undefined, atriumApiBase: string, pageOrigin: string): string {
  return resolveIntegrationBase(shellBase || bootBase || GUARDIAN_DEFAULT_API_BASE, atriumApiBase, pageOrigin)
}

/**
 * A Guardian client for the two-factor pages. Each request is signed as
 * every Atrium client's is (`signRequest()`: the auth adapter's headers and
 * credentials, else the page's session, and `Accept: application/json`);
 * each response goes to the response handlers; a 401 calls the adapter's
 * `onUnauthorized()`, even though the pages are public (the SDK's
 * `atriumFetch` skips it there): they only ever act for a signed-in user.
 */
export function useGuardianPageClient(): GuardianClient {
  const atrium = useAtrium()
  const boot = useAtriumBoot()
  const shellBase = useAtriumShellStore().integration('guardian')?.api_base

  return createClient<paths>({
    baseUrl: guardianApiBase(shellBase, boot.integrations.guardian?.api_base, boot.api_base, pageOrigin()),
    // `globalThis.fetch` is read at request time, so a fetch swapped in later (a test's) applies.
    fetch: async (input: Request) => {
      const request = await signRequest(input)
      const response = await globalThis.fetch(request)

      await runResponseHandlers(response, request)

      if (response.status === 401) {
        await atrium.auth().onUnauthorized?.()
      }

      return response
    }
  })
}
