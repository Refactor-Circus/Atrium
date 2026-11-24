<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UBadge from '@nuxt/ui/components/Badge.vue'
import { useI18n } from 'vue-i18n'

/**
 * In place of a widget, section, tab or settings panel whose data failed to
 * load: the server isolated the failure (`error`), or the request for it
 * failed. The rest of the page carries on. An error <UAlert>, which the
 * deck's theme draws as a fault line (D-078), headed by an `ERR` code.
 */
defineProps<{ message: string }>()

const { t } = useI18n()
</script>

<template>
  <UAlert
    color="error"
    variant="subtle"
    icon="i-lucide-octagon-alert"
    role="alert"
    data-code="ERR"
    data-testid="atrium-error-card"
  >
    <template #title>
      <span class="flex items-center gap-2">
        <UBadge label="ERR" color="error" variant="solid" aria-hidden="true" />
        <span class="atrium-label text-error">{{ t('atrium.shell.fault') }}</span>
      </span>
    </template>
    <template #description>
      <span class="font-mono text-xs">{{ message }}</span>
    </template>
  </UAlert>
</template>
