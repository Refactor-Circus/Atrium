import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AtriumPlacement } from '../src/types/atrium'
import fixture from './fixtures/dashboard.json'
import { AtriumWidget, useAtrium } from '../src/index'
import { httpError, mockAtriumApi, mountSuspended, settle, withSetup } from '../src/testing/index'

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: unknown) => Promise<unknown>>()
}))

mockAtriumApi(api)

const Services = defineComponent({
  props: { data: { type: Object, required: true } },
  setup: props => () => h('ul', { 'data-testid': 'services' }, (props.data.services as { name: string }[] ?? []).map(s => h('li', s.name)))
})

const lazy = fixture.data.widgets.find(w => w.lazy) as AtriumPlacement
const eager = fixture.data.widgets[0] as AtriumPlacement

describe('AtriumWidget', () => {
  beforeEach(async () => {
    api.mockReset()
    const atrium = await withSetup(() => useAtrium())
    atrium.widget('demo.services', Services).widget('demo.revenue', Services)
  })

  it('fetches a lazy placement by uuid through atrium.dashboards.widgets.show, then renders it', async () => {
    api.mockResolvedValue({ data: { ...lazy, data: { services: [{ name: 'API' }, { name: 'Queue' }] } } })

    const wrapper = await mountSuspended(AtriumWidget, { props: { dashboardSlug: 'overview', placement: lazy } })
    await settle()

    expect(api).toHaveBeenCalledExactlyOnceWith(`/dashboards/overview/widgets/${lazy.uuid}`)
    expect(wrapper.find('[data-testid="services"]').text()).toBe('APIQueue')
  })

  it('does not fetch a placement that is not lazy', async () => {
    await mountSuspended(AtriumWidget, { props: { dashboardSlug: 'overview', placement: eager } })
    await settle()

    expect(api).not.toHaveBeenCalled()
  })

  it('renders an error card for a placement the server sent with an error', async () => {
    const failed = { ...eager, data: null, error: { message: 'Widget failed to load' } }

    const wrapper = await mountSuspended(AtriumWidget, { props: { dashboardSlug: 'overview', placement: failed } })

    expect(wrapper.find('[data-testid="atrium-error-card"]').text()).toContain('This widget failed to load.')
    expect(wrapper.find('[data-testid="services"]').exists()).toBe(false)
  })

  it('renders an error card when a lazy placement comes back with an error', async () => {
    api.mockResolvedValue({ data: { ...lazy, data: null, error: { message: 'Widget failed to load' } } })

    const wrapper = await mountSuspended(AtriumWidget, { props: { dashboardSlug: 'overview', placement: lazy } })
    await settle()

    expect(wrapper.find('[data-testid="atrium-error-card"]').exists()).toBe(true)
  })

  it('renders an error card when the lazy request fails, without breaking anything else', async () => {
    api.mockRejectedValue(httpError(500))

    const wrapper = await mountSuspended(AtriumWidget, { props: { dashboardSlug: 'overview', placement: lazy } })
    await settle()

    expect(wrapper.find('[data-testid="atrium-error-card"]').exists()).toBe(true)
  })
})
