<script setup lang="ts">
/**
 * In place of a widget, section, tab or settings panel whose data failed to
 * load: the server isolated the failure (`error`), or the request for it
 * failed. The rest of the page carries on. Drawn as the deck's fault strip
 * (D-077).
 */
defineProps<{ message: string }>()
</script>

<template>
  <div class="atrium-strip" data-tone="error" role="alert" data-testid="atrium-error-card">
    <UIcon name="i-lucide-triangle-alert" class="atrium-strip-icon size-4 shrink-0" />
    <p class="min-w-0">{{ message }}</p>
  </div>
</template>
