import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { useAtrium } from '#imports'
import PolycartCartsByType from '../../../app/integrations/polycart/components/PolycartCartsByType.vue'
import PolycartRecentCarts from '../../../app/integrations/polycart/components/PolycartRecentCarts.vue'
import { settle, withSetup } from '../../support'
import { mockPackageApi, mountIntegration, reply, resetPackageApis, type PackageCall, type PackageRoutes } from '../support'
import { CART_ID, guestCart, requests, stats } from './data'

/*
 * Polycart's widgets (AC 60): `polycart.carts-by-type` and
 * `polycart.recent-carts` keep their v1 keys, get `data: {}` from PHP, and
 * read `polycart.stats.show` (`by_type` and `recent`), sharing one request
 * per dashboard load. A 403 renders the no-access card; any other failure
 * the error card.
 */

function polycart(routes: PackageRoutes<'polycart'> = {}): PackageCall[] {
  return mockPackageApi('polycart', {
    'GET /stats': { data: stats },
    ...routes
  })
}

/** Both widgets on one dashboard, as <AtriumWidget> renders them. */
const Dashboard = defineComponent({
  setup() {
    return () => h('div', [
      h(PolycartCartsByType, { data: {}, settings: {} }),
      h(PolycartRecentCarts, { data: {}, settings: {} })
    ])
  }
})

let mounted: VueWrapper | null = null

async function mountDashboard(): Promise<VueWrapper> {
  const wrapper = await mountIntegration(Dashboard, 'polycart')
  await settle()

  mounted = wrapper as unknown as VueWrapper

  return mounted
}

afterEach(() => {
  // Leaving the dashboard ends its load, so the next test asks again.
  mounted?.unmount()
  mounted = null
  resetPackageApis()
})

describe('registration', () => {
  it('registers both widgets under their v1 keys', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.widgets.get('polycart.carts-by-type')).toBe(PolycartCartsByType)
    expect(atrium.widgets.get('polycart.recent-carts')).toBe(PolycartRecentCarts)
  })
})

describe('the shared stats request', () => {
  it('loads polycart.stats.show once for both widgets', async () => {
    const calls = polycart()
    await mountDashboard()

    expect(requests(calls, 'GET', '/stats')).toHaveLength(1)
    expect(calls).toHaveLength(1)
  })
})

describe('polycart.carts-by-type', () => {
  it('shows each type\'s count, linking to its unexpired carts', async () => {
    polycart()
    const wrapper = await mountDashboard()

    const types = wrapper.findAll('[data-testid="polycart-carts-by-type"] [data-testid="polycart-type-count"]')
    expect(types.map(type => type.text().replace(/\s+/g, ' ').trim())).toEqual(['order 4', 'quote 0'])
    expect(types[0]!.attributes('href')).toBe('/polycart/carts?type=order&unexpired=1')
  })
})

describe('polycart.recent-carts', () => {
  it('lists the recent carts, each linking to its page', async () => {
    polycart()
    const wrapper = await mountDashboard()

    const carts = wrapper.findAll('[data-testid="polycart-recent-carts"] [data-testid="polycart-recent-cart"]')
    expect(carts).toHaveLength(2)
    expect(carts[0]!.text()).toContain('Spring order')
    expect(carts[0]!.text()).toContain('2 lines')
    expect(carts[0]!.find('a').attributes('href')).toBe(`/polycart/carts/${CART_ID}`)
    expect(carts[1]!.text()).toContain(guestCart.id)
    expect(carts[1]!.text()).toContain('No lines')
  })

  it('says so when there is no cart', async () => {
    polycart({ 'GET /stats': { data: { by_type: [], recent: [] } } })
    const wrapper = await mountDashboard()

    expect(wrapper.find('[data-testid="polycart-no-recent-carts"]').exists()).toBe(true)
  })
})

describe('failures', () => {
  it('renders the no-access card in both widgets on a 403, after one request', async () => {
    const calls = polycart({ 'GET /stats': reply(403) })
    const wrapper = await mountDashboard()

    expect(wrapper.findAll('[data-testid="atrium-no-access"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="atrium-error-card"]').exists()).toBe(false)
    expect(requests(calls, 'GET', '/stats')).toHaveLength(1)
  })

  it('renders the error card in both widgets on any other failure', async () => {
    polycart({ 'GET /stats': reply(500) })
    const wrapper = await mountDashboard()

    expect(wrapper.findAll('[data-testid="atrium-error-card"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(false)
  })
})
