<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <AtriumDashboardPage :slug="String(route.params.slug)" />
</template>
