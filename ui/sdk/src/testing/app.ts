import { createHead } from '@unhead/vue/client'
import { flushPromises, mount, type ComponentMountingOptions, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { defineComponent, h, nextTick, reactive, Suspense, type App, type Component, type Plugin } from 'vue'
import { createRouter, createWebHistory, type RouteLocationRaw, type RouteRecordRaw, type Router } from 'vue-router'
// Resolved by Nuxt UI's Vite plugin, which the test config always loads.
import ui from '@nuxt/ui/vue-plugin'
import { setAtriumApp } from '../runtime/context'
import { atriumI18n } from '../runtime/i18n'
import { installAtriumIcons } from '../runtime/icons'

/*
 * One Atrium app per test file (Vitest isolates files, so every SDK
 * singleton starts fresh): its Pinia, router, i18n, head and Nuxt UI, which
 * every component a test mounts is given, as the page's app gives them.
 */

interface TestApp {
  pinia: Pinia
  router: Router
  plugins: Plugin[]
}

let app: TestApp | null = null

const Empty = defineComponent({ name: 'AtriumTestRoute', render: () => null })

/** The test file's app, made on first use. */
export function atriumTestApp(): TestApp {
  if (app) {
    return app
  }

  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/:path(.*)*', name: 'atrium-test-any', component: Empty }]
  })

  installAtriumIcons()

  app = { pinia, router, plugins: [pinia, router, atriumI18n(), createHead(), ui] }

  return app
}

/** The test app's router (`useRouter()` from Nuxt's test utils, outside a component). */
export function useRouter(): Router {
  return atriumTestApp().router
}

/** Adds a module's routes to the test router, so named routes resolve. */
export function addTestRoutes(routes: readonly RouteRecordRaw[]): void {
  const router = atriumTestApp().router

  for (const route of routes) {
    if (!route.name || !router.hasRoute(route.name)) {
      router.addRoute(route)
    }
  }
}

export interface MountSuspendedOptions<T> extends ComponentMountingOptions<T> {
  /** The route to be on while the component mounts */
  route?: RouteLocationRaw
}

/**
 * Mounts `component` inside <Suspense> in the test app, after going to
 * `route`, and resolves once its (async) setup has settled, as Nuxt's
 * `mountSuspended()` did. The wrapper is the component's: `setProps()` and
 * `unmount()` reach the root.
 */
export async function mountSuspended<T>(component: T, options: MountSuspendedOptions<T> = {}): Promise<VueWrapper> {
  const { route, props, slots, attrs, global, ...rest } = options as MountSuspendedOptions<T> & { props?: Record<string, unknown>, attrs?: Record<string, unknown>, slots?: Record<string, unknown> }
  const test = atriumTestApp()

  if (route !== undefined) {
    await test.router.push(route)
  }

  await test.router.isReady()

  const state = reactive<Record<string, unknown>>({ ...(attrs ?? {}), ...(props ?? {}) })

  const Root = defineComponent({
    name: 'AtriumTestRoot',
    setup() {
      return () => h(Suspense, null, { default: () => h(component as Component, { ...state }, slots as never) })
    }
  })

  let mounted: App | null = null

  const root = mount(Root, {
    ...rest,
    attachTo: rest.attachTo,
    global: {
      ...global,
      plugins: [
        ...test.plugins,
        { install: (vueApp: App) => { mounted = vueApp; setAtriumApp(vueApp, test.router) } },
        ...(global?.plugins ?? [])
      ]
    }
  } as never)

  await flushPromises()
  await nextTick()
  await flushPromises()

  void mounted

  const inner = root.findComponent(component as Component) as VueWrapper

  if (!inner.exists()) {
    return root as unknown as VueWrapper
  }

  return Object.assign(inner, {
    setProps: async (next: Record<string, unknown>) => {
      Object.assign(state, next)
      await nextTick()
    },
    unmount: () => root.unmount()
  }) as VueWrapper
}

/**
 * Runs `setup` inside a mounted component, so composables that need the
 * app, the router or a component scope (watchers) work as they do in a page.
 */
export async function withSetup<T>(setup: () => T): Promise<T> {
  let result: T | undefined

  await mountSuspended(defineComponent({
    setup() {
      result = setup()

      return () => h('div')
    }
  }))

  return result as T
}

/** Lets pending promises and Vue's scheduler settle. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}
