<script setup lang="ts">
import RosterPager from '../users/RosterPager.vue'
import {
  pageOf,
  queryPage,
  rosterData,
  userPath,
  useRosterLoad,
  type RosterOrganization,
  type RosterPage,
  type RosterRole
} from '../users/users'
import OrganizationState from './OrganizationState.vue'
import { summaryName, type RosterOrganizationAssignment } from './organizations'

/**
 * The organization page's Roles tab, as v1's: the role assignments within it
 * (`organizations.role-assignments.index`, paged), each with its user, role
 * and team; and the roles it can assign (`roles.index?organization=`), its
 * own and the shared ones, with a link to manage them.
 */
const props = defineProps<{ organization: RosterOrganization }>()

const { t } = useI18n()
const route = useRoute()

const slug = computed(() => props.organization.slug)
const page = computed(() => queryPage(route.query.page))

const assignments = useRosterLoad(async roster => rosterData<RosterPage<RosterOrganizationAssignment>>(await roster.GET('/organizations/{organization}/role-assignments', {
  params: { path: { organization: slug.value }, query: page.value > 1 ? { page: page.value } : {} }
})), page)

const roles = useRosterLoad(async roster => rosterData<RosterPage<RosterRole>>(await roster.GET('/roles', {
  params: { query: { organization: slug.value, per_page: 100 } }
})).data)

const list = computed(() => assignments.data.value?.data ?? [])
const paging = computed(() => pageOf(assignments.data.value))
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="roster-organization-roles">
    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ t('roster.organizations.roles.assignments') }}</h2>
      </template>
      <OrganizationState :ready="!assignments.pending.value && assignments.data.value !== null" :failed="assignments.failed.value" :status="assignments.status.value" compact>
        <div class="space-y-3">
          <p v-if="list.length === 0" class="text-sm" data-testid="roster-assignments-empty">{{ t('roster.organizations.roles.no_assignments') }}</p>
          <ul v-else class="flex flex-col gap-1 text-sm">
            <li v-for="assignment in list" :key="assignment.id" :data-testid="`roster-org-assignment-${assignment.id}`">
              <NuxtLink v-if="assignment.user" :to="userPath(assignment.user.id)" class="font-medium hover:underline">{{ summaryName(assignment.user) }}</NuxtLink>
              — {{ assignment.role?.name ?? t('roster.organizations.none') }}<template v-if="assignment.team"> ({{ assignment.team }})</template>
            </li>
          </ul>
          <RosterPager :current="paging.current" :last="paging.last" testid="roster-assignments" />
        </div>
      </OrganizationState>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ t('roster.organizations.roles.title') }}</h2>
      </template>
      <OrganizationState :ready="!roles.pending.value && roles.data.value !== null" :failed="roles.failed.value" :status="roles.status.value" compact>
        <div class="space-y-3">
          <ul class="flex flex-col gap-1 text-sm">
            <li v-for="role in roles.data.value ?? []" :key="role.id" :data-testid="`roster-org-role-${role.slug}`">
              <NuxtLink :to="`/roster/roles/${encodeURIComponent(role.id)}`" class="font-medium hover:underline">{{ role.name }}</NuxtLink>
              <span class="text-muted">
                — {{ t(`roster.organizations.roles.scopes.${role.scope}`) }}, {{ role.organization ? t('roster.organizations.roles.own') : t('roster.organizations.roles.shared') }}
              </span>
            </li>
          </ul>
          <UButton
            :to="{ path: '/roster/roles', query: { organization: organization.slug } }"
            variant="ghost"
            trailing-icon="i-lucide-arrow-right"
            data-testid="roster-organization-manage-roles"
          >
            {{ t('roster.organizations.roles.manage') }}
          </UButton>
        </div>
      </OrganizationState>
    </UCard>
  </div>
</template>
