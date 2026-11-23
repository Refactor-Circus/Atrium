<script setup lang="ts">
defineProps<{ data: { label?: string, icon?: string, value?: string | number, change?: string, trend?: 'up' | 'down' | null } }>()
</script>

<template>
  <div class="flex h-full flex-col justify-between">
    <div class="flex items-center gap-2 text-sm text-muted">
      <AtriumIcon :icon="data.icon" />
      {{ data.label }}
    </div>
    <p class="text-3xl font-semibold">{{ data.value }}</p>
    <p class="text-sm" :class="data.trend === 'up' ? 'text-success' : data.trend === 'down' ? 'text-error' : 'text-muted'">
      {{ data.change }}
    </p>
  </div>
</template>
