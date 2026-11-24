<script setup lang="ts">
import GuardianAssignments from '../../components/access/GuardianAssignments.vue'
import { scopeTypesOf } from '../../components/access/access'

/**
 * `guardian.role-assignments`: every role assignment
 * (`guardian.role-assignments.index`), filtered by user, role, scope type
 * and scope id, paged as Guardian pages it, with assign and revoke (AC 89).
 * The scope types come from the screen's `scope_types` (D-048).
 */
const { t } = useI18n()

useHead({ title: () => t('guardian.access.assignments.title') })

const { data: screen } = useAtriumScreen('guardian.role-assignments')
const scopeTypes = computed(() => scopeTypesOf(screen.value?.data.options as Record<string, unknown> | undefined))
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('guardian.access.assignments.title')" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.role-assignments">
        <GuardianAssignments :scope-types="scopeTypes" filters />
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
