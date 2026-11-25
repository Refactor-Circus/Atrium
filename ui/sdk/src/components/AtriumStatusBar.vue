<script setup lang="ts">
import UChip from '@nuxt/ui/components/Chip.vue'
import UDashboardToolbar from '@nuxt/ui/components/DashboardToolbar.vue'
import USeparator from '@nuxt/ui/components/Separator.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import { useAtriumShellStore } from '../stores/atriumShell'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

/**
 * The deck's status strip (D-078), a <UDashboardToolbar> along the foot of
 * the content: each integration as a live <UChip> (lit and pulsing while
 * active, dim while not, named by a tooltip), how long the shell took to
 * answer, the API version, the route, and a UTC clock in mono. Decorative
 * motion stops under reduced motion.
 */
const store = useAtriumShellStore()
const route = useRoute()
const { t } = useI18n()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})

onBeforeUnmount(() => clearInterval(timer))

const clock = computed(() => now.value.toISOString().slice(11, 19))
const online = computed(() => store.shell !== null && !store.error)

/** A live dot: lit, glowing and pulsing while on; dim while off. */
function dot(on: boolean) {
  return {
    base: on
      ? 'size-1.5 ring-0 shadow-[0_0_8px_var(--ui-success)] after:absolute after:-inset-[3px] after:rounded-full after:border after:border-success after:opacity-0 after:animate-[atrium-ping_2.4s_var(--atrium-ease)_infinite] after:[animation-delay:var(--delay,0s)]'
      : 'size-1.5 ring-0 bg-(--ui-text-dimmed)'
  }
}
</script>

<template>
  <UDashboardToolbar
    :ui="{ root: 'min-h-0 h-6 shrink-0 gap-3 overflow-hidden border-t border-b-0 border-default bg-(--atrium-canvas)/80 px-3 sm:px-3 lg:px-3 font-mono text-[0.65625rem] tracking-[0.06em] text-muted backdrop-blur-md', left: 'gap-3 min-w-0', right: 'gap-3' }"
    data-testid="atrium-statusbar"
  >
    <template #left>
      <span class="flex items-center gap-1.5" data-testid="atrium-status">
        <span class="inline-flex" data-testid="atrium-live-dot" :data-state="online ? 'on' : 'off'"><UChip standalone inset color="success" :ui="dot(online)" /></span>
        <span class="uppercase">{{ online ? t('atrium.shell.online') : t('atrium.shell.offline') }}</span>
      </span>
      <USeparator orientation="vertical" class="h-3" />
      <ul v-if="store.integrations.length" class="hidden items-center gap-2.5 md:flex" :aria-label="t('atrium.shell.integrations')">
        <li
          v-for="(integration, index) in store.integrations"
          :key="integration.key"
          :data-integration="integration.key"
          :data-active="integration.active"
        >
          <UTooltip :text="integration.label" :content="{ side: 'top' }">
            <span class="flex items-center gap-1" :style="{ '--delay': `${index * 0.3}s` }">
              <span class="inline-flex" data-testid="atrium-live-dot" :data-state="integration.active ? 'on' : 'off'"><UChip standalone inset color="success" :ui="dot(integration.active)" /></span>
              <span class="uppercase">{{ integration.key.slice(0, 4) }}</span>
            </span>
          </UTooltip>
        </li>
      </ul>
    </template>
    <template #right>
      <span class="hidden truncate text-dimmed lg:inline">{{ route.path }}</span>
      <span v-if="store.latency !== null" class="tabular-nums" data-testid="atrium-latency">{{ t('atrium.shell.latency', { ms: store.latency }) }}</span>
      <span v-if="store.shell?.api_version" class="hidden sm:inline">API v{{ store.shell.api_version }}</span>
      <span class="text-highlighted tabular-nums" data-testid="atrium-clock">{{ clock }} UTC</span>
    </template>
  </UDashboardToolbar>
</template>
