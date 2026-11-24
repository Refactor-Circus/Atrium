<script setup lang="ts">
import PennantPlusFeatureFlags from '../components/PennantPlusFeatureFlags.vue'

/**
 * `pennantplus.features`: the feature flag values Pennant has stored, from
 * PennantPlus's API, inside the extensions other packages registered for the
 * screen (`atrium.screens.show`).
 */
const { t } = useI18n()

useHead({ title: () => t('pennantplus.features.title') })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('pennantplus.features.title')" />
    </template>
    <template #body>
      <p class="mb-4 text-sm text-muted">{{ t('pennantplus.features.description') }}</p>
      <AtriumIntegrationScreen screen-key="pennantplus.features">
        <PennantPlusFeatureFlags />
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
