import { useColorMode as useVueUseColorMode } from '@vueuse/core'

export interface AtriumColorMode {
  /** What the user chose: `light`, `dark` or `system` */
  preference: 'light' | 'dark' | 'system'
  /** What shows now: `light` or `dark` */
  readonly value: 'light' | 'dark'
}

/**
 * The colour mode, as Nuxt's `useColorMode()` reads (D-081): `dark` or
 * `light` on <html>, the choice kept in `localStorage['vueuse-color-scheme']`
 * (the key Nuxt UI's own colour-mode plugin uses, so both agree), following
 * the system until the user picks one. The Blade page applies the stored
 * mode before the first paint.
 */
export function useColorMode(): AtriumColorMode {
  const { store, system } = useVueUseColorMode()

  return {
    get preference() {
      return store.value === 'auto' ? 'system' : store.value as 'light' | 'dark'
    },
    set preference(value) {
      store.value = value === 'system' ? 'auto' : value
    },
    get value() {
      return (store.value === 'auto' ? system.value : store.value) as 'light' | 'dark'
    }
  }
}
