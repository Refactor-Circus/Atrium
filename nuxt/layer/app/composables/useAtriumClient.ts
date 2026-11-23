import createClient, { type Client, type Middleware } from 'openapi-fetch'
import type { Router } from 'vue-router'
import type { paths } from '../client/schema'
import type { AtriumRegistry } from '../plugins/atrium'

/** Atrium's own API, typed by the client generated from openapi.json (AC 74). */
export type AtriumClient = Client<paths>

const clients = new WeakMap<object, { base: string, client: AtriumClient }>()

/**
 * An `openapi-fetch` client of Atrium's API, typed by
 * `app/client/schema.d.ts` and signed by the app's one auth adapter (AC 75):
 *
 *   const { data } = await useAtriumClient().GET('/dashboards/{dashboard}', { params: { path: { dashboard: slug } } })
 *
 * Its base is `runtimeConfig.public.atrium.apiBase`, resolved against the
 * page's origin when it is a path. Every request carries the adapter's
 * headers and credentials and `Accept: application/json`; a 401 calls its
 * `onUnauthorized()`, except on a public page (D-038). The adapter is read at
 * request time, so one set after the client was made still applies.
 * `useAtriumApi()` stays the untyped `$fetch` twin. One client per Nuxt app.
 */
export function useAtriumClient(): AtriumClient {
  const nuxtApp = useNuxtApp()
  const apiBase = (useRuntimeConfig().public.atrium as { apiBase: string }).apiBase
  const base = resolveIntegrationBase(apiBase, apiBase, window.location.origin)
  const cached = clients.get(nuxtApp)

  if (cached && cached.base === base) {
    return cached.client
  }

  const client = createClient<paths>({
    baseUrl: base,
    // Read at request time, so a fetch swapped in later (a test's) applies.
    fetch: (input: Request) => globalThis.fetch(input)
  })

  client.use(signedBy(nuxtApp.$atrium as AtriumRegistry, nuxtApp.$router as Router))
  clients.set(nuxtApp, { base, client })

  return client
}

/** Signs each request with the auth adapter, read at request time. */
function signedBy(atrium: AtriumRegistry, router: Router): Middleware {
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
