import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { AtriumRegistry } from '../src/registry'
import type { AtriumPlacement } from '../src/types/atrium'
import dashboard from './fixtures/dashboard.json'
import { AtriumExtension, AtriumWidget, useAtrium, useAtriumI18n } from '../src/index'
import { mountSuspended, runInAtrium, withSetup } from '../src/testing/index'

const Revenue = defineComponent({
  props: { data: { type: Object, required: true } },
  setup: props => () => h('p', { 'data-testid': 'revenue' }, String(props.data.value))
})

const Stub = defineComponent({ setup: () => () => h('span') })

function placement(overrides: Partial<AtriumPlacement> = {}): AtriumPlacement {
  return { ...structuredClone(dashboard.data.widgets[0]), ...overrides } as AtriumPlacement
}

describe('the $atrium registry', () => {
  it('registers widgets, extensions and settings panels by key, chainably', () => {
    const registry = new AtriumRegistry()

    registry.widget('demo.revenue', Stub).extension('demo.help', Stub).settingsPanel('demo', Stub)

    expect(registry.widgets.get('demo.revenue')).toBe(Stub)
    expect(registry.extensions.get('demo.help')).toBe(Stub)
    expect(registry.panels.get('demo')).toBe(Stub)
    expect(registry.widgets.get('demo.orders')).toBeUndefined()
  })

  it('keeps the auth adapter it is given', () => {
    const registry = new AtriumRegistry()
    const adapter = { headers: () => ({ Authorization: 'Bearer token' }), credentials: 'include' as const }

    expect(registry.auth()).toEqual({})
    expect(registry.auth(adapter)).toBe(adapter)
    expect(registry.auth()).toBe(adapter)
  })

  it('is the page\'s one registry, returned by useAtrium()', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium).toBeInstanceOf(AtriumRegistry)
    expect(atrium).toBe(useAtrium())
  })
})

describe('rendering by key', () => {
  it('renders the component registered for a widget key, with its data', async () => {
    const atrium = await withSetup(() => useAtrium())
    atrium.widget('demo.revenue', Revenue)

    const wrapper = await mountSuspended(AtriumWidget, { props: { dashboardSlug: 'overview', placement: placement() } })

    expect(wrapper.find('[data-testid="revenue"]').text()).toBe('$48,250')
    expect(wrapper.find('[data-testid="atrium-unregistered"]').exists()).toBe(false)
  })

  it('falls back to the unregistered notice, naming the key, when no component is registered', async () => {
    const wrapper = await mountSuspended(AtriumWidget, {
      props: { dashboardSlug: 'overview', placement: placement({ key: 'demo.unknown', component: 'demo.unknown' }) }
    })

    const fallback = wrapper.find('[data-testid="atrium-unregistered"]')

    expect(fallback.exists()).toBe(true)
    expect(fallback.text()).toContain('demo.unknown')
  })

  it('says an orphaned placement (no component) is no longer installed', async () => {
    const wrapper = await mountSuspended(AtriumWidget, {
      props: { dashboardSlug: 'overview', placement: placement({ key: 'gone.widget', component: null, title: null, icon: null }) }
    })

    expect(wrapper.find('[data-testid="atrium-widget-orphaned"]').text()).toContain('gone.widget')
  })

  it('falls back for a screen extension no package registered', async () => {
    const wrapper = await mountSuspended(AtriumExtension, {
      props: { extension: { key: 'demo.nothing', label: 'Nothing', component: 'demo.nothing', data: {} } }
    })

    expect(wrapper.find('[data-testid="atrium-unregistered"]').text()).toContain('demo.nothing')
  })
})
