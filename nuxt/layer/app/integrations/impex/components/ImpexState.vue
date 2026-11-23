<script setup lang="ts">
/**
 * What an Impex page shows until its data is in: the no-access state on a
 * 403, a not-found state on a 404, an error card for any other failure, a
 * skeleton while loading, and then the default slot.
 */
const props = defineProps<{ error: unknown, ready: boolean }>()

const { t } = useI18n()

const status = computed(() => atriumStatus(props.error))
</script>

<template>
  <AtriumNoAccess v-if="status === 403" />
  <div v-else-if="status === 404" class="rounded-md border border-default p-4 text-sm" role="status" data-testid="impex-not-found">
    <p class="font-medium">{{ t('impex.common.not_found_title') }}</p>
    <p class="text-muted">{{ t('impex.common.not_found_description') }}</p>
  </div>
  <AtriumErrorCard v-else-if="error" :message="t('impex.common.load_failed')" />
  <USkeleton v-else-if="!ready" class="h-24" />
  <slot v-else />
</template>
