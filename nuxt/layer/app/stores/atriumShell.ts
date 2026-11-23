import { defineStore } from 'pinia'
import type { AtriumShell, AtriumShellResponse } from '../types/atrium'

/**
 * The shell (GET /shell): app, user, navigation, themes, settings, search,
 * and the app's locale, which the layer switches to when it has messages for
 * it (its own `en`, or a locale the host added).
 */
export const useAtriumShellStore = defineStore('atrium-shell', () => {
  const nuxtApp = useNuxtApp()
  const shell = ref<AtriumShell | null>(null)
  const error = ref<unknown>(null)
  const loading = ref(false)

  async function load(force = false): Promise<void> {
    if (shell.value && !force) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await nuxtApp.runWithContext(() => useAtriumApi()<AtriumShellResponse>('/shell'))
      shell.value = response.data
      await applyLocale(response.data.locale)
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  async function applyLocale(locale: string | undefined): Promise<void> {
    const i18n = nuxtApp.$i18n
    const codes = i18n.localeCodes.value as string[]

    if (!locale || i18n.locale.value === locale || !codes.includes(locale)) {
      return
    }

    await i18n.setLocale(locale as typeof i18n.locale.value)
  }

  return { shell, error, loading, load }
})
