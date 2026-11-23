<script setup lang="ts">
import { statusColor } from './shared'

/** A run, step, channel, subscription or delivery status, coloured by state. */
const props = defineProps<{ status: string | null | undefined }>()

const { t, te } = useI18n()

const label = computed(() => {
  const key = `impex.statuses.${props.status ?? ''}`

  return props.status && te(key) ? t(key) : (props.status ?? '—')
})
</script>

<template>
  <UBadge :color="statusColor(status)" variant="subtle" :data-status="status ?? undefined">
    {{ label }}
  </UBadge>
</template>
