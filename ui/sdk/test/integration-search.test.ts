import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { integrationData, useAtrium, useAtriumIntegration, useAtriumSearch } from '#imports'
import { AtriumRegistry } from '../app/plugins/atrium'
import type { AtriumSearchResult, AtriumSearchSource } from '../app/types/atrium'
import { withSetup } from './support'
import { integrationEntry, integrationShell, mockPackageApi, reply, resetPackageApis, useShell } from './integrations/support'

/*
 * ⌘K over Atrium's own search and every client-side source the shell lists
 * (AC 52, D-030): run in parallel, a failing source dropped without failing
 * the others, and every result's link through the AC 14 guard.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: unknown) => Promise<unknown>>()
}))

mockNuxtImport('useAtriumApi', () => () => api)

const atriumResults: AtriumSearchResult[] = [
  { title: 'ORD-1048', subtitle: null, icon: null, group: 'Orders', link: { path: '/demo/orders/1048', external: false } }
]

const source = (key: string, integration: string, label: string): AtriumSearchSource => ({ key, integration, label, icon: 'i-lucide-search' })

const sources = [
  source('cortex', 'cortex', 'Agents'),
  source('impex', 'impex', 'Runs'),
  source('roster-users', 'roster', 'Users'),
  source('roster-organizations', 'roster', 'Organizations'),
  source('polycart', 'polycart', 'Carts')
]

function items(groups: { label?: string, items?: { label?: string }[] }[]) {
  return Object.fromEntries(groups.flatMap(g => g.items ?? []).map(i => [i.label, i]))
}

describe('the $atrium registry: searchSource()', () => {
  it('registers a source by key, chainably', () => {
    const registry = new AtriumRegistry()
    const resolver = async () => []

    expect(registry.searchSource('cortex', resolver)).toBe(registry)
    expect(registry.searchSources.get('cortex')).toBe(resolver)
  })
})

describe('⌘K fan-out', () => {
  let atrium: AtriumRegistry

  beforeEach(async () => {
    api.mockReset()
    api.mockResolvedValue({ data: atriumResults })

    atrium = await withSetup(() => useAtrium())
    atrium.searchSources.clear()

    await useShell(integrationShell(
      [integrationEntry('cortex'), integrationEntry('impex'), integrationEntry('roster'), integrationEntry('polycart', { active: false })],
      { search: { min_length: 2, sources, per_source: 2 } }
    ))
  })

  afterEach(() => {
    atrium.searchSources.clear()
    resetPackageApis()
  })

  it('calls atrium.search and every listed source with a registered resolver, in parallel', async () => {
    const order: string[] = []
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })

    atrium
      .searchSource('cortex', async (q) => {
        order.push(`cortex:${q}`)
        await gate
        return [{ title: 'Triage', subtitle: null, icon: null, group: null, link: { path: '/cortex/virtual-agents/triage', external: false } }]
      })
      .searchSource('roster-users', async (q) => {
        order.push(`roster-users:${q}`)
        release()
        return [{ title: 'Ada', subtitle: 'ada@example.com', icon: null, group: null, link: { path: '/roster/users/1', external: false } }]
      })

    const search = await withSetup(() => useAtriumSearch())
    await search.search('ad')

    expect(api).toHaveBeenCalledExactlyOnceWith('/search', { query: { q: 'ad' } })
    expect(order).toEqual(['cortex:ad', 'roster-users:ad'])
    expect(search.results.value.map(r => r.title)).toEqual(['ORD-1048', 'Triage', 'Ada'])

    const byLabel = items(search.groups.value)
    expect(search.groups.value.map(g => g.label)).toEqual(['Orders', 'Agents', 'Users'])
    expect(byLabel.Triage).toMatchObject({ to: '/cortex/virtual-agents/triage' })
    expect(byLabel.Ada).toMatchObject({ to: '/roster/users/1', suffix: 'ada@example.com' })
  })

  it('drops a source that rejects, or answers 401, 403 or 5xx, and keeps the others', async () => {
    mockPackageApi('cortex', { 'GET /search': reply(403) })
    mockPackageApi('impex', { 'GET /search': reply(500) })

    atrium
      .searchSource('cortex', async (q) => {
        const { client } = useAtriumIntegration('cortex')
        integrationData(await client!.GET('/search', { params: { query: { q } } }))
        return [{ title: 'Never', subtitle: null, icon: null, group: null, link: null }]
      })
      .searchSource('impex', async (q) => {
        const { client } = useAtriumIntegration('impex')
        integrationData(await client!.GET('/search', { params: { query: { q } } }))
        return [{ title: 'Never either', subtitle: null, icon: null, group: null, link: null }]
      })
      .searchSource('roster-users', async () => { throw new Error('Network down') })
      .searchSource('roster-organizations', async () => [
        { title: 'Acme', subtitle: null, icon: null, group: null, link: { path: '/roster/organizations/acme', external: false } }
      ])

    const search = await withSetup(() => useAtriumSearch())
    await search.search('ac')

    expect(search.results.value.map(r => r.title)).toEqual(['ORD-1048', 'Acme'])
  })

  it('keeps the sources when atrium.search itself fails', async () => {
    api.mockRejectedValue(Object.assign(new Error('HTTP 500'), { status: 500 }))
    atrium.searchSource('cortex', async () => [{ title: 'Triage', subtitle: null, icon: null, group: null, link: null }])

    const search = await withSetup(() => useAtriumSearch())
    await search.search('tr')

    expect(search.results.value.map(r => r.title)).toEqual(['Triage'])
  })

  it('applies the link guard to source results', async () => {
    // Two sources, as each adds at most search.per_source (2) results.
    atrium
      .searchSource('cortex', async () => [
        { title: 'Sneaky', subtitle: null, icon: null, group: null, link: { path: 'javascript:alert(1)', external: false } },
        { title: 'Elsewhere', subtitle: null, icon: null, group: null, link: { path: '//evil.test/x', external: true } }
      ])
      .searchSource('impex', async () => [
        { title: 'Docs', subtitle: null, icon: null, group: null, link: { path: 'https://docs.example.com', external: true } }
      ])

    const search = await withSetup(() => useAtriumSearch())
    await search.search('xx')

    const byLabel = items(search.groups.value)
    expect(byLabel.Sneaky).not.toHaveProperty('to')
    expect(byLabel.Elsewhere).not.toHaveProperty('to')
    expect(byLabel.Docs).toMatchObject({ to: 'https://docs.example.com', rel: 'noopener noreferrer', target: '_blank' })
  })

  it('caps each source at search.per_source', async () => {
    atrium.searchSource('cortex', async () => ['A', 'B', 'C'].map(title => ({ title, subtitle: null, icon: null, group: null, link: null })))

    const search = await withSetup(() => useAtriumSearch())
    await search.search('ab')

    expect(search.results.value.map(r => r.title)).toEqual(['ORD-1048', 'A', 'B'])
  })

  it('skips a source of an inactive integration, and a source with no resolver', async () => {
    const polycart = vi.fn(async () => [])
    atrium.searchSource('polycart', polycart)

    const search = await withSetup(() => useAtriumSearch())
    await search.search('ca')

    expect(polycart).not.toHaveBeenCalled()
    expect(search.results.value.map(r => r.title)).toEqual(['ORD-1048'])
  })

  it('calls no source below search.min_length', async () => {
    const cortex = vi.fn(async () => [])
    atrium.searchSource('cortex', cortex)

    const search = await withSetup(() => useAtriumSearch())
    await search.search('a')

    expect(cortex).not.toHaveBeenCalled()
    expect(api).not.toHaveBeenCalled()
  })
})
