<script setup lang="ts">
import GuardianAssignments from '../access/GuardianAssignments.vue'
import type { GuardianScopeType } from '../access/access'

/**
 * One user's role assignments (AC 90, 98): `guardian.role-assignments.index?user=`,
 * assigning a role globally or in a chosen scope, and revoking.
 */
defineProps<{ user: string, scopeTypes: GuardianScopeType[] }>()

const { t } = useI18n()
</script>

<template>
  <UCard data-testid="guardian-user-assignments">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.access.user.assignments') }}</h2>
    </template>
    <GuardianAssignments :user="user" :scope-types="scopeTypes" />
  </UCard>
</template>
