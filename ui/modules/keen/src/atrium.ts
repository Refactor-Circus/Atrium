// Not ported (D-032): nothing. Every action of Keen's v1 screens has a v2
// route: browsing and filtering the log (`keen.entries.index`), one entry
// (`keen.entries.show`), recording an event (`keen.entries.store`) and each
// package's history (`keen.entries.index` by `source`, with the packages
// from `keen.packages.index`).
import { keenHistory } from './components/history'
import './atrium.css'
import { defineAtriumModule, mergeAtriumMessages } from '@refactor-circus/atrium'
import KeenActivityTab from './components/hooks/KeenActivityTab.vue'
import KeenHistorySection from './components/hooks/KeenHistorySection.vue'
import hooks_en from './locales/hooks.en.json'
import keen_en from './locales/keen.en.json'
import { routes } from './routes'

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

/**
 * Keen's Atrium module (D-082): everything above, registered while the
 * keen integration is active.
 */
export default defineAtriumModule({
  key: 'keen',
  routes,
  screens,
  extensions: {
    'keen.history': KeenHistorySection,
    'keen.activity': KeenActivityTab
  },
  liveResolvers: {
    'keen.history': keenHistory
  },
  messages: { en: mergeAtriumMessages(hooks_en, keen_en) }
})
