// Not ported (D-032): v1 actions of the Cortex screens with no Cortex v2 API route.
// - Redirect domains: the source filter (`?source=global|owned`); `redirect-domains.index` takes only `owner_type`/`owner_id`.
// - Redirect domains: the read-only list of domains configured in `cortex.redirect_domains` (config); the API lists stored domains only.
// - Redirect domains: paging of the stored domains; `redirect-domains.index` answers every stored domain at once.
// - Redirect domains: the "redirect domains are turned off" warning; no route reports whether they are enabled.
import type { AtriumSearchResult } from '@refactor-circus/atrium'
import { integrationData, useAtriumIntegration } from '@refactor-circus/atrium'
import type { CortexAgentReference } from './components/cortex'
import CortexSettingsPanel from './components/CortexSettingsPanel.vue'
import './atrium.css'
import { defineAtriumModule, mergeAtriumMessages } from '@refactor-circus/atrium'
import CortexRedirectDomains from './components/hooks/CortexRedirectDomains.vue'
import cortex_en from './locales/cortex.en.json'
import hooks_en from './locales/hooks.en.json'
import { routes } from './routes'

/**
 * The Cortex integration (AC 55, 61, 62): the `cortex` settings panel, the
 * `cortex` search source and the eleven screens under `/cortex/…`. Every
 * action of the v1 screens has a v2 route except those listed above.
 */

/** Each Cortex screen key, to the name of the layer route that renders it. */
export const screens: Record<string, string> = {
  'cortex.virtual-agents': 'cortex-virtual-agents',
  'cortex.virtual-agent-create': 'cortex-virtual-agents-create',
  'cortex.virtual-agent': 'cortex-virtual-agents-slug',
  'cortex.concrete-agents': 'cortex-concrete-agents',
  'cortex.concrete-agent': 'cortex-concrete-agents-agent',
  'cortex.tools': 'cortex-tools',
  'cortex.tool-description': 'cortex-tools-tool-description',
  'cortex.servers': 'cortex-servers',
  'cortex.server-instructions': 'cortex-servers-server-instructions',
  'cortex.redirect-domains': 'cortex-redirect-domains',
  'cortex.run': 'cortex-run'
}

/** The layer path a search result of Cortex's `search` endpoint links to, by its `type`. */
export function cortexAgentPath(agent: CortexAgentReference): string {
  return agent.type === 'concrete_agent'
    ? `/cortex/concrete-agents/${encodeURIComponent(agent.key)}`
    : `/cortex/virtual-agents/${encodeURIComponent(agent.key)}`
}

/**
 * The `cortex` search source: virtual and concrete agents matching `q`,
 * from `cortex.search.index`, at most `limit` of them.
 */
export async function searchCortex(q: string, { limit }: { limit: number }): Promise<AtriumSearchResult[]> {
  const { client } = useAtriumIntegration('cortex')
  const { t } = useAtriumI18n()

  if (!client) {
    return []
  }

  const found = integrationData(await client.GET('/search', { params: { query: { q } } })).data

  return found.slice(0, limit).map(agent => ({
    title: agent.name,
    subtitle: agent.type === 'concrete_agent' ? t('cortex.search.concrete_agent') : t('cortex.search.virtual_agent'),
    icon: agent.type === 'concrete_agent' ? 'i-lucide-cpu' : 'i-lucide-sparkles',
    group: null,
    link: { path: cortexAgentPath(agent), external: false }
  }))
}

/**
 * Cortex's Atrium module (D-082): everything above, registered while the
 * cortex integration is active.
 */
export default defineAtriumModule({
  key: 'cortex',
  routes,
  screens,
  extensions: {
    'cortex.mcp': CortexRedirectDomains,
    'cortex.redirect-domains': CortexRedirectDomains
  },
  settingsPanels: {
    'cortex': CortexSettingsPanel
  },
  searchSources: {
    'cortex': searchCortex
  },
  messages: { en: mergeAtriumMessages(cortex_en, hooks_en) }
})
