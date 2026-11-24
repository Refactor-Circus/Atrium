<script setup lang="ts">
import UserSecurity from '../users/UserSecurity.vue'
import { useGuardian } from '../two-factor/guardian'
import { recordKey } from './hooks'

/**
 * The `guardian.user-security` tab (AC 97, 98): group 33's sessions, API
 * tokens, recent events and two-factor reset blocks for the screen's user
 * record, each handling its own 403. Without a record or Guardian's client
 * it renders nothing.
 */
const props = defineProps<{ data: Record<string, unknown>, record?: unknown }>()

const client = useGuardian()
const user = computed(() => recordKey(props.record))
</script>

<template>
  <div v-if="user && client" data-testid="hooks-guardian-user-security">
    <UserSecurity :key="user" :user="user" />
  </div>
</template>
