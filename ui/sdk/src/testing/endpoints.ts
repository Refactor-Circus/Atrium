/*
 * `registerEndpoint(path, handler)`, as Nuxt's test utils had it: answers
 * every request to `path` (on any origin) with what `handler` returns, a
 * JSON value or a `Response`. Requests to anything else go to the real
 * `fetch`.
 */

export interface AtriumTestEvent {
  method: string
  path: string
  query: Record<string, string>
  headers: Headers
  body: unknown
  web: { request: Request }
}

type Handler = (event: AtriumTestEvent) => unknown

const endpoints = new Map<string, Handler>()
let installed = false

export function registerEndpoint(path: string, handler: Handler | { handler: Handler }): void {
  endpoints.set(path, typeof handler === 'function' ? handler : handler.handler)

  if (installed) {
    return
  }

  installed = true

  const real = globalThis.fetch

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request && init === undefined ? input : new Request(input, init)
    const url = new URL(request.url, 'http://localhost')
    const handle = endpoints.get(url.pathname)

    if (!handle) {
      return real(input, init)
    }

    const text = await request.clone().text()
    let body: unknown = text === '' ? undefined : text

    try {
      body = text === '' ? undefined : JSON.parse(text)
    } catch {
      // Not JSON: the handler gets the text.
    }

    const answer = await handle({
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers: request.headers,
      body,
      web: { request }
    })

    return answer instanceof Response
      ? answer
      : new Response(answer === undefined ? null : JSON.stringify(answer), { status: answer === undefined ? 204 : 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch
}
