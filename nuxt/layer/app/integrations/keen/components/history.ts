import type { AtriumLiveResult, AtriumNavItem, AtriumNavSection } from '../../../types/atrium'
import { integrationData, useAtriumIntegration } from '../../../composables/useAtriumIntegration'
import { useAtriumShellStore } from '../../../stores/atriumShell'
import type { KeenAuditedPackage } from './entries'

/**
 * The History nav item's settings, as the shell sends them in its `live`
 * options (`atrium.integrations.keen.history.nav`):
 *
 * - `exclude`: package keys left out
 * - `groups`: package key to the Atrium nav group (D-033) its link sits under
 * - `sort`: where the History item sits in the nav; the PHP side places the
 *   item with it, and the children are always ordered by label
 */
export interface KeenHistoryOptions {
  exclude: string[]
  groups: Record<string, string>
  sort: number
}

const DEFAULT_SORT = 90

/** The History options from a nav item's `live.options`, ignoring anything malformed. */
export function historyOptions(options: Record<string, unknown>): KeenHistoryOptions {
  const exclude = Array.isArray(options.exclude) ? options.exclude.filter((key): key is string => typeof key === 'string') : []
  const groups: Record<string, string> = {}

  if (typeof options.groups === 'object' && options.groups !== null && !Array.isArray(options.groups)) {
    for (const [key, group] of Object.entries(options.groups)) {
      if (typeof group === 'string' && group !== '') {
        groups[key] = group
      }
    }
  }

  return { exclude, groups, sort: typeof options.sort === 'number' ? options.sort : DEFAULT_SORT }
}

/**
 * The label of the Atrium nav group a `groups` value names: the shell's
 * section keyed `group-{value}` (or labelled `value`), else the value itself.
 */
export function historyGroupLabel(sections: readonly AtriumNavSection[], group: string): string {
  const wanted = group.toLowerCase()
  const section = sections.find(candidate => candidate.key === `group-${wanted}` || candidate.label.toLowerCase() === wanted)

  return section?.label ?? group
}

function byLabel(a: AtriumNavItem, b: AtriumNavItem): number {
  return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
}

function packageItem(pkg: KeenAuditedPackage): AtriumNavItem {
  return {
    label: pkg.label,
    icon: null,
    link: { path: `/keen/history/${encodeURIComponent(pkg.key)}`, external: false },
    badge: null,
    live: null,
    children: []
  }
}

/**
 * The History item's children: a link to `/keen/history/:key` for each
 * package Keen lists, minus the excluded ones. A package with a group sits
 * under a child named after that group, with the others of its group. Every
 * level is ordered by label.
 */
export function historyChildren(
  packages: readonly KeenAuditedPackage[],
  options: KeenHistoryOptions,
  groupLabel: (group: string) => string = group => group
): AtriumNavItem[] {
  const loose: AtriumNavItem[] = []
  const grouped = new Map<string, AtriumNavItem>()

  for (const pkg of packages) {
    if (options.exclude.includes(pkg.key)) {
      continue
    }

    const group = options.groups[pkg.key]

    if (group === undefined) {
      loose.push(packageItem(pkg))
      continue
    }

    const label = groupLabel(group)
    let parent = grouped.get(label)

    if (!parent) {
      parent = { label, icon: null, link: null, badge: null, live: null, children: [] }
      grouped.set(label, parent)
    }

    parent.children.push(packageItem(pkg))
  }

  for (const parent of grouped.values()) {
    parent.children.sort(byLabel)
  }

  return [...loose, ...grouped.values()].sort(byLabel)
}

/**
 * The `keen.history` live resolver (AC 64): the History item's children,
 * from `keen.packages.index`. It rejects when Keen's API fails, and the
 * navigation then keeps the item as the shell sent it.
 */
export async function keenHistory(options: Record<string, unknown>): Promise<AtriumLiveResult> {
  const { client } = useAtriumIntegration('keen')
  const sections = useAtriumShellStore().shell?.navigation ?? []

  if (!client) {
    throw new Error('The Keen integration is not active.')
  }

  const packages = integrationData(await client.GET('/packages')).data

  return { children: historyChildren(packages, historyOptions(options), group => historyGroupLabel(sections, group)) }
}
