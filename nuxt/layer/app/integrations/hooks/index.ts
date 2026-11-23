// Not ported (D-032): nothing. The hooks call routes every package's v2 API
// has: Cortex's `redirect-domains` index, store and destroy, and Keen's
// `packages.index` and `entries.index`. The run link makes no request.
import { defineAtriumIntegration } from '../../composables/useAtriumIntegration'
import CortexRedirectDomains from './components/CortexRedirectDomains.vue'
import ImpexRunLink from './components/ImpexRunLink.vue'
import KeenActivityTab from './components/KeenActivityTab.vue'
import KeenHistorySection from './components/KeenHistorySection.vue'

/**
 * The cross-package hooks (AC 65 to 67): one integration's tab or section on
 * another's screens, registered by the extension keys Atrium's
 * `src/Integrations/Hooks` sends. Atrium sends each only while both its
 * integrations are registered and active, so the components assume their
 * package's client and render nothing without it. They declare no screens.
 */
export const screens: Record<string, string> = {}

export default defineAtriumIntegration((atrium) => {
  atrium
    .extension('cortex.mcp', CortexRedirectDomains)
    .extension('cortex.redirect-domains', CortexRedirectDomains)
    .extension('impex.run-link', ImpexRunLink)
    .extension('keen.history', KeenHistorySection)
    .extension('keen.activity', KeenActivityTab)
})
