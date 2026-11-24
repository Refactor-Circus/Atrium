import type { App, Component } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'
import { useAtrium, type AtriumRegistry } from '../registry'
import type { AtriumLiveResolver, AtriumResponseHandler, AtriumSearchSourceResolver } from '../types/atrium'
import { useAtriumBoot, type AtriumBoot } from './boot'
import { addAtriumMessages, type AtriumMessages } from './i18n'

/** What a module's `setup()` gets. */
export interface AtriumModuleContext {
  app: App
  router: Router
  atrium: AtriumRegistry
  boot: AtriumBoot
}

/**
 * An Atrium module: a package's (or the app's) front end, built with
 * `@refactor-circus/atrium/vite` and loaded by the Blade page (D-082).
 *
 *   export default defineAtriumModule({
 *     key: 'polycart',
 *     routes: [{ path: '/polycart/carts', name: 'polycart-carts', component: () => import('./pages/carts/index.vue') }],
 *     widgets: { 'polycart.open-carts': OpenCarts },
 *     extensions: { 'polycart.customer-carts': CustomerCarts },
 *     settingsPanels: { polycart: PolycartSettings },
 *     liveResolvers: { 'polycart.open-carts': openCarts },
 *     searchSources: { polycart: searchCarts },
 *     responseHandlers: {},
 *     messages: { en: { polycart: { … } } },
 *     setup({ app, router, atrium }) {}
 *   })
 *
 * Keys follow the PHP declarations: widget, extension and panel keys are the
 * `component` the API sends; live and search keys are those the shell lists.
 */
export interface AtriumModuleDefinition {
  /** The module's key: its integration's key (`polycart`), a plugin's key, or the app's own */
  key: string
  /**
   * The integration that gates it: the module registers only while that
   * integration is active for the user. Defaults to `key` when the page lists
   * an integration by that key; `null` never gates.
   */
  integration?: string | null
  /** Its pages, added to the router before the first navigation */
  routes?: RouteRecordRaw[]
  widgets?: Record<string, Component>
  extensions?: Record<string, Component>
  settingsPanels?: Record<string, Component>
  liveResolvers?: Record<string, AtriumLiveResolver>
  searchSources?: Record<string, AtriumSearchSourceResolver>
  responseHandlers?: Record<string, AtriumResponseHandler>
  /** Each screen key it renders (the PHP `ScreenDeclaration`), to the route name that renders it */
  screens?: Record<string, string>
  /** Its strings, by locale, merged into the app's */
  messages?: AtriumMessages
  /** Anything else, run once after the registrations above */
  setup?: (context: AtriumModuleContext) => void | Promise<void>
}

const pending: AtriumModuleDefinition[] = []
const installed = new Map<string, AtriumModuleDefinition>()

/**
 * Declares a module. Importing the module's entry registers it (the Blade
 * page loads it as a `<script type="module">` before the app boots); the
 * definition is returned so the entry can also export it.
 */
export function defineAtriumModule(definition: AtriumModuleDefinition): AtriumModuleDefinition {
  pending.push(definition)

  return definition
}

/** Modules declared and not installed yet (and the `window.Atrium` queue). */
export function pendingAtriumModules(): AtriumModuleDefinition[] {
  const queued = typeof window === 'undefined' ? [] : (window.Atrium?.queue ?? []).splice(0)

  return [...pending.splice(0), ...queued]
}

/** The modules that registered, by key. */
export function installedAtriumModules(): ReadonlyMap<string, AtriumModuleDefinition> {
  return installed
}

/** Whether `definition` may register for this user: its integration, if any, is active. */
export function atriumModuleActive(definition: AtriumModuleDefinition, boot: AtriumBoot = useAtriumBoot()): boolean {
  const gate = definition.integration === undefined
    ? (definition.key in boot.integrations ? definition.key : null)
    : definition.integration

  return gate === null || boot.integrations[gate]?.active === true
}

/**
 * Registers every declared module, in declaration order: its messages,
 * components, resolvers and handlers into the registry, its routes into the
 * router, then its `setup()`. A module whose integration is not active is
 * skipped; one that throws is reported and skipped, and the rest still
 * register. Returns the keys that registered.
 */
export async function installAtriumModules(app: App, router: Router, definitions: AtriumModuleDefinition[] = pendingAtriumModules()): Promise<string[]> {
  const boot = useAtriumBoot()
  const atrium = useAtrium()
  const keys: string[] = []

  for (const definition of definitions) {
    if (!atriumModuleActive(definition, boot)) {
      continue
    }

    try {
      if (definition.messages) {
        addAtriumMessages(definition.messages)
      }

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

      for (const route of definition.routes ?? []) {
        router.addRoute(route)
      }

      await app.runWithContext(() => definition.setup?.({ app, router, atrium, boot }))

      installed.set(definition.key, definition)
      keys.push(definition.key)
    } catch (error) {
      console.error(`[atrium] The module "${definition.key}" failed to register; it was skipped.`, error)
    }
  }

  return keys
}

/** What a classic script (no bundler) calls: `window.Atrium.register({ key, … })`. */
export interface AtriumGlobal {
  queue: AtriumModuleDefinition[]
  register: (definition: AtriumModuleDefinition) => void
}

declare global {
  interface Window {
    Atrium?: AtriumGlobal
  }
}
