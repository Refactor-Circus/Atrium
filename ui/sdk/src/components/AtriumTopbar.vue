<script setup lang="ts">
import { computed } from 'vue'
import { useAtriumTheme } from '../composables/useAtriumTheme'
import { useAtriumNavigation } from '../composables/useAtriumNavigation'
import { useRoute } from 'vue-router'
import { useColorMode } from '../runtime/colorMode'
import { useI18n } from 'vue-i18n'

/**
 * The shell's top bar (D-077): the navigation toggles (the drawer below
 * `lg`, the section panel above), where you are (a short code such as
 * `CAT/PRD`, then section / page), ⌘K, the theme switcher and the colour
 * mode. The API's status lives in <AtriumStatusBar>.
 */
const collapsed = defineModel<boolean>('collapsed', { default: false })
const emit = defineEmits<{ menu: [] }>()

const theme = useAtriumTheme()
const nav = useAtriumNavigation()
const route = useRoute()
const colorMode = useColorMode()
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

const themeItems = computed(() => [theme.themes.value.map(item => ({
  label: item.label,
  type: 'checkbox' as const,
  checked: item.key === theme.current.value?.key,
  onSelect: () => theme.choose(item.key),
  slot: 'theme' as const,
  swatch: item.swatch
}))])

const dark = computed(() => colorMode.value === 'dark')

function toggleCollapsed() {
  collapsed.value = !collapsed.value
}

function toggleMode() {
  colorMode.preference = dark.value ? 'light' : 'dark'
}
</script>

<template>
  <header class="atrium-topbar sticky top-0 z-20 flex shrink-0 items-center gap-2 px-2 sm:px-3" data-testid="atrium-topbar">
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

    <nav class="flex min-w-0 items-center gap-1.5" :aria-label="t('atrium.shell.breadcrumb')" data-testid="atrium-breadcrumb">
      <span v-if="code" class="atrium-code hidden sm:inline-flex" data-testid="atrium-code" aria-hidden="true">{{ code }}</span>
      <span v-if="section" class="atrium-label hidden truncate sm:inline">{{ section }}</span>
      <UIcon v-if="section && page" name="i-lucide-chevron-right" class="hidden size-3 shrink-0 text-dimmed sm:inline" />
      <span v-if="page" class="truncate text-[0.8125rem] font-medium text-highlighted" aria-current="page">{{ page }}</span>
    </nav>

    <div class="ms-auto flex items-center gap-1.5">
      <div class="flex md:w-64">
        <AtriumSearch />
      </div>

      <UDropdownMenu v-if="theme.switchable.value && theme.themes.value.length > 1" :items="themeItems" :content="{ align: 'end' }">
        <UButton icon="i-lucide-palette" color="neutral" variant="ghost" size="sm" :aria-label="t('atrium.theme.label')" data-testid="atrium-theme" />
        <template #theme-leading="{ item }">
          <span class="size-2.5 rounded-full ring-1 ring-(--ui-border-accented)" :style="{ background: (item as { swatch?: string }).swatch }" />
        </template>
      </UDropdownMenu>
      <UButton
        :icon="dark ? 'i-lucide-sun' : 'i-lucide-moon'"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-label="dark ? t('atrium.shell.light_mode') : t('atrium.shell.dark_mode')"
        data-testid="atrium-color-mode"
        @click="toggleMode"
      />
    </div>
  </header>
</template>
