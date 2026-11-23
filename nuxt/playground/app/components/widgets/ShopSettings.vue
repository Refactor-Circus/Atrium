<script setup lang="ts">
defineProps<{ data: { features?: Record<string, boolean> } }>()
</script>

<template>
  <UCard>
    <h3 class="mb-3 font-medium">Feature flags</h3>
    <ul class="space-y-2">
      <li v-for="(on, name) in data.features ?? {}" :key="name" class="flex items-center justify-between">
        <span>{{ name }}</span>
        <USwitch :model-value="on" disabled />
      </li>
    </ul>
  </UCard>
</template>
