<script setup lang="ts">
/**
 * Page paging, as Guardian's paged lists answer: previous and next, with
 * "page n of m". The list keeps its page itself, so a block mounted on
 * another package's screen pages without touching the route.
 */
const props = defineProps<{ current: number, last: number, testid: string }>()
const emit = defineEmits<{ go: [page: number] }>()

const { t } = useI18n()
</script>

<template>
  <div v-if="props.last > 1" class="flex items-center gap-3 text-sm">
    <UButton variant="outline" size="sm" icon="i-lucide-chevron-left" :disabled="props.current <= 1" :data-testid="`${testid}-prev`" @click="emit('go', props.current - 1)">
      {{ t('guardian.access.pager.previous') }}
    </UButton>
    <span class="text-muted" :data-testid="`${testid}-page`">{{ t('guardian.access.pager.page', { current: props.current, last: props.last }) }}</span>
    <UButton variant="outline" size="sm" trailing-icon="i-lucide-chevron-right" :disabled="props.current >= props.last" :data-testid="`${testid}-next`" @click="emit('go', props.current + 1)">
      {{ t('guardian.access.pager.next') }}
    </UButton>
  </div>
</template>
