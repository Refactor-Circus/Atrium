<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UIcon from '@nuxt/ui/runtime/vue/components/Icon.vue'
import { computed, useId } from 'vue'

/**
 * One figure (D-077, D-078): a micro-label, the value in big monospaced
 * numerals, an optional delta (a <UBadge> in the tone), an optional
 * sparkline of `series`, and a hint. `tone` colours the top edge, sparkline
 * and delta. The `value` slot replaces the value (to wrap it in a test hook
 * or a link). On its own it is a glass panel; inside a panel (a widget's
 * <UCard>) it borrows the panel's frame.
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

/** The tone as a colour variable, for the edge and the sparkline. */
const tones = {
  primary: '[--tone:var(--ui-primary)]',
  success: '[--tone:var(--ui-success)]',
  warning: '[--tone:var(--ui-warning)]',
  error: '[--tone:var(--ui-error)]',
  neutral: '[--tone:var(--ui-border-accented)]'
} as const

const id = useId()
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[calc(var(--ui-radius)*1.5)] bg-(color:--atrium-glass) bg-(image:--atrium-sheen) px-3 pt-2.5 pb-2 shadow-(--atrium-panel-shadow) backdrop-blur-(--atrium-blur) before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,var(--tone),transparent_70%)] before:shadow-[0_0_8px_var(--tone)] in-[.atrium-panel]:overflow-visible in-[.atrium-panel]:bg-none in-[.atrium-panel]:bg-transparent in-[.atrium-panel]:p-0 in-[.atrium-panel]:shadow-none in-[.atrium-panel]:backdrop-blur-none in-[.atrium-panel]:before:hidden"
    :class="tones[props.tone]"
    :data-tone="props.tone"
    data-testid="atrium-stat"
  >
    <div class="flex items-center justify-between gap-2">
      <p class="atrium-label flex min-w-0 items-center gap-1.5">
        <UIcon v-if="props.icon" :name="props.icon" class="size-3.5 shrink-0" />
        <span class="truncate">{{ props.label }}</span>
      </p>
      <UBadge v-if="props.delta" :label="props.delta" :color="props.tone" variant="soft" data-testid="atrium-stat-delta" />
    </div>
    <div class="mt-1 flex items-end justify-between gap-3">
      <p class="font-mono text-[1.625rem] leading-8 font-medium tracking-[-0.04em] text-highlighted tabular-nums slashed-zero">
        <slot name="value">{{ props.value }}</slot>
      </p>
      <svg
        v-if="spark"
        class="mb-1 shrink-0 text-(--tone) drop-shadow-[0_0_4px_color-mix(in_oklab,var(--tone)_60%,transparent)]"
        :width="W"
        :height="H"
        :viewBox="`0 0 ${W} ${H}`"
        aria-hidden="true"
        data-testid="atrium-stat-spark"
      >
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
