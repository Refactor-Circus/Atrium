<script setup lang="ts">
defineProps<{ data: { name?: string, url?: string, currency?: string, timezone?: string } }>()
</script>

<template>
  <UCard>
    <dl class="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
      <dt class="text-muted">Name</dt>
      <dd>{{ data.name }}</dd>
      <dt class="text-muted">URL</dt>
      <dd>{{ data.url }}</dd>
      <dt class="text-muted">Currency</dt>
      <dd>{{ data.currency }}</dd>
      <dt class="text-muted">Time zone</dt>
      <dd>{{ data.timezone }}</dd>
    </dl>
  </UCard>
</template>
