<script setup lang="ts">
import type { CortexPickerTool } from './cortex'

/**
 * A checkbox list of tools, narrowed by tag, name and selection. Filtering
 * only hides rows: a checked tool stays selected while it is out of view.
 * A newly checked tool is added after those already selected, so a saved
 * order is kept.
 */
const props = defineProps<{ tools: CortexPickerTool[], idPrefix?: string }>()

const selected = defineModel<string[]>({ required: true })

const { t } = useI18n()

const tag = ref<string | null>(null)
const search = ref('')
const selectedOnly = ref(false)

const tags = computed(() => [...new Set(props.tools.flatMap(tool => tool.tags))].sort())

function shows(tool: CortexPickerTool): boolean {
  return (tag.value === null || tool.tags.includes(tag.value))
    && (search.value === '' || tool.name.toLowerCase().includes(search.value.toLowerCase()))
    && (!selectedOnly.value || selected.value.includes(tool.name))
}

const visible = computed(() => props.tools.filter(shows))
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="cortex-tool-picker">
    <div class="flex flex-wrap items-center gap-3">
      <UInput v-model="search" icon="i-lucide-search" :placeholder="t('cortex.tools.search')" data-testid="cortex-tool-search" />
      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input v-model="selectedOnly" type="checkbox" class="accent-(--ui-primary)" data-testid="cortex-selected-only">
        {{ t('cortex.tools.selected_only') }}
      </label>
      <span class="ml-auto text-xs text-muted" data-testid="cortex-selected-count">{{ t('cortex.tools.selected', { count: selected.length }) }}</span>
    </div>

    <div v-if="tags.length" class="flex flex-wrap gap-2" data-testid="cortex-picker-tags">
      <UButton size="xs" :variant="tag === null ? 'solid' : 'outline'" color="neutral" :label="t('cortex.tools.all_tags')" @click="() => { tag = null }" />
      <UButton
        v-for="option in tags"
        :key="option"
        size="xs"
        :variant="tag === option ? 'solid' : 'outline'"
        color="neutral"
        :label="option"
        :data-testid="`cortex-picker-tag-${option}`"
        @click="() => { tag = tag === option ? null : option }"
      />
    </div>

    <div class="flex max-h-80 flex-col gap-2 overflow-y-auto">
      <label v-for="tool in visible" :key="tool.name" class="flex flex-wrap items-center gap-2 text-sm">
        <input
          v-model="selected"
          type="checkbox"
          class="accent-(--ui-primary)"
          :value="tool.name"
          :data-testid="`${idPrefix ?? 'cortex-tool-'}${tool.name}`"
        >
        <span>{{ tool.label }}</span>
        <UBadge v-for="toolTag in tool.tags" :key="toolTag" color="neutral" variant="subtle" size="sm" :label="toolTag" />
      </label>
    </div>
  </div>
</template>
