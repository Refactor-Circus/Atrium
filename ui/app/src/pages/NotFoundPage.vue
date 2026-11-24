<script setup lang="ts">
/**
 * A navigation link to a page no package's Nuxt layer provides yet: each
 * package ships its own Vue pages for the links it adds.
 */
const route = useRoute()
const { t } = useI18n()

useHead({ title: () => t('atrium.not_found.title') })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('atrium.not_found.title')" />
    </template>
    <template #body>
      <UAlert
        color="warning"
        icon="i-lucide-construction"
        :title="t('atrium.not_found.heading')"
        :description="t('atrium.not_found.description', { path: route.path })"
      />
    </template>
  </UDashboardPanel>
</template>
