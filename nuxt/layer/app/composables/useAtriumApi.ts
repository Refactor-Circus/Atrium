import { runResponseHandlers } from '../plugins/atrium'

type AtriumFetch = typeof $fetch

/** Statuses whose response carries no body. */
const BODILESS = new Set([101, 103, 204, 205, 304])

/**
 * A `Response` for the response handlers: `$fetch` has already read the
 * body into `_data`, so the copy carries it again, as JSON when it parsed.
 */
function replayable(response: Response & { _data?: unknown }): Response {
  const init = { status: response.status, statusText: response.statusText, headers: response.headers }

  if (BODILESS.has(response.status) || response._data === undefined) {
    return new Response(null, init)
  }

  const data = response._data

  return new Response(typeof data === 'string' ? data : JSON.stringify(data), init)
}

const clients = new WeakMap<object, AtriumFetch>()

/** `base` and `path` with one slash between them, as `$fetch` joins them. */
function joinURL(base: string, path: string): string {
  if (/^https?:\/\//i.test(path) || base === '') {
    return path
  }

  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

/**
 * `$fetch` bound to Atrium's API, carrying the app's auth adapter on every
 * request, and calling its `onUnauthorized()` on a 401:
 *
 *   const { data } = await useAtriumApi()<{ data: AtriumDashboard[] }>('/dashboards')
 *
 * Every response goes to the app's response handlers (D-049) first. One
 * client per Nuxt app; the adapter is read at request time, so one set
 * after the client was made still applies.
 */
export function useAtriumApi(): AtriumFetch {
  const nuxtApp = useNuxtApp()
  const existing = clients.get(nuxtApp)

  if (existing) {
    return existing
  }

  const config = useRuntimeConfig()
  const atrium = useAtrium()

  const client = $fetch.create({
    baseURL: config.public.atrium.apiBase as string,
    headers: { Accept: 'application/json' },
    async onRequest({ options }) {
      const auth = atrium.auth()
      const headers = new Headers(options.headers as HeadersInit | undefined)

      for (const [name, value] of Object.entries((await auth.headers?.()) ?? {})) {
        headers.set(name, value)
      }

      options.headers = headers

      if (auth.credentials) {
        options.credentials = auth.credentials
      }
    },
    async onResponse({ request, response, options }) {
      const url = new URL(typeof request === 'string' ? joinURL(String(options.baseURL ?? ''), request) : request.url, window.location.origin)

      await runResponseHandlers(nuxtApp, replayable(response), new Request(url, { method: options.method ?? 'GET', headers: options.headers as HeadersInit | undefined }))
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        await atrium.auth().onUnauthorized?.()
      }
    }
  }) as AtriumFetch

  clients.set(nuxtApp, client)

  return client
}
