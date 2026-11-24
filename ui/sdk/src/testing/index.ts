/*
 * @refactor-circus/atrium/testing: what Atrium's suites and every module's
 * Vitest suite mount with (the module preset loads `./setup.ts` first).
 */
import type { RouteLocationRaw } from 'vue-router'
import { replaceAtriumApi } from '../composables/useAtriumApi'
import { useAtrium } from '../registry'
import { clearAsyncData } from '../runtime/asyncData'
import { replaceNavigateTo, runInAtrium } from '../runtime/context'
import { addAtriumMessages } from '../runtime/i18n'
import type { AtriumModuleDefinition } from '../runtime/module'
import { addTestRoutes } from './app'

export * from './app'
export * from './shell'
export * from './packages'
export * from './i18n'
export { setAtriumBoot } from '../runtime/boot'
export { runInAtrium }

/** Answers every `useAtriumApi()` call with `fetch` (a `vi.fn()`), Nuxt's `mockNuxtImport('useAtriumApi', …)`. */
export function mockAtriumApi(fetch: (...args: never[]) => unknown): void {
  replaceAtriumApi(fetch)
}

/** Sends every `navigateTo()` to `fn` (a `vi.fn()`). */
export function mockNavigateTo(fn: (to: RouteLocationRaw, options?: unknown) => unknown): void {
  replaceNavigateTo(fn as (...args: never[]) => unknown)
}

/** Forgets every `useAsyncData()` answer, Nuxt's `clearNuxtData()`. */
export function clearAtriumData(): void {
  clearAsyncData()
}

/**
 * Registers a module as the page would, for its suite: its messages, routes,
 * components, resolvers and handlers. Its `setup()` is not run, and nothing
 * is gated by its integration.
 */
export function useTestModule(definition: AtriumModuleDefinition): AtriumModuleDefinition {
  const atrium = useAtrium()

  if (definition.messages) {
    addAtriumMessages(definition.messages)
  }

  addTestRoutes(definition.routes ?? [])

  for (const [key, component] of Object.entries(definition.widgets ?? {})) {
    atrium.widget(key, component)
  }

  for (const [key, component] of Object.entries(definition.extensions ?? {})) {
    atrium.extension(key, component)
  }

  for (const [key, component] of Object.entries(definition.settingsPanels ?? {})) {
    atrium.settingsPanel(key, component)
  }

  for (const [key, resolver] of Object.entries(definition.liveResolvers ?? {})) {
    atrium.live(key, resolver)
  }

  for (const [key, resolver] of Object.entries(definition.searchSources ?? {})) {
    atrium.searchSource(key, resolver)
  }

  for (const [key, handler] of Object.entries(definition.responseHandlers ?? {})) {
    atrium.responseHandler(key, handler)
  }

  return definition
}
