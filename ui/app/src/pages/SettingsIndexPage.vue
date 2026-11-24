<script setup lang="ts">
/** Every settings panel the user may open, on the settings screen: a <UPageGrid> of <UPageCard> links. */
const { t } = useI18n()
const { data, status } = useAtriumSettings()
const { resolve } = useAtriumIcon()

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
        <UPageGrid>
          <UPageCard
            v-for="(panel, index) in data?.data ?? []"
            :key="panel.key"
            :to="`/settings/${encodeURIComponent(panel.key)}`"
            :title="panel.label"
            :description="`${String(index + 1).padStart(2, '0')} · ${panel.key}`"
            :icon="resolve(panel.icon ?? 'i-lucide-settings')"
            variant="outline"
            :ui="{ wrapper: 'grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-3', leading: 'row-span-2', title: 'truncate', description: 'atrium-label mt-0 truncate', footer: 'hidden' }"
            :data-testid="`atrium-settings-${panel.key}`"
          >
            <template #title>
              <span class="flex items-center gap-2">
                <span class="min-w-0 flex-1 truncate">{{ panel.label }}</span>
                <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
              </span>
            </template>
          </UPageCard>
        </UPageGrid>
      </AtriumScreen>
    </template>
  </UDashboardPanel>
</template>
