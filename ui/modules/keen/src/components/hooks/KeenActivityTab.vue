<script setup lang="ts">
import KeenHookEntries from './KeenHookEntries.vue'
import { activityQuery } from './hooks'

/**
 * The `keen.activity` tab (AC 67): with `scope`, everything recorded within
 * the screen's record (`scope_type`/`scope_id`), such as an organization;
 * otherwise the record's own history (`subject_type`/`subject_id`).
 */
const props = defineProps<{ data: Record<string, unknown>, record?: unknown }>()

const query = computed(() => activityQuery(props.data, props.record))
</script>

<template>
  <KeenHookEntries :query="query" :without-subject="!!query?.subject_id" :linkable="!!query?.subject_id" data-testid="hooks-keen-activity" />
</template>
