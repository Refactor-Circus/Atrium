<script setup lang="ts">
import AtriumErrorCard from './AtriumErrorCard.vue'
import AtriumUnregistered from './AtriumUnregistered.vue'
import { computed } from 'vue'
import { useAtrium } from '../registry'
import { useI18n } from 'vue-i18n'

import type { AtriumExtensionData } from '../types/atrium'

/**
 * A screen extension (a registered tab or a section), rendered by the
 * component registered for its key, or an error card when its data failed.
 */
const props = defineProps<{ extension: AtriumExtensionData, record?: unknown }>()

const atrium = useAtrium()
const { t } = useI18n()

const component = computed(() => props.extension.component ? atrium.extensions.get(props.extension.component) : undefined)
</script>

<template>
  <AtriumErrorCard v-if="extension.error" :message="t('atrium.extension.failed')" />
  <component :is="component" v-else-if="component" :data="extension.data ?? {}" :record="record" />
  <AtriumUnregistered v-else kind="extension" :component-key="extension.component" :data="extension.data" />
</template>
