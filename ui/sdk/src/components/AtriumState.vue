<script setup lang="ts">
import UEmpty from '@nuxt/ui/components/Empty.vue'
import { computed } from 'vue'

/**
 * An empty, failed or forbidden state in the deck's style (D-077): Nuxt
 * UI's <UEmpty> with an icon in a lit socket, a title, an optional
 * description and actions (default slot). `compact` fits it inside a panel
 * or table.
 */
const props = withDefaults(defineProps<{
  kind?: 'empty' | 'error' | 'locked' | 'info'
  title: string
  description?: string | null
  icon?: string
  compact?: boolean
}>(), { kind: 'empty', description: null, icon: undefined, compact: false })

const icons = { empty: 'i-lucide-inbox', error: 'i-lucide-triangle-alert', locked: 'i-lucide-lock', info: 'i-lucide-info' } as const

const tone = computed(() => ({
  error: 'text-error shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ui-error)_45%,transparent),0_0_24px_-8px_var(--ui-error)]',
  locked: 'text-warning shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ui-warning)_45%,transparent),0_0_24px_-8px_var(--ui-warning)]',
  empty: '',
  info: ''
})[props.kind])
</script>

<template>
  <UEmpty
    :icon="props.icon ?? icons[props.kind]"
    :title="props.title"
    :description="props.description ?? undefined"
    :size="props.compact ? 'xs' : 'md'"
    :variant="props.compact ? 'naked' : 'outline'"
    :ui="{ root: props.compact ? 'py-6' : 'py-14', avatar: tone }"
    :data-kind="props.kind"
    :role="props.kind === 'error' ? 'alert' : 'status'"
    data-testid="atrium-state"
  >
    <template v-if="$slots.default" #actions>
      <slot />
    </template>
  </UEmpty>
</template>
