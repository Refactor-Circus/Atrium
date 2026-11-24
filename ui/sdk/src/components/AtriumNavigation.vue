<script setup lang="ts">
import AtriumLink from './AtriumLink.vue'
import AtriumNavList from './AtriumNavList.vue'
import UAvatar from '@nuxt/ui/components/Avatar.vue'
import UIcon from '@nuxt/ui/runtime/vue/components/Icon.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { ref, watch, computed } from 'vue'
import { useAtriumShellStore } from '../stores/atriumShell'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAtriumNavigation } from '../composables/useAtriumNavigation'

import type { AtriumNavGroup } from '../composables/useAtriumNavigation'

/**
 * The shell's navigation (D-077): a slim rail of sections beside a panel
 * listing one section's pages.
 *
 * The rail holds the app's mark, one button per section (useAtriumNavigation:
 * the loose sections' items together as Home, then each grouped section,
 * labelled by a tooltip) and, at its foot, Settings. The section holding the
 * route is lit. Choosing a section shows its pages in the panel without
 * leaving the page; moving to another page shows the section that holds it.
 *
 * Collapsed, the panel is gone and a section's button opens its pages in a
 * flyout instead. Every link goes through atriumLink (an external one opens
 * in a new tab, an unsafe one is a plain label).
 */
const props = defineProps<{ collapsed?: boolean }>()

const store = useAtriumShellStore()
const route = useRoute()
const { t } = useI18n()
const nav = useAtriumNavigation({ live: true })

const chosen = ref<string | null>(null)

watch(() => route.path, () => { chosen.value = null })

const shown = computed<AtriumNavGroup | null>(() =>
  nav.groups.value.find(group => group.key === chosen.value)
  ?? nav.current.value
  ?? nav.groups.value[0]
  ?? null
)

const activePath = computed(() => nav.page.value?.path ?? null)

const mark = computed(() => (store.shell?.app.name ?? 'Atrium').trim().charAt(0).toUpperCase() || 'A')

function choose(group: AtriumNavGroup): void {
  chosen.value = group.key
}

function pageCount(group: AtriumNavGroup): string {
  return String(nav.flatten(group.items).length).padStart(2, '0')
}
</script>

<template>
  <div class="flex h-full min-h-0" data-testid="atrium-nav" :data-collapsed="props.collapsed ? 'true' : 'false'">
    <nav class="atrium-rail flex shrink-0 flex-col items-center gap-1 py-2" :aria-label="t('atrium.nav.sections')" data-testid="atrium-rail">
      <AtriumLink to="/" class="atrium-mark mb-2" :title="store.shell?.app.name ?? 'Atrium'" :aria-label="store.shell?.app.name ?? 'Atrium'">
        {{ mark }}
      </AtriumLink>

      <ul class="flex min-h-0 flex-1 flex-col items-center gap-1 px-2">
        <li v-for="group in nav.groups.value" :key="group.key">
          <UPopover
            v-if="props.collapsed"
            :key="route.path"
            :content="{ side: 'right', align: 'start', sideOffset: 10 }"
          >
            <button
              type="button"
              class="atrium-rail-item"
              :data-tip="group.label"
              :aria-label="group.label"
              :data-current="nav.current.value?.key === group.key"
              data-testid="atrium-rail-section"
              :data-section="group.key"
            >
              <UIcon :name="group.icon ?? 'i-lucide-folder'" class="atrium-rail-icon size-[1.125rem]" />
            </button>
            <template #content>
              <div class="w-56 p-1.5" :data-testid="`atrium-flyout-${group.key}`">
                <p class="atrium-label flex items-center justify-between px-2 pb-1 pt-0.5">
                  <span>{{ group.label }}</span><span class="text-dimmed">{{ pageCount(group) }}</span>
                </p>
                <AtriumNavList :items="group.items" :active-path="activePath" />
              </div>
            </template>
          </UPopover>
          <button
            v-else
            type="button"
            class="atrium-rail-item"
            :data-tip="group.label"
            :aria-label="group.label"
            :aria-pressed="shown?.key === group.key"
            :data-shown="shown?.key === group.key"
            :data-current="nav.current.value?.key === group.key"
            aria-controls="atrium-nav-panel"
            data-testid="atrium-rail-section"
            :data-section="group.key"
            @click="choose(group)"
          >
            <UIcon :name="group.icon ?? 'i-lucide-folder'" class="atrium-rail-icon size-[1.125rem]" />
          </button>
        </li>
      </ul>

      <AtriumLink
        v-if="nav.hasSettings.value"
        to="/settings"
        class="atrium-rail-item mt-1"
        :data-tip="t('atrium.nav.settings')"
        :aria-label="t('atrium.nav.settings')"
        :data-current="route.path === '/settings' || route.path.startsWith('/settings/')"
      >
        <UIcon name="i-lucide-settings" class="atrium-rail-icon size-[1.125rem]" />
      </AtriumLink>
    </nav>

    <section
      v-if="!props.collapsed && shown"
      id="atrium-nav-panel"
      class="atrium-panel-nav flex min-h-0 shrink-0 flex-col"
      :aria-label="shown.label"
      data-testid="atrium-nav-panel"
      :data-section="shown.key"
    >
      <header class="atrium-panel-head flex h-(--atrium-bar-height) shrink-0 items-center gap-2 border-b border-default px-3">
        <UIcon :name="shown.icon ?? 'i-lucide-folder'" class="size-4 shrink-0 text-primary" />
        <span class="truncate font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-highlighted">{{ shown.label }}</span>
        <span class="atrium-label ms-auto text-dimmed">{{ pageCount(shown) }}</span>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <AtriumNavList :items="shown.items" :active-path="activePath" />
      </div>
      <footer v-if="store.shell?.user" class="flex shrink-0 items-center gap-2 border-t border-default px-3 py-2">
        <UAvatar :alt="store.shell.user.name ?? ''" size="xs" class="ring-1 ring-(--ui-border-accented)" />
        <div class="min-w-0 leading-tight">
          <p class="truncate text-xs font-medium text-highlighted">{{ store.shell.user.name }}</p>
          <p class="atrium-mono truncate text-[0.65625rem] text-muted">{{ store.shell.user.email }}</p>
        </div>
      </footer>
    </section>
  </div>
</template>
