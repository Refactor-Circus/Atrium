import type { VueWrapper } from '@vue/test-utils'
import { vi } from 'vitest'
import type { AtriumIntegrationPaths } from '../index'
import { useAtriumShellStore } from '../stores/atriumShell'
import type { AtriumIntegration, AtriumShell } from '../types/atrium'
import { atriumTestApp, mountSuspended, type MountSuspendedOptions } from './app'
import { shell } from './shell'

/*
 * Mocked package APIs for module suites (and Atrium's integration suites).
 *
 * - `mockPackageApi(pkg, routes)` answers a package's API, typed by the
 *   `paths` its module declares in `AtriumIntegrationPaths`, and records
 *   every call (method, path, query, body, headers, credentials).
 * - `integrationShell()` and `mountIntegration()` give the shell store a shell
 *   carrying one active integration (or any list), then mount.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PathsOf<K extends string> = K extends keyof AtriumIntegrationPaths ? AtriumIntegrationPaths[K] : Record<string, any>

type Method = 'get' | 'put' | 'post' | 'delete' | 'patch'

/** `GET /runs/{run}`: a method and a path template the package's API documents. */
export type PackageRoute<K extends string> = {
  [Path in keyof PathsOf<K> & string]: {
    [M in Method]: PathsOf<K>[Path] extends { [Key in M]: unknown } ? `${Uppercase<M>} ${Path}` : never
  }[Method]
}[keyof PathsOf<K> & string]

type OperationOf<K extends string, R> = R extends `${infer M} ${infer Path}`
  ? Path extends keyof PathsOf<K>
    ? Lowercase<M> extends keyof PathsOf<K>[Path]
      ? PathsOf<K>[Path][Lowercase<M>]
      : never
    : never
  : never

type JsonOf<Response> = Response extends { content: { 'application/json': infer Body } } ? Body : never

type SuccessOf<Operation> = Operation extends { responses: infer Responses }
  ? { [Status in keyof Responses]: Status extends 200 | 201 | 202 ? JsonOf<Responses[Status]> : never }[keyof Responses]
  : never

/** The JSON body a route answers with on success, as the vendored schema documents it. */
export type PackageBody<K extends string, R> = [SuccessOf<OperationOf<K, R>>] extends [never]
  ? unknown
  : SuccessOf<OperationOf<K, R>>

/** An answer other than the documented success: any status, any body. */
export class PackageReply {
  constructor(readonly status: number, readonly body: unknown = status === 204 ? undefined : { message: `HTTP ${status}` }) {}
}

/** Answers a route with `status` (and `body`), e.g. `reply(403)` or `reply(422, { errors })`. */
export function reply(status: number, body?: unknown): PackageReply {
  return body === undefined ? new PackageReply(status) : new PackageReply(status, body)
}

/** One request a mocked package API received. */
export interface PackageCall {
  pkg: string
  method: string
  /** The route's path template (`/runs/{run}`), or the bare path when no route matched */
  route: string | null
  /** The path under the package's API base (`/runs/5`) */
  path: string
  query: Record<string, string>
  body: unknown
  headers: Headers
  credentials: RequestCredentials
}

export type PackageHandler<K extends string, R> =
  | PackageBody<K, R>
  | PackageReply
  | ((call: PackageCall) => PackageBody<K, R> | PackageReply | Promise<PackageBody<K, R> | PackageReply>)

export type PackageRoutes<K extends string> = {
  [R in PackageRoute<K>]?: PackageHandler<K, R>
}

interface MockedApi {
  pkg: string
  base: string
  routes: [method: string, template: string, matcher: RegExp, handler: unknown][]
  calls: PackageCall[]
}

const mocked = new Map<string, MockedApi>()
const calls: PackageCall[] = []
let realFetch: typeof fetch | null = null

/** Every request any mocked package API received, in order. */
export const packageCalls: readonly PackageCall[] = calls

/** The base path a test shell gives each integration. */
export function packageBase(pkg: string): string {
  return `/${pkg}/api`
}

function matcherFor(template: string): RegExp {
  const pattern = template
    .split(/(\{[^}]+\})/)
    .map(part => part.startsWith('{') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('')

  return new RegExp(`^${pattern}$`)
}

async function bodyOf(request: Request): Promise<unknown> {
  const text = await request.clone().text()

  if (text === '') {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function respond(answer: unknown): Response {
  const { status, body } = answer instanceof PackageReply ? answer : { status: 200, body: answer }

  if (body === undefined || status === 204) {
    return new Response(null, { status })
  }

  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

async function dispatch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request && init === undefined ? input : new Request(input, init)
  const url = new URL(request.url, 'http://localhost')
  const api = [...mocked.values()].find(candidate => url.pathname === candidate.base || url.pathname.startsWith(`${candidate.base}/`))

  if (!api) {
    return realFetch!(input, init)
  }

  const path = url.pathname.slice(api.base.length) || '/'
  const route = api.routes.find(([method, , matcher]) => method === request.method && matcher.test(path))

  const call: PackageCall = {
    pkg: api.pkg,
    method: request.method,
    route: route?.[1] ?? null,
    path,
    query: Object.fromEntries(url.searchParams.entries()),
    body: await bodyOf(request),
    headers: request.headers,
    credentials: request.credentials
  }

  calls.push(call)
  api.calls.push(call)

  if (!route) {
    return respond(reply(404, { message: `No mock for ${request.method} ${path} in ${api.pkg}` }))
  }

  const handler = route[3]

  return respond(typeof handler === 'function' ? await (handler as (call: PackageCall) => unknown)(call) : handler)
}

/**
 * Answers `pkg`'s API under `base` (by default `/{pkg}/api`, as the test
 * shell sets it) with `routes`, keyed by method and the path template the
 * vendored schema documents:
 *
 *   mockPackageApi('impex', {
 *     'GET /stats': { data: stats },
 *     'POST /runs/{run}/cancel': reply(403),
 *     'GET /runs': call => ({ data: runs.filter(r => r.status === call.query.status) })
 *   })
 *
 * A request to the package that no route matches answers 404 and is still
 * recorded. Requests to anything else go to the real `fetch`. Returns the
 * calls this package receives, as a live list. Call `resetPackageApis()`
 * after each test.
 */
export function mockPackageApi<K extends string>(pkg: K, routes: PackageRoutes<K>, base = packageBase(pkg)): PackageCall[] {
  if (realFetch === null) {
    realFetch = globalThis.fetch
    globalThis.fetch = vi.fn(dispatch) as typeof fetch
  }

  const api: MockedApi = {
    pkg,
    base,
    calls: [],
    routes: Object.entries(routes as Record<string, unknown>).map(([key, handler]) => {
      const [method, template] = key.split(' ') as [string, string]

      return [method, template, matcherFor(template), handler]
    })
  }

  mocked.set(pkg, api)

  return api.calls
}

/**
 * Watches `fetch` without answering any package: every request to a path
 * under one of `pkgs`' API bases is recorded (and answers 404). For tests
 * that assert no package API is called.
 */
export function watchPackageApis(pkgs: readonly string[]): readonly PackageCall[] {
  for (const pkg of pkgs) {
    mockPackageApi(pkg, {})
  }

  return calls
}

/** Forgets every mocked package API and its calls, and restores `fetch`. */
export function resetPackageApis(): void {
  mocked.clear()
  calls.length = 0

  if (realFetch !== null) {
    globalThis.fetch = realFetch
    realFetch = null
  }
}

/** An integration entry of the shell, active, with its API at `/{key}/api`. */
export function integrationEntry(key: string, overrides: Partial<AtriumIntegration> = {}): AtriumIntegration {
  return {
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    active: true,
    api_base: packageBase(key),
    features: {},
    ...overrides
  }
}

/** The shell fixture carrying `integrations` (by default one active `cortex`). */
export function integrationShell(
  integrations: AtriumIntegration[] = [integrationEntry('cortex')],
  overrides: Partial<AtriumShell> = {}
): AtriumShell {
  return shell({ integrations, ...overrides })
}

/** Puts `value` in the shell store, as if GET /shell had answered it. */
export async function useShell(value: AtriumShell): Promise<void> {
  atriumTestApp()
  useAtriumShellStore().shell = value
}

/**
 * Mounts `component` with a shell carrying one active integration, `pkg`
 * (or the `integrations` given), so `useAtriumIntegration(pkg)` hands it a
 * client.
 */
export async function mountIntegration<T>(
  component: T,
  pkg: string,
  options: MountSuspendedOptions<T> & { integrations?: AtriumIntegration[], shell?: Partial<AtriumShell> } = {}
): Promise<VueWrapper> {
  const { integrations = [integrationEntry(pkg)], shell: overrides = {}, ...mountOptions } = options

  await useShell(integrationShell(integrations, overrides))

  return mountSuspended(component, mountOptions as MountSuspendedOptions<T>)
}

