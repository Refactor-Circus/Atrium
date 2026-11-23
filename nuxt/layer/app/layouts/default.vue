<script setup lang="ts">
/**
 * The Atrium shell: sidebar navigation, ⌘K search, the theme switcher and
 * the signed-in user, all from GET /shell, loaded once on boot. The version
 * banner warns when the API and this layer have drifted apart, and the
 * response notices show what response handlers raised (D-049).
 *
 * A `/{pkg}/…` page whose integration is not active (the
 * `atrium-integration` middleware marks it) is replaced by
 * <AtriumIntegrationUnavailable>, so the page never calls its package.
 */
const store = useAtriumShellStore()
const theme = useAtriumTheme()
const route = useRoute()
const { t } = useI18n()

await store.load()

const unavailable = computed(() => route.meta.atriumUnavailable ?? null)

useHead({ titleTemplate: title => (title ? `${title} · ` : '') + (store.shell?.app.name ?? 'Atrium') })

const themeItems = computed(() => [theme.themes.value.map(item => ({
  label: item.label,
  type: 'checkbox' as const,
  checked: item.key === theme.current.value?.key,
  onSelect: () => theme.choose(item.key)
}))])
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :ui="{ footer: 'border-t border-default' }">
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="truncate font-semibold" :class="collapsed ? 'sr-only' : ''">
          {{ store.shell?.app.name ?? 'Atrium' }}
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <AtriumSearch v-if="!collapsed" />
        <AtriumNavigation :collapsed="collapsed" />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex w-full items-center gap-2">
          <UAvatar v-if="store.shell?.user" :alt="store.shell.user.name ?? ''" size="sm" />
          <div v-if="!collapsed && store.shell?.user" class="min-w-0 flex-1 text-sm">
            <p class="truncate font-medium">{{ store.shell.user.name }}</p>
            <p class="truncate text-muted">{{ store.shell.user.email }}</p>
          </div>
          <UDropdownMenu v-if="theme.switchable.value && theme.themes.value.length > 1" :items="themeItems">
            <UButton icon="i-lucide-palette" color="neutral" variant="ghost" :aria-label="t('atrium.theme.label')" />
          </UDropdownMenu>
          <UColorModeButton />
        </div>
      </template>
    </UDashboardSidebar>

    <div class="flex min-w-0 flex-1 flex-col">
      <AtriumVersionBanner />
      <AtriumResponseNotice />
      <div v-if="store.error" class="m-6">
        <UAlert color="error" :title="t('atrium.app.unreachable')" :description="String(store.error)" />
      </div>
      <AtriumIntegrationUnavailable
        v-else-if="unavailable"
        :integration="unavailable.integration"
        :reason="unavailable.reason"
        :label="store.integration(unavailable.integration)?.label"
      />
      <slot v-else />
    </div>
  </UDashboardGroup>
</template>
