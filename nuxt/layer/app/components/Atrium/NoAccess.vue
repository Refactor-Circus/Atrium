<script setup lang="ts">
/**
 * In place of a screen, widget or section the user may not see: its API
 * answered 403. Integration pages, widgets and hooks render it rather than an
 * error (D-031). Drawn as the deck's locked strip (D-077).
 */
defineProps<{ title?: string, description?: string, compact?: boolean }>()

const { t } = useI18n()
</script>

<template>
  <div
    class="atrium-strip"
    data-tone="locked"
    :class="compact ? '' : 'py-3'"
    role="status"
    data-testid="atrium-no-access"
  >
    <UIcon name="i-lucide-lock" class="atrium-strip-icon size-4 shrink-0" />
    <div class="min-w-0">
      <p class="font-medium text-highlighted">{{ title ?? t('atrium.no_access.title') }}</p>
      <p v-if="!compact || description" class="text-muted">{{ description ?? t('atrium.no_access.description') }}</p>
    </div>
  </div>
</template>
