import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import DefaultLayout from '../../app/src/layouts/AtriumDefaultLayout.vue'
import AtriumSearch from '../src/components/AtriumSearch.vue'
import { mockAtriumApi, mountSuspended, shell, useShell } from '../src/testing/index'

/*
 * ⌘K's launchers in the real shell (D-095): inside the layout's
 * <UDashboardGroup>, a click on the top bar's search button (or the compact
 * magnifier below `md`) opens the palette once, ⌘K still toggles it, and
 * closing it closes it.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: unknown) => Promise<unknown>>()
}))

mockAtriumApi(api)

/** The palette's dialog, which Nuxt UI portals to the body. */
function palette(): Element | null {
  return document.body.querySelector('[role="dialog"] input')
}

async function flush(): Promise<void> {
  // Nuxt UI's dashboard toggles the palette through an async runtime hook.
  for (let i = 0; i < 3; i++) {
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

async function press(key: string, init: KeyboardEventInit = {}): Promise<void> {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))
  await flush()
}

describe('the search launchers in the shell', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(async () => {
    api.mockReset()
    api.mockResolvedValue({ data: [] })
    await useShell(shell())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  async function mountShell(): Promise<VueWrapper> {
    wrapper = await mountSuspended(DefaultLayout, { attachTo: document.body, slots: { default: () => h('p', 'Page') } })
    await flush()

    return wrapper
  }

  for (const testid of ['atrium-search', 'atrium-search-compact']) {
    it(`opens the palette on a click of ${testid}, and keeps it open`, async () => {
      const shell = await mountShell()
      expect(palette()).toBeNull()

      await shell.find(`[data-testid="${testid}"]`).trigger('click')
      await flush()

      expect(palette()).not.toBeNull()
    })
  }

  // ⌘K is Ctrl+K off macOS, as in jsdom.
  it('still toggles the palette with ⌘K', async () => {
    await mountShell()

    await press('k', { ctrlKey: true })
    expect(palette()).not.toBeNull()

    await press('k', { ctrlKey: true })
    expect(palette()).toBeNull()
  })

  it('closes the palette with Escape after a click opened it', async () => {
    const shell = await mountShell()

    await shell.find('[data-testid="atrium-search"]').trigger('click')
    await flush()
    expect(palette()).not.toBeNull()

    palette()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flush()
    expect(palette()).toBeNull()
  })
})

describe('the search launcher outside a dashboard group', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens the palette on a click on its own', async () => {
    await useShell(shell())
    const wrapper = await mountSuspended(AtriumSearch, { attachTo: document.body })

    await wrapper.find('[data-testid="atrium-search"]').trigger('click')
    await flush()

    expect(palette()).not.toBeNull()
    wrapper.unmount()
  })
})
