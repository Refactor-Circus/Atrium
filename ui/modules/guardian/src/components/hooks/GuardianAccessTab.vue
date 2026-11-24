<script setup lang="ts">
import GuardianAssignments from '../access/GuardianAssignments.vue'
import { scopeTypesOf } from '../access/access'
import { useGuardian } from '../two-factor/guardian'
import type { AtriumIntegrationScreenResponse } from '@refactor-circus/atrium'
import { guardianAccessOf } from './hooks'

/**
 * The `guardian.access` tab (AC 97, 98): Guardian's role assignments for
 * the screen's record, through group 33's `GuardianAssignments`.
 *
 * - On a scope, such as an organization, Atrium sends its `scope_type`: the
 *   tab lists `guardian.role-assignments.index?scope_type=&scope_id=<record>`,
 *   assigns a role (user and role) in that scope, revokes, and links each
 *   role to its page.
 * - On a user (`scope_type: null`) it lists `?user=<record>` and assigns a
 *   role globally or in a chosen scope, the scope types coming from the
 *   `guardian.role-assignments` screen's options, as the `guardian.user`
 *   screen's block does.
 *
 * A 403 shows the no-access state; without Guardian's client it renders
 * nothing.
 */
const props = defineProps<{ data: Record<string, unknown>, record?: unknown }>()

const api = useAtriumApi()
const client = useGuardian()
const access = computed(() => guardianAccessOf(props.data, props.record))

const { data: screen } = useAsyncData('guardian-hook-scope-types', async () => {
  try {
    return await api<AtriumIntegrationScreenResponse>('/screens/guardian.role-assignments')
  } catch {
    return null
  }
}, { server: false })

const scopeTypes = computed(() => scopeTypesOf(screen.value?.data.options as Record<string, unknown> | undefined))
</script>

<template>
  <div v-if="access && client" data-testid="hooks-guardian-access">
    <GuardianAssignments v-if="'user' in access" :key="access.user" :user="access.user" :scope-types="scopeTypes" />
    <GuardianAssignments v-else :key="`${access.scopeType}:${access.scopeId}`" :scope-type="access.scopeType" :scope-id="access.scopeId" :scope-types="scopeTypes" />
  </div>
</template>
