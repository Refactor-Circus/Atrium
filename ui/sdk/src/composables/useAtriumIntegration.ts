import createClient, { type Client } from 'openapi-fetch'
import type { AtriumIntegrationPaths } from '../index'
import { useAtriumBoot } from '../runtime/boot'
import { atriumFetch, pageOrigin, resolveIntegrationBase } from '../runtime/http'
import { useAtriumShellStore } from '../stores/atriumShell'

/**
 * What a module passes to its own client factory (`createRosterClient()`,
 * generated in the package's `client/`): the integration's API base and the
 * signing `fetch`, so the module's typed client authenticates as every
 * Atrium client does (D-083).
 */
export interface AtriumClientOptions {
  baseUrl: string
  fetch: typeof atriumFetch
}

/** A client of an API no module typed: every path is allowed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AtriumUntypedClient = Client<any>

/**
 * The client of integration `K`: typed by the `paths` its module declares
 *
 *   declare module '@refactor-circus/atrium' {
 *     interface AtriumIntegrationPaths { roster: import('../client').paths }
 *   }
 *
 * and untyped for a key no module declared.
 */
export type AtriumIntegrationClient<K extends string> = K extends keyof AtriumIntegrationPaths
  ? Client<AtriumIntegrationPaths[K] & {}>
  : AtriumUntypedClient

export interface AtriumIntegrationHandle<C> {
  /** Registered and active for the user, per the shell (or the page, before the shell loads) */
  active: boolean
  /** The resolved base URL of its API; null when the integration is not registered */
  apiBase: string | null
  /** Its client; null unless active */
  client: C | null
}

/** Whether the shell (or, until it loads, the page) lists `key`. */
function registration(key: string): { api_base: string, active: boolean } | null {
  const fromShell = useAtriumShellStore().integration(key)

  if (fromShell) {
    return fromShell
  }

  return useAtriumBoot().integrations[key] ?? null
}

/**
 * The options for a module's own client of integration `key`: its API base
 * (as the shell or page sends it, resolved to an absolute URL) and the
 * signing `fetch`. Null while the integration is not registered.
 *
 *   const client = createRosterClient(atriumClientOptions('roster')!)
 */
export function atriumClientOptions(key: string): AtriumClientOptions | null {
  const integration = registration(key)

  if (!integration) {
    return null
  }

  const atriumBase = useAtriumBoot().api_base

  return { baseUrl: resolveIntegrationBase(integration.api_base, atriumBase, pageOrigin()), fetch: atriumFetch }
}

/** The factory without the module's own: an untyped openapi-fetch client. */
function untyped(options: AtriumClientOptions): AtriumUntypedClient {
  return createClient(options)
}

let clients = new WeakMap<object, Map<string, { base: string, client: unknown }>>()

/**
 * An integration's `openapi-fetch` client, signed by the app's one auth
 * (D-021, D-083), typed by the paths its module declares in
 * `AtriumIntegrationPaths`:
 *
 *   const { active, client } = useAtriumIntegration('impex')
 *   const runs = integrationData(await client!.GET('/runs', { params: { query: { status } } }))
 *
 * Or with the module's own factory, whose client it returns:
 *
 *   const { client } = useAtriumIntegration('impex', createImpexClient)
 * An integration the
 * shell does not list, or lists as inactive, has no client. One client is
 * kept per key and factory.
 */
export function useAtriumIntegration<K extends string>(key: K): AtriumIntegrationHandle<AtriumIntegrationClient<K>>
export function useAtriumIntegration<C>(key: string, create: (options: AtriumClientOptions) => C): AtriumIntegrationHandle<C>
export function useAtriumIntegration<C>(key: string, create?: (options: AtriumClientOptions) => C): AtriumIntegrationHandle<C | AtriumUntypedClient> {
  const integration = registration(key)
  const options = atriumClientOptions(key)

  if (!integration || !options) {
    return { active: false, apiBase: null, client: null }
  }

  if (!integration.active) {
    return { active: false, apiBase: options.baseUrl, client: null }
  }

  const factory: (options: AtriumClientOptions) => C | AtriumUntypedClient = create ?? untyped
  let perFactory = clients.get(factory)

  if (!perFactory) {
    perFactory = new Map()
    clients.set(factory, perFactory)
  }

  const cached = perFactory.get(key)

  if (cached && cached.base === options.baseUrl) {
    return { active: true, apiBase: options.baseUrl, client: cached.client as C }
  }

  const client = factory(options)

  perFactory.set(key, { base: options.baseUrl, client })

  return { active: true, apiBase: options.baseUrl, client }
}

/** Forgets every cached integration client, for tests. */
export function resetAtriumIntegrationClients(): void {
  clients = new WeakMap()
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
