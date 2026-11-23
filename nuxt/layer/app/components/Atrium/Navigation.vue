<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { AtriumLiveResult, AtriumNavItem, AtriumShell } from '../../types/atrium'

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
 */
const props = defineProps<{ collapsed?: boolean }>()

const store = useAtriumShellStore()
const atrium = useAtrium()
const nuxtApp = useNuxtApp()
const { t } = useI18n()
const { resolve } = useAtriumIcon()

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

function item(nav: AtriumNavItem): NavigationMenuItem {
  const result = nav.live ? live.value.get(nav.live.key) : undefined
  const badge = result && 'badge' in result ? result.badge ?? null : nav.badge
  const children = result?.children ?? nav.children ?? []

  return {
    label: nav.label,
    icon: resolve(nav.icon),
    ...atriumLink(nav.link),
    ...(badge !== null && badge !== undefined ? { badge: String(badge) } : {}),
    defaultOpen: true,
    ...(children.length ? { children: children.map(item) } : {})
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
