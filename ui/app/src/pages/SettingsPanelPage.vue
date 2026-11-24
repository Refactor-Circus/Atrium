<script setup lang="ts">
/** One settings panel, with its screen's tabs and sections. */
const route = useRoute()
const { t } = useI18n()

const { data, status, error } = useAtriumSettingsPanel(() => String(route.params.panel))

const panel = computed(() => data.value?.data ?? null)

useHead({ title: () => panel.value?.label ?? t('atrium.settings.title') })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="panel?.label ?? t('atrium.settings.title')">
        <template #leading>
          <UButton to="/settings" icon="i-lucide-arrow-left" color="neutral" variant="ghost" :aria-label="t('atrium.settings.all')" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <USkeleton v-if="status === 'pending' && !panel" class="h-40" />
      <UAlert v-else-if="error" color="error" :title="t('atrium.settings.load_failed')" />
      <AtriumSettingsPanel v-else-if="panel" :panel="panel" :screen="data?.screen" />
    </template>
  </UDashboardPanel>
</template>
