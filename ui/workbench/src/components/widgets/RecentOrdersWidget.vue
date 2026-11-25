<script setup lang="ts">
interface Order { number: string, customer: string, total: number, status: string, placed: string }

defineProps<{ data: { orders?: Order[] } }>()

const colors: Record<string, 'success' | 'primary' | 'info' | 'warning' | 'error' | 'neutral'> = {
  paid: 'success', shipped: 'primary', pending: 'info', refunded: 'warning', failed: 'error'
}
</script>

<template>
  <div>
    <h3 class="mb-2 font-medium">Recent orders</h3>
    <ul class="divide-y divide-default text-sm">
      <li v-for="order in data.orders ?? []" :key="order.number" class="flex items-center gap-3 py-2">
        <span class="font-mono">{{ order.number }}</span>
        <span class="flex-1 truncate">{{ order.customer }}</span>
        <span class="tabular-nums">${{ order.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</span>
        <UBadge :color="colors[order.status] ?? 'neutral'" variant="subtle">{{ order.status }}</UBadge>
      </li>
    </ul>
  </div>
</template>
