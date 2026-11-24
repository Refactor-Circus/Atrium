<script setup lang="ts">
/** Every settings panel the user may open, on the settings screen. */
const { t } = useI18n()
const { data, status } = useAtriumSettings()

useHead({ title: () => t('atrium.settings.title') })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('atrium.settings.title')" />
    </template>
    <template #body>
      <USkeleton v-if="status === 'pending'" class="h-24" />
      <AtriumScreen v-else :screen="data?.screen">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <NuxtLink
            v-for="(panel, index) in data?.data ?? []"
            :key="panel.key"
            :to="`/settings/${encodeURIComponent(panel.key)}`"
            class="atrium-card atrium-module group flex items-center gap-3 rounded-[calc(var(--ui-radius)*1.5)] p-3"
            :data-testid="`atrium-settings-${panel.key}`"
          >
            <span class="atrium-module-icon grid size-9 shrink-0 place-items-center">
              <AtriumIcon :icon="panel.icon ?? 'i-lucide-settings'" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium text-highlighted">{{ panel.label }}</span>
              <span class="atrium-label block truncate">{{ String(index + 1).padStart(2, '0') }} · {{ panel.key }}</span>
            </span>
            <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
          </NuxtLink>
        </div>
      </AtriumScreen>
    </template>
  </UDashboardPanel>
</template>
