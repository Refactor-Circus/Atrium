<script setup lang="ts">
import type { AtriumWidgetDefinition } from '../../types/atrium'

/** The widget catalogue (`atrium.widgets.index`), loaded when first opened. */
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ pick: [widget: AtriumWidgetDefinition] }>()

const api = useAtriumApi()
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
const filtered = computed(() => (Array.isArray(catalogue.value) ? catalogue.value : []).filter(w =>
  `${w.label} ${w.description ?? ''}`.toLowerCase().includes(query.value.toLowerCase())))

function choose(widget: AtriumWidgetDefinition) {
  emit('pick', widget)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="t('atrium.picker.title')" :description="t('atrium.picker.description')">
    <template #body>
      <UInput v-model="query" icon="i-lucide-search" :placeholder="t('atrium.picker.filter')" class="mb-3 w-full" />
      <p v-if="status === 'pending'" class="text-sm text-muted">{{ t('atrium.picker.loading') }}</p>
      <ul v-else class="divide-y divide-default">
        <li v-for="widget in filtered" :key="widget.key">
          <button
            type="button"
            class="flex w-full items-start gap-3 rounded px-2 py-3 text-left hover:bg-elevated"
            :data-testid="`atrium-pick-${widget.key}`"
            @click="choose(widget)"
          >
            <AtriumIcon :icon="widget.icon ?? 'i-lucide-layout-grid'" />
            <span>
              <span class="block font-medium">{{ widget.label }}</span>
              <span v-if="widget.description" class="block text-sm text-muted">{{ widget.description }}</span>
            </span>
          </button>
        </li>
      </ul>
    </template>
  </UModal>
</template>
