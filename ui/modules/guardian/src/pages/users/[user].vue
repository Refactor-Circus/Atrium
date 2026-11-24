<script setup lang="ts">
import { scopeTypesOf } from '../../components/access/access'
import UserAbilities from '../../components/users/UserAbilities.vue'
import UserAssignments from '../../components/users/UserAssignments.vue'
import UserSecurity from '../../components/users/UserSecurity.vue'

/**
 * `guardian.user`: the admin view of one user (AC 90, D-055), which works
 * without Roster. Each block loads on its own and handles its own 403: role
 * assignments (assign and revoke), abilities (globally or in a scope),
 * sessions (revoke all), API tokens (revoke all; hidden on 501), recent
 * events, and the two-factor reset. Guardian has no route for another
 * user's two-factor status, so none is shown.
 */
const { t } = useI18n()
const route = useRoute()

const user = computed(() => String(route.params.user))

useHead({ title: () => t('guardian.access.user.title', { user: user.value }) })

const { data: screen } = useAtriumScreen('guardian.user', user)
const scopeTypes = computed(() => scopeTypesOf(screen.value?.data.options as Record<string, unknown> | undefined))
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('guardian.access.user.title', { user })" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.user" :record="user">
        <div :key="user" class="space-y-4" data-testid="guardian-user">
          <div class="grid gap-4 lg:grid-cols-2">
            <div class="lg:col-span-2">
              <UserAssignments :user="user" :scope-types="scopeTypes" />
            </div>
            <div class="lg:col-span-2">
              <UserAbilities :user="user" :scope-types="scopeTypes" />
            </div>
          </div>
          <UserSecurity :user="user" />
        </div>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
