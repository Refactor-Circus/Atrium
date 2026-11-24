<script setup lang="ts">
/**
 * In place of a screen, widget or section the user may not see: its API
 * answered 403. Integration pages, widgets and hooks render it rather than an
 * error (D-031). Drawn as a terminal readout in the warning tone (D-078).
 */
defineProps<{ title?: string, description?: string, compact?: boolean }>()

const { t } = useI18n()
</script>

<template>
  <div class="atrium-terminal" data-tone="locked" role="status" data-testid="atrium-no-access">
    <div v-if="!compact" class="atrium-terminal-head" data-code="403" aria-hidden="true">{{ t('atrium.shell.restricted') }}</div>
    <div class="atrium-terminal-body">
      <UIcon name="i-lucide-lock" class="mt-0.5 size-3.5 shrink-0 text-warning" />
      <div class="min-w-0 font-sans text-sm">
        <p class="font-medium text-highlighted">{{ title ?? t('atrium.no_access.title') }}</p>
        <p v-if="!compact || description" class="text-muted">{{ description ?? t('atrium.no_access.description') }}</p>
      </div>
    </div>
  </div>
</template>
