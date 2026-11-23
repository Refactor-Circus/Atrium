<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { AtriumNavItem } from '../../types/atrium'

/**
 * The shell's navigation sections. Each item's `link` becomes a route inside
 * the SPA, or an external link opening in a new tab with
 * `rel="noopener noreferrer"`; a link the layer refuses (atriumLink) renders
 * the item as a plain label.
 */
const props = defineProps<{ collapsed?: boolean }>()

const store = useAtriumShellStore()
const { t } = useI18n()
const { resolve } = useAtriumIcon()

function item(nav: AtriumNavItem): NavigationMenuItem {
  return {
    label: nav.label,
    icon: resolve(nav.icon),
    ...atriumLink(nav.link),
    ...(nav.badge !== null ? { badge: String(nav.badge) } : {}),
    defaultOpen: true,
    ...(nav.children.length ? { children: nav.children.map(item) } : {})
  }
}

const items = computed<NavigationMenuItem[]>(() => {
  const sections = store.shell?.navigation ?? []
  const loose = sections.filter(s => !s.grouped).flatMap(s => s.items.map(item))
  const grouped = sections.filter(s => s.grouped).flatMap(s => [
    { label: s.label, type: 'label' as const, icon: resolve(s.icon) },
    ...s.items.map(item)
  ])

  return [...loose, ...grouped]
})

const settings = computed<NavigationMenuItem[]>(() => (store.shell?.settings.length ?? 0) > 0
  ? [{ label: t('atrium.nav.settings'), icon: 'i-lucide-settings', to: '/settings' }]
  : [])
</script>

<template>
  <UNavigationMenu :collapsed="props.collapsed" :items="items" orientation="vertical" data-testid="atrium-nav" />
  <UNavigationMenu v-if="settings.length" :collapsed="props.collapsed" :items="settings" orientation="vertical" class="mt-auto" />
</template>
