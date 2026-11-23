import type { AtriumRegistry } from '../plugins/atrium'

/** The registry packages and the app register into (plugins/atrium.ts). */
export function useAtrium(): AtriumRegistry {
  return useNuxtApp().$atrium as AtriumRegistry
}
