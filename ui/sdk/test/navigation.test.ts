import { beforeEach, describe, expect, it } from 'vitest'
import { atriumLink, isExternalUrl } from '../src/utils/atriumLink'
import { AtriumNavigation, useAtriumShellStore } from '../src/index'
import { inApp, mountSuspended, shell, withSetup } from '../src/testing/index'

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

  const rail = (wrapper: { findAll: (selector: string) => { attributes: (name: string) => string | undefined }[] }) =>
    wrapper.findAll('[data-testid="atrium-rail-section"]').map(button => button.attributes('aria-label'))

  it('renders nav items with their link and badge', async () => {
    const wrapper = await mountSuspended(AtriumNavigation)

    const orders = wrapper.find('a[href="/demo/orders"]')

    expect(orders.exists()).toBe(true)
    expect(orders.text()).toContain('Orders')
    expect(orders.text()).toContain('1')
    expect(wrapper.find('a[href="/demo/users"]').text()).toContain('6')
    expect(wrapper.find('[data-testid="atrium-nav-panel"]').text()).toContain('Workspace')
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

  it('links to the settings pages from the rail when the shell has panels', async () => {
    const wrapper = await mountSuspended(AtriumNavigation)

    const settings = wrapper.find('[data-testid="atrium-rail"] a[href="/settings"]')

    expect(settings.exists()).toBe(true)
    expect(settings.attributes('aria-label')).toBe('Settings')
  })

  it('puts each grouped section on the rail, labelled, and lights the one holding the route', async () => {
    const wrapper = await mountSuspended(AtriumNavigation, { route: '/demo/billing' })
    const buttons = wrapper.findAll('[data-testid="atrium-rail-section"]')

    expect(rail(wrapper)).toEqual(['Workspace', 'Insights', 'Administration'])
    expect(buttons.map(button => button.attributes('data-current'))).toEqual(['false', 'false', 'true'])
    expect(wrapper.find('[data-testid="atrium-nav-panel"]').attributes('data-section')).toBe('group-administration')
    expect(wrapper.find('a[href="/demo/billing"]').attributes('aria-current')).toBe('page')
  })

  it('shows only the pages of the section holding the route', async () => {
    const wrapper = await mountSuspended(AtriumNavigation, { route: '/demo/orders' })
    const panel = wrapper.find('[data-testid="atrium-nav-panel"]')

    expect(panel.attributes('data-section')).toBe('group-workspace')
    expect(panel.find('a[href="/demo/orders"]').exists()).toBe(true)
    expect(panel.find('a[href="/demo/billing"]').exists()).toBe(false)
  })

  it('shows another section\'s pages when it is chosen on the rail, without leaving the page', async () => {
    const wrapper = await mountSuspended(AtriumNavigation, { route: '/demo/orders' })

    await wrapper.find('[data-testid="atrium-rail-section"][data-section="group-administration"]').trigger('click')

    const panel = wrapper.find('[data-testid="atrium-nav-panel"]')

    expect(panel.attributes('data-section')).toBe('group-administration')
    expect(panel.find('a[href="/demo/billing"]').exists()).toBe(true)
    expect(wrapper.find('[data-section="group-administration"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-section="group-workspace"]').attributes('data-current')).toBe('true')
  })

  it('opens a section and its nested item for a page beneath one of its pages', async () => {
    const wrapper = await mountSuspended(AtriumNavigation, { route: '/demo/reports/sales/2026' })
    const panel = wrapper.find('[data-testid="atrium-nav-panel"]')

    expect(panel.attributes('data-section')).toBe('group-insights')
    expect(panel.findAll('button[aria-expanded="true"]').map(button => button.text())).toEqual(['Reports'])
    expect(panel.find('a[href="/demo/reports/sales"]').attributes('aria-current')).toBe('page')
  })

  it('opens and closes a nested item with its disclosure', async () => {
    const wrapper = await mountSuspended(AtriumNavigation, { route: '/demo/reports/sales' })
    const reports = () => wrapper.findAll('button[aria-expanded]').find(button => button.text() === 'Reports')!

    expect(reports().attributes('aria-expanded')).toBe('true')

    await reports().trigger('click')

    expect(reports().attributes('aria-expanded')).toBe('false')
  })

  it('shows a package section for its pages the nav does not list', async () => {
    const store = await withSetup(() => useAtriumShellStore())
    const page = (label: string, path: string) => ({ label, icon: null, link: { path, external: false }, badge: null, live: null, children: [] })

    store.shell = shell({
      navigation: [
        { key: 'group-catalog', label: 'Catalog', icon: 'i-lucide-box', grouped: true, link: null, items: [page('Products', '/showroom/products'), page('Assets', '/showroom/assets')] },
        { key: 'group-impex', label: 'Impex', icon: 'i-lucide-workflow', grouped: true, link: null, items: [page('Runs', '/impex/runs')] }
      ]
    })

    const wrapper = await mountSuspended(AtriumNavigation, { route: '/impex/flows' })

    expect(wrapper.find('[data-testid="atrium-nav-panel"]').attributes('data-section')).toBe('group-impex')
    expect(wrapper.find('[data-section="group-impex"][data-testid="atrium-rail-section"]').attributes('data-current')).toBe('true')
  })

  it('gathers loose sections first, as one Home entry of plain links', async () => {
    const store = await withSetup(() => useAtriumShellStore())
    const navigation = shell().navigation

    navigation.push({ key: 'dashboard', label: 'Dashboard', icon: 'i-lucide-house', grouped: false, link: { path: '/', external: false }, items: [{ label: 'Dashboard', icon: 'i-lucide-house', link: { path: '/', external: false }, badge: null, live: null, children: [] }] })
    store.shell = shell({ navigation })

    const wrapper = await mountSuspended(AtriumNavigation, { route: '/demo/billing' })

    expect(rail(wrapper)).toEqual(['Home', 'Workspace', 'Insights', 'Administration'])

    await wrapper.find('[data-section="home"]').trigger('click')

    const panel = wrapper.find('[data-testid="atrium-nav-panel"]')

    expect(panel.find('a[href="/"]').text()).toContain('Dashboard')
    expect(panel.find('[aria-expanded]').exists()).toBe(false)
  })

  it('shows only the rail while collapsed, with each section\'s pages in a flyout', async () => {
    const wrapper = await mountSuspended(inApp(AtriumNavigation), { attrs: { collapsed: true } })
    const nav = wrapper.find('[data-testid="atrium-nav"]')

    expect(nav.attributes('data-collapsed')).toBe('true')
    expect(nav.find('[data-testid="atrium-nav-panel"]').exists()).toBe(false)
    expect(rail(nav)).toEqual(['Workspace', 'Insights', 'Administration'])

    // Each section's icon, drawn from the bundled collection.
    expect(nav.findAll('[data-testid="atrium-rail-section"] svg')).toHaveLength(3)

    const administration = nav.find('[data-section="group-administration"]')

    // Each section opens its pages in a popover (checked in the browser).
    expect(administration.attributes('aria-haspopup')).toBe('dialog')
  })
})
