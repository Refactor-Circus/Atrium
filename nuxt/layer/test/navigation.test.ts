import { beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { AtriumNavigation } from '#components'
import { useAtriumShellStore } from '#imports'
import { atriumLink, isExternalUrl } from '../app/utils/atriumLink'
import { shell, withSetup } from './support'

describe('atriumLink()', () => {
  it('routes a client path inside the SPA', () => {
    expect(atriumLink({ path: '/demo/orders', external: false })).toEqual({ to: '/demo/orders' })
  })

  it('opens an external link in a new tab with rel="noopener noreferrer"', () => {
    expect(atriumLink({ path: 'https://docs.example.com/guide', external: true })).toEqual({
      to: 'https://docs.example.com/guide',
      external: true,
      target: '_blank',
      rel: 'noopener noreferrer'
    })
  })

  it('refuses a path that does not start with / or http(s)', () => {
    for (const path of ['javascript:alert(1)', 'data:text/html,x', '//evil.test', '/\\evil.test', 'demo/orders', ' /demo', 'ftp://host/file']) {
      expect(atriumLink({ path, external: false }), path).toBeNull()
      expect(atriumLink({ path, external: true }), path).toBeNull()
    }

    expect(atriumLink(null)).toBeNull()
  })
})

describe('isExternalUrl()', () => {
  it('accepts only an absolute http(s) URL with a host', () => {
    expect(isExternalUrl('https://app.test/roster/impersonate/abc')).toBe(true)
    expect(isExternalUrl('HTTP://app.test')).toBe(true)

    for (const url of ['javascript:alert(1)', 'data:text/html,x', '//evil.test', '/\\evil.test', '/demo/orders', ' https://app.test', 'https:///path', 'ftp://host/file', '']) {
      expect(isExternalUrl(url), url).toBe(false)
    }
  })
})

describe('AtriumNavigation', () => {
  beforeEach(async () => {
    const store = await withSetup(() => useAtriumShellStore())
    const navigation = shell().navigation

    navigation[0]!.items.push(
      { label: 'Docs', icon: 'i-lucide-book', link: { path: 'https://docs.example.com', external: true }, badge: 'new', children: [] },
      { label: 'Sneaky', icon: null, link: { path: 'javascript:alert(1)', external: false }, badge: null, children: [] }
    )

    store.shell = shell({ navigation })
  })

  it('renders nav items with their link and badge', async () => {
    const wrapper = await mountSuspended(AtriumNavigation)

    const orders = wrapper.find('a[href="/demo/orders"]')

    expect(orders.exists()).toBe(true)
    expect(orders.text()).toContain('Orders')
    expect(orders.text()).toContain('1')
    expect(wrapper.find('a[href="/demo/users"]').text()).toContain('6')
    expect(wrapper.text()).toContain('Workspace')
  })

  it('renders external links with target="_blank" and rel="noopener noreferrer"', async () => {
    const wrapper = await mountSuspended(AtriumNavigation)

    const docs = wrapper.find('a[href="https://docs.example.com"]')

    expect(docs.attributes('target')).toBe('_blank')
    expect(docs.attributes('rel')).toBe('noopener noreferrer')
    expect(docs.text()).toContain('new')
  })

  it('renders an unsafe link as a plain label, never as a link', async () => {
    const wrapper = await mountSuspended(AtriumNavigation)

    expect(wrapper.text()).toContain('Sneaky')
    expect(wrapper.html()).not.toContain('javascript:')
  })

  it('links to the settings pages when the shell has panels', async () => {
    const wrapper = await mountSuspended(AtriumNavigation)

    expect(wrapper.find('a[href="/settings"]').exists()).toBe(true)
  })
})
