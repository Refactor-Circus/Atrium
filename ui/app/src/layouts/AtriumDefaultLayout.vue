<script setup lang="ts">
/**
 * The Atrium shell (D-077, D-091), Nuxt UI's dashboard: a <UDashboardGroup>
 * on the deck's canvas, a collapsible <UDashboardSidebar> holding the
 * section rail and its page panel (a slideover below `lg`, which the top
 * bar opens), and the content column: the top bar (where you are, ⌘K,
 * theme and colour mode), the page and the status strip, all from GET
 * /shell, loaded once on boot. The sidebar remembers whether it is
 * collapsed per browser. The version banner warns when the API and this
 * layer have drifted apart, and the response notices show what response
 * handlers raised (D-049).
 *
 * A `/{pkg}/…` page whose integration is not active (the
 * integration guard marks it) is replaced by
 * <AtriumIntegrationUnavailable>, so the page never calls its package.
 * A page that is a <UDashboardPanel> fills the content column; any other
 * scrolls inside it with the deck's padding.
 */
const store = useAtriumShellStore()
const route = useRoute()
const { t } = useI18n()

await store.load()

// Applies the chosen theme's tokens on :root for the whole shell.
useAtriumTheme()

const unavailable = computed(() => route.meta.atriumUnavailable ?? null)
const collapsed = ref(false)
const drawer = ref(false)

watch(() => route.fullPath, () => { drawer.value = false })

useHead({ titleTemplate: title => (title ? `${title} · ` : '') + (store.shell?.app.name ?? 'Atrium') })
</script>

<template>
  <UDashboardGroup storage="local" storage-key="atrium" unit="rem" data-testid="atrium-shell">
    <UDashboardSidebar
      id="nav"
      v-model:collapsed="collapsed"
      v-model:open="drawer"
      collapsible
      :default-size="17.75"
      :collapsed-size="3.25"
      :min-size="3.25"
      :max-size="17.75"
      :toggle="false"
      :menu="{ title: store.shell?.app.name ?? 'Atrium', description: t('atrium.nav.sections') }"
      data-testid="atrium-sidebar"
    >
      <template #default="{ collapsed: folded }">
        <AtriumNavigation :collapsed="folded" />
      </template>
    </UDashboardSidebar>

    <div class="flex min-w-0 flex-1 flex-col">
      <AtriumTopbar v-model:collapsed="collapsed" @menu="drawer = true" />
      <AtriumVersionBanner />
      <AtriumResponseNotice />
      <main
        class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3.5 pb-8 text-sm lg:px-5 lg:pt-4 lg:pb-10 has-[>.atrium-dashboard-panel]:overflow-hidden has-[>.atrium-dashboard-panel]:p-0 *:animate-[atrium-rise_200ms_var(--atrium-ease)_both]"
        data-atrium-content
      >
        <AtriumState v-if="store.error" kind="error" :title="t('atrium.app.unreachable')" :description="String(store.error)" />
        <AtriumIntegrationUnavailable
          v-else-if="unavailable"
          :integration="unavailable.integration"
          :reason="unavailable.reason"
          :label="store.integration(unavailable.integration)?.label"
        />
        <slot v-else />
      </main>
      <AtriumStatusBar />
    </div>
  </UDashboardGroup>
</template>
