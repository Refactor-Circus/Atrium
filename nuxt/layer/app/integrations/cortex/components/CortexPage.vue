<script setup lang="ts">
/**
 * The frame of a Cortex page: the dashboard panel with its title and header
 * actions, and the screen's extensions (`atrium.screens.show`) around the
 * page's body.
 */
const props = defineProps<{
  title: string
  screenKey: string
  record?: string | null
  description?: string | null
  back?: { to: string, label: string }
}>()

defineSlots<{ default?: () => unknown, actions?: () => unknown }>()

useHead({ title: () => props.title })
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="title">
        <template v-if="back" #leading>
          <UButton :to="back.to" icon="i-lucide-arrow-left" color="neutral" variant="ghost" :aria-label="back.label" data-testid="cortex-back" />
        </template>
        <template #right>
          <slot name="actions" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <p v-if="description" class="mb-4 text-sm text-muted">{{ description }}</p>
      <AtriumIntegrationScreen :screen-key="screenKey" :record="record ?? null">
        <slot />
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
