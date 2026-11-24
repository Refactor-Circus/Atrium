import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { UCommandPalette } from '#components'
import { useAtriumSearch, useAtriumShellStore } from '#imports'
import type { AtriumSearchResult } from '../app/types/atrium'
import { shell, withSetup } from './support'

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: unknown) => Promise<unknown>>()
}))

mockNuxtImport('useAtriumApi', () => () => api)

const results: AtriumSearchResult[] = [
  { title: 'ORD-1048', subtitle: 'Northwind Traders', icon: 'i-lucide-receipt', group: 'Orders', link: { path: '/demo/orders/1048', external: false } },
  { title: 'Guide', subtitle: null, icon: null, group: 'Docs', link: { path: 'https://docs.example.com/guide', external: true } },
  { title: 'Sneaky', subtitle: null, icon: null, group: 'Docs', link: { path: 'javascript:alert(1)', external: false } },
  { title: 'Unlinked', subtitle: null, icon: null, group: null, link: null }
]

describe('⌘K search', () => {
  beforeEach(async () => {
    api.mockReset()
    api.mockResolvedValue({ data: results })

    const store = await withSetup(() => useAtriumShellStore())
    store.shell = shell({ search: { min_length: 3 } })
  })

  it('calls atrium.search with the term once it reaches search.min_length', async () => {
    const search = await withSetup(() => useAtriumSearch())

    await search.search('ac')
    expect(api).not.toHaveBeenCalled()
    expect(search.results.value).toEqual([])

    await search.search('acme')
    expect(api).toHaveBeenCalledExactlyOnceWith('/search', { query: { q: 'acme' } })
    expect(search.results.value).toEqual(results)
  })

  it('groups results and turns each link.path into a route or an external link', async () => {
    const search = await withSetup(() => useAtriumSearch())
    await search.search('acme')

    const groups = search.groups.value
    const items = Object.fromEntries(groups.flatMap(g => g.items ?? []).map(i => [i.label, i]))

    expect(groups.map(g => g.label)).toEqual(['Orders', 'Docs', 'Results'])
    expect(items['ORD-1048']).toMatchObject({ to: '/demo/orders/1048', suffix: 'Northwind Traders' })
    expect(items['ORD-1048']).not.toHaveProperty('target')
    expect(items.Guide).toMatchObject({ to: 'https://docs.example.com/guide', external: true, target: '_blank', rel: 'noopener noreferrer' })
    expect(items.Sneaky).not.toHaveProperty('to')
    expect(items.Unlinked).not.toHaveProperty('to')
  })

  it('renders link.path as the result href, with rel="noopener noreferrer" on external results', async () => {
    const search = await withSetup(() => useAtriumSearch())
    await search.search('acme')

    const wrapper = await mountSuspended(UCommandPalette, { props: { groups: search.groups.value } })

    const internal = wrapper.find('a[href="/demo/orders/1048"]')
    const external = wrapper.find('a[href="https://docs.example.com/guide"]')

    expect(internal.exists()).toBe(true)
    expect(internal.attributes('target')).toBeUndefined()
    expect(external.attributes('rel')).toBe('noopener noreferrer')
    expect(external.attributes('target')).toBe('_blank')
    expect(wrapper.html()).not.toContain('javascript:')
  })
})
