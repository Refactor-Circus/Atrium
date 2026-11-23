import type { Component } from 'vue'
import { markRaw } from 'vue'
import type { AtriumAuthAdapter, AtriumLiveResolver, AtriumSearchSourceResolver } from '../types/atrium'

/**
 * The registry packages plug into, as their PHP side plugs into Atrium:
 *
 *   export default defineNuxtPlugin(() => {
 *     const atrium = useAtrium()
 *     atrium.auth({ headers: () => ({ Authorization: `Bearer ${token()}` }) })
 *     atrium.widget('demo.revenue', RevenueWidget)
 *     atrium.extension('billing.invoices', InvoicesTab)
 *     atrium.settingsPanel('demo', ShopSettings)
 *     atrium.searchSource('impex', q => searchRuns(q))
 *     atrium.live('impex.active-runs', async () => ({ badge: await activeRuns() }))
 *   })
 *
 * Keys are the `component` the API sends: the widget, extension or panel key
 * unless its PHP definition names another with `->component()`. A key with
 * no component registered renders <AtriumUnregistered>. Search sources and
 * live resolvers are keyed as the shell lists them (`search.sources[].key`,
 * a nav item's `live.key`); one the shell does not list never runs.
 */
export class AtriumRegistry {
  private authAdapter: AtriumAuthAdapter = {}
  readonly widgets = new Map<string, Component>()
  readonly extensions = new Map<string, Component>()
  readonly panels = new Map<string, Component>()
  readonly searchSources = new Map<string, AtriumSearchSourceResolver>()
  readonly liveResolvers = new Map<string, AtriumLiveResolver>()

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

  /**
   * A client-side ⌘K source, run beside `atrium.search` while the shell
   * lists it. It runs inside the Nuxt app's context, so it may call
   * `useAtriumIntegration()` before its first `await`.
   */
  searchSource(key: string, resolver: AtriumSearchSourceResolver): this {
    this.searchSources.set(key, resolver)
    return this
  }

  /**
   * The badge or children of the nav items whose `live.key` is `key`,
   * computed from a package API. Like a search source, it runs inside the
   * Nuxt app's context.
   */
  live(key: string, resolver: AtriumLiveResolver): this {
    this.liveResolvers.set(key, resolver)
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
