<script setup lang="ts">
/**
 * An empty, failed or forbidden state in the deck's style (D-077): an icon
 * in a lit frame, a title, an optional description and actions (default
 * slot). `compact` fits it inside a panel or table.
 */
const props = withDefaults(defineProps<{
  kind?: 'empty' | 'error' | 'locked' | 'info'
  title: string
  description?: string | null
  icon?: string
  compact?: boolean
}>(), { kind: 'empty', description: null, icon: undefined, compact: false })

const icons = { empty: 'i-lucide-inbox', error: 'i-lucide-triangle-alert', locked: 'i-lucide-lock', info: 'i-lucide-info' } as const
</script>

<template>
  <div
    class="atrium-state flex flex-col items-center text-center"
    :class="props.compact ? 'gap-2 px-3 py-6' : 'gap-3 px-4 py-14'"
    :data-kind="props.kind"
    :role="props.kind === 'error' ? 'alert' : 'status'"
    data-testid="atrium-state"
  >
    <span class="atrium-state-icon grid place-items-center" :class="props.compact ? 'size-8' : 'size-11'">
      <UIcon :name="props.icon ?? icons[props.kind]" :class="props.compact ? 'size-4' : 'size-5'" />
    </span>
    <div class="max-w-md space-y-1">
      <p class="font-semibold text-highlighted" :class="props.compact ? 'text-sm' : 'text-[0.9375rem]'">{{ props.title }}</p>
      <p v-if="props.description" class="text-sm text-muted">{{ props.description }}</p>
    </div>
    <div v-if="$slots.default" class="mt-1 flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>
