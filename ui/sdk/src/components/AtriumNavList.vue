<script setup lang="ts">
import UNavigationMenu from '@nuxt/ui/components/NavigationMenu.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { isUnderPath, type AtriumNavEntry } from '../composables/useAtriumNavigation'

import type { NavigationMenuItem } from '@nuxt/ui'

/**
 * A section's pages as a compact list: Nuxt UI's vertical <UNavigationMenu>.
 * Each item is a route, an external link (new tab, `rel="noopener
 * noreferrer"`) or, for a link the layer refuses, a plain label. An item
 * with children has a disclosure, open while it holds the route. The open
 * page is the one at `activePath` (the most specific match), never every
 * page above it.
 */
const props = defineProps<{ items: AtriumNavEntry[], activePath: string | null, depth?: number }>()

const route = useRoute()

function holds(items: AtriumNavEntry[]): boolean {
  return items.some(nav => (nav.path !== null && isUnderPath(route.path, nav.path)) || holds(nav.children))
}

function item(nav: AtriumNavEntry, index: number, level: number): NavigationMenuItem {
  const active = nav.path !== null && nav.path === props.activePath

  return {
    label: nav.label,
    icon: nav.icon,
    value: `${level}:${index}:${nav.label}`,
    badge: nav.badge ?? undefined,
    active,
    defaultOpen: nav.children.length > 0 && holds(nav.children),
    ...(nav.link
      ? { ...nav.link, 'aria-current': active ? 'page' : undefined }
      // A refused link is a label: no href, nothing to press (unless it
      // opens its children).
      : nav.children.length ? {} : { as: 'span', class: 'cursor-default' }),
    children: nav.children.length ? nav.children.map((child, i) => item(child, i, level + 1)) : undefined
  }
}

const menu = computed(() => props.items.map((nav, index) => item(nav, index, props.depth ?? 0)))
</script>

<template>
  <UNavigationMenu
    :key="route.path"
    :items="menu"
    orientation="vertical"
    color="primary"
    :external-icon="'i-lucide-arrow-up-right'"
    :unmount-on-hide="false"
    data-testid="atrium-nav-list"
  />
</template>
