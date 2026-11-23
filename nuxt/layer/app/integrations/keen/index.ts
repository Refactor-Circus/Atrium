// Not ported (D-032): nothing. Every action of Keen's v1 screens has a v2
// route: browsing and filtering the log (`keen.entries.index`), one entry
// (`keen.entries.show`), recording an event (`keen.entries.store`) and each
// package's history (`keen.entries.index` by `source`, with the packages
// from `keen.packages.index`).
import { defineAtriumIntegration } from '../../composables/useAtriumIntegration'
import { keenHistory } from './components/history'

/**
 * Keen, the suite's audit log (AC 57, 64): its three screens, at the layer
 * routes below, and the `keen.history` live resolver, which lists each
 * audited package under the History nav item.
 */
export const screens: Record<string, string> = {
  'keen.entries': 'keen-entries',
  'keen.entry': 'keen-entries-entry',
  'keen.history': 'keen-history-package'
}

export default defineAtriumIntegration((atrium) => {
  atrium.live('keen.history', keenHistory)
})
