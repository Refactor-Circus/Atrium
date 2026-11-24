<script setup lang="ts">
defineProps<{ data: { services?: { name: string, status: 'success' | 'warning' | 'info' | 'error', label: string, uptime: string }[] } }>()
</script>

<template>
  <div>
    <h3 class="mb-2 font-medium">Service status</h3>
    <ul class="space-y-2 text-sm">
      <li v-for="service in data.services ?? []" :key="service.name" class="flex items-center gap-2">
        <UChip :color="service.status" standalone inset />
        <span class="flex-1">{{ service.name }}</span>
        <span class="text-muted">{{ service.label }}</span>
      </li>
    </ul>
  </div>
</template>
