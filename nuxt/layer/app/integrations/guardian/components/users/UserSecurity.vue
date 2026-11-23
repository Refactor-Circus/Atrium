<script setup lang="ts">
import UserEvents from './UserEvents.vue'
import UserSessions from './UserSessions.vue'
import UserTokens from './UserTokens.vue'
import UserTwoFactorReset from './UserTwoFactorReset.vue'

/**
 * The security blocks of one user (AC 90, 98): sessions, API tokens, recent
 * events and the two-factor reset, each handling its own 403. The
 * `guardian.user` screen shows them below the access blocks, and the
 * `guardian.user-security` tab on Roster's user screen mounts this whole.
 */
defineProps<{ user: string, name?: string | null }>()
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2" data-testid="guardian-user-security">
    <UserSessions :user="user" :name="name" />
    <UserTokens :user="user" :name="name" />
    <UserEvents :user="user" />
    <UserTwoFactorReset :user="user" :name="name" />
  </div>
</template>
