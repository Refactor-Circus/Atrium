import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import type { AtriumSearchResult } from '../types/atrium'

/**
 * Global search (⌘K) over Atrium's search sources, through `atrium.search`,
 * and, in parallel, over every client-side source the shell lists
 * (`search.sources`) whose resolver is registered with
 * `$atrium.searchSource()` and whose integration is active (D-030).
 *
 * A term shorter than the shell's `search.min_length` is not sent (the API
 * would answer 422). A source that fails (it rejects, or its API answered
 * 401, 403 or 5xx) is dropped from that search without failing the others,
 * and each source adds at most `search.per_source` results. Results are
 * grouped by their `group` (a source's results default to its label), in
 * the order they arrive: Atrium's first, then each source in the shell's
 * order. Each `link` becomes a route inside the SPA or an external link
 * opening in a new tab with `rel="noopener noreferrer"`; a link the layer
 * refuses (atriumLink) leaves the result unlinked.
 */
export function useAtriumSearch(onSelect?: () => void) {
  const api = useAtriumApi()
  const atrium = useAtrium()
  const nuxtApp = useNuxtApp()
  const store = useAtriumShellStore()
  const { t } = useI18n()
  const { resolve } = useAtriumIcon()

  const results = ref<AtriumSearchResult[]>([])
  const loading = ref(false)

  async function fromAtrium(q: string): Promise<AtriumSearchResult[]> {
    return (await api<{ data: AtriumSearchResult[] }>('/search', { query: { q } })).data
  }

  function fromSources(q: string): Promise<AtriumSearchResult[]>[] {
    const search = store.shell?.search
    const limit = search?.per_source ?? 5

    return (search?.sources ?? []).flatMap((source) => {
      const resolver = atrium.searchSources.get(source.key)

      if (!resolver || !store.isActive(source.integration)) {
        return []
      }

      return [(async () => {
        const found = await nuxtApp.runWithContext(() => resolver(q, { limit }))

        return (Array.isArray(found) ? found : [])
          .slice(0, limit)
          .map(result => ({ ...result, group: result.group ?? source.label }))
      })()]
    })
  }

  async function search(term: string): Promise<void> {
    const q = term.trim()

    if (q.length < (store.shell?.search.min_length ?? 2)) {
      results.value = []
      return
    }

    loading.value = true

    try {
      const settled = await Promise.allSettled([fromAtrium(q), ...fromSources(q)])

      results.value = settled.flatMap(outcome => outcome.status === 'fulfilled' ? outcome.value : [])
    } finally {
      loading.value = false
    }
  }

  const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => {
    const byGroup = new Map<string, AtriumSearchResult[]>()

    for (const result of results.value) {
      const label = result.group ?? t('atrium.search.results')
      byGroup.set(label, [...(byGroup.get(label) ?? []), result])
    }

    return [...byGroup.entries()].map(([label, items]) => ({
      id: label,
      label,
      ignoreFilter: true,
      items: items.map(result => ({
        label: result.title,
        ...(result.subtitle ? { suffix: result.subtitle } : {}),
        ...(resolve(result.icon) ? { icon: resolve(result.icon) } : {}),
        ...atriumLink(result.link),
        onSelect: () => onSelect?.()
      }))
    }))
  })

  return { results, loading, groups, search }
}
