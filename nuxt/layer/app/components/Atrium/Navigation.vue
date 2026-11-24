<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { AtriumLiveResult, AtriumNavItem, AtriumNavSection, AtriumShell } from '../../types/atrium'

/**
 * The shell's navigation sections. Each item's `link` becomes a route inside
 * the SPA, or an external link opening in a new tab with
 * `rel="noopener noreferrer"`; a link the layer refuses (atriumLink) renders
 * the item as a plain label.
 *
 * An item with a `live` key whose resolver is registered
 * (`$atrium.live(key, …)`) gets its badge or children from it, once per shell
 * load, while its integration (the key's first segment) is active. A
 * resolver that fails leaves the item as the API sent it.
 *
 * Loose sections (the app's own pages) come first, as one list. Each grouped
 * section (a package's, a nav group's) is its own list behind a separator:
 * one collapsible parent with the section's label and icon, open only while
 * the current route is inside it (see `openSections`), closed otherwise; a
 * nested item opens while it holds the route. Collapsed, the sidebar shows each loose item's
 * icon with a tooltip and each section's icon with its pages in a popover.
 * Closed sections stay in the DOM, hidden, so their links remain addressable.
 */
const props = defineProps<{ collapsed?: boolean }>()

const store = useAtriumShellStore()
const atrium = useAtrium()
const nuxtApp = useNuxtApp()
const { t } = useI18n()
const { resolve } = useAtriumIcon()
const route = useRoute()

const live = shallowRef(new Map<string, AtriumLiveResult>())

function liveItems(shell: AtriumShell | null): AtriumNavItem[] {
  const all: AtriumNavItem[] = []
  const walk = (items: AtriumNavItem[]) => items.forEach((nav) => {
    all.push(nav)
    walk(nav.children ?? [])
  })

  walk(shell?.navigation.flatMap(section => section.items) ?? [])

  return all.filter(nav => nav.live)
}

async function runLive(shell: AtriumShell | null): Promise<void> {
  live.value = new Map()

  const runs = liveItems(shell).map(async (nav) => {
    const { key, options } = nav.live!
    const resolver = atrium.liveResolvers.get(key)

    if (!resolver || !store.isActive(key.split('.')[0] ?? '')) {
      return
    }

    try {
      const result = await nuxtApp.runWithContext(() => resolver(options ?? {}))

      if (shell === store.shell) {
        live.value = new Map(live.value).set(key, result ?? {})
      }
    } catch {
      // Keep the item as the API sent it.
    }
  })

  await Promise.all(runs)
}

watch(() => store.shell, shell => void runLive(shell), { immediate: true })

/** The SPA path a nav item links to, or null for none or an external one. */
function internalPath(nav: AtriumNavItem): string | null {
  const link = atriumLink(nav.link)

  return link && !link.external ? link.to.split(/[?#]/)[0]! : null
}

/** Whether `current` is `path` or a page beneath it (`/` only matches itself). */
function isUnder(current: string, path: string): boolean {
  const base = path.replace(/\/+$/, '')

  return current === path || (base !== '' && (current === base || current.startsWith(`${base}/`)))
}

function walk(items: AtriumNavItem[]): AtriumNavItem[] {
  return items.flatMap(nav => [nav, ...walk(childrenOf(nav))])
}

function childrenOf(nav: AtriumNavItem): AtriumNavItem[] {
  const result = nav.live ? live.value.get(nav.live.key) : undefined

  return result?.children ?? nav.children ?? []
}

/** Whether the current route is one of these items' pages, or beneath one. */
function holdsRoute(items: AtriumNavItem[]): boolean {
  return walk(items).some((nav) => {
    const path = internalPath(nav)

    return path !== null && isUnder(route.path, path)
  })
}

/** The first segment of a path: `showroom` for `/showroom/products`. */
function segment(path: string): string {
  return path.split('/')[1] ?? ''
}

/**
 * The grouped sections the current route is inside: those holding one of
 * its pages (or a page beneath one); failing that, those whose pages all
 * share the route's `/{segment}/` (a package's, for its pages the nav does
 * not list, such as `/showroom/flags`).
 */
const openSections = computed<Set<string>>(() => {
  const grouped = (store.shell?.navigation ?? []).filter(s => s.grouped)
  const holding = grouped.filter(s => holdsRoute(s.items))

  if (holding.length) {
    return new Set(holding.map(s => s.key))
  }

  const current = segment(route.path)

  return new Set(grouped.filter((s) => {
    const segments = new Set(walk(s.items).map(internalPath).filter((path): path is string => path !== null).map(segment))

    return current !== '' && segments.size === 1 && segments.has(current)
  }).map(s => s.key))
})

function item(nav: AtriumNavItem): NavigationMenuItem {
  const result = nav.live ? live.value.get(nav.live.key) : undefined
  const badge = result && 'badge' in result ? result.badge ?? null : nav.badge
  const children = childrenOf(nav)

  return {
    label: nav.label,
    icon: resolve(nav.icon),
    ...atriumLink(nav.link),
    ...(badge !== null && badge !== undefined ? { badge: String(badge) } : {}),
    ...(children.length ? { defaultOpen: holdsRoute(children), children: children.map(item) } : {})
  }
}

/** A grouped section as one collapsible parent holding its items. */
function section(s: AtriumNavSection): NavigationMenuItem {
  return {
    label: s.label,
    icon: resolve(s.icon),
    type: 'trigger',
    value: s.key,
    defaultOpen: openSections.value.has(s.key),
    children: s.items.map(item),
    class: 'font-medium'
  }
}

const items = computed<NavigationMenuItem[][]>(() => {
  const sections = store.shell?.navigation ?? []
  const loose = sections.filter(s => !s.grouped).flatMap(s => s.items.map(item))
  const grouped = sections.filter(s => s.grouped).map(s => [section(s)])

  return [...(loose.length ? [loose] : []), ...grouped]
})

/**
 * The section holding the current route: the menu is keyed on it, so moving
 * into another section opens that one (the accordion reads its open items
 * only when it mounts) while other route changes keep what the user opened.
 */
const activeSection = computed(() => [...openSections.value].join(' '))

const settings = computed<NavigationMenuItem[]>(() => (store.shell?.settings.length ?? 0) > 0
  ? [{ label: t('atrium.nav.settings'), icon: 'i-lucide-settings', to: '/settings' }]
  : [])
</script>

<template>
  <UNavigationMenu
    :key="activeSection"
    :collapsed="props.collapsed"
    :items="items"
    orientation="vertical"
    type="multiple"
    :unmount-on-hide="false"
    tooltip
    popover
    :ui="{ separator: 'my-2 h-px bg-(--ui-border)' }"
    data-testid="atrium-nav"
  />
  <UNavigationMenu v-if="settings.length" :collapsed="props.collapsed" :items="settings" orientation="vertical" tooltip class="mt-auto" />
</template>
