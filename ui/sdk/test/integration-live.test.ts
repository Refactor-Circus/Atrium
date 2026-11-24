import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AtriumRegistry } from '../src/registry'
import type { AtriumNavItem, AtriumNavSection } from '../src/types/atrium'
import { AtriumNavigation, useAtrium } from '../src/index'
import { inApp, integrationEntry, integrationShell, mountSuspended, settle, useShell, withSetup } from '../src/testing/index'

/*
 * Live nav keys (AC 43, 52): Navigation calls the `live` resolver registered
 * for each item's `live.key`, with the item's static options, and shows the
 * badge and children it returns.
 */

const item = (label: string, path: string, live: AtriumNavItem['live'] = null, badge: AtriumNavItem['badge'] = null): AtriumNavItem => ({
  label,
  icon: null,
  link: { path, external: false },
  badge,
  live,
  children: []
})

const sections: AtriumNavSection[] = [{
  key: 'group-integrations',
  label: 'Integrations',
  icon: null,
  grouped: true,
  link: null,
  items: [
    item('Runs', '/impex/runs', { key: 'impex.active-runs', options: {} }),
    item('History', '/keen/entries', { key: 'keen.history', options: { exclude: ['atrium'], sort: 90 } }),
    item('Carts', '/polycart/carts', { key: 'polycart.open-carts', options: {} }, 4),
    item('Static', '/impex/flows', null, 2)
  ]
}]

describe('the $atrium registry: live()', () => {
  it('registers a resolver by key, chainably', () => {
    const registry = new AtriumRegistry()
    const resolver = async () => ({ badge: 1 })

    expect(registry.live('impex.active-runs', resolver)).toBe(registry)
    expect(registry.liveResolvers.get('impex.active-runs')).toBe(resolver)
  })
})

describe('live nav items', () => {
  let atrium: AtriumRegistry

  beforeEach(async () => {
    atrium = await withSetup(() => useAtrium())
    atrium.liveResolvers.clear()

    await useShell(integrationShell(
      [integrationEntry('impex'), integrationEntry('keen'), integrationEntry('polycart', { active: false })],
      { navigation: structuredClone(sections) }
    ))
  })

  afterEach(() => {
    atrium.liveResolvers.clear()
  })

  it('sets an item\'s badge from its live resolver', async () => {
    atrium.live('impex.active-runs', async () => ({ badge: 7 }))

    const wrapper = await mountSuspended(AtriumNavigation)
    await settle()

    expect(wrapper.find('a[href="/impex/runs"]').text()).toContain('7')
  })

  it('sets an item\'s children from its live resolver, passing the item\'s live options', async () => {
    const history = vi.fn(async (_options: Record<string, unknown>) => ({
      children: [
        item('Showroom', '/keen/history/showroom'),
        item('Roster', '/keen/history/roster')
      ]
    }))
    atrium.live('keen.history', history)

    const wrapper = await mountSuspended(AtriumNavigation)
    await settle()

    expect(history).toHaveBeenCalledWith({ exclude: ['atrium'], sort: 90 })
    expect(wrapper.find('a[href="/keen/history/showroom"]').text()).toContain('Showroom')
    expect(wrapper.find('a[href="/keen/history/roster"]').exists()).toBe(true)
  })

  it('removes the badge when the resolver returns badge null', async () => {
    atrium.live('impex.active-runs', async () => ({ badge: null }))

    const wrapper = await mountSuspended(AtriumNavigation)
    await settle()

    expect(wrapper.find('a[href="/impex/runs"]').text().trim()).toBe('Runs')
  })

  it('keeps the item as sent when its resolver fails', async () => {
    atrium.live('impex.active-runs', async () => { throw new Error('Network down') })

    const wrapper = await mountSuspended(AtriumNavigation)
    await settle()

    expect(wrapper.find('a[href="/impex/runs"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/impex/flows"]').text()).toContain('2')
  })

  it('calls no resolver for an item of an inactive integration, or a key with none registered', async () => {
    const carts = vi.fn(async () => ({ badge: 99 }))
    atrium.live('polycart.open-carts', carts)

    const wrapper = await mountSuspended(AtriumNavigation)
    await settle()

    expect(carts).not.toHaveBeenCalled()
    expect(wrapper.find('a[href="/polycart/carts"]').text()).toContain('4')
    expect(wrapper.find('a[href="/keen/entries"]').exists()).toBe(true)
  })

  it('calls each resolver once per shell load', async () => {
    const runs = vi.fn(async () => ({ badge: 1 }))
    atrium.live('impex.active-runs', runs)

    const wrapper = await mountSuspended(inApp(AtriumNavigation))
    await settle()
    await wrapper.setProps({ collapsed: true })
    await settle()

    expect(runs).toHaveBeenCalledOnce()
  })
})
