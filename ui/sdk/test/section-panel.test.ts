import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import DefaultLayout from '../../app/src/layouts/AtriumDefaultLayout.vue'
import { mockAtriumApi, mountSuspended, settle, shell, useRouter, useShell } from '../src/testing/index'
import type { AtriumNavItem, AtriumNavSection } from '../src/types/atrium'

/*
 * The section panel in the real shell shows the section that owns the
 * route (D-096): a module's for its pages, the section holding `/` for the
 * dashboard, Settings for the settings pages and, for a page no section
 * holds, the dashboard's section; never the first module's, nor the one
 * visited before.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: unknown) => Promise<unknown>>()
}))

mockAtriumApi(api)

const page = (label: string, path: string): AtriumNavItem => ({ label, icon: null, link: { path, external: false }, badge: null, live: null, children: [] })

/** The suite's sections only, as a host without a dashboard nav item sends them. */
const modules: AtriumNavSection[] = [
  { key: 'group-catalog', label: 'Catalog', icon: 'i-lucide-box', grouped: true, link: null, items: [page('Products', '/showroom/products'), page('Assets', '/showroom/assets')] },
  { key: 'group-impex', label: 'Impex', icon: 'i-lucide-workflow', grouped: true, link: null, items: [page('Runs', '/impex/runs')] }
]

describe('the section panel in the shell', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    api.mockReset()
    api.mockResolvedValue({ data: [] })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  async function visit(path: string): Promise<{ section: string | undefined, heading: string, links: string[], active: string | undefined }> {
    if (wrapper === null) {
      wrapper = await mountSuspended(DefaultLayout, { route: path, attachTo: document.body, slots: { default: () => h('p', 'Page') } })
    } else {
      await useRouter().push(path)
    }

    await settle()

    const panel = wrapper.find('[data-testid="atrium-nav-panel"]')

    return {
      section: panel.attributes('data-section'),
      heading: panel.find('[data-testid="atrium-nav-panel-title"]').text(),
      links: panel.findAll('a[href]').map(link => link.attributes('href')!),
      active: panel.findAll('a[aria-current="page"]').map(link => link.attributes('href'))[0]
    }
  }

  it('leaves a module\'s section for Atrium\'s own pages when no section holds them', async () => {
    await useShell(shell({ navigation: modules }))

    expect((await visit('/impex/runs')).heading).toBe('Impex')

    const settings = await visit('/settings')
    expect(settings.section).toBe('settings')
    expect(settings.heading).toBe('Settings')
    expect(settings.links).toEqual(['/settings', '/settings/demo'])
    expect(settings.active).toBe('/settings')

    expect((await visit('/settings/demo')).active).toBe('/settings/demo')

    const dashboard = await visit('/')
    expect(dashboard.section).toBe('atrium')
    expect(dashboard.heading).toBe('Home')
    expect(dashboard.links).toContain('/')
    expect(dashboard.active).toBe('/')

    expect((await visit('/showroom/products')).heading).toBe('Catalog')
    expect((await visit('/d/sales')).section).toBe('atrium')
    expect((await visit('/nowhere')).section).toBe('atrium')
  })

  it('shows the section holding the dashboard for it and for pages no section holds', async () => {
    await useShell(shell({ navigation: [...modules, ...shell().navigation] }))

    expect((await visit('/showroom/products')).heading).toBe('Catalog')

    const dashboard = await visit('/')
    expect(dashboard.section).toBe('group-workspace')
    expect(dashboard.heading).toBe('Workspace')
    expect(dashboard.active).toBe('/')

    expect((await visit('/impex/runs')).heading).toBe('Impex')
    expect((await visit('/settings')).heading).toBe('Settings')
    expect((await visit('/nowhere')).section).toBe('group-workspace')
  })
})
