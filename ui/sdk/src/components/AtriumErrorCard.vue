<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * In place of a widget, section, tab or settings panel whose data failed to
 * load: the server isolated the failure (`error`), or the request for it
 * failed. The rest of the page carries on. Drawn as a terminal fault readout
 * (D-078); the head's code and label are decoration (CSS), not text.
 */
defineProps<{ message: string }>()

const { t } = useI18n()
</script>

<template>
  <div class="atrium-terminal" data-tone="error" role="alert" data-testid="atrium-error-card">
    <div class="atrium-terminal-head" data-code="ERR" aria-hidden="true">{{ t('atrium.shell.fault') }}</div>
    <p class="atrium-terminal-body">
      <span class="min-w-0">{{ message }}<span class="atrium-cursor" aria-hidden="true" /></span>
    </p>
  </div>
</template>
