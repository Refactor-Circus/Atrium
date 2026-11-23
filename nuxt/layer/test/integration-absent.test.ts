import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { AtriumNavigation } from '#components'
import { ATRIUM_INTEGRATION_KEYS, useAtrium, useAtriumIntegration, useAtriumSearch } from '#imports'
import type { AtriumRegistry } from '../app/plugins/atrium'
import { settle, shell, withSetup } from './support'
import { resetPackageApis, useShell, watchPackageApis } from './integrations/support'

/*
 * Build without packages (AC 51): a host whose shell lists no integration
 * gets no integration UI and no package request, even with every
 * integration's layer code loaded and its resolvers registered.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: unknown) => Promise<unknown>>()
}))

mockNuxtImport('useAtriumApi', () => () => api)

const PACKAGES = ['cortex', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom'] as const

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

  it('knows the seven integrations the layer ships', () => {
    expect([...ATRIUM_INTEGRATION_KEYS]).toEqual([...PACKAGES])
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

  it('carries every integration\'s vendored client, so it builds with no sibling checkout', () => {
    const integrations = fileURLToPath(new URL('../app/integrations/', import.meta.url))

    for (const pkg of PACKAGES) {
      expect(readdirSync(`${integrations}${pkg}/client`).sort(), pkg).toEqual(['openapi.json', 'openapi.sha256', 'schema.d.ts'])
    }
  })
})
