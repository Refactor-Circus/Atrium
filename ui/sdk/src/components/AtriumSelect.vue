<script setup lang="ts">
import USelect from '@nuxt/ui/components/Select.vue'
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
 * Every other attribute (placeholder, size, `data-testid`, ...) goes to the
 * <USelect>; items are what <USelect> takes (`{ label, value }` objects or
 * plain values). The testing helpers (`selectItems()`, `chooseOption()`, ...)
 * read and set the blank item as `blankValue`.
 */
defineOptions({ inheritAttrs: false })

type Value = string | number | boolean | null
type Item = Value | { label?: string, value?: Value, [key: string]: unknown }

const props = withDefaults(defineProps<{
  modelValue?: Value
  items?: Item[]
  /** The blank item's label; no blank item without it. */
  blank?: string | null
  /** The model value the blank item stands for: '' (default) or null. */
  blankValue?: '' | null
}>(), { modelValue: null, items: () => [], blank: null, blankValue: '' })

const emit = defineEmits<{ 'update:modelValue': [value: Value] }>()

/** What <USelect> holds for the blank item. */
const BLANK = '__atrium_blank__'

const isBlank = (value: unknown): boolean => value === '' || value === null || value === undefined || value === BLANK

const options = computed(() => props.blank === null
  ? props.items
  : [{ label: props.blank, value: BLANK }, ...props.items.filter(item => !(typeof item === 'object' && item !== null ? isBlank(item.value) : isBlank(item)))])

const inner = computed(() => props.blank !== null && isBlank(props.modelValue) ? BLANK : (props.modelValue ?? undefined))

function update(value: unknown): void {
  emit('update:modelValue', value === BLANK ? props.blankValue : value as Value)
}
</script>

<template>
  <USelect
    v-bind="$attrs"
    :items="options as never"
    :model-value="inner as never"
    @update:model-value="update"
  />
</template>
