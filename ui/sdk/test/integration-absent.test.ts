import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AtriumRegistry } from '../src/registry'
import { AtriumNavigation, useAtrium, useAtriumIntegration, useAtriumSearch } from '../src/index'
import { mockAtriumApi, mountSuspended, resetPackageApis, settle, shell, useShell, watchPackageApis, withSetup } from '../src/testing/index'

/*
 * Build without packages (AC 51): a host whose shell lists no integration
 * gets no integration UI and no package request, even with every
 * integration's layer code loaded and its resolvers registered.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: unknown) => Promise<unknown>>()
}))

mockAtriumApi(api)

const PACKAGES = ['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom'] as const

describe('a shell with integrations: []', () => {
  let atrium: AtriumRegistry
  const resolver = vi.fn(async () => [])
  const live = vi.fn(async () => ({ badge: 3 }))

  beforeEach(async () => {
    api.mockReset()
    api.mockResolvedValue({ data: [] })
    resolver.mockClear()
    live.mockClear()

    atrium = await withSetup(() => useAtrium())

    for (const key of ['cortex', 'impex', 'polycart', 'roster-users', 'roster-organizations', 'showroom']) {
      atrium.searchSource(key, resolver)
    }

    atrium.live('impex.active-runs', live).live('keen.history', live)

    await useShell(shell({ integrations: [], search: { min_length: 2, sources: [], per_source: 5 } }))
  })

  afterEach(() => {
    atrium.searchSources.clear()
    atrium.liveResolvers.clear()
    resetPackageApis()
  })

  it('renders no integration nav item and runs no live resolver', async () => {
    const calls = watchPackageApis(PACKAGES)

    const wrapper = await mountSuspended(AtriumNavigation)
    await settle()

    for (const pkg of PACKAGES) {
      expect(wrapper.find(`a[href^="/${pkg}/"]`).exists(), pkg).toBe(false)
    }

    expect(live).not.toHaveBeenCalled()
    expect(calls).toEqual([])
  })

  it('runs no search source, and finds only Atrium\'s own results', async () => {
    const calls = watchPackageApis(PACKAGES)

    const search = await withSetup(() => useAtriumSearch())
    await search.search('acme')

    expect(resolver).not.toHaveBeenCalled()
    expect(api).toHaveBeenCalledExactlyOnceWith('/search', { query: { q: 'acme' } })
    expect(calls).toEqual([])
  })

  it('gives no integration a client', async () => {
    for (const pkg of PACKAGES) {
      expect((await withSetup(() => useAtriumIntegration(pkg))).client, pkg).toBeNull()
    }
  })
})
