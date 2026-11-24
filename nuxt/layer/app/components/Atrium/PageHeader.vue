<script setup lang="ts">
/**
 * A page's header in the deck's style (D-077): an optional overline (the
 * section, a record type), the title, a description or meta line, and the
 * page's actions on the right (default slot). Pages that render their own
 * `<h1>` get the same title style from atrium.css.
 */
defineProps<{ title: string, overline?: string | null, description?: string | null }>()
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-3" data-testid="atrium-page-header">
    <div class="min-w-0">
      <p v-if="overline" class="atrium-label mb-0.5">{{ overline }}</p>
      <h1 class="truncate">{{ title }}</h1>
      <p v-if="description" class="mt-0.5 text-sm text-muted">{{ description }}</p>
      <slot name="meta" />
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-1.5">
      <slot />
    </div>
  </header>
</template>
