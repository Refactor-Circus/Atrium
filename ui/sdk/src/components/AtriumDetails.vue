<script setup lang="ts">
import ULink from '@nuxt/ui/runtime/vue/components/Link.vue'
import { computed } from 'vue'
import type { AtriumDetailsItem } from '../types/components'

/**
 * A record's facts as a description list (D-093): a micro-label per term
 * and its value, compact, in the deck's type (monospaced identifiers,
 * muted labels). Put it in a <UCard> body or anywhere on a page.
 *
 *   <AtriumDetails :items="[
 *     { key: 'id', label: 'ID', value: run.id, mono: true },
 *     { key: 'parent', label: 'Parent', value: run.parent_run_id, href: `/impex/runs/${run.parent_run_id}` },
 *     { key: 'tags', label: 'Tags', wide: true }
 *   ]" data-testid="impex-run-details">
 *     <template #tags><UBadge v-for="tag in tags" :key="tag" :label="tag" /></template>
 *   </AtriumDetails>
 *
 * `columns` 1 (default) sets the label beside its value, row by row; 2 or 3
 * stack each label over its value in a grid (`wide` spans the row). An item
 * with a `key` can replace its value through the slot of that name (it gets
 * `{ item }`); `value` null or '' shows `empty`. Each value carries
 * `data-testid` `testid` (default `atrium-details-{key}`).
 */

const props = withDefaults(defineProps<{
  items: AtriumDetailsItem[]
  columns?: 1 | 2 | 3
  empty?: string
}>(), { columns: 1, empty: '—' })

const stacked = computed(() => props.columns > 1)

const grid = computed(() => ({
  1: 'grid-cols-[minmax(7rem,max-content)_minmax(0,1fr)] gap-x-4 gap-y-1.5',
  2: 'grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3'
})[props.columns])

function text(item: AtriumDetailsItem): string | null {
  const value = item.value

  return value === null || value === undefined || value === '' ? null : String(value)
}

function testid(item: AtriumDetailsItem, index: number): string {
  return item.testid ?? `atrium-details-${item.key ?? index}`
}
</script>

<template>
  <dl class="grid text-sm" :class="grid" data-testid="atrium-details">
    <template v-for="(item, index) in props.items" :key="item.key ?? index">
      <div v-if="stacked" class="min-w-0" :class="item.wide ? 'sm:col-span-full' : null">
        <dt class="atrium-label truncate" :data-key="item.key">{{ item.label }}</dt>
        <dd class="mt-0.5 min-w-0 leading-5 break-words text-highlighted" :class="item.mono ? 'atrium-mono text-[0.8125rem]' : null" :data-testid="testid(item, index)">
          <slot v-if="item.key && $slots[item.key]" :name="item.key" :item="item" />
          <ULink v-else-if="item.href && text(item) !== null" :to="item.href" class="text-highlighted underline-offset-2 hover:text-primary hover:underline">{{ text(item) }}</ULink>
          <template v-else-if="text(item) !== null">{{ text(item) }}</template>
          <span v-else class="text-dimmed">{{ props.empty }}</span>
        </dd>
      </div>
      <template v-else>
        <dt class="atrium-label truncate leading-5" :data-key="item.key">{{ item.label }}</dt>
        <dd class="min-w-0 leading-5 break-words text-highlighted" :class="item.mono ? 'atrium-mono text-[0.8125rem]' : null" :data-testid="testid(item, index)">
          <slot v-if="item.key && $slots[item.key]" :name="item.key" :item="item" />
          <ULink v-else-if="item.href && text(item) !== null" :to="item.href" class="text-highlighted underline-offset-2 hover:text-primary hover:underline">{{ text(item) }}</ULink>
          <template v-else-if="text(item) !== null">{{ text(item) }}</template>
          <span v-else class="text-dimmed">{{ props.empty }}</span>
        </dd>
      </template>
    </template>
  </dl>
</template>
