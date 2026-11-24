<script setup lang="ts">
import UCommandPalette from '@nuxt/ui/components/CommandPalette.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import { watch, ref, computed } from 'vue'
import { useAtriumApi } from '../composables/useAtriumApi'
import { useAtriumIcon } from '../composables/useAtriumIcon'
import { useI18n } from 'vue-i18n'
import { useAsyncData } from '../runtime/asyncData'

import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import type { AtriumWidgetDefinition } from '../types/atrium'

/**
 * The widget catalogue (`atrium.widgets.index`), loaded when first opened:
 * a <UModal> holding a filterable <UCommandPalette> of every widget, its
 * description beside it. Choosing one emits `pick` and closes.
 */
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ pick: [widget: AtriumWidgetDefinition] }>()

const api = useAtriumApi()
const { resolve } = useAtriumIcon()
const { t } = useI18n()

const { data: catalogue, status, execute } = useAsyncData(
  'atrium-widgets',
  async () => (await api<{ data: AtriumWidgetDefinition[] }>('/widgets')).data,
  { server: false, immediate: false }
)

watch(open, (opened) => {
  if (opened && status.value === 'idle') {
    void execute()
  }
}, { immediate: true })

const query = ref('')

const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => [{
  id: 'atrium-widgets',
  label: t('atrium.picker.title'),
  items: (Array.isArray(catalogue.value) ? catalogue.value : []).map(widget => ({
    label: widget.label,
    suffix: widget.description ?? undefined,
    icon: resolve(widget.icon ?? 'i-lucide-layout-grid'),
    value: widget.key,
    onSelect: () => choose(widget)
  }))
}])

function choose(widget: AtriumWidgetDefinition) {
  emit('pick', widget)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="t('atrium.picker.title')" :description="t('atrium.picker.description')" :ui="{ body: 'p-0 sm:p-0' }">
    <template #body>
      <UCommandPalette
        v-model:search-term="query"
        :groups="groups"
        :loading="status === 'pending'"
        :placeholder="t('atrium.picker.filter')"
        class="h-[min(24rem,60vh)]"
        data-testid="atrium-widget-picker"
      />
    </template>
  </UModal>
</template>
