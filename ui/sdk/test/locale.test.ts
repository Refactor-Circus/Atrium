import { afterEach, describe, expect, it, vi } from 'vitest'
import { addAtriumMessages, AtriumSearch, setAtriumLocale, useAtriumI18n, useAtriumShellStore } from '../src/index'
import fr from './locales/fr.json'
import { mockAtriumApi, mountSuspended, runInAtrium, settle, shell, withSetup } from '../src/testing/index'

/*
 * `fr` is registered for this suite only (test/locales): Atrium itself
 * ships `en` alone; a module or the app adds a locale with
 * addAtriumMessages().
 */

addAtriumMessages({ fr })

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string) => Promise<unknown>>()
}))

mockAtriumApi(api)

async function loadShell(locale: string) {
  api.mockResolvedValue({ data: shell({ locale }) })

  const store = await withSetup(() => useAtriumShellStore())
  await store.load(true)
  await settle()

  return store
}

describe('the layer locale', () => {
  afterEach(async () => {
    setAtriumLocale('en')
  })

  it('renders the layer strings in English by default', async () => {
    await loadShell('en')

    const wrapper = await mountSuspended(AtriumSearch)

    expect(wrapper.find('[data-testid="atrium-search"]').text()).toContain('Search…')
  })

  it('switches to the locale the shell sends', async () => {
    await loadShell('fr')

    expect(useAtriumI18n().locale.value).toBe('fr')

    const wrapper = await mountSuspended(AtriumSearch)

    expect(wrapper.find('[data-testid="atrium-search"]').text()).toContain('Rechercher…')
  })

  it('stays on the current locale when the app has no messages for the shell locale', async () => {
    await loadShell('de')

    expect(useAtriumI18n().locale.value).toBe('en')
  })
})
