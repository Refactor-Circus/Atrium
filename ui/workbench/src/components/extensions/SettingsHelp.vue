<script setup lang="ts">
defineProps<{ data: { text?: string } }>()
</script>

<template>
  <UCard>
    <h3 class="mb-2 font-medium">About these settings</h3>
    <p class="text-sm text-muted">{{ data.text }}</p>
  </UCard>
</template>
