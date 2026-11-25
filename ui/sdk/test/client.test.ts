import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { components } from '../src/client/schema'
import type { AtriumDashboard, AtriumShell } from '../src/types/atrium'
import { useAtrium, useAtriumBoot, useAtriumClient } from '../src/index'
import { withSetup } from '../src/testing/index'

/*
 * `useAtriumClient()`: an `openapi-fetch` client of Atrium's own API, typed
 * by the client generated from openapi.json and signed by the same auth
 * adapter as `useAtriumApi()` and the integration clients (AC 75).
 */

const seen: Request[] = []
let status = 200

function answer(input: Request): Response {
  seen.push(input)

  if (status !== 200) {
    return new Response(JSON.stringify({ message: 'No.' }), { status, headers: { 'content-type': 'application/json' } })
  }

  return new Response(JSON.stringify({ data: { slug: 'main', name: 'Main', is_default: true, version: 3 }, meta: { abilities: { update: true, delete: false } } }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  })
}

describe('useAtriumClient()', () => {
  const onUnauthorized = vi.fn()

  beforeEach(async () => {
    seen.length = 0
    status = 200
    onUnauthorized.mockReset()
    vi.stubGlobal('fetch', vi.fn(async (input: Request) => answer(input)))

    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ headers: async () => ({ Authorization: 'Bearer secret' }), credentials: 'include', onUnauthorized })
  })

  afterEach(async () => {
    vi.unstubAllGlobals()

    const atrium = await withSetup(() => useAtrium())
    atrium.auth({})
  })

  it('calls Atrium\'s API at the configured apiBase, with the adapter\'s headers, credentials and Accept', async () => {
    const client = await withSetup(() => useAtriumClient())
    const apiBase = useAtriumBoot().api_base

    const { data } = await client.GET('/dashboards/{dashboard}', { params: { path: { dashboard: 'main' } } })

    expect(seen).toHaveLength(1)
    expect(seen[0]!.method).toBe('GET')
    expect(seen[0]!.url).toBe(new URL(`${apiBase}/dashboards/main`, window.location.origin).toString())
    expect(seen[0]!.headers.get('authorization')).toBe('Bearer secret')
    expect(seen[0]!.headers.get('accept')).toBe('application/json')
    expect(seen[0]!.credentials).toBe('include')
    expect(data?.data.slug).toBe('main')
    expect(data?.meta.abilities).toEqual({ update: true, delete: false })
  })

  it('reads the adapter at request time, so one set after the client was made still applies', async () => {
    const client = await withSetup(() => useAtriumClient())

    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ headers: () => ({ Authorization: 'Bearer later' }) })

    await client.GET('/shell')

    expect(seen[0]!.headers.get('authorization')).toBe('Bearer later')
  })

  it('calls onUnauthorized() on a 401, and not on a 403', async () => {
    const client = await withSetup(() => useAtriumClient())

    status = 403
    await client.GET('/shell')
    expect(onUnauthorized).not.toHaveBeenCalled()

    status = 401
    const { response } = await client.GET('/shell')
    expect(response.status).toBe(401)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('keeps one client per app', async () => {
    expect(await withSetup(() => useAtriumClient())).toBe(await withSetup(() => useAtriumClient()))
  })

  it('types each answer by the generated schema the public types alias', () => {
    expectTypeOf<components['schemas']['DashboardResource']>().toEqualTypeOf<AtriumDashboard>()
    expectTypeOf<AtriumShell['api_version']>().toEqualTypeOf<components['schemas']['ShellResource']['api_version']>()
  })
})
