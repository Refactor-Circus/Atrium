<script setup lang="ts">
/**
 * In place of a widget, section, tab or settings panel whose data failed to
 * load: the server isolated the failure (`error`), or the request for it
 * failed. The rest of the page carries on.
 */
defineProps<{ message: string }>()
</script>

<template>
  <div class="flex items-start gap-2 rounded-md border border-error/40 p-3 text-sm text-error" role="alert" data-testid="atrium-error-card">
    <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" />
    <p>{{ message }}</p>
  </div>
</template>
