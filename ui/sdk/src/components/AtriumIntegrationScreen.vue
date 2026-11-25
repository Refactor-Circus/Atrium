<script setup lang="ts">
import AtriumNoAccess from './AtriumNoAccess.vue'
import AtriumScreen from './AtriumScreen.vue'
import { computed } from 'vue'
import { useAtriumScreen } from '../composables/useAtriumScreen'
import { atriumStatus } from '../utils/atriumStatus'

/**
 * The frame of a suite integration's page: the tabs and sections other
 * packages registered for its screen (`atrium.screens.show`), around the
 * page's own content in the default slot.
 *
 *   <AtriumIntegrationScreen screen-key="impex.run" :record="route.params.run">
 *     <template #default="{ tab }">…the run…</template>
 *   </AtriumIntegrationScreen>
 *
 * Each extension gets the record key as its `record` prop. The page renders
 * while the extensions load, and without them when their request fails,
 * except on a 403: the user may not use Atrium, so the page is not shown.
 */
const props = defineProps<{ screenKey: string, record?: string | number | null }>()

defineSlots<{ default?: (props: { tab: string | null }) => unknown }>()

const { data, error } = useAtriumScreen(() => props.screenKey, () => props.record)

const screen = computed(() => error.value ? null : data.value?.data ?? null)
const record = computed(() => screen.value?.record ?? (props.record === null || props.record === undefined ? null : String(props.record)))
const forbidden = computed(() => atriumStatus(error.value) === 403)
</script>

<template>
  <AtriumNoAccess v-if="forbidden" />
  <AtriumScreen v-else :screen="screen" :record="record">
    <template #default="{ tab }">
      <slot :tab="tab" />
    </template>
  </AtriumScreen>
</template>
