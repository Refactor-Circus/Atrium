<script setup lang="ts">
import type { AtriumIntegrationUnavailableReason } from '../../types/atrium'

/**
 * In place of a `/{pkg}/…` page whose integration is not active in the
 * shell (D-023): the page is never set up, so its package's API is not
 * called. The shell lists only registered integrations, so a package that is
 * not installed and one turned off with `atrium.integrations.{pkg}.enabled`
 * look the same here (`absent`); one flagged off for the user is `inactive`.
 */
const props = defineProps<{ integration: string, reason: AtriumIntegrationUnavailableReason, label?: string | null }>()

const { t } = useI18n()

const name = computed(() => props.label || props.integration)

useHead({ title: () => t('atrium.integrations.unavailable.page_title', { name: name.value }) })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="name" />
    </template>
    <template #body>
      <UAlert
        :color="reason === 'inactive' ? 'neutral' : 'warning'"
        :icon="reason === 'inactive' ? 'i-lucide-toggle-left' : 'i-lucide-package-x'"
        :title="t(`atrium.integrations.unavailable.${reason}_title`, { name })"
        :description="t(`atrium.integrations.unavailable.${reason}_description`, { name })"
        :data-reason="reason"
        data-testid="atrium-integration-unavailable"
      />
    </template>
  </UDashboardPanel>
</template>
