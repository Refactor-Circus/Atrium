import { defineComponent, h, type Component } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { AtriumShell } from '../app/types/atrium'
import shellFixture from './fixtures/shell.json'
import { UApp } from '#components'

/**
 * Runs `setup` inside a mounted component, so composables that need the Nuxt
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

/**
 * `component` inside <UApp>, as app.vue mounts pages, for components that
 * need its providers (tooltips). Attributes, `setProps()` included, go to
 * the component.
 */
export function inApp(component: Component): Component {
  return defineComponent({
    inheritAttrs: false,
    setup: (_, { attrs }) => () => h(UApp, null, { default: () => h(component, attrs) })
  })
}

/** A fresh copy of the shell fixture, changed by `overrides`. */
export function shell(overrides: Partial<AtriumShell> = {}): AtriumShell {
  return { ...structuredClone(shellFixture.data), ...overrides } as AtriumShell
}

/** Lets pending promises and Vue's scheduler settle. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

/** An error shaped as ofetch throws it for an HTTP status. */
export function httpError(status: number): Error & { status: number, statusCode: number } {
  return Object.assign(new Error(`HTTP ${status}`), { status, statusCode: status })
}
