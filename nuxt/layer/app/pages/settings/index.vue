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
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="panel in data?.data ?? []"
            :key="panel.key"
            :to="`/settings/${encodeURIComponent(panel.key)}`"
            class="flex items-center gap-3 rounded-lg border border-default p-4 hover:bg-elevated"
            :data-testid="`atrium-settings-${panel.key}`"
          >
            <AtriumIcon :icon="panel.icon ?? 'i-lucide-settings'" />
            <span class="font-medium">{{ panel.label }}</span>
          </NuxtLink>
        </div>
      </AtriumScreen>
    </template>
  </UDashboardPanel>
</template>
