import { beforeEach, describe, expect, it } from 'vitest'
import { h, ref } from 'vue'
import { AtriumErrorCard, AtriumNoAccess, AtriumPageHeader, AtriumStat, AtriumState, AtriumStatusBar, AtriumTopbar, useAtriumNavigation, useAtriumPalette, useAtriumShellStore } from '../src/index'
import { UBadge } from '../src/ui'
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
    expect(wrapper.find('[data-integration="impex"] [data-testid="atrium-live-dot"]').attributes('data-state')).toBe('on')
    expect(wrapper.find('[data-integration="polycart"] [data-testid="atrium-live-dot"]').attributes('data-state')).toBe('off')
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

  it('reads a failure as a coded fault alert and a 403 as a restricted one', async () => {
    const error = await mountSuspended(AtriumErrorCard, { props: { message: 'Nothing loaded.' } })
    const locked = await mountSuspended(AtriumNoAccess)

    expect(error.find('[data-testid="atrium-error-card"]').attributes('role')).toBe('alert')
    expect(error.text()).toContain('Nothing loaded.')
    expect(error.find('[data-testid="atrium-error-card"]').attributes('data-code')).toBe('ERR')
    expect(locked.find('[data-testid="atrium-no-access"]').attributes('data-code')).toBe('403')
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

  it('puts a page header\'s title slot (a status badge beside the text) in its <h1>', async () => {
    const wrapper = await mountSuspended(AtriumPageHeader, {
      props: { title: 'ignored' },
      slots: { title: () => [h('span', 'orders.sync'), h(UBadge, { label: 'running', 'data-testid': 'status' })] }
    })

    expect(wrapper.find('h1').text()).toContain('orders.sync')
    expect(wrapper.find('h1 [data-testid="status"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="atrium-page-header-back"]').exists()).toBe(false)
  })

  it('leads a page header\'s title with a back button, or the leading slot', async () => {
    const back = await mountSuspended(AtriumPageHeader, { props: { title: 'Run', back: '/impex/runs' } })
    const button = back.find('[data-testid="atrium-page-header-back"]')

    expect(button.attributes('href')).toBe('/impex/runs')
    expect(button.attributes('aria-label')).toBe('Back')
    expect(back.find('h1').text()).toBe('Run')

    const named = await mountSuspended(AtriumPageHeader, { props: { title: 'Run', back: '/impex/runs', backLabel: 'All runs' } })
    expect(named.find('[data-testid="atrium-page-header-back"]').attributes('aria-label')).toBe('All runs')

    const leading = await mountSuspended(AtriumPageHeader, { props: { title: 'Run' }, slots: { leading: () => h('span', { 'data-testid': 'lead' }, '<') } })
    expect(leading.find('h1 [data-testid="lead"]').exists()).toBe(true)
  })

  it('takes a page header\'s description, meta, headline and links slots, and the page\'s own test id', async () => {
    const wrapper = await mountSuspended(AtriumPageHeader, {
      props: { title: 'Products', links: [{ label: 'Docs', to: '/docs' }] },
      attrs: { 'data-testid': 'showroom-products-header' },
      slots: {
        headline: () => h('span', { 'data-testid': 'headline' }, 'Catalog'),
        description: () => h('p', { 'data-testid': 'description' }, '42 products'),
        meta: () => h('p', { 'data-testid': 'meta' }, 'Updated today')
      }
    })

    expect(wrapper.attributes('data-testid')).toBe('showroom-products-header')
    expect(wrapper.find('[data-testid="headline"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="description"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="meta"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Docs')
  })

  it('merges a page header\'s `ui` into its own slot classes instead of replacing them (D-094)', async () => {
    const plain = await mountSuspended(AtriumPageHeader, { props: { title: 'Products' } })
    const merged = await mountSuspended(AtriumPageHeader, { props: { title: 'Products', ui: { root: 'border-none py-0', title: 'max-w-xl' } } })

    expect(plain.find('h1').classes()).toContain('truncate')
    expect(merged.find('h1').classes()).toEqual(expect.arrayContaining(['truncate', 'max-w-xl']))
    expect(merged.classes()).toEqual(expect.arrayContaining(['border-none', 'py-0']))
    expect(merged.classes()).not.toContain('border-b')

    const composed = await mountSuspended(AtriumPageHeader, { props: { title: 'Run', back: '/runs', ui: { title: 'text-lg' } } })
    expect(composed.find('h1').classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'text-lg']))
  })
})
