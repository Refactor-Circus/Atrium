<script setup lang="ts">
import AtriumErrorCard from './AtriumErrorCard.vue'
import AtriumUnregistered from './AtriumUnregistered.vue'
import UCard from '@nuxt/ui/components/Card.vue'
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { computed, ref, watch, onMounted } from 'vue'
import { useAtrium } from '../registry'
import { useAtriumApi } from '../composables/useAtriumApi'
import { useI18n } from 'vue-i18n'

import type { AtriumDataError, AtriumPlacement } from '../types/atrium'

/**
 * One placed widget: its registered component with the placement's data.
 *
 * A lazy placement fetches its data once mounted, by uuid, from
 * `atrium.dashboards.widgets.show`. An orphaned placement (its widget is no
 * longer installed, `component: null`) says so. A placement with an `error`,
 * from the server or from its own request, renders an error card.
 */
const props = defineProps<{ dashboardSlug: string, placement: AtriumPlacement }>()

const atrium = useAtrium()
const api = useAtriumApi()
const { t } = useI18n()

const component = computed(() => props.placement.component ? atrium.widgets.get(props.placement.component) : undefined)

const data = ref<Record<string, unknown> | null>(props.placement.data ?? null)
const error = ref<AtriumDataError | undefined>(props.placement.error)
const loading = ref(false)

watch(() => [props.placement.data, props.placement.error] as const, ([value, failure]) => {
  if (!props.placement.lazy) {
    data.value = value ?? null
    error.value = failure
  }
})

onMounted(async () => {
  if (!props.placement.lazy || props.placement.component === null) {
    return
  }

  loading.value = true

  try {
    const response = await api<{ data: AtriumPlacement }>(
      `/dashboards/${encodeURIComponent(props.dashboardSlug)}/widgets/${encodeURIComponent(props.placement.uuid)}`
    )

    data.value = response.data.data ?? null
    error.value = response.data.error
  } catch {
    error.value = { message: t('atrium.widget.failed') }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="h-full" data-testid="atrium-widget" :data-widget-key="placement.key">
    <UCard class="h-full" :ui="{ body: 'h-full' }">
      <p v-if="placement.component === null" class="text-sm text-muted" data-testid="atrium-widget-orphaned">
        {{ t('atrium.widget.orphaned', { key: placement.key }) }}
      </p>
      <div v-else-if="loading" class="space-y-2">
        <USkeleton class="h-4 w-1/3" />
        <USkeleton class="h-8 w-2/3" />
      </div>
      <AtriumErrorCard v-else-if="error" :message="t('atrium.widget.failed')" />
      <component :is="component" v-else-if="component" :data="data ?? {}" :settings="placement.settings" />
      <AtriumUnregistered v-else kind="widget" :component-key="placement.component" :data="data" />
    </UCard>
  </div>
</template>
