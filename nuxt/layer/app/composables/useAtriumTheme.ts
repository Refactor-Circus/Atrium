import { useLocalStorage } from '@vueuse/core'
import type { AtriumTheme } from '../types/atrium'

/**
 * The chosen theme: remembered per browser and applied by setting its tokens
 * on :root. The shell lists the themes and the default; a stored choice the
 * shell no longer offers falls back to the default.
 */
export function useAtriumTheme() {
  const store = useAtriumShellStore()
  const chosen = useLocalStorage<string | null>('atrium-theme', null)

  const themes = computed<AtriumTheme[]>(() => store.shell?.themes.all ?? [])
  const current = computed<AtriumTheme | null>(() =>
    themes.value.find(t => t.key === chosen.value)
    ?? themes.value.find(t => t.key === store.shell?.themes.default)
    ?? themes.value[0]
    ?? null
  )

  let applied: string[] = []

  watchEffect(() => {
    if (import.meta.server) {
      return
    }

    const root = document.documentElement
    const properties = current.value?.properties ?? {}

    for (const name of applied) {
      root.style.removeProperty(name)
    }

    for (const [name, value] of Object.entries(properties)) {
      root.style.setProperty(name, value)
    }

    applied = Object.keys(properties)
    root.dataset.atriumTheme = current.value?.key ?? ''
  })

  return {
    themes,
    current,
    switchable: computed(() => store.shell?.themes.switchable ?? false),
    choose: (key: string) => { chosen.value = key }
  }
}
