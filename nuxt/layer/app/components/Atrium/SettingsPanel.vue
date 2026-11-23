<script setup lang="ts">
import type { AtriumScreen, AtriumSettingsPanel } from '../../types/atrium'

/**
 * A settings panel on its screen: the panel's registered component on the
 * built-in tab, a registered tab in its place when that tab is open, and the
 * screen's sections around it.
 */
const props = defineProps<{ panel: AtriumSettingsPanel, screen: AtriumScreen | null | undefined }>()

const atrium = useAtrium()
const { t } = useI18n()

const component = computed(() => atrium.panels.get(props.panel.component))
</script>

<template>
  <div data-testid="atrium-settings-panel">
    <p v-if="panel.description" class="mb-4 text-muted">{{ panel.description }}</p>
    <AtriumScreen :screen="screen" :record="panel">
      <AtriumErrorCard v-if="panel.error" :message="t('atrium.settings.failed')" />
      <component :is="component" v-else-if="component" :data="panel.data ?? {}" />
      <AtriumUnregistered v-else kind="panel" :component-key="panel.component" :data="panel.data" />
    </AtriumScreen>
  </div>
</template>
