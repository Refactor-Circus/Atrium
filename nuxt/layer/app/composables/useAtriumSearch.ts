import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import type { AtriumSearchResult } from '../types/atrium'

/**
 * Global search (⌘K) over every search source, through `atrium.search`.
 *
 * A term shorter than the shell's `search.min_length` is not sent (the API
 * would answer 422). Results are grouped by their `group`, in the order the
 * API returns them, and each `link` becomes a route inside the SPA or an
 * external link opening in a new tab with `rel="noopener noreferrer"`; a link
 * the layer refuses (atriumLink) leaves the result unlinked.
 */
export function useAtriumSearch(onSelect?: () => void) {
  const api = useAtriumApi()
  const store = useAtriumShellStore()
  const { t } = useI18n()
  const { resolve } = useAtriumIcon()

  const results = ref<AtriumSearchResult[]>([])
  const loading = ref(false)

  async function search(term: string): Promise<void> {
    const q = term.trim()

    if (q.length < (store.shell?.search.min_length ?? 2)) {
      results.value = []
      return
    }

    loading.value = true

    try {
      results.value = (await api<{ data: AtriumSearchResult[] }>('/search', { query: { q } })).data
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
