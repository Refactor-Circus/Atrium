<script setup lang="ts">
// Leans on the preset's resolver for its own tags, as every module does; the
// SDK components it renders must not lean on it for theirs.
const open = ref(true)
</script>

<template>
  <div class="p-4" data-testid="consumer-panel">
    <UAlert v-if="open" title="From the module" data-testid="consumer-alert" />
    <AtriumNoAccess title="Locked" />
    <AtriumState icon="i-lucide-inbox" title="Nothing yet" />
  </div>
</template>
