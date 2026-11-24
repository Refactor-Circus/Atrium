import { beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { AtriumNavigation } from '#components'
import { useAtriumShellStore } from '#imports'
import { atriumLink, isExternalUrl } from '../app/utils/atriumLink'
import { inApp, shell, withSetup } from './support'

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

  it('renders each grouped section as its own collapsible group behind a separator', async () => {
    const wrapper = await mountSuspended(AtriumNavigation)
    const nav = wrapper.find('[data-testid="atrium-nav"]')
    const lists = nav.findAll(':scope > ul')

    expect(lists).toHaveLength(3)
    expect(lists.map(list => list.find('button').text())).toEqual(['Workspace', 'Insights', 'Administration'])
    expect(lists[0]!.find('a[href="/demo/orders"]').exists()).toBe(true)
    expect(lists[2]!.find('a[href="/demo/billing"]').exists()).toBe(true)
    expect(nav.findAll(':scope > div').filter(div => div.classes().includes('h-px'))).toHaveLength(2)
  })

  it('opens only the section holding the current route', async () => {
    const wrapper = await mountSuspended(AtriumNavigation, { route: '/demo/billing' })
    const triggers = wrapper.find('[data-testid="atrium-nav"]').findAll(':scope > ul > li > button')

    expect(triggers.map(trigger => [trigger.text(), trigger.attributes('aria-expanded')])).toEqual([
      ['Workspace', 'false'],
      ['Insights', 'false'],
      ['Administration', 'true']
    ])
  })

  it('opens a section and its nested item for a page beneath one of its pages', async () => {
    const wrapper = await mountSuspended(AtriumNavigation, { route: '/demo/reports/sales/2026' })
    const nav = wrapper.find('[data-testid="atrium-nav"]')
    const expanded = nav.findAll('button[aria-expanded="true"]').map(button => button.text())

    expect(expanded).toEqual(['Insights', 'Reports'])
  })

  it('opens a package section for its pages the nav does not list', async () => {
    const store = await withSetup(() => useAtriumShellStore())
    const page = (label: string, path: string) => ({ label, icon: null, link: { path, external: false }, badge: null, live: null, children: [] })

    store.shell = shell({
      navigation: [
        { key: 'group-catalog', label: 'Catalog', icon: 'i-lucide-box', grouped: true, link: null, items: [page('Products', '/showroom/products'), page('Assets', '/showroom/assets')] },
        { key: 'group-impex', label: 'Impex', icon: 'i-lucide-workflow', grouped: true, link: null, items: [page('Runs', '/impex/runs')] }
      ]
    })

    const wrapper = await mountSuspended(AtriumNavigation, { route: '/showroom/flags' })
    const expanded = wrapper.find('[data-testid="atrium-nav"]').findAll('button[aria-expanded="true"]').map(button => button.text())

    expect(expanded).toEqual(['Catalog'])
  })

  it('lists loose sections first, as one group of plain links', async () => {
    const store = await withSetup(() => useAtriumShellStore())
    const navigation = shell().navigation

    navigation.push({ key: 'dashboard', label: 'Dashboard', icon: 'i-lucide-house', grouped: false, link: { path: '/', external: false }, items: [{ label: 'Dashboard', icon: 'i-lucide-house', link: { path: '/', external: false }, badge: null, live: null, children: [] }] })
    store.shell = shell({ navigation })

    const wrapper = await mountSuspended(AtriumNavigation)
    const lists = wrapper.find('[data-testid="atrium-nav"]').findAll(':scope > ul')

    expect(lists).toHaveLength(4)
    expect(lists[0]!.find('a[href="/"]').text()).toContain('Dashboard')
    expect(lists[0]!.find('button').exists()).toBe(false)
  })

  it('shows each section by its icon while the sidebar is collapsed', async () => {
    const wrapper = await mountSuspended(inApp(AtriumNavigation), { attrs: { collapsed: true } })
    const nav = wrapper.find('[data-testid="atrium-nav"]')

    expect(nav.attributes('data-collapsed')).toBe('true')
    expect(nav.findAll('div').filter(div => div.classes().includes('h-px'))).toHaveLength(2)

    for (const icon of ['lucide:briefcase', 'lucide:chart-pie', 'lucide:settings']) {
      expect(nav.html()).toContain(icon)
    }
  })
})

