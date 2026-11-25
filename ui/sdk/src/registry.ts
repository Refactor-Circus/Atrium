import type { Component } from 'vue'
import { markRaw, shallowReactive } from 'vue'
import type { AtriumAuthAdapter, AtriumLiveResolver, AtriumNotice, AtriumResponseHandler, AtriumSearchSourceResolver } from './types/atrium'
import { runInAtrium } from './runtime/context'

/**
 * The registry modules plug into, as their PHP side plugs into Atrium. A
 * module declares most of it with `defineAtriumModule()`; its `setup()` (or
 * any script) may also call the registry directly:
 *
 *   defineAtriumModule({ key: 'billing', setup() {
 *     const atrium = useAtrium()
 *     atrium.auth({ headers: () => ({ Authorization: `Bearer ${token()}` }) })
 *     atrium.widget('demo.revenue', RevenueWidget)
 *     atrium.extension('billing.invoices', InvoicesTab)
 *     atrium.settingsPanel('demo', ShopSettings)
 *     atrium.searchSource('impex', q => searchRuns(q))
 *     atrium.live('impex.active-runs', async () => ({ badge: await activeRuns() }))
 *     atrium.responseHandler('billing.trial', response => { … })
 *   } })
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
  readonly responseHandlers = new Map<string, AtriumResponseHandler>()
  /** The app-wide notices showing now, by key; <AtriumResponseNotice> renders them. */
  readonly notices = shallowReactive(new Map<string, AtriumNotice>())
  private readonly dismissed = new Map<string, string | undefined>()

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
   * lists it. It runs inside the app's context, so it may call
   * `useAtriumIntegration()` before its first `await`.
   */
  searchSource(key: string, resolver: AtriumSearchSourceResolver): this {
    this.searchSources.set(key, resolver)
    return this
  }

  /**
   * The badge or children of the nav items whose `live.key` is `key`,
   * computed from a package API. Like a search source, it runs inside the
   * app's context.
   */
  live(key: string, resolver: AtriumLiveResolver): this {
    this.liveResolvers.set(key, resolver)
    return this
  }

  /**
   * Run `handler` on every response of every Atrium client, in registration
   * order, before the caller sees it (D-049): the integration clients,
   * `useAtriumClient()` and `useAtriumApi()`. Registered at plugin time, it
   * runs even when the shell request itself fails. It runs inside the app's
   * context until its first `await`.
   */
  responseHandler(key: string, handler: AtriumResponseHandler): this {
    this.responseHandlers.set(key, handler)
    return this
  }

  /**
   * Hands `response` to every response handler, in registration order, each
   * with its own copy. A handler that throws is logged and skipped.
   */
  async handleResponse(response: Response, request: Request): Promise<void> {
    for (const [key, handler] of this.responseHandlers) {
      try {
        await handler(response.bodyUsed ? response : response.clone(), request)
      } catch (error) {
        console.error(`[atrium] The response handler "${key}" failed; it was skipped.`, error)
      }
    }
  }

  /** Show an app-wide notice under `key`, unless the user dismissed this one. */
  notify(key: string, notice: AtriumNotice): this {
    if (this.dismissed.has(key) && this.dismissed.get(key) === notice.id) {
      return this
    }

    this.notices.set(key, notice)
    return this
  }

  /** Hide the notice under `key`, and keep it hidden until its `id` changes. */
  dismiss(key: string): this {
    this.dismissed.set(key, this.notices.get(key)?.id)
    this.notices.delete(key)
    return this
  }
}

/** The page's one registry: every module and the app register into it. */
let registry = new AtriumRegistry()

/** The registry packages and the app register into. */
export function useAtrium(): AtriumRegistry {
  return registry
}

/** A fresh registry, for tests. */
export function resetAtrium(): AtriumRegistry {
  registry = new AtriumRegistry()

  return registry
}

/**
 * Runs the app's response handlers for one response, inside the app's
 * context, as every Atrium client does before its caller sees the answer.
 */
export async function runResponseHandlers(response: Response, request: Request): Promise<void> {
  const atrium = useAtrium()

  if (atrium.responseHandlers.size === 0) {
    return
  }

  await runInAtrium(() => atrium.handleResponse(response, request))
}
