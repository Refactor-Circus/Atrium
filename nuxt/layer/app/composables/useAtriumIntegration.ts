import createClient, { type Client, type Middleware } from 'openapi-fetch'
import type { Router } from 'vue-router'
import type { paths as CortexPaths } from '../integrations/cortex/client/schema'
import type { paths as GuardianPaths } from '../integrations/guardian/client/schema'
import type { paths as ImpexPaths } from '../integrations/impex/client/schema'
import type { paths as KeenPaths } from '../integrations/keen/client/schema'
import type { paths as PennantPlusPaths } from '../integrations/pennantplus/client/schema'
import type { paths as PolycartPaths } from '../integrations/polycart/client/schema'
import type { paths as RosterPaths } from '../integrations/roster/client/schema'
import type { paths as ShowroomPaths } from '../integrations/showroom/client/schema'
import type { AtriumRegistry } from '../plugins/atrium'

/**
 * Each suite integration's API, typed by the `paths` of its vendored
 * `app/integrations/{pkg}/client/schema.d.ts` (D-020).
 */
export interface AtriumIntegrationPaths {
  cortex: CortexPaths
  guardian: GuardianPaths
  impex: ImpexPaths
  keen: KeenPaths
  pennantplus: PennantPlusPaths
  polycart: PolycartPaths
  roster: RosterPaths
  showroom: ShowroomPaths
}

export type AtriumIntegrationKey = keyof AtriumIntegrationPaths

/** The integrations the layer ships, whose pages live under `/{key}/`. */
export const ATRIUM_INTEGRATION_KEYS: readonly AtriumIntegrationKey[] = ['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom']

/** Whether `key` is one of the integrations the layer ships. */
export function isAtriumIntegrationKey(key: string): key is AtriumIntegrationKey {
  return (ATRIUM_INTEGRATION_KEYS as readonly string[]).includes(key)
}

export type AtriumIntegrationClient<K extends AtriumIntegrationKey> = Client<AtriumIntegrationPaths[K]>

export interface AtriumIntegrationHandle<K extends AtriumIntegrationKey> {
  /** Registered and active for the user, per the shell */
  active: boolean
  /** The resolved base URL of its API; null when the shell does not list it */
  apiBase: string | null
  /** Its typed client; null unless active */
  client: AtriumIntegrationClient<K> | null
}

/**
 * Each integration's `openapi-fetch` client, signed by the app's one auth
 * adapter (D-021):
 *
 *   const { active, client } = useAtriumIntegration('impex')
 *   const runs = integrationData(await client!.GET('/runs', { params: { query: { status } } }))
 *
 * The base URL is the host's `runtimeConfig.public.atrium.integrations.{key}.apiBase`
 * when set, otherwise the shell's `api_base`; a path is resolved against the
 * origin of `runtimeConfig.public.atrium.apiBase` when that is absolute, and
 * against the page's otherwise. Every request carries the adapter's headers
 * and credentials and `Accept: application/json`; a 401 calls its
 * `onUnauthorized()`, except on a public page (D-038).
 *
 * An integration the shell does not list, or lists as inactive, has no
 * client. One client is kept per key per Nuxt app.
 */
export function useAtriumIntegration<K extends AtriumIntegrationKey>(key: K): AtriumIntegrationHandle<K> {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig().public.atrium as { apiBase: string, integrations?: Record<string, { apiBase?: string } | undefined> }
  const integration = useAtriumShellStore().integration(key)

  if (!integration) {
    return { active: false, apiBase: null, client: null }
  }

  const override = config.integrations?.[key]?.apiBase
  const apiBase = resolveIntegrationBase(override || integration.api_base, config.apiBase, window.location.origin)

  if (!integration.active) {
    return { active: false, apiBase, client: null }
  }

  return { active: true, apiBase, client: cachedClient(nuxtApp, key, apiBase) }
}

/**
 * An integration's API base as an absolute URL, without a trailing slash: an
 * http(s) `base` as it is, a path against the origin of an absolute
 * `atriumApiBase`, or else against `pageOrigin`.
 */
export function resolveIntegrationBase(base: string, atriumApiBase: string, pageOrigin: string): string {
  const absolute = /^https?:\/\//i

  if (absolute.test(base)) {
    return base.replace(/\/+$/, '')
  }

  const origin = absolute.test(atriumApiBase) ? new URL(atriumApiBase).origin : pageOrigin
  const path = base.startsWith('/') ? base : `/${base}`

  return new URL(path, origin).toString().replace(/\/+$/, '')
}

/** An integration API call that failed with an HTTP status. */
export class AtriumIntegrationError extends Error {
  constructor(readonly status: number, readonly body: unknown) {
    super(`The integration API answered ${status}`)
    this.name = 'AtriumIntegrationError'
  }
}

/**
 * The data of an `openapi-fetch` answer, or an `AtriumIntegrationError`
 * carrying its status (read it with `atriumStatus()`), so a failure rejects:
 * a search source or live resolver that throws is dropped, and a query shows
 * its 403 as no access.
 */
export function integrationData<T>(result: { data?: T, error?: unknown, response: Response }): T {
  if (!result.response.ok) {
    throw new AtriumIntegrationError(result.response.status, result.error)
  }

  return result.data as T
}

const clients = new WeakMap<object, Map<string, { base: string, client: unknown }>>()

function cachedClient<K extends AtriumIntegrationKey>(nuxtApp: ReturnType<typeof useNuxtApp>, key: K, base: string): AtriumIntegrationClient<K> {
  let perApp = clients.get(nuxtApp)

  if (!perApp) {
    perApp = new Map()
    clients.set(nuxtApp, perApp)
  }

  const cached = perApp.get(key)

  if (cached && cached.base === base) {
    return cached.client as AtriumIntegrationClient<K>
  }

  const client = createClient<AtriumIntegrationPaths[K]>({
    baseUrl: base,
    // Read at request time, so a fetch swapped in later (a test's) applies.
    fetch: (input: Request) => globalThis.fetch(input)
  })

  client.use(authMiddleware(nuxtApp.$atrium as AtriumRegistry, nuxtApp.$router as Router))
  perApp.set(key, { base, client })

  return client
}

/** Signs each request with the auth adapter, read at request time. */
function authMiddleware(atrium: AtriumRegistry, router: Router): Middleware {
  return {
    async onRequest({ request }) {
      const auth = atrium.auth()
      const headers = new Headers(request.headers)

      headers.set('Accept', 'application/json')

      for (const [name, value] of Object.entries((await auth.headers?.()) ?? {})) {
        headers.set(name, value)
      }

      return new Request(request, { headers, ...(auth.credentials ? { credentials: auth.credentials } : {}) })
    },
    async onResponse({ response }) {
      if (response.status === 401 && router.currentRoute.value.meta.atrium?.public !== true) {
        await atrium.auth().onUnauthorized?.()
      }
    }
  }
}

/**
 * The shape an integration's `app/integrations/{pkg}/index.ts` exports,
 * loaded by the `atrium-integrations` plugin:
 *
 *   export const screens = { 'impex.runs': 'impex-runs' }
 *   export default defineAtriumIntegration((atrium) => {
 *     atrium.widget('impex.run-status', RunStatus)
 *   })
 */
export interface AtriumIntegrationModule {
  /** Registers its widgets, extensions, panel, search sources and live resolvers */
  default?: (atrium: AtriumRegistry) => void
  /** Each screen key it declares, to the name of the layer route that renders it */
  screens?: Record<string, string>
}

/** Types an integration's registration function. */
export function defineAtriumIntegration(register: (atrium: AtriumRegistry) => void): (atrium: AtriumRegistry) => void {
  return register
}
