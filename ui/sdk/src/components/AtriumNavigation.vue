<script setup lang="ts">
import AtriumNavList from './AtriumNavList.vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/runtime/vue/components/Icon.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import UUser from '@nuxt/ui/components/User.vue'
import { ref, watch, computed } from 'vue'
import { useAtriumShellStore } from '../stores/atriumShell'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isUnderPath, useAtriumNavigation } from '../composables/useAtriumNavigation'

import type { AtriumNavGroup } from '../composables/useAtriumNavigation'

/**
 * The shell's navigation (D-077): a slim rail of sections beside a panel
 * listing one section's pages, built from Nuxt UI (<UButton>, <UTooltip>,
 * <UPopover>, <UNavigationMenu> through <AtriumNavList>, <UUser>).
 *
 * The rail holds the app's mark, one button per section (useAtriumNavigation:
 * the loose sections' items together as Home, then each grouped section,
 * labelled by a tooltip) and, at its foot, Settings. The section holding the
 * route is lit. Choosing a section shows its pages in the panel without
 * leaving the page; moving to another page shows the section that owns it
 * (`section`: Settings on the settings pages, the dashboard's for a page no
 * section holds), never a module's that does not hold it (D-096).
 *
 * Collapsed, the panel is gone and a section's button opens its pages in a
 * popover instead. Every link goes through atriumLink (an external one opens
 * in a new tab, an unsafe one is a plain label).
 */
const props = defineProps<{ collapsed?: boolean }>()

const store = useAtriumShellStore()
const route = useRoute()
const { t } = useI18n()
const nav = useAtriumNavigation({ live: true })

const chosen = ref<string | null>(null)

watch(() => route.path, () => { chosen.value = null })

// The chosen rail section, else the one owning the route (D-096): never a
// section that does not hold it, such as the first module's.
const shown = computed<AtriumNavGroup>(() =>
  nav.groups.value.find(group => group.key === chosen.value)
  ?? nav.section.value
)

/** The shown section's most specific page holding the route, else the nav's. */
const activePath = computed(() => {
  const paths = nav.flatten(shown.value.items)
    .map(entry => entry.path)
    .filter((path): path is string => path !== null && isUnderPath(route.path, path))

  return paths.sort((a, b) => b.length - a.length)[0] ?? nav.page.value?.path ?? null
})
const appName = computed(() => store.shell?.app.name ?? 'Atrium')
const mark = computed(() => appName.value.trim().charAt(0).toUpperCase() || 'A')
const inSettings = computed(() => route.path === '/settings' || route.path.startsWith('/settings/'))

function choose(group: AtriumNavGroup): void {
  chosen.value = group.key
}

function pageCount(group: AtriumNavGroup): string {
  return String(nav.flatten(group.items).length).padStart(2, '0')
}

/** A rail button's look: lit while its section holds the route, raised while shown. */
function railClass(lit: boolean, raised = false): string[] {
  return [
    'relative size-9 justify-center rounded-(--ui-radius) text-muted hover:text-highlighted hover:bg-elevated',
    raised ? 'text-highlighted bg-elevated' : '',
    lit ? 'text-primary hover:text-primary bg-(image:--atrium-socket) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ui-primary)_40%,transparent),0_0_18px_-6px_var(--atrium-glow)] before:absolute before:-start-2 before:inset-y-1.5 before:w-[3px] before:rounded-e-[3px] before:bg-primary before:shadow-[0_0_12px_1px_var(--atrium-glow)]' : ''
  ]
}

const railIcon = { leadingIcon: 'size-[1.125rem]' }
</script>

<template>
  <div class="flex h-full min-h-0" data-testid="atrium-nav" :data-collapsed="props.collapsed ? 'true' : 'false'">
    <nav
      class="relative flex w-(--atrium-rail-width) shrink-0 flex-col items-center gap-1 bg-default bg-[radial-gradient(120%_30%_at_0%_0%,color-mix(in_oklab,var(--ui-primary)_14%,transparent),transparent_70%)] py-2 after:absolute after:inset-y-0 after:end-0 after:w-px after:bg-(image:--atrium-spine) after:shadow-[0_0_10px_0_var(--atrium-glow-soft)]"
      :aria-label="t('atrium.nav.sections')"
      data-testid="atrium-rail"
    >
      <UButton
        to="/"
        :label="mark"
        color="neutral"
        variant="ghost"
        class="mb-2 size-8 justify-center p-0 font-mono text-sm font-bold text-highlighted [clip-path:polygon(0_0,100%_0,100%_70%,70%_100%,0_100%)] bg-[linear-gradient(140deg,color-mix(in_oklab,var(--ui-primary)_70%,var(--ui-bg)),color-mix(in_oklab,var(--ui-primary)_18%,var(--ui-bg)))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ui-primary)_70%,transparent)] text-shadow-[0_0_10px_var(--atrium-glow)] hover:bg-[linear-gradient(140deg,color-mix(in_oklab,var(--ui-primary)_80%,var(--ui-bg)),color-mix(in_oklab,var(--ui-primary)_25%,var(--ui-bg)))]"
        :title="appName"
        :aria-label="appName"
      />

      <ul class="flex min-h-0 flex-1 flex-col items-center gap-1 px-2">
        <li v-for="group in nav.groups.value" :key="group.key">
          <UPopover
            v-if="props.collapsed"
            :key="route.path"
            :content="{ side: 'right', align: 'start', sideOffset: 10 }"
          >
            <UButton
              :icon="group.icon ?? 'i-lucide-folder'"
              color="neutral"
              variant="ghost"
              :class="railClass(nav.current.value?.key === group.key)"
              :ui="railIcon"
              :aria-label="group.label"
              :data-current="nav.current.value?.key === group.key"
              data-testid="atrium-rail-section"
              :data-section="group.key"
            />
            <template #content>
              <div class="w-56 p-1.5" :data-testid="`atrium-flyout-${group.key}`">
                <p class="atrium-label flex items-center justify-between px-2 pt-0.5 pb-1">
                  <span>{{ group.label }}</span><span class="text-dimmed">{{ pageCount(group) }}</span>
                </p>
                <AtriumNavList :items="group.items" :active-path="activePath" />
              </div>
            </template>
          </UPopover>
          <UTooltip v-else :text="group.label" :content="{ side: 'right', sideOffset: 10 }">
            <UButton
              :icon="group.icon ?? 'i-lucide-folder'"
              color="neutral"
              variant="ghost"
              :class="railClass(nav.current.value?.key === group.key, shown.key === group.key)"
              :ui="railIcon"
              :aria-label="group.label"
              :aria-pressed="shown.key === group.key"
              :data-shown="shown.key === group.key"
              :data-current="nav.current.value?.key === group.key"
              aria-controls="atrium-nav-panel"
              data-testid="atrium-rail-section"
              :data-section="group.key"
              @click="choose(group)"
            />
          </UTooltip>
        </li>
      </ul>

      <UTooltip v-if="nav.hasSettings.value" :text="t('atrium.nav.settings')" :content="{ side: 'right', sideOffset: 10 }">
        <UButton
          to="/settings"
          icon="i-lucide-settings"
          color="neutral"
          variant="ghost"
          :class="railClass(inSettings)"
          :ui="railIcon"
          :aria-label="t('atrium.nav.settings')"
          :data-current="inSettings"
        />
      </UTooltip>
    </nav>

    <section
      v-if="!props.collapsed"
      id="atrium-nav-panel"
      class="flex w-(--atrium-panel-width) min-h-0 shrink-0 flex-col border-e border-default bg-[color-mix(in_oklab,var(--ui-bg)_90%,var(--atrium-canvas))]"
      :aria-label="shown.label"
      data-testid="atrium-nav-panel"
      :data-section="shown.key"
    >
      <header class="relative flex h-(--atrium-bar-height) shrink-0 items-center gap-2 border-b border-default px-3 after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-px after:h-1 after:bg-(image:--atrium-ruler) after:mask-[linear-gradient(90deg,transparent,#000_60%)] after:opacity-80">
        <UIcon :name="shown.icon ?? 'i-lucide-folder'" class="size-4 shrink-0 text-primary" />
        <span class="truncate font-mono text-[0.6875rem] font-semibold tracking-[0.12em] text-highlighted uppercase" data-testid="atrium-nav-panel-title">{{ shown.label }}</span>
        <UBadge :label="pageCount(shown)" color="neutral" variant="outline" class="ms-auto text-dimmed" />
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <AtriumNavList :items="shown.items" :active-path="activePath" />
      </div>
      <footer v-if="store.shell?.user" class="shrink-0 border-t border-default px-3 py-2">
        <UUser
          :name="store.shell.user.name ?? ''"
          :description="store.shell.user.email ?? undefined"
          :avatar="{ alt: store.shell.user.name ?? '', size: 'xs', class: 'ring-1 ring-(--ui-border-accented)' }"
          size="sm"
          :ui="{ name: 'truncate text-xs text-highlighted', description: 'truncate font-mono text-[0.65625rem]' }"
          data-testid="atrium-user"
        />
      </footer>
    </section>
  </div>
</template>
