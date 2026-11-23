<script setup lang="ts">
/**
 * In place of a screen, widget or section the user may not see: its API
 * answered 403. Integration pages, widgets and hooks render it rather than an
 * error (D-031).
 */
defineProps<{ title?: string, description?: string, compact?: boolean }>()

const { t } = useI18n()
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-md border border-default text-sm"
    :class="compact ? 'p-3' : 'p-4'"
    role="status"
    data-testid="atrium-no-access"
  >
    <UIcon name="i-lucide-lock" class="mt-0.5 size-4 shrink-0 text-muted" />
    <div class="min-w-0">
      <p class="font-medium">{{ title ?? t('atrium.no_access.title') }}</p>
      <p v-if="!compact || description" class="text-muted">{{ description ?? t('atrium.no_access.description') }}</p>
    </div>
  </div>
</template>
