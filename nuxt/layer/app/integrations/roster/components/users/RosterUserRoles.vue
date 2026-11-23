<script setup lang="ts">
import RosterActionError from './RosterActionError.vue'
import RosterState from './RosterState.vue'
import {
  rosterData,
  useOrganizationTeams,
  useRosterAction,
  useRosterLoad,
  type RosterEffectivePermissions,
  type RosterOrganization,
  type RosterPage,
  type RosterRole,
  type RosterRoleAssignment,
  type RosterUser
} from './users'

/**
 * The user page's roles card, as v1's: the user's role assignments
 * (`users.roles.index`) with revoke (`users.roles.destroy`), assigning a role
 * globally or in one of the user's organizations and teams
 * (`users.roles.store`), and the effective permissions (`users.permissions`).
 * Only shared roles and those of the user's organizations are offered, as v1
 * did. A 403 on the assignments shows the card as no access.
 */
const props = defineProps<{ user: RosterUser, memberships: RosterOrganization[] }>()

const { t } = useI18n()
const action = useRosterAction()
const id = computed(() => String(props.user.id))

const { client, data, pending, failed, status, reload } = useRosterLoad(async (roster) => {
  const path = { params: { path: { user: id.value } } }
  const [assignments, roles, effective] = await Promise.all([
    roster.GET('/users/{user}/roles', { params: { path: { user: id.value }, query: { per_page: 100 } } }).then(result => rosterData<RosterPage<RosterRoleAssignment>>(result).data),
    roster.GET('/roles', { params: { query: { per_page: 100 } } }).then(result => rosterData<RosterPage<RosterRole>>(result).data).catch(() => [] as RosterRole[]),
    roster.GET('/users/{user}/permissions', path).then(result => rosterData<{ data: RosterEffectivePermissions }>(result).data).catch(() => null)
  ])

  return { assignments, roles, effective }
})

const form = reactive({ role: '', organization: '', team: '' })
const teams = useOrganizationTeams(() => form.organization || null)

watch(() => form.organization, () => {
  form.team = ''
})

const assignable = computed(() => {
  const mine = new Set(props.memberships.map(organization => organization.slug))

  return (data.value?.roles ?? []).filter(role => role.organization === null || mine.has(role.organization))
})

function scopeOf(assignment: RosterRoleAssignment): string {
  if (assignment.organization && assignment.team) {
    return `${assignment.organization} / ${assignment.team}`
  }

  return assignment.organization ?? t('roster.users.roles.global')
}

async function assign(): Promise<void> {
  if (!client) {
    return
  }

  if (await action.run(async () => rosterData(await client.POST('/users/{user}/roles', {
    params: { path: { user: id.value } },
    body: { role: form.role, organization: form.organization || null, team: form.team || null }
  })))) {
    form.role = ''
    form.organization = ''
    await reload()
  }
}

async function revoke(assignment: RosterRoleAssignment): Promise<void> {
  if (!client) {
    return
  }

  if (await action.run(async () => rosterData(await client.DELETE('/users/{user}/roles/{assignment}', {
    params: { path: { user: id.value, assignment: assignment.id } }
  })))) {
    await reload()
  }
}
</script>

<template>
  <UCard data-testid="roster-user-roles">
    <template #header>
      <h2 class="font-semibold">{{ t('roster.users.roles.title') }}</h2>
    </template>

    <RosterState :ready="!pending && data !== null" :failed="failed" :status="status" compact>
      <div class="flex flex-col gap-4">
        <RosterActionError :action="action" />

        <p v-if="data?.effective?.super_admin"><UBadge color="error" variant="subtle">{{ t('roster.users.roles.super_admin') }}</UBadge></p>

        <p v-if="(data?.assignments.length ?? 0) === 0" class="text-sm text-muted">{{ t('roster.users.roles.none') }}</p>
        <ul v-else class="flex flex-col gap-1 text-sm">
          <li v-for="assignment in data?.assignments" :key="assignment.id" class="flex items-center justify-between gap-2" :data-testid="`roster-assignment-${assignment.id}`">
            <span>
              <span class="font-medium">{{ assignment.role?.name }}</span>
              <span class="text-muted"> — {{ scopeOf(assignment) }}</span>
            </span>
            <UButton size="sm" variant="ghost" icon="i-lucide-ban" :data-testid="`roster-revoke-${assignment.id}`" @click="revoke(assignment)">
              {{ t('roster.users.roles.revoke') }}
            </UButton>
          </li>
        </ul>

        <form class="flex flex-wrap items-end gap-2" data-testid="roster-user-assign-form" @submit.prevent="assign">
          <UFormField :label="t('roster.users.roles.role')" :error="action.error('role')">
            <select v-model="form.role" class="w-72 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="roster-assign-role">
              <option value="" disabled>{{ t('roster.users.roles.choose') }}</option>
              <option v-for="role in assignable" :key="role.id" :value="role.id">{{ role.name }} ({{ role.scope }}{{ role.organization ? `, ${role.organization}` : '' }})</option>
            </select>
          </UFormField>
          <UFormField :label="t('roster.users.memberships.organization')" :error="action.error('organization')">
            <select v-model="form.organization" class="w-56 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="roster-assign-organization">
              <option value="">{{ t('roster.users.roles.global') }}</option>
              <option v-for="organization in memberships" :key="organization.slug" :value="organization.slug">{{ organization.name }}</option>
            </select>
          </UFormField>
          <UFormField :label="t('roster.users.memberships.team')" :error="action.error('team')">
            <select v-model="form.team" class="w-56 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="roster-assign-team">
              <option value="">{{ t('roster.users.memberships.no_team') }}</option>
              <option v-for="team in teams" :key="team.slug" :value="team.slug">{{ team.name }}</option>
            </select>
          </UFormField>
          <UButton type="submit" icon="i-lucide-shield-check" :loading="action.busy.value" data-testid="roster-assign-submit">
            {{ t('roster.users.roles.assign') }}
          </UButton>
        </form>

        <details v-if="data?.effective" class="text-sm" data-testid="roster-user-permissions">
          <summary class="cursor-pointer">{{ t('roster.users.roles.effective', { count: data.effective.permissions.length }) }}</summary>
          <p class="mt-2 font-mono text-xs leading-relaxed">{{ data.effective.permissions.join(', ') || t('roster.users.none') }}</p>
        </details>
      </div>
    </RosterState>
  </UCard>
</template>
