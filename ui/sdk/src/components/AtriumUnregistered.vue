<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UCollapsible from '@nuxt/ui/components/Collapsible.vue'
import { useI18n } from 'vue-i18n'

/**
 * Shown where the API names a component no package registered: the data is
 * there, the Vue half is missing. A neutral <UAlert> naming the key, so the
 * fix is obvious, with the data in a <UCollapsible>.
 */
defineProps<{
  kind: 'widget' | 'extension' | 'panel'
  componentKey: string | null
  data?: Record<string, unknown> | null
}>()

const { t } = useI18n()
</script>

<template>
  <UAlert
    color="neutral"
    variant="outline"
    icon="i-lucide-puzzle"
    :title="t('atrium.unregistered.message', { kind: t(`atrium.unregistered.kinds.${kind}`), key: componentKey ?? '' })"
    :ui="{ root: 'border border-dashed border-accented ring-0 bg-transparent', title: 'font-normal text-muted' }"
    data-testid="atrium-unregistered"
  >
    <template v-if="data && Object.keys(data).length" #description>
      <UCollapsible class="mt-1">
        <UButton :label="t('atrium.unregistered.data')" color="neutral" variant="link" size="xs" trailing-icon="i-lucide-chevron-down" class="px-0" />
        <template #content>
          <pre class="mt-1 max-h-48 overflow-auto rounded-(--ui-radius) bg-elevated p-2 font-mono text-xs">{{ data }}</pre>
        </template>
      </UCollapsible>
    </template>
  </UAlert>
</template>
