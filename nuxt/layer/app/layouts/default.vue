<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

/**
 * The Atrium shell (D-077): the section rail and its page panel, the top bar
 * (where you are, ⌘K, live status, theme and colour mode) and the content on
 * the deck's canvas, all from GET /shell, loaded once on boot. Below `lg` the
 * navigation moves into a drawer the top bar opens. The panel's collapsed
 * state is remembered per browser (`atrium-nav-collapsed`). The version
 * banner warns when the API and this layer have drifted apart, and the
 * response notices show what response handlers raised (D-049).
 *
 * A `/{pkg}/…` page whose integration is not active (the
 * `atrium-integration` middleware marks it) is replaced by
 * <AtriumIntegrationUnavailable>, so the page never calls its package.
 */
const store = useAtriumShellStore()
const route = useRoute()
const { t } = useI18n()

await store.load()

// Applies the chosen theme's tokens on :root for the whole shell.
useAtriumTheme()

const unavailable = computed(() => route.meta.atriumUnavailable ?? null)
const collapsed = useLocalStorage('atrium-nav-collapsed', false)
const drawer = ref(false)

watch(() => route.fullPath, () => { drawer.value = false })

useHead({ titleTemplate: title => (title ? `${title} · ` : '') + (store.shell?.app.name ?? 'Atrium') })
</script>

<template>
  <UDashboardGroup class="atrium-shell">
    <aside class="atrium-sidebar hidden h-full shrink-0 lg:flex">
      <AtriumNavigation :collapsed="collapsed" />
    </aside>

    <div class="atrium-canvas flex min-w-0 flex-1 flex-col">
      <AtriumTopbar v-model:collapsed="collapsed" @menu="drawer = true" />
      <AtriumVersionBanner />
      <AtriumResponseNotice />
      <main class="atrium-content flex min-h-0 flex-1 flex-col">
        <div v-if="store.error" class="atrium-page">
          <AtriumState kind="error" :title="t('atrium.app.unreachable')" :description="String(store.error)" />
        </div>
        <AtriumIntegrationUnavailable
          v-else-if="unavailable"
          :integration="unavailable.integration"
          :reason="unavailable.reason"
          :label="store.integration(unavailable.integration)?.label"
        />
        <div v-else class="atrium-page">
          <slot />
        </div>
      </main>
    </div>

    <USlideover
      v-model:open="drawer"
      side="left"
      :title="store.shell?.app.name ?? 'Atrium'"
      :description="t('atrium.nav.sections')"
      :ui="{ content: 'w-auto max-w-[calc(100vw-3rem)]', header: 'sr-only', body: 'p-0 sm:p-0 flex' }"
      data-testid="atrium-drawer"
    >
      <template #body>
        <AtriumNavigation />
      </template>
    </USlideover>
  </UDashboardGroup>
</template>
