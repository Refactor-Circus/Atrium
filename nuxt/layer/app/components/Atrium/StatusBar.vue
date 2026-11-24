<script setup lang="ts">
/**
 * The deck's status strip (D-078), along the foot of the content: each
 * integration as a live dot (lit and pulsing while active, dim while not),
 * how long the shell took to answer, the API version, the route, and a UTC
 * clock in mono. Decorative motion stops under reduced motion.
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
</script>

<template>
  <footer class="atrium-statusbar flex shrink-0 items-center gap-3 overflow-hidden px-3" data-testid="atrium-statusbar">
    <span class="flex items-center gap-1.5" data-testid="atrium-status">
      <span class="atrium-live-dot" :data-state="online ? 'on' : 'off'" aria-hidden="true" />
      <span class="uppercase">{{ online ? t('atrium.shell.online') : t('atrium.shell.offline') }}</span>
    </span>
    <span class="atrium-statusbar-sep" aria-hidden="true" />
    <ul v-if="store.integrations.length" class="hidden items-center gap-2.5 md:flex" :aria-label="t('atrium.shell.integrations')">
      <li
        v-for="(integration, index) in store.integrations"
        :key="integration.key"
        class="flex items-center gap-1"
        :title="integration.label"
        :data-integration="integration.key"
        :data-active="integration.active"
      >
        <span class="atrium-live-dot" :data-state="integration.active ? 'on' : 'off'" :style="{ '--delay': `${index * 0.3}s` }" aria-hidden="true" />
        <span class="uppercase">{{ integration.key.slice(0, 4) }}</span>
      </li>
    </ul>
    <span class="ms-auto hidden truncate text-dimmed lg:inline">{{ route.path }}</span>
    <span v-if="store.latency !== null" class="tabular-nums" data-testid="atrium-latency">{{ t('atrium.shell.latency', { ms: store.latency }) }}</span>
    <span v-if="store.shell?.api_version" class="hidden sm:inline">API v{{ store.shell.api_version }}</span>
    <span class="tabular-nums text-highlighted" data-testid="atrium-clock">{{ clock }} UTC</span>
  </footer>
</template>
