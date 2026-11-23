<script setup lang="ts">
import type { AtriumScreen } from '../../types/atrium'

/** Every section packages placed in one slot of a screen. */
defineProps<{ screen: AtriumScreen | null | undefined, name: string, record?: unknown }>()
</script>

<template>
  <div v-if="screen?.sections[name]?.length" class="space-y-4" :data-testid="`atrium-slot-${name}`">
    <AtriumExtension v-for="section in screen.sections[name]" :key="section.key" :extension="section" :record="record" />
  </div>
</template>
