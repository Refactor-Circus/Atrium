import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { AtriumErrorCard, AtriumNoAccess, AtriumPageHeader, AtriumStat, AtriumState, AtriumStatusBar, AtriumTopbar, useAtriumNavigation, useAtriumPalette, useAtriumShellStore } from '../src/index'
import { inApp, mountSuspended, shell, withSetup, useRouter } from '../src/testing/index'

/*
 * The deck's shell pieces (D-077): the navigation model, the top bar with its
 * breadcrumb and panel toggle, and the shared state, stat and header blocks.
 */

describe('useAtriumNavigation()', () => {
  beforeEach(async () => {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = shell()
  })

  it('lists one group per grouped section, with each item\'s link checked', async () => {
    const nav = await withSetup(() => useAtriumNavigation())

    expect(nav.groups.value.map(group => group.key)).toEqual(['group-workspace', 'group-insights', 'group-administration'])
    expect(nav.groups.value[0]!.items.map(item => item.path)).toEqual(['/', '/demo/orders', '/demo/users'])
    expect(nav.groups.value[1]!.items[0]!.children.map(item => item.label)).toEqual(['Sales', 'Signups'])
  })

  it('finds the group and page holding a path, the most specific page winning', async () => {
    const nav = await withSetup(() => useAtriumNavigation())

    expect(nav.groupOf('/demo/reports/sales/2026')?.key).toBe('group-insights')
    expect(nav.groupOf('/demo/billing')?.key).toBe('group-administration')
    expect(nav.groupOf('/elsewhere')).toBeNull()
  })

  it('names the current page from the route', async () => {
    const nav = await withSetup(() => useAtriumNavigation())

    expect(nav.page.value?.label).toBe('Overview')
    expect(nav.hasSettings.value).toBe(true)
  })
})

describe('AtriumTopbar', () => {
  beforeEach(async () => {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = shell()
  })

  it('shows where you are: the section, then the page', async () => {
    const wrapper = await mountSuspended(inApp(AtriumTopbar), { route: '/demo/orders' })
    const crumb = wrapper.find('[data-testid="atrium-breadcrumb"]')

    expect(crumb.text()).toContain('Workspace')
    expect(crumb.find('[aria-current="page"]').text()).toBe('Orders')
  })

  it('toggles the section panel and asks for the drawer', async () => {
    const wrapper = await mountSuspended(AtriumTopbar, { props: { collapsed: false } })

    await wrapper.find('[data-testid="atrium-collapse"]').trigger('click')
    await wrapper.find('[data-testid="atrium-menu"]').trigger('click')

    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
    expect(wrapper.emitted('menu')).toHaveLength(1)
  })

  it('codes where you are: CTL/PRD for Catalog / Products', async () => {
    const wrapper = await mountSuspended(inApp(AtriumTopbar), { route: '/demo/orders' })

    expect(wrapper.find('[data-testid="atrium-code"]').text()).toBe('WRK/ORD')
  })
})

describe('AtriumStatusBar', () => {
  beforeEach(async () => {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = shell({ integrations: [
      { key: 'impex', label: 'Impex', active: true, api_base: '/impex/api', features: {} },
      { key: 'polycart', label: 'Polycart', active: false, api_base: '/polycart/api', features: {} }
    ] })
    store.latency = 42
  })

  it('shows the API as online, each integration as a live dot, the latency, version and a UTC clock', async () => {
    const wrapper = await mountSuspended(AtriumStatusBar)

    expect(wrapper.find('[data-testid="atrium-status"]').text()).toContain('Online')
    expect(wrapper.find('[data-integration="impex"]').attributes('data-active')).toBe('true')
    expect(wrapper.find('[data-integration="polycart"] .atrium-live-dot').attributes('data-state')).toBe('off')
    expect(wrapper.find('[data-testid="atrium-latency"]').text()).toBe('42 ms')
    expect(wrapper.text()).toContain('API v2.0')
    expect(wrapper.find('[data-testid="atrium-clock"]').text()).toMatch(/^\d{2}:\d{2}:\d{2} UTC$/)
  })
})

describe('⌘K as navigation', () => {
  beforeEach(async () => {
    localStorage.clear()
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = shell()
  })

  it('lists every page of the navigation, with its section, and the shell actions', async () => {
    const palette = await withSetup(() => useAtriumPalette(ref(''), ref([]), () => {}))
    const groups = Object.fromEntries(palette.groups.value.map(group => [group.id, group.items ?? []]))

    expect(Object.keys(groups)).toEqual(['atrium-pages', 'atrium-actions'])
    expect(groups['atrium-pages']!.map(item => [item.label, item.suffix, item.to])).toEqual([
      ['Overview', 'Workspace', '/'],
      ['Orders', 'Workspace', '/demo/orders'],
      ['Team', 'Workspace', '/demo/users'],
      ['Sales', 'Insights', '/demo/reports/sales'],
      ['Signups', 'Insights', '/demo/reports/signups'],
      ['Billing', 'Administration', '/demo/billing']
    ])
    expect(groups['atrium-actions']!.map(item => item.label)).toContain('Use the Harbor theme')
  })

  it('remembers the pages visited and offers them first, the current one aside', async () => {
    await useRouter().push('/')
    localStorage.setItem('atrium-recent', JSON.stringify(['/demo/billing']))

    const palette = await withSetup(() => useAtriumPalette(ref(''), ref([]), () => {}))

    expect(palette.recent.value).toEqual(['/', '/demo/billing'])
    expect(palette.groups.value[0]!.id).toBe('atrium-recent')
    expect(palette.groups.value[0]!.items!.map(item => item.to)).toEqual(['/demo/billing'])
  })

  it('puts search results after the pages', async () => {
    const results = ref([{ id: 'Orders', label: 'Orders', ignoreFilter: true, items: [{ label: 'ORD-1048' }] }])
    const palette = await withSetup(() => useAtriumPalette(ref('ord'), results, () => {}))

    expect(palette.groups.value.map(group => group.id)).toEqual(['atrium-pages', 'Orders', 'atrium-actions'])
  })
})

describe('the shared deck blocks', () => {
  it('renders a state with its kind, title, description and actions', async () => {
    const wrapper = await mountSuspended(AtriumState, {
      props: { kind: 'error', title: 'Nothing loaded', description: 'Try again.' },
      slots: { default: () => 'Retry' }
    })
    const state = wrapper.find('[data-testid="atrium-state"]')

    expect(state.attributes('data-kind')).toBe('error')
    expect(state.attributes('role')).toBe('alert')
    expect(state.text()).toContain('Nothing loaded')
    expect(state.text()).toContain('Try again.')
    expect(state.text()).toContain('Retry')
  })

  it('renders a stat with its label, value, hint and tone', async () => {
    const wrapper = await mountSuspended(AtriumStat, { props: { label: 'Inbound', value: 12, hint: 'last 24h', tone: 'success' } })
    const stat = wrapper.find('[data-testid="atrium-stat"]')

    expect(stat.attributes('data-tone')).toBe('success')
    expect(stat.text()).toContain('Inbound')
    expect(stat.text()).toContain('12')
    expect(stat.text()).toContain('last 24h')
  })

  it('draws a stat\'s series as a sparkline and its delta as a chip', async () => {
    const wrapper = await mountSuspended(AtriumStat, { props: { label: 'Orders', value: '1,284', delta: '+8.1%', series: [3, 5, 4, 8] } })

    expect(wrapper.find('[data-testid="atrium-stat-delta"]').text()).toBe('+8.1%')
    expect(wrapper.find('[data-testid="atrium-stat-spark"] path[stroke]').attributes('d')).toMatch(/^M0\.0,/)
  })

  it('draws no sparkline for fewer than two points', async () => {
    const wrapper = await mountSuspended(AtriumStat, { props: { label: 'Orders', value: 1, series: [3] } })

    expect(wrapper.find('[data-testid="atrium-stat-spark"]').exists()).toBe(false)
  })

  it('reads a failure as a terminal fault and a 403 as a restricted readout', async () => {
    const error = await mountSuspended(AtriumErrorCard, { props: { message: 'Nothing loaded.' } })
    const locked = await mountSuspended(AtriumNoAccess)

    expect(error.find('[data-testid="atrium-error-card"]').attributes('role')).toBe('alert')
    expect(error.text()).toContain('Nothing loaded.')
    expect(error.find('.atrium-terminal-head').attributes('data-code')).toBe('ERR')
    expect(locked.find('.atrium-terminal-head').attributes('data-code')).toBe('403')
    expect(locked.text()).toContain('No access')
  })

  it('renders a page header with its overline, title and actions', async () => {
    const wrapper = await mountSuspended(AtriumPageHeader, {
      props: { title: 'Products', overline: 'Catalog', description: '42 products' },
      slots: { default: () => 'New product' }
    })

    expect(wrapper.find('h1').text()).toBe('Products')
    expect(wrapper.text()).toContain('Catalog')
    expect(wrapper.text()).toContain('42 products')
    expect(wrapper.text()).toContain('New product')
  })
})
