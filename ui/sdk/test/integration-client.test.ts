import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import {
  integrationData,
  resolveIntegrationBase,
  useAtrium,
  useAtriumApi,
  useAtriumIntegration,
  useAtriumShellStore,
  useIntegrationQuery,
  useRuntimeConfig
} from '#imports'
import { settle, withSetup } from './support'
import { integrationEntry, integrationShell, mockPackageApi, reply, resetPackageApis, useShell } from './integrations/support'

/*
 * One `openapi-fetch` client per integration (AC 47), all signed by the one
 * auth adapter registered with `$atrium.auth()` (AC 48), and the shared
 * per-dashboard-load request integration widgets read (`useIntegrationQuery`).
 */

const atriumSeen: { authorization: string | null, accept: string | null, credentials: string | undefined }[] = []

registerEndpoint('/atrium/api/shell', (event) => {
  atriumSeen.push({
    authorization: event.headers.get('authorization'),
    accept: event.headers.get('accept'),
    credentials: event.web?.request?.credentials
  })

  return { data: {} }
})

registerEndpoint('/atrium/api/dashboards', () =>
  new Response(JSON.stringify({ message: 'Unauthenticated.' }), { status: 401, headers: { 'content-type': 'application/json' } }))

type AtriumConfig = { apiBase: string, integrations: Record<string, { apiBase: string }> }

async function atriumConfig(): Promise<AtriumConfig> {
  return (await withSetup(() => useRuntimeConfig())).public.atrium as unknown as AtriumConfig
}

describe('resolveIntegrationBase()', () => {
  it('keeps an absolute http(s) base, without a trailing slash', () => {
    expect(resolveIntegrationBase('https://cortex.example.test/api/', '/atrium/api', 'https://app.test')).toBe('https://cortex.example.test/api')
  })

  it('resolves a path against the origin of an absolute Atrium apiBase', () => {
    expect(resolveIntegrationBase('/cortex/api', 'https://api.example.test/atrium/api', 'https://app.test')).toBe('https://api.example.test/cortex/api')
  })

  it('resolves a path against the page origin when the Atrium apiBase is relative', () => {
    expect(resolveIntegrationBase('/cortex/api', '/atrium/api', 'https://app.test')).toBe('https://app.test/cortex/api')
    expect(resolveIntegrationBase('cortex/api', '/atrium/api', 'https://app.test')).toBe('https://app.test/cortex/api')
  })
})

describe('useAtriumIntegration()', () => {
  let config: AtriumConfig
  let original: AtriumConfig

  beforeEach(async () => {
    config = await atriumConfig()
    original = structuredClone({ apiBase: config.apiBase, integrations: config.integrations })

    await useShell(integrationShell([
      integrationEntry('cortex'),
      integrationEntry('impex', { api_base: 'https://impex.example.test/api/' }),
      integrationEntry('polycart', { active: false })
    ]))
  })

  afterEach(() => {
    config.apiBase = original.apiBase
    config.integrations = original.integrations
  })

  it('resolves the shell api_base path against the page origin while the Atrium apiBase is relative', async () => {
    const cortex = await withSetup(() => useAtriumIntegration('cortex'))

    expect(cortex.active).toBe(true)
    expect(cortex.apiBase).toBe(`${window.location.origin}/cortex/api`)
    expect(cortex.client).not.toBeNull()
  })

  it('resolves it against the origin of an absolute Atrium apiBase', async () => {
    config.apiBase = 'https://api.example.test/atrium/api'

    expect((await withSetup(() => useAtriumIntegration('cortex'))).apiBase).toBe('https://api.example.test/cortex/api')
  })

  it('uses an absolute shell api_base as it is', async () => {
    expect((await withSetup(() => useAtriumIntegration('impex'))).apiBase).toBe('https://impex.example.test/api')
  })

  it('lets the host override the base with runtimeConfig.public.atrium.integrations.{key}.apiBase', async () => {
    config.integrations = { ...config.integrations, cortex: { apiBase: 'https://cortex.example.test/v2' } }

    expect((await withSetup(() => useAtriumIntegration('cortex'))).apiBase).toBe('https://cortex.example.test/v2')
  })

  it('caches one client per key per app', async () => {
    const first = await withSetup(() => useAtriumIntegration('cortex'))
    const second = await withSetup(() => useAtriumIntegration('cortex'))
    const impex = await withSetup(() => useAtriumIntegration('impex'))

    expect(second.client).toBe(first.client)
    expect(impex.client).not.toBe(first.client)
  })

  it('gives an inactive (flagged-off) integration no client', async () => {
    const polycart = await withSetup(() => useAtriumIntegration('polycart'))

    expect(polycart.active).toBe(false)
    expect(polycart.client).toBeNull()
  })

  it('gives an integration absent from the shell no client and no base', async () => {
    const keen = await withSetup(() => useAtriumIntegration('keen'))

    expect(keen).toEqual({ active: false, apiBase: null, client: null })
  })

  it('treats every integration as inactive until the shell is loaded', async () => {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = null

    expect((await withSetup(() => useAtriumIntegration('cortex'))).client).toBeNull()
  })
})

describe('one auth adapter for every client (AC 48)', () => {
  const onUnauthorized = vi.fn()

  beforeEach(async () => {
    atriumSeen.length = 0
    onUnauthorized.mockReset()

    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ headers: async () => ({ Authorization: 'Bearer secret' }), credentials: 'include', onUnauthorized })

    await useShell(integrationShell([integrationEntry('cortex'), integrationEntry('impex')]))
  })

  afterEach(async () => {
    resetPackageApis()

    const atrium = await withSetup(() => useAtrium())
    atrium.auth({})
  })

  it('sends the adapter headers and credentials, plus Accept: application/json, on two integrations and Atrium\'s API', async () => {
    const cortexCalls = mockPackageApi('cortex', { 'GET /search': { data: [] } })
    const impexCalls = mockPackageApi('impex', { 'GET /stats': reply(200, { data: {} }) })

    const cortex = (await withSetup(() => useAtriumIntegration('cortex'))).client!
    const impex = (await withSetup(() => useAtriumIntegration('impex'))).client!
    const api = await withSetup(() => useAtriumApi())

    await cortex.GET('/search', { params: { query: { q: 'triage' } } })
    await impex.GET('/stats')
    await api('/shell')

    for (const call of [cortexCalls[0]!, impexCalls[0]!]) {
      expect(call.headers.get('authorization')).toBe('Bearer secret')
      expect(call.headers.get('accept')).toBe('application/json')
      expect(call.credentials).toBe('include')
    }

    expect(cortexCalls[0]).toMatchObject({ method: 'GET', route: '/search', query: { q: 'triage' } })
    expect(impexCalls[0]).toMatchObject({ method: 'GET', route: '/stats' })
    expect(atriumSeen).toEqual([{ authorization: 'Bearer secret', accept: 'application/json', credentials: 'include' }])
  })

  it('reads the adapter at request time, so one set after the client was made still applies', async () => {
    const calls = mockPackageApi('cortex', { 'GET /search': { data: [] } })
    const cortex = (await withSetup(() => useAtriumIntegration('cortex'))).client!

    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ headers: () => ({ Authorization: 'Bearer later' }) })

    await cortex.GET('/search', { params: { query: { q: 'x' } } })

    expect(calls[0]!.headers.get('authorization')).toBe('Bearer later')
  })

  it('calls onUnauthorized() once on a 401 from either integration or Atrium\'s API', async () => {
    mockPackageApi('cortex', { 'GET /search': reply(401) })
    mockPackageApi('impex', { 'GET /stats': reply(401) })

    const cortex = (await withSetup(() => useAtriumIntegration('cortex'))).client!
    const impex = (await withSetup(() => useAtriumIntegration('impex'))).client!
    const api = await withSetup(() => useAtriumApi())

    const fromCortex = await cortex.GET('/search', { params: { query: { q: 'x' } } })
    expect(fromCortex.response.status).toBe(401)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)

    await impex.GET('/stats')
    expect(onUnauthorized).toHaveBeenCalledTimes(2)

    await expect(api('/dashboards')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledTimes(3)
  })

  it('does not call onUnauthorized() on a 403 or a 500', async () => {
    mockPackageApi('cortex', { 'GET /search': reply(403) })
    mockPackageApi('impex', { 'GET /stats': reply(500) })

    await (await withSetup(() => useAtriumIntegration('cortex'))).client!.GET('/search', { params: { query: { q: 'x' } } })
    await (await withSetup(() => useAtriumIntegration('impex'))).client!.GET('/stats')

    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})

describe('integrationData()', () => {
  it('returns the data of a successful answer and throws the status of a failed one', () => {
    const ok = new Response('{}', { status: 200 })
    const forbidden = new Response('{}', { status: 403 })

    expect(integrationData({ data: { a: 1 }, response: ok })).toEqual({ a: 1 })
    expect(() => integrationData({ error: { message: 'No.' }, response: forbidden })).toThrow(expect.objectContaining({ status: 403 }))
  })
})

describe('useIntegrationQuery()', () => {
  // A mounted widget keeps its shared request alive (D-029), so each test's
  // widgets are unmounted after it, as leaving the dashboard would.
  enableAutoUnmount(afterEach)

  beforeEach(async () => {
    await useShell(integrationShell([integrationEntry('impex'), integrationEntry('polycart', { active: false })]))
  })

  afterEach(() => {
    resetPackageApis()
  })

  function widget(testid: string, pkg: 'impex' | 'polycart' = 'impex') {
    return defineComponent({
      setup() {
        const query = useIntegrationQuery(pkg, `${pkg}.stats.show`, async client => integrationData(await client.GET('/stats')))

        return () => h('div', { 'data-testid': testid }, [
          query.status.value,
          query.forbidden.value ? ' forbidden' : '',
          query.data.value ? ` ${JSON.stringify(query.data.value)}` : ''
        ].join(''))
      }
    })
  }

  it('shares one request among the widgets of one integration on a dashboard load', async () => {
    const calls = mockPackageApi('impex', { 'GET /stats': { data: { runs: { active: 3 } } } as never })

    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h('div', [h(widget('one')), h(widget('two')), h(widget('three'))])
    }))
    await settle()

    expect(calls).toHaveLength(1)

    for (const testid of ['one', 'two', 'three']) {
      expect(wrapper.find(`[data-testid="${testid}"]`).text()).toContain('success')
      expect(wrapper.find(`[data-testid="${testid}"]`).text()).toContain('"active":3')
    }
  })

  it('requests again on the next load, once the previous widgets are gone', async () => {
    const calls = mockPackageApi('impex', { 'GET /stats': { data: {} } as never })

    const first = await mountSuspended(widget('one'))
    await settle()
    first.unmount()

    await mountSuspended(widget('two'))
    await settle()

    expect(calls).toHaveLength(2)
  })

  it('reports a 403 as forbidden', async () => {
    mockPackageApi('impex', { 'GET /stats': reply(403) })

    const wrapper = await mountSuspended(widget('one'))
    await settle()

    expect(wrapper.text()).toContain('error forbidden')
  })

  it('makes no request for an inactive integration', async () => {
    const calls = mockPackageApi('polycart', { 'GET /stats': { data: {} } as never })

    const wrapper = await mountSuspended(widget('one', 'polycart'))
    await settle()

    expect(calls).toHaveLength(0)
    expect(wrapper.text()).toBe('idle')
  })
})
