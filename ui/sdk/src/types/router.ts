import type { AtriumIntegrationUnavailableReason } from './atrium'

/** What a page declares about itself to Atrium, in its route's `meta.atrium`. */
export interface AtriumPageMeta {
  /**
   * A page anyone may open, signed in or not (D-038): it renders in the
   * public layout, loads no shell, and a 401 from an integration client on
   * it never calls the auth adapter's `onUnauthorized()`.
   */
  public?: boolean
}

/** Set by the app's integration guard on a `/{pkg}/…` route whose integration is not active. */
export interface AtriumUnavailableMeta {
  integration: string
  reason: AtriumIntegrationUnavailableReason
}

declare module 'vue-router' {
  interface RouteMeta {
    atrium?: AtriumPageMeta
    atriumUnavailable?: AtriumUnavailableMeta
  }
}
