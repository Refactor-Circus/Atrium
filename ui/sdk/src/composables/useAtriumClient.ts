import createClient, { type Client } from 'openapi-fetch'
import type { paths } from '../client/schema'
import { useAtriumBoot } from '../runtime/boot'
import { atriumFetch, pageOrigin, resolveIntegrationBase } from '../runtime/http'

/** Atrium's own API, typed by the client generated from openapi.json (AC 74). */
export type AtriumClient = Client<paths>

let cached: { base: string, client: AtriumClient } | null = null

/**
 * An `openapi-fetch` client of Atrium's API, typed by `src/client/schema.d.ts`
 * and signed as every Atrium client is (AC 75):
 *
 *   const { data } = await useAtriumClient().GET('/dashboards/{dashboard}', { params: { path: { dashboard: slug } } })
 *
 * `useAtriumApi()` stays the untyped ofetch twin. One client per page.
 */
export function useAtriumClient(): AtriumClient {
  const apiBase = useAtriumBoot().api_base
  const base = resolveIntegrationBase(apiBase, apiBase, pageOrigin())

  if (cached && cached.base === base) {
    return cached.client
  }

  const client = createClient<paths>({ baseUrl: base, fetch: atriumFetch })

  cached = { base, client }

  return client
}
