import type { AtriumIntegrationUnavailableReason } from '../types/atrium'

/** What a page declares about itself to Atrium, with `definePageMeta({ atrium: { … } })`. */
export interface AtriumPageMeta {
  /**
   * A page anyone may open, signed in or not (D-038): it renders in the
   * public layout, loads no shell, and a 401 from an integration client on
   * it never calls the auth adapter's `onUnauthorized()`.
   */
  public?: boolean
}

/** Set by this middleware on a `/{pkg}/…` route whose integration is not active. */
export interface AtriumUnavailableMeta {
  integration: string
  reason: AtriumIntegrationUnavailableReason
}

declare module '#app' {
  interface PageMeta {
    atrium?: AtriumPageMeta
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    atrium?: AtriumPageMeta
    atriumUnavailable?: AtriumUnavailableMeta
  }
}

/**
 * Guards every integration page (D-023). A path under `/{pkg}/`, for one of
 * the integrations the layer ships, renders only while the shell lists that
 * integration as active. Otherwise the route is marked, and the default
 * layout renders <AtriumIntegrationUnavailable> without setting the page up,
 * so the package's API is never called.
 *
 * A public page skips all of it: it takes the public layout, and the shell is
 * not loaded for it.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  to.meta.atriumUnavailable = undefined

  if (to.meta.atrium?.public === true) {
    to.meta.layout = 'public'
    return
  }

  const key = to.path.split('/')[1] ?? ''

  if (!isAtriumIntegrationKey(key)) {
    return
  }

  const store = useAtriumShellStore()

  await store.load()

  const integration = store.integration(key)

  if (integration?.active) {
    return
  }

  to.meta.atriumUnavailable = { integration: key, reason: integration ? 'inactive' : 'absent' }
})
