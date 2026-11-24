import type { App } from 'vue'
import type { RouteLocationRaw, Router } from 'vue-router'

/*
 * The one Atrium app on the page. Atrium is a single app per document, so
 * its registry, router and i18n are module singletons of this SDK, which
 * every module shares through the import map: a module's search source or
 * live resolver reaches them without a component around it.
 */

let current: App | null = null
let currentRouter: Router | null = null

/** Called once by the app's boot, before modules are installed. */
export function setAtriumApp(app: App | null, router: Router | null = null): void {
  current = app
  currentRouter = router
}

/** The mounted Vue app, or null before boot (and in plain unit tests). */
export function atriumApp(): App | null {
  return current
}

/** The app's router. Throws before boot. */
export function atriumRouter(): Router {
  if (!currentRouter) {
    throw new Error('[atrium] The router is not ready: call this after Atrium has booted.')
  }

  return currentRouter
}

/** Whether the router is ready. */
export function hasAtriumRouter(): boolean {
  return currentRouter !== null
}

/**
 * Runs `fn` inside the app's injection context, so composables that
 * `inject()` (Pinia stores, Nuxt UI's `useToast()`) work in a resolver or a
 * response handler, outside any component.
 */
export function runInAtrium<T>(fn: () => T): T {
  return current ? current.runWithContext(fn) : fn()
}

type Navigator = (to: RouteLocationRaw, options: NavigateToOptions) => unknown

let navigator: Navigator | null = null

/** Sends every `navigateTo()` to `fn` instead (tests); null restores it. */
export function replaceNavigateTo(fn: ((...args: never[]) => unknown) | null): void {
  navigator = fn as Navigator | null
}

export interface NavigateToOptions {
  replace?: boolean
  /** Leave the SPA: a full page load of `to` (a URL or a path on this host) */
  external?: boolean
}

/**
 * Goes to `to` inside the SPA (paths are under the router's base, the
 * `client_path`), or with `{ external: true }` loads it as a page. The SDK's
 * stand-in for Nuxt's `navigateTo()`.
 */
export async function navigateTo(to: RouteLocationRaw, options: NavigateToOptions = {}): Promise<void> {
  if (navigator) {
    await navigator(to, options)
    return
  }

  if (options.external || (typeof to === 'string' && /^https?:\/\//i.test(to))) {
    const url = String(to)

    if (options.replace) {
      window.location.replace(url)
    } else {
      window.location.assign(url)
    }

    return
  }

  const router = atriumRouter()

  await (options.replace ? router.replace(to) : router.push(to))
}
