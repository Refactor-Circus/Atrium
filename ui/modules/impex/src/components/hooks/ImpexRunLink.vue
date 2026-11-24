<script setup lang="ts">
import { runLinkPath } from './hooks'

/**
 * The `impex.run-link` section (AC 66): in a row slot, a link to the row's
 * Impex run, `/impex/runs/:id`. It makes no request. Without a run id (the
 * slot rendered outside a row) it renders nothing.
 */
const props = defineProps<{ data: Record<string, unknown>, record?: unknown }>()

const { t } = useI18n()

const path = computed(() => runLinkPath(props.record))
</script>

<template>
  <UButton
    v-if="path"
    :to="path"
    size="xs"
    color="neutral"
    variant="ghost"
    icon="i-lucide-workflow"
    :label="t('hooks.run_link.label')"
    data-testid="hooks-impex-run-link"
  />
</template>
