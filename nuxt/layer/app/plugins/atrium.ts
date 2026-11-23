import type { Component } from 'vue'
import { markRaw } from 'vue'
import type { AtriumAuthAdapter } from '../types/atrium'

/**
 * The registry packages plug into, as their PHP side plugs into Atrium:
 *
 *   export default defineNuxtPlugin(() => {
 *     const atrium = useAtrium()
 *     atrium.auth({ headers: () => ({ Authorization: `Bearer ${token()}` }) })
 *     atrium.widget('demo.revenue', RevenueWidget)
 *     atrium.extension('billing.invoices', InvoicesTab)
 *     atrium.settingsPanel('demo', ShopSettings)
 *   })
 *
 * Keys are the `component` the API sends: the widget, extension or panel key
 * unless its PHP definition names another with `->component()`. A key with
 * no component registered renders <AtriumUnregistered>.
 */
export class AtriumRegistry {
  private authAdapter: AtriumAuthAdapter = {}
  readonly widgets = new Map<string, Component>()
  readonly extensions = new Map<string, Component>()
  readonly panels = new Map<string, Component>()

  /** Set the auth adapter, or read it back. */
  auth(adapter?: AtriumAuthAdapter): AtriumAuthAdapter {
    if (adapter) {
      this.authAdapter = adapter
    }

    return this.authAdapter
  }

  widget(key: string, component: Component): this {
    this.widgets.set(key, markRaw(component))
    return this
  }

  extension(key: string, component: Component): this {
    this.extensions.set(key, markRaw(component))
    return this
  }

  settingsPanel(key: string, component: Component): this {
    this.panels.set(key, markRaw(component))
    return this
  }
}

export default defineNuxtPlugin({
  name: 'atrium',
  enforce: 'pre',
  setup() {
    return { provide: { atrium: new AtriumRegistry() } }
  }
})
