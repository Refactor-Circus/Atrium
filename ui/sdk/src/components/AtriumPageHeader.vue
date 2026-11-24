<script setup lang="ts">
import UPageHeader from '@nuxt/ui/components/PageHeader.vue'

/**
 * A page's header in the deck's style (D-077), Nuxt UI's <UPageHeader>: an
 * optional overline (the section, a record type) as its headline, the
 * title, a description or `meta` line, and the page's actions on the right
 * (default slot).
 */
defineProps<{ title: string, overline?: string | null, description?: string | null }>()
</script>

<template>
  <UPageHeader
    :headline="overline ?? undefined"
    :title="title"
    :description="description ?? undefined"
    :ui="{ title: 'truncate' }"
    data-testid="atrium-page-header"
  >
    <template v-if="$slots.meta" #description>
      <p v-if="description">{{ description }}</p>
      <slot name="meta" />
    </template>
    <template v-if="$slots.default" #links>
      <slot />
    </template>
  </UPageHeader>
</template>
