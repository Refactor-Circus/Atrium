import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { AtriumScreen, AtriumSettingsPanel } from '#components'
import { clearNuxtData, useAtrium, useAtriumSettingsPanel, useRouter } from '#imports'
import type { AtriumScreen as ScreenData, AtriumSettingsPanel as PanelData } from '../app/types/atrium'
import { settle, withSetup } from './support'
import settingsPanel from './fixtures/screen.json'
import settingsPanelTab from './fixtures/screen-tab.json'

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: { query?: Record<string, unknown> }) => Promise<unknown>>()
}))

mockNuxtImport('useAtriumApi', () => () => api)

const show = (testid: string) => defineComponent({
  props: { data: { type: Object, default: null } },
  setup: props => () => h('div', { 'data-testid': testid }, JSON.stringify(props.data))
})

describe('screens', () => {
  beforeEach(async () => {
    clearNuxtData()
    api.mockReset()

    const atrium = await withSetup(() => useAtrium())
    atrium
      .settingsPanel('demo', show('shop-settings'))
      .extension('demo.storefront', show('storefront-tab'))
      .extension('demo.visit-store', show('visit-store'))
      .extension('demo.help', show('help'))
  })

  afterEach(async () => {
    await useRouter().replace({ query: {} })
  })

  it('renders a settings panel and the sections of every slot of its screen', async () => {
    const wrapper = await mountSuspended(AtriumSettingsPanel, {
      props: { panel: settingsPanel.data as PanelData, screen: settingsPanel.screen as ScreenData }
    })

    expect(wrapper.text()).toContain('Store details and the feature flags this workbench runs with.')
    expect(wrapper.find('[data-testid="shop-settings"]').text()).toContain('"audit-log":false')
    expect(wrapper.find('[data-testid="atrium-slot-header.actions"] [data-testid="visit-store"]').text()).toContain('https://shop.acme.test')
    expect(wrapper.find('[data-testid="atrium-slot-aside"] [data-testid="help"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="storefront-tab"]').exists()).toBe(false)
  })

  it('renders the open registered tab with its data in place of the panel', async () => {
    const wrapper = await mountSuspended(AtriumSettingsPanel, {
      props: { panel: settingsPanelTab.data as PanelData, screen: settingsPanelTab.screen as ScreenData }
    })

    expect(wrapper.find('[data-testid="storefront-tab"]').text()).toContain('America/New_York')
    expect(wrapper.find('[data-testid="shop-settings"]').exists()).toBe(false)
  })

  it('renders an error card for a settings panel the server sent with an error', async () => {
    const panel = { ...settingsPanel.data, data: null, error: { message: 'Widget failed to load' } } as PanelData

    const wrapper = await mountSuspended(AtriumSettingsPanel, { props: { panel, screen: settingsPanel.screen as ScreenData } })

    expect(wrapper.find('[data-testid="atrium-error-card"]').text()).toContain('This settings panel failed to load.')
    expect(wrapper.find('[data-testid="shop-settings"]').exists()).toBe(false)
  })

  it('renders an error card for a section the server sent with an error', async () => {
    const screen = structuredClone(settingsPanel.screen) as ScreenData
    screen.sections.aside = [{ key: 'demo.help', label: 'Help', component: 'demo.help', data: null, error: { message: 'Widget failed to load' } }]

    const wrapper = await mountSuspended(AtriumScreen, { props: { screen } })

    expect(wrapper.find('[data-testid="atrium-slot-aside"] [data-testid="atrium-error-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="help"]').exists()).toBe(false)
  })

  it('switching tabs puts the tab in the ?tab= query', async () => {
    const wrapper = await mountSuspended(AtriumScreen, { props: { screen: settingsPanel.screen as ScreenData } })

    const storefront = wrapper.findAll('[data-testid="atrium-screen-tabs"] button').find(b => b.text().includes('Storefront'))
    await storefront!.trigger('mousedown', { button: 0 })
    await settle()

    expect(useRouter().currentRoute.value.query.tab).toBe('demo.storefront')
  })

  it('a tab in the query is sent to the API as ?tab=', async () => {
    api.mockImplementation(async (_path, options) => options?.query?.tab === 'demo.storefront' ? settingsPanelTab : settingsPanel)

    const { data } = await withSetup(() => useAtriumSettingsPanel('demo'))
    await settle()

    expect(api).toHaveBeenLastCalledWith('/settings/demo', { query: { tab: undefined } })

    await useRouter().replace({ query: { tab: 'demo.storefront' } })
    await settle()

    expect(api).toHaveBeenLastCalledWith('/settings/demo', { query: { tab: 'demo.storefront' } })
    expect(data.value?.screen.open_tab).toBe('demo.storefront')
  })
})
