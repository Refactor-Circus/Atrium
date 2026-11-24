<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * In place of a screen, widget or section the user may not see: its API
 * answered 403. Integration pages, widgets and hooks render it rather than an
 * error (D-031). A warning <UAlert> (a fault line in the deck's theme, D-078)
 * coded `403`; `compact` leaves out the default description.
 */
const props = defineProps<{ title?: string, description?: string, compact?: boolean }>()

const { t } = useI18n()

const detail = computed(() => props.description ?? (props.compact ? undefined : t('atrium.no_access.description')))
</script>

<template>
  <UAlert
    color="warning"
    variant="subtle"
    icon="i-lucide-lock"
    :title="props.title ?? t('atrium.no_access.title')"
    :description="detail"
    role="status"
    data-code="403"
    data-testid="atrium-no-access"
  />
</template>
