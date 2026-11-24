<script setup lang="ts">
/**
 * The demo's stat widget on the layer's <AtriumStat>. The sparkline is a
 * made-up series derived from the label (the demo data has no history).
 */
const props = defineProps<{ data: { label?: string, icon?: string, value?: string | number, change?: string, trend?: 'up' | 'down' | null } }>()

const series = computed(() => {
  let seed = [...(props.data.label ?? '')].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const drift = props.data.trend === 'down' ? -0.6 : 0.8

  return Array.from({ length: 14 }, (_, i) => {
    seed = (seed * 9301 + 49297) % 233280

    return 10 + i * drift + (seed / 233280) * 4
  })
})

const tone = computed(() => props.data.trend === 'up' ? 'success' : props.data.trend === 'down' ? 'error' : 'primary')
</script>

<template>
  <AtriumStat
    class="h-full"
    :label="data.label ?? ''"
    :value="data.value"
    :icon="data.icon"
    :delta="data.change?.split(' ')[0] ?? null"
    :hint="data.change?.split(' ').slice(1).join(' ') || null"
    :series="series"
    :tone="tone"
  />
</template>
