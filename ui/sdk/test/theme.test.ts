import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAtriumShellStore, useAtriumTheme } from '#imports'
import { shell, withSetup } from './support'

describe('useAtriumTheme()', () => {
  beforeEach(async () => {
    localStorage.clear()
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = shell()
  })

  it('applies the default theme from the shell', async () => {
    const theme = await withSetup(() => useAtriumTheme())
    await nextTick()

    expect(theme.current.value?.key).toBe('atrium')
    expect(theme.switchable.value).toBe(true)
    expect(document.documentElement.dataset.atriumTheme).toBe('atrium')
  })

  it('switches theme: sets the chosen theme tokens on :root and remembers the choice', async () => {
    const theme = await withSetup(() => useAtriumTheme())

    theme.choose('harbor')
    await nextTick()

    const root = document.documentElement

    expect(root.dataset.atriumTheme).toBe('harbor')
    expect(root.style.getPropertyValue('--color-primary')).toBe('#0d9488')
    expect(root.style.getPropertyValue('--atrium-token-primary')).toBe('#0d9488')
    expect(root.style.getPropertyValue('--atrium-token-radius')).toBe('0.75rem')
    expect(localStorage.getItem('atrium-theme')).toContain('harbor')

    theme.choose('sunset')
    await nextTick()

    expect(root.dataset.atriumTheme).toBe('sunset')
    expect(root.style.getPropertyValue('--color-primary')).toBe('#ea580c')
    expect(root.style.getPropertyValue('--color-info')).toBe('')
    expect(root.style.getPropertyValue('--atrium-token-info')).toBe('')
  })

  it('falls back to the default theme for an unknown choice', async () => {
    localStorage.setItem('atrium-theme', 'retired')

    const theme = await withSetup(() => useAtriumTheme())
    await nextTick()

    expect(theme.current.value?.key).toBe('atrium')
  })
})
