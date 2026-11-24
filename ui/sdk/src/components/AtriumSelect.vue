<script setup lang="ts">
import USelect from '@nuxt/ui/components/Select.vue'
import type { SelectItem, SelectValue } from '@nuxt/ui'
import { computed } from 'vue'

/**
 * A <USelect> with a blank choice (D-093): "Any", "None", "Global". Reka UI
 * keeps '' for "no selection", so <USelect> refuses an item whose value is
 * '' (and null). `blank` names that item; the model stays '' (or null with
 * `blank-value="null"`) when it is chosen, and the select maps it to an
 * internal stand-in on the way in and back on the way out.
 *
 *   <AtriumSelect v-model="filters.status" :items="statuses" blank="Any status" data-testid="runs-status" />
 *
 * Items are what <USelect> takes, typed as Nuxt UI's `SelectItem` (D-094):
 * `SelectItem[]` (plain values, `{ label, value }` objects, labels and
 * separators) or groups of them (`SelectItem[][]`, the blank item leads the
 * first group). `value-key` / `label-key` name the item's fields, as on
 * <USelect>, and the blank item uses them too. Every other attribute
 * (placeholder, size, `data-testid`, ...) goes to the <USelect>. The testing
 * helpers (`selectItems()`, `chooseOption()`, ...) read and set the blank
 * item as `blankValue`.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: SelectValue
  items?: SelectItem[] | SelectItem[][]
  /** The blank item's label; no blank item without it. */
  blank?: string | null
  /** The model value the blank item stands for: '' (default) or null. */
  blankValue?: '' | null
  /** The item field holding its value, as on <USelect>. */
  valueKey?: string
  /** The item field holding its label, as on <USelect>. */
  labelKey?: string
}>(), { modelValue: null, items: () => [], blank: null, blankValue: '', valueKey: 'value', labelKey: 'label' })

const emit = defineEmits<{ 'update:modelValue': [value: SelectValue] }>()

/** What <USelect> holds for the blank item. */
const BLANK = '__atrium_blank__'

const isBlank = (value: unknown): boolean => value === '' || value === null || value === undefined || value === BLANK

/** An item standing for "no selection" (dropped: the blank item replaces it). Labels and separators stay. */
function blankItem(item: SelectItem): boolean {
  if (typeof item !== 'object' || item === null) {
    return isBlank(item)
  }

  return item.type !== 'label' && item.type !== 'separator' && isBlank(item[props.valueKey])
}

const options = computed<SelectItem[] | SelectItem[][]>(() => {
  if (props.blank === null) {
    return props.items
  }

  const blank: SelectItem = { [props.labelKey]: props.blank, [props.valueKey]: BLANK }
  const items = props.items as (SelectItem | SelectItem[])[]

  if (items.length > 0 && items.every(Array.isArray)) {
    const groups = (items as SelectItem[][]).map(group => group.filter(item => !blankItem(item)))

    return [[blank, ...(groups[0] ?? [])], ...groups.slice(1)]
  }

  return [blank, ...(items as SelectItem[]).filter(item => !blankItem(item))]
})

const inner = computed(() => props.blank !== null && isBlank(props.modelValue) ? BLANK : (props.modelValue ?? undefined))

function update(value: unknown): void {
  emit('update:modelValue', value === BLANK ? props.blankValue : value as SelectValue)
}
</script>

<template>
  <USelect
    v-bind="$attrs"
    :items="options as never"
    :value-key="props.valueKey as never"
    :label-key="props.labelKey as never"
    :model-value="inner as never"
    @update:model-value="update"
  />
</template>
