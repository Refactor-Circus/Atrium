import { ofetch, type $Fetch } from 'ofetch'
import { useAtriumBoot } from '../runtime/boot'
import { afterResponse, pageOrigin, resolveIntegrationBase, signedHeaders } from '../runtime/http'

export type AtriumFetch = $Fetch

/** Statuses whose response carries no body. */
const BODILESS = new Set([101, 103, 204, 205, 304])

/**
 * A `Response` for the response handlers: ofetch has already read the
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

/** `base` and `path` with one slash between them, as ofetch joins them. */
function joinURL(base: string, path: string): string {
  if (/^https?:\/\//i.test(path) || base === '') {
    return path
  }

  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

let client: { base: string, fetch: AtriumFetch } | null = null
let replacement: AtriumFetch | null = null

/** Answers `useAtriumApi()` with `fetch` instead (tests); null restores the real client. */
export function replaceAtriumApi(fetch: ((...args: never[]) => unknown) | null): void {
  replacement = fetch as AtriumFetch | null
}

/**
 * An ofetch client bound to Atrium's API (the page's `api_base`), signed as
 * every Atrium client is (the session by default, or the app's auth
 * adapter), with a 401 handled after the response handlers saw it:
 *
 *   const { data } = await useAtriumApi()<{ data: AtriumDashboard[] }>('/dashboards')
 *
 * `useAtriumClient()` is its typed twin. One client per page.
 */
export function useAtriumApi(): AtriumFetch {
  if (replacement) {
    return replacement
  }

  const apiBase = useAtriumBoot().api_base
  const base = resolveIntegrationBase(apiBase, apiBase, pageOrigin())

  if (client && client.base === base) {
    return client.fetch
  }

  const fetch = ofetch.create({
    baseURL: base,
    async onRequest({ request, options }) {
      const url = typeof request === 'string' ? joinURL(String(options.baseURL ?? ''), request) : request.url
      const signed = await signedHeaders(new URL(url, pageOrigin()).toString(), options.headers as HeadersInit | undefined)

      options.headers = signed.headers
      options.credentials = signed.credentials
    },
    async onResponse({ request, response, options }) {
      const url = new URL(typeof request === 'string' ? joinURL(String(options.baseURL ?? ''), request) : request.url, pageOrigin())

      await afterResponse(replayable(response), new Request(url, { method: options.method ?? 'GET', headers: options.headers as HeadersInit | undefined }))
    }
  }) as AtriumFetch

  client = { base, fetch }

  return fetch
}
