<script setup lang="ts">
import KeenHookEntries from './KeenHookEntries.vue'
import { historyQuery } from './hooks'

/**
 * The `keen.history` section (AC 67): the screen's package history, from
 * `{source}`, or on a detail screen the record's own, from
 * `{source, subject_type}` and the record key as `subject_id`.
 */
const props = defineProps<{ data: Record<string, unknown>, record?: unknown }>()

const query = computed(() => historyQuery(props.data, props.record))
</script>

<template>
  <KeenHookEntries :query="query" :without-subject="!!query?.subject_id" linkable data-testid="hooks-keen-history" />
</template>
