<script setup lang="ts">
import AtriumSearch from './AtriumSearch.vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UBreadcrumb from '@nuxt/ui/components/Breadcrumb.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UColorModeButton from '@nuxt/ui/runtime/vue/components/color-mode/ColorModeButton.vue'
import UDashboardNavbar from '@nuxt/ui/components/DashboardNavbar.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { computed } from 'vue'
import { useAtriumTheme } from '../composables/useAtriumTheme'
import { useAtriumNavigation } from '../composables/useAtriumNavigation'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import type { BreadcrumbItem, DropdownMenuItem } from '@nuxt/ui'

/**
 * The shell's top bar (D-077), a <UDashboardNavbar>: the navigation toggles
 * (the drawer below `lg`, the section panel above), where you are (a short
 * code such as `CAT/PRD`, then a <UBreadcrumb> of section / page), ⌘K, the
 * theme switcher and the colour mode. The API's status lives in
 * <AtriumStatusBar>.
 */
const collapsed = defineModel<boolean>('collapsed', { default: false })
const emit = defineEmits<{ menu: [] }>()

const theme = useAtriumTheme()
const nav = useAtriumNavigation()
const route = useRoute()
const { t } = useI18n()

const section = computed(() => nav.current.value?.label ?? null)
const page = computed(() => {
  if (route.path === '/settings' || route.path.startsWith('/settings/')) {
    return t('atrium.nav.settings')
  }

  return nav.page.value?.label ?? null
})

/** A short code for where you are: `CAT/PRD` for Catalog / Products. */
function abbreviate(label: string | null): string {
  const letters = (label ?? '').normalize('NFKD').replace(/[^A-Za-z0-9 ]/g, '').trim()
  const words = letters.split(/\s+/).filter(Boolean)

  if (words.length > 1) {
    return words.map(word => word[0]).join('').slice(0, 3).toUpperCase()
  }

  return letters.replace(/[aeiou]/gi, (match, offset) => offset === 0 ? match : '').slice(0, 3).toUpperCase()
}

const code = computed(() => [section.value, page.value].filter(Boolean).map(abbreviate).filter(Boolean).join('/'))

const crumbs = computed<BreadcrumbItem[]>(() => [
  ...section.value ? [{ label: section.value, class: 'hidden sm:inline-flex font-mono text-[0.65625rem] font-medium tracking-[0.08em] uppercase text-muted' }] : [],
  ...page.value ? [{ label: page.value, active: true, class: 'font-medium text-highlighted' }] : []
])

const themeItems = computed<DropdownMenuItem[][]>(() => [theme.themes.value.map(item => ({
  label: item.label,
  type: 'checkbox' as const,
  checked: item.key === theme.current.value?.key,
  onSelect: () => theme.choose(item.key),
  slot: 'theme' as const,
  swatch: item.swatch
}))])

function toggleCollapsed() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <UDashboardNavbar
    :toggle="false"
    class="sticky top-0 z-20 h-(--atrium-bar-height) gap-2 border-b border-default bg-(--atrium-canvas)/70 px-2 pt-0 backdrop-blur-md backdrop-saturate-150 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-[linear-gradient(90deg,var(--ui-primary),color-mix(in_oklab,var(--ui-primary)_30%,transparent)_25%,transparent_60%)] after:shadow-[0_0_10px_var(--atrium-glow-soft)] sm:px-3 lg:px-3"
    data-testid="atrium-topbar"
  >
    <template #leading>
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        size="sm"
        class="lg:hidden"
        :aria-label="t('atrium.shell.open_menu')"
        data-testid="atrium-menu"
        @click="emit('menu')"
      />
      <UButton
        :icon="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
        color="neutral"
        variant="ghost"
        size="sm"
        class="hidden lg:inline-flex"
        :aria-label="collapsed ? t('atrium.shell.expand') : t('atrium.shell.collapse')"
        :aria-pressed="collapsed"
        data-testid="atrium-collapse"
        @click="toggleCollapsed"
      />
    </template>

    <template #title>
      <nav class="flex min-w-0 items-center gap-2" :aria-label="t('atrium.shell.breadcrumb')" data-testid="atrium-breadcrumb">
        <UBadge
          v-if="code"
          :label="code"
          icon="i-lucide-chevrons-right"
          color="primary"
          variant="soft"
          class="hidden tracking-[0.1em] uppercase sm:inline-flex"
          data-testid="atrium-code"
          aria-hidden="true"
        />
        <UBreadcrumb :items="crumbs" separator-icon="i-lucide-chevron-right" :ui="{ separator: 'max-sm:hidden' }" class="min-w-0" />
      </nav>
    </template>

    <template #right>
      <AtriumSearch />

      <UDropdownMenu v-if="theme.switchable.value && theme.themes.value.length > 1" :items="themeItems" :content="{ align: 'end' }">
        <UButton icon="i-lucide-palette" color="neutral" variant="ghost" size="sm" :aria-label="t('atrium.theme.label')" data-testid="atrium-theme" />
        <template #theme-leading="{ item }">
          <span class="size-2.5 rounded-full ring-1 ring-(--ui-border-accented)" :style="{ background: (item as { swatch?: string }).swatch }" />
        </template>
      </UDropdownMenu>
      <UColorModeButton size="sm" data-testid="atrium-color-mode" />
    </template>
  </UDashboardNavbar>
</template>
