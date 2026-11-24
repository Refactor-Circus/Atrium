<script setup lang="ts">
/**
 * One figure (D-077, D-078): a micro-label, the value in big monospaced
 * numerals, an optional delta chip, an optional sparkline of `series`, and a
 * hint. `tone` colours the top edge, sparkline and delta. The `value` slot
 * replaces the value (to wrap it in a test hook or a link).
 */
const props = withDefaults(defineProps<{
  label: string
  value?: string | number | null
  hint?: string | null
  icon?: string
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'primary'
  delta?: string | null
  series?: number[] | null
}>(), { value: null, hint: null, icon: undefined, tone: 'primary', delta: null, series: null })

const W = 96
const H = 28

/** The sparkline's line and area paths, scaled to the box. */
const spark = computed(() => {
  const values = props.series ?? []

  if (values.length < 2) {
    return null
  }

  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const points = values.map((value, i) => [
    (i / (values.length - 1)) * W,
    H - 2 - ((value - min) / span) * (H - 4)
  ] as const)
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  return { line, area: `${line} L${W},${H} L0,${H} Z`, last: points[points.length - 1]! }
})

const id = useId()
</script>

<template>
  <div class="atrium-stat" :data-tone="props.tone" data-testid="atrium-stat">
    <div class="flex items-center justify-between gap-2">
      <p class="atrium-label flex min-w-0 items-center gap-1.5">
        <UIcon v-if="props.icon" :name="props.icon" class="size-3.5 shrink-0" />
        <span class="truncate">{{ props.label }}</span>
      </p>
      <span v-if="props.delta" class="atrium-delta" data-testid="atrium-stat-delta">{{ props.delta }}</span>
    </div>
    <div class="mt-1 flex items-end justify-between gap-3">
      <p class="atrium-stat-value"><slot name="value">{{ props.value }}</slot></p>
      <svg v-if="spark" class="atrium-spark mb-1 shrink-0" :width="W" :height="H" :viewBox="`0 0 ${W} ${H}`" aria-hidden="true" data-testid="atrium-stat-spark">
        <defs>
          <linearGradient :id="`${id}-fill`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="currentColor" stop-opacity="0.35" />
            <stop offset="1" stop-color="currentColor" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path :d="spark.area" :fill="`url(#${id}-fill)`" />
        <path :d="spark.line" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round" />
        <circle :cx="spark.last[0]" :cy="spark.last[1]" r="2" fill="currentColor" />
      </svg>
    </div>
    <p v-if="props.hint" class="mt-0.5 text-xs text-muted">{{ props.hint }}</p>
  </div>
</template>
