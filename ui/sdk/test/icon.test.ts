import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { AtriumIcon } from '#components'
import { useAtriumIcon } from '#imports'
import { withSetup } from './support'

describe('useAtriumIcon()', () => {
  it('keeps an Iconify name from a bundled collection', async () => {
    const icons = await withSetup(() => useAtriumIcon())

    expect(icons.resolve('i-lucide-house')).toBe('i-lucide-house')
    expect(icons.isKnown('i-lucide-shopping-cart')).toBe(true)
  })

  it('swaps an unknown icon for the fallback', async () => {
    const icons = await withSetup(() => useAtriumIcon())

    for (const icon of ['i-heroicons-home', 'lucide:home', 'i-home', '<svg></svg>', 'chart-bar']) {
      expect(icons.isKnown(icon), icon).toBe(false)
      expect(icons.resolve(icon), icon).toBe('i-lucide-circle-help')
    }
  })

  it('resolves no icon to none', async () => {
    const icons = await withSetup(() => useAtriumIcon())

    expect(icons.resolve(null)).toBeUndefined()
    expect(icons.resolve('')).toBeUndefined()
  })
})

describe('AtriumIcon', () => {
  it('renders an Iconify icon by name', async () => {
    const wrapper = await mountSuspended(AtriumIcon, { props: { icon: 'i-lucide-house' } })

    const icon = wrapper.find('[data-testid="atrium-icon"]')

    expect(icon.attributes('data-icon')).toBe('i-lucide-house')
    expect(icon.attributes('data-fallback')).toBeUndefined()
    expect(wrapper.html()).toContain('lucide:house')
  })

  it('renders the fallback icon, not an error, for an unknown icon', async () => {
    const wrapper = await mountSuspended(AtriumIcon, { props: { icon: 'i-nope-not-an-icon' } })

    const icon = wrapper.find('[data-testid="atrium-icon"]')

    expect(icon.attributes('data-icon')).toBe('i-lucide-circle-help')
    expect(icon.attributes('data-fallback')).toBe('i-nope-not-an-icon')
    expect(wrapper.html()).toContain('lucide:circle-help')
  })

  it('renders nothing for no icon', async () => {
    const wrapper = await mountSuspended(AtriumIcon, { props: { icon: null } })

    expect(wrapper.find('[data-testid="atrium-icon"]').exists()).toBe(false)
  })
})
