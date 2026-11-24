<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * Shown where the API names a component no package registered: the data is
 * there, the Vue half is missing. Names the key, so the fix is obvious.
 */
defineProps<{
  kind: 'widget' | 'extension' | 'panel'
  componentKey: string | null
  data?: Record<string, unknown> | null
}>()

const { t } = useI18n()
</script>

<template>
  <div class="rounded-md border border-dashed border-default p-3 text-sm text-muted" data-testid="atrium-unregistered">
    <p>{{ t('atrium.unregistered.message', { kind: t(`atrium.unregistered.kinds.${kind}`), key: componentKey ?? '' }) }}</p>
    <details v-if="data && Object.keys(data).length" class="mt-2">
      <summary class="cursor-pointer">{{ t('atrium.unregistered.data') }}</summary>
      <pre class="mt-1 overflow-auto text-xs">{{ data }}</pre>
    </details>
  </div>
</template>
