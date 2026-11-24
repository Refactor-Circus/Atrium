import { atriumTestApp } from './app'

// happy-dom has no `window.confirm()`. Pages ask it before a destructive
// call, and their tests spy on it (`vi.spyOn(window, 'confirm')`), so every
// test file starts with one that declines.
if (typeof window !== 'undefined' && typeof window.confirm !== 'function') {
  window.confirm = () => false
}

// Nothing a test runs may leave for the network. A request no mock answers
// (a page refetching after its test reset the package mocks, say) fails at
// once, as an offline fetch would, instead of reaching happy-dom's fetch,
// which tries http://localhost:3000 and logs ECONNREFUSED into the run.
// `mockPackageApi()`, `registerEndpoint()` and `vi.spyOn(globalThis,
// 'fetch')` sit in front of it.
const offline = ((input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : null
  const method = init?.method ?? request?.method ?? 'GET'
  const url = request?.url ?? String(input)

  return Promise.reject(new TypeError(`[atrium] No test mock answers ${method} ${url}; tests never reach the network.`))
}) as typeof fetch

globalThis.fetch = offline

if (typeof window !== 'undefined') {
  window.fetch = offline
}

// The file's app: Pinia active, the router, icons installed.
atriumTestApp()
