import { defineComponent, h, type Component } from 'vue'
import { UApp } from '../ui'
import type { AtriumShell } from '../types/atrium'
import shellFixture from '../../test/fixtures/shell.json'

/** A fresh copy of the shell fixture (the PHP suite writes it), changed by `overrides`. */
export function shell(overrides: Partial<AtriumShell> = {}): AtriumShell {
  return { ...structuredClone(shellFixture.data), ...overrides } as AtriumShell
}

/**
 * `component` inside <UApp>, as the app mounts pages, for components that
 * need its providers (tooltips, toasts). Attributes, `setProps()` included,
 * go to the component.
 */
export function inApp(component: Component): Component {
  return defineComponent({
    inheritAttrs: false,
    setup: (_, { attrs }) => () => h(UApp, null, { default: () => h(component, attrs) })
  })
}

/** An error shaped as ofetch throws it for an HTTP status. */
export function httpError(status: number): Error & { status: number, statusCode: number } {
  return Object.assign(new Error(`HTTP ${status}`), { status, statusCode: status })
}
