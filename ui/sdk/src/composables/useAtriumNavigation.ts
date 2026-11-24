import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAtrium } from '../registry'
import { runInAtrium } from '../runtime/context'
import { useAtriumShellStore } from '../stores/atriumShell'
import type { AtriumLiveResult, AtriumNavItem, AtriumNavSection, AtriumShell } from '../types/atrium'
import { atriumLink } from '../utils/atriumLink'
import { useAtriumIcon } from './useAtriumIcon'

/** One nav item as the shell renders it: live badge and children applied. */
export interface AtriumNavEntry {
  label: string
  icon: string | undefined
  /** Route or external link props (atriumLink), or null for a plain label */
  link: ReturnType<typeof atriumLink>
  /** The SPA path it routes to, or null for none or an external one */
  path: string | null
  badge: string | null
  children: AtriumNavEntry[]
}

/** One rail entry: a grouped section, or every loose item together as `home`. */
export interface AtriumNavGroup {
  key: string
  label: string
  icon: string | undefined
  items: AtriumNavEntry[]
}

/** The loose sections' rail entry. */
export const ATRIUM_NAV_HOME = 'home'

/** Whether `current` is `path` or a page beneath it (`/` only matches itself). */
export function isUnderPath(current: string, path: string): boolean {
  const base = path.replace(/\/+$/, '')

  return current === path || (base !== '' && (current === base || current.startsWith(`${base}/`)))
}

/**
 * The shell's navigation as the layer draws it (D-077): one rail entry per
 * grouped section, the loose sections' items together first as `home`, each
 * item's `link` checked by atriumLink and its `live` resolver applied.
 *
 * With `{ live: true }` (the navigation itself), an item with a `live` key
 * whose resolver is registered (`atrium.live(key, …)`) gets its badge or
 * children from it, once per shell load, while its integration (the key's
 * first segment) is active. A resolver that fails leaves the item as the API
 * sent it. Other readers (the breadcrumb, ⌘K) see the items as sent.
 *
 * `current` is the group holding the route: one of its pages, or a page
 * beneath one; failing that, the group whose pages all share the route's
 * first segment (a package's page the nav does not list, such as
 * `/showroom/flags`); failing that, the first group.
 */
export function useAtriumNavigation(options: { live?: boolean } = {}) {
  const store = useAtriumShellStore()
  const atrium = useAtrium()
  const route = useRoute()
  const { t } = useI18n()
  const { resolve } = useAtriumIcon()

  const live = shallowRef(new Map<string, AtriumLiveResult>())

  async function runLive(shell: AtriumShell | null): Promise<void> {
    live.value = new Map()

    const all: AtriumNavItem[] = []
    const walk = (items: AtriumNavItem[]) => items.forEach((nav) => {
      all.push(nav)
      walk(nav.children ?? [])
    })

    walk(shell?.navigation.flatMap(section => section.items) ?? [])

    await Promise.all(all.filter(nav => nav.live).map(async (nav) => {
      const { key, options: liveOptions } = nav.live!
      const resolver = atrium.liveResolvers.get(key)

      if (!resolver || !store.isActive(key.split('.')[0] ?? '')) {
        return
      }

      try {
        const result = await runInAtrium(() => resolver(liveOptions ?? {}))

        if (shell === store.shell) {
          live.value = new Map(live.value).set(key, result ?? {})
        }
      } catch {
        // Keep the item as the API sent it.
      }
    }))
  }

  if (options.live) {
    watch(() => store.shell, shell => void runLive(shell), { immediate: true })
  }

  function entry(nav: AtriumNavItem): AtriumNavEntry {
    const result = nav.live ? live.value.get(nav.live.key) : undefined
    const badge = result && 'badge' in result ? result.badge ?? null : nav.badge
    const link = atriumLink(nav.link)

    return {
      label: nav.label,
      icon: resolve(nav.icon),
      link,
      path: link && !link.external ? link.to.split(/[?#]/)[0]! : null,
      badge: badge !== null && badge !== undefined ? String(badge) : null,
      children: (result?.children ?? nav.children ?? []).map(entry)
    }
  }

  const groups = computed<AtriumNavGroup[]>(() => {
    const sections: AtriumNavSection[] = store.shell?.navigation ?? []
    const loose = sections.filter(s => !s.grouped).flatMap(s => s.items.map(entry))
    const grouped = sections.filter(s => s.grouped).map(s => ({
      key: s.key,
      label: s.label,
      icon: resolve(s.icon) ?? resolve(s.items[0]?.icon ?? null),
      items: s.items.map(entry)
    }))

    return [
      ...(loose.length ? [{ key: ATRIUM_NAV_HOME, label: t('atrium.nav.home'), icon: 'i-lucide-house', items: loose }] : []),
      ...grouped
    ]
  })

  function flatten(items: AtriumNavEntry[]): AtriumNavEntry[] {
    return items.flatMap(nav => [nav, ...flatten(nav.children)])
  }

  /** Whether the route is one of these entries' pages, or beneath one. */
  function holds(items: AtriumNavEntry[], path = route.path): boolean {
    return flatten(items).some(nav => nav.path !== null && isUnderPath(path, nav.path))
  }

  /** The group holding `path` (see above), or null when there is none. */
  function groupOf(path: string): AtriumNavGroup | null {
    const holding = groups.value.filter(group => holds(group.items, path))

    if (holding.length) {
      // The deepest match wins: `/` is in home, `/demo/orders` elsewhere.
      return holding.sort((a, b) => depth(b, path) - depth(a, path))[0]!
    }

    const segment = path.split('/')[1] ?? ''

    return groups.value.find((group) => {
      const segments = new Set(flatten(group.items).map(nav => nav.path).filter((p): p is string => p !== null).map(p => p.split('/')[1] ?? ''))

      return segment !== '' && segments.size === 1 && segments.has(segment)
    }) ?? null
  }

  function depth(group: AtriumNavGroup, path: string): number {
    return Math.max(...flatten(group.items).filter(nav => nav.path !== null && isUnderPath(path, nav.path)).map(nav => nav.path!.length))
  }

  const current = computed<AtriumNavGroup | null>(() => groupOf(route.path) ?? null)

  /** The entry whose page the route is on (the most specific), or null. */
  const page = computed<AtriumNavEntry | null>(() => {
    const candidates = flatten(groups.value.flatMap(group => group.items)).filter(nav => nav.path !== null && isUnderPath(route.path, nav.path))

    return candidates.sort((a, b) => b.path!.length - a.path!.length)[0] ?? null
  })

  const hasSettings = computed(() => (store.shell?.settings.length ?? 0) > 0)

  return { groups, current, page, hasSettings, holds, groupOf, flatten }
}
