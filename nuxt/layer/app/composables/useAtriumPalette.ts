import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import { useLocalStorage } from '@vueuse/core'
import type { Ref } from 'vue'

/**
 * The ⌘K palette's groups (D-077): the pages visited lately (while no term
 * is typed), every page in the navigation with its section (the palette
 * filters them as you type), the search results (`results`, from
 * useAtriumSearch) and the shell actions (colour mode, each theme).
 * `close` runs when an item is chosen.
 *
 * Recent pages are remembered per browser (`atrium-recent`): only pages the
 * navigation lists, the latest first, at most six.
 */
export function useAtriumPalette(term: Ref<string>, results: Ref<CommandPaletteGroup<CommandPaletteItem>[]>, close: () => void) {
  const { t } = useI18n()
  const route = useRoute()
  const colorMode = useColorMode()
  const theme = useAtriumTheme()
  const nav = useAtriumNavigation()
  const recent = useLocalStorage<string[]>('atrium-recent', [])

  /** Every page the navigation links to, with its section, children included. */
  const pages = computed(() => nav.groups.value.flatMap(group => nav.flatten(group.items)
    .filter(entry => entry.link)
    .map(entry => ({ entry, group }))))

  watch(() => route.path, (path) => {
    if (pages.value.some(({ entry }) => entry.path === path)) {
      recent.value = [path, ...recent.value.filter(p => p !== path)].slice(0, 6)
    }
  }, { immediate: true })

  const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => {
    const jump = pages.value.map(({ entry, group }) => ({
      label: entry.label,
      suffix: group.label,
      icon: entry.icon ?? group.icon,
      ...entry.link!,
      onSelect: close
    }))

    const visited = recent.value
      .filter(path => path !== route.path)
      .map(path => pages.value.find(({ entry }) => entry.path === path))
      .filter(found => found !== undefined)
      .map(({ entry, group }) => ({ label: entry.label, suffix: group.label, icon: 'i-lucide-history', ...entry.link!, onSelect: close }))

    const actions: CommandPaletteItem[] = [
      {
        label: colorMode.value === 'dark' ? t('atrium.shell.light_mode') : t('atrium.shell.dark_mode'),
        icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
        onSelect: () => { colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark' }
      },
      ...(theme.switchable.value
        ? theme.themes.value.map(item => ({
            label: t('atrium.shell.use_theme', { name: item.label }),
            icon: 'i-lucide-palette',
            suffix: item.key === theme.current.value?.key ? t('atrium.shell.current') : undefined,
            onSelect: () => theme.choose(item.key)
          }))
        : [])
    ]

    return [
      ...(visited.length && !term.value ? [{ id: 'atrium-recent', label: t('atrium.search.recent'), items: visited }] : []),
      { id: 'atrium-pages', label: t('atrium.search.pages'), items: jump },
      ...results.value,
      { id: 'atrium-actions', label: t('atrium.search.actions'), items: actions }
    ]
  })

  return { groups, recent }
}
