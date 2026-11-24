<script setup lang="ts">
/**
 * One figure in the deck's style (D-077): a micro-label, the value in
 * monospaced figures, and an optional trend or note. `tone` lights the
 * value's edge (success, warning, error) for a figure that needs attention.
 * The `value` slot replaces the value (to wrap it in a test hook or a link).
 */
const props = withDefaults(defineProps<{
  label: string
  value?: string | number | null
  hint?: string | null
  icon?: string
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'primary'
}>(), { value: null, hint: null, icon: undefined, tone: 'neutral' })
</script>

<template>
  <div class="atrium-stat" :data-tone="props.tone" data-testid="atrium-stat">
    <p class="atrium-label flex items-center gap-1.5">
      <UIcon v-if="props.icon" :name="props.icon" class="size-3.5" />
      {{ props.label }}
    </p>
    <p class="atrium-mono mt-1 text-[1.375rem] font-medium leading-7 text-highlighted"><slot name="value">{{ props.value }}</slot></p>
    <p v-if="props.hint" class="mt-0.5 text-xs text-muted">{{ props.hint }}</p>
  </div>
</template>
