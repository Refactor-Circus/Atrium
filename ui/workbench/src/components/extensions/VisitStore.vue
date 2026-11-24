<script setup lang="ts">
defineProps<{ data: { url?: string } }>()
</script>

<template>
  <div class="flex justify-end">
    <UButton
      v-if="data.url"
      :to="data.url"
      target="_blank"
      rel="noopener noreferrer"
      icon="i-lucide-external-link"
      variant="outline"
    >
      Visit store
    </UButton>
  </div>
</template>
