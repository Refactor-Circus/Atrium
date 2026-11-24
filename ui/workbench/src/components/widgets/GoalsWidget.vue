<script setup lang="ts">
defineProps<{ data: { goals?: { label: string, value: number, max: number }[] } }>()
</script>

<template>
  <div>
    <h3 class="mb-3 font-medium">Quarterly goals</h3>
    <div v-for="goal in data.goals ?? []" :key="goal.label" class="mb-3">
      <div class="mb-1 flex justify-between text-sm">
        <span>{{ goal.label }}</span>
        <span class="text-muted">{{ goal.value }}/{{ goal.max }}</span>
      </div>
      <UProgress :model-value="goal.value" :max="goal.max" />
    </div>
  </div>
</template>
