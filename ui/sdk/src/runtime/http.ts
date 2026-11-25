import { useAtrium, runResponseHandlers } from '../registry'
import { hasAtriumRouter, atriumRouter } from './context'
import { useAtriumBoot } from './boot'

/**
 * How every Atrium client signs a request (D-080): the auth adapter's
 * headers and credentials when the app set one (`useAtrium().auth({ … })`),
 * and otherwise the session the Blade page was served in: same-origin
 * credentials, `X-XSRF-TOKEN` from Laravel's `XSRF-TOKEN` cookie and the
 * page's `X-CSRF-TOKEN`, sent only to the page's own origin. Every request
 * asks for JSON and says it is an XHR, so Laravel answers errors as JSON.
 */
export async function signRequest(request: Request): Promise<Request> {
  const auth = useAtrium().auth()
  const headers = new Headers(request.headers)

  headers.set('Accept', 'application/json')

  if (sameOrigin(request.url)) {
    headers.set('X-Requested-With', 'XMLHttpRequest')

    const xsrf = cookie('XSRF-TOKEN')
    const csrf = useAtriumBoot().csrf_token

    if (xsrf !== null) {
      headers.set('X-XSRF-TOKEN', xsrf)
    }

    if (csrf) {
      headers.set('X-CSRF-TOKEN', csrf)
    }
  }

  for (const [name, value] of Object.entries((await auth.headers?.()) ?? {})) {
    headers.set(name, value)
  }

  return new Request(request, { headers, credentials: auth.credentials ?? 'same-origin' })
}

/** The headers `signRequest()` would add to a request for `url` (for `$fetch`-style clients). */
export async function signedHeaders(url: string, base: HeadersInit | undefined): Promise<{ headers: Headers, credentials: RequestCredentials }> {
  const signed = await signRequest(new Request(url, { headers: base }))

  return { headers: signed.headers, credentials: signed.credentials }
}

/**
 * After every response: the response handlers (D-049) see it first, then a
 * 401 calls the adapter's `onUnauthorized()`, except on a public page
 * (D-038). With no adapter of the app's own, a 401 on a page Atrium served
 * reloads it, so the host's auth middleware sends the user to sign in.
 */
export async function afterResponse(response: Response, request: Request): Promise<void> {
  await runResponseHandlers(response, request)

  if (response.status !== 401 || onPublicPage()) {
    return
  }

  const auth = useAtrium().auth()

  if (auth.onUnauthorized) {
    await auth.onUnauthorized()
  } else if (typeof document !== 'undefined' && document.getElementById('atrium-boot')) {
    window.location.reload()
  }
}

/**
 * `fetch` for any client of Atrium's or a module's API: signs the request,
 * then runs the response handlers and the 401 handling. Read at request
 * time, so a `fetch` swapped in later (a test's) applies.
 */
export async function atriumFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = await signRequest(input instanceof Request && init === undefined ? input : new Request(input, init))
  const response = await globalThis.fetch(request)

  await afterResponse(response, request)

  return response
}

function onPublicPage(): boolean {
  return hasAtriumRouter() && atriumRouter().currentRoute.value.meta.atrium?.public === true
}

function sameOrigin(url: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return new URL(url, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

/** A cookie's decoded value, or null. */
export function cookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  for (const part of document.cookie.split(';')) {
    const [key, ...value] = part.trim().split('=')

    if (key === name) {
      return decodeURIComponent(value.join('='))
    }
  }

  return null
}

/**
 * An API base as an absolute URL, without a trailing slash: an http(s)
 * `base` as it is, a path against the origin of an absolute
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

/** The page's origin, or `http://localhost` outside a browser. */
export function pageOrigin(): string {
  return typeof window === 'undefined' ? 'http://localhost' : window.location.origin
}
