// Not ported (D-032):
// - Operator mode (`impex.atrium.show_all`): Impex's v2 API has no route for
//   it, so every list shows what the API returns for the signed-in user.
// - The channel form's list of installed transports: the v2 API lists none,
//   so the form offers http, mail and file.
// - Hiding nav items, widgets and the search source by permission (D-031):
//   a screen shows its no-access state on Impex's 403 instead.

import type { AtriumSearchResult } from '@refactor-circus/atrium'
import { integrationData, useAtriumIntegration } from '@refactor-circus/atrium'
import MessageVolumeWidget from './components/MessageVolumeWidget.vue'
import RecentFailuresWidget from './components/RecentFailuresWidget.vue'
import RunStatusWidget from './components/RunStatusWidget.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { runPath } from './components/shared'
import './atrium.css'
import { defineAtriumModule, mergeAtriumMessages } from '@refactor-circus/atrium'
import ImpexRunLink from './components/hooks/ImpexRunLink.vue'
import hooks_en from './locales/hooks.en.json'
import impex_en from './locales/impex.en.json'
import { routes } from './routes'

/**
 * Each Impex screen key (as `ImpexIntegration` declares it) to the layer
 * route that renders it.
 */
export const screens: Record<string, string> = {
  'impex.runs': 'impex-runs',
  'impex.run': 'impex-runs-run',
  'impex.flows': 'impex-flows',
  'impex.messages': 'impex-messages',
  'impex.message': 'impex-messages-message',
  'impex.channels': 'impex-channels',
  'impex.channel-create': 'impex-channels-create',
  'impex.channel': 'impex-channels-name',
  'impex.subscriptions': 'impex-subscriptions',
  'impex.subscription': 'impex-subscriptions-subscription'
}

/**
 * The `impex` ⌘K source: runs by flow or id from `impex.search.index`, at
 * most `limit` of them, each linking to its run.
 */
export async function searchRuns(q: string, options: { limit: number }): Promise<AtriumSearchResult[]> {
  const { client } = useAtriumIntegration('impex')

  if (!client) {
    return []
  }

  const runs = integrationData(await client.GET('/search', { params: { query: { q, limit: options.limit } } })).data

  return runs.slice(0, options.limit).map(run => ({
    title: run.flow,
    subtitle: run.status,
    icon: null,
    group: null,
    link: { path: runPath(run.id), external: false }
  }))
}

/**
 * The `impex.active-runs` live resolver: the Runs nav badge is the number of
 * active runs from `impex.stats.show`, or none when there are none or the
 * request fails.
 */
export async function activeRuns(): Promise<{ badge: number | null }> {
  const { client } = useAtriumIntegration('impex')

  if (!client) {
    return { badge: null }
  }

  try {
    const active = integrationData(await client.GET('/stats')).data.runs.active

    return { badge: active > 0 ? active : null }
  } catch {
    return { badge: null }
  }
}

/**
 * Impex's Atrium module (D-082): everything above, registered while the
 * impex integration is active.
 */
export default defineAtriumModule({
  key: 'impex',
  routes,
  screens,
  widgets: {
    'impex.run-status': RunStatusWidget,
    'impex.recent-failures': RecentFailuresWidget,
    'impex.message-volume': MessageVolumeWidget
  },
  extensions: {
    'impex.run-link': ImpexRunLink
  },
  settingsPanels: {
    'impex': SettingsPanel
  },
  liveResolvers: {
    'impex.active-runs': activeRuns
  },
  searchSources: {
    'impex': searchRuns
  },
  messages: { en: mergeAtriumMessages(hooks_en, impex_en) }
})
