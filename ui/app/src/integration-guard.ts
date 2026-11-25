import { useAtriumBoot, useAtriumShellStore } from '@refactor-circus/atrium'
import type { RouteLocationNormalized } from 'vue-router'

/**
 * Guards every integration page (D-023): a path under `/{pkg}/`, for an
 * integration Atrium knows, renders only while the shell lists it as
 * active. Otherwise the route is marked, and the default layout renders
 * <AtriumIntegrationUnavailable> without setting the page up, so the
 * package's API is never called. (An inactive integration's module does not
 * register at all, so most such paths reach the not-found page, which the
 * layout replaces the same way.)
 *
 * A public page skips all of it: it takes the public layout, and the shell
 * is not loaded for it.
 */
export async function integrationGuard(to: RouteLocationNormalized): Promise<void> {
  to.meta.atriumUnavailable = undefined

  if (to.meta.atrium?.public === true) {
    return
  }

  const key = to.path.split('/')[1] ?? ''
  const boot = useAtriumBoot()

  if (key === '' || !(key in boot.integrations || boot.known_integrations.includes(key))) {
    return
  }

  const store = useAtriumShellStore()

  await store.load()

  const integration = store.integration(key)

  if (integration?.active) {
    return
  }

  to.meta.atriumUnavailable = { integration: key, reason: integration ? 'inactive' : 'absent' }
}
