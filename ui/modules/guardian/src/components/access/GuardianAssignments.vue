<script setup lang="ts">
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, useGuardianAction, useGuardianLoad, type GuardianClient, type GuardianPage } from '../two-factor/guardian'
import GuardianErrors from './GuardianErrors.vue'
import GuardianPager from './GuardianPager.vue'
import {
  ACCESS_PAGE_SIZE,
  blankToNull,
  pageOf,
  rolePath,
  scopeKeyOf,
  useRoleCatalogue,
  userPath,
  type GuardianAssignment,
  type GuardianScopeType
} from './access'

/**
 * Role assignments (`guardian.role-assignments.*`, AC 89, 90, 98), paged as
 * Guardian pages them: listed by the filters `user`, `role`, `scope_type`
 * and `scope_id`; assigned (user, role, a scope type from the screen's
 * `scope_types` or none for global, and a scope id); and revoked after a
 * confirmation. A fixed `user` (the user screen) or a fixed scope (an
 * organization's tab) narrows the list and the form, with no filters shown
 * for what is fixed. A 422 from the escalation guard lists the permissions
 * it names.
 */
const props = withDefaults(defineProps<{
  scopeTypes: GuardianScopeType[]
  user?: string | null
  scopeType?: string | null
  scopeId?: string | null
  filters?: boolean
  client?: GuardianClient | null
}>(), { user: null, scopeType: null, scopeId: null, filters: false, client: undefined })

const { t } = useI18n()
const action = useGuardianAction()
const revoking = useGuardianAction()

const scoped = computed(() => props.scopeType !== null && props.scopeId !== null)
const page = ref(1)
const filter = reactive({ user: '', role: '', scope_type: '', scope_id: '' })
const applied = ref({ ...filter })
const form = reactive({ user: '', role: '', scope_type: '', scope_id: '' })

const query = computed(() => {
  const values = {
    user: props.user ?? blankToNull(applied.value.user),
    role: blankToNull(applied.value.role),
    scope_type: scoped.value ? props.scopeType : blankToNull(applied.value.scope_type),
    scope_id: scoped.value ? props.scopeId : blankToNull(applied.value.scope_id)
  }

  return {
    ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null)),
    per_page: ACCESS_PAGE_SIZE,
    ...(page.value > 1 ? { page: page.value } : {})
  }
})

const load = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianAssignment>>(await guardian.GET('/role-assignments', { params: { query: query.value } })), query, props.client === undefined ? undefined : props.client)

const { client, data, pending, failed, status, reload } = load
const roles = useRoleCatalogue(client)
const rows = computed(() => data.value?.data ?? [])
const paging = computed(() => pageOf(data.value))

function applyFilters(): void {
  page.value = 1
  applied.value = { ...filter }
}

function clearFilters(): void {
  Object.assign(filter, { user: '', role: '', scope_type: '', scope_id: '' })
  applyFilters()
}

function scopeOf(assignment: GuardianAssignment): string {
  if (!assignment.scope_type) {
    return t('guardian.access.scopes.global')
  }

  return `${scopeKeyOf(assignment.scope_type, props.scopeTypes)} ${assignment.scope_id ?? ''}`.trim()
}

async function assign(): Promise<void> {
  if (!client) {
    return
  }

  const scopeType = scoped.value ? props.scopeType : blankToNull(form.scope_type)
  const ok = await action.run(async () => {
    guardianData(await client.POST('/role-assignments', {
      body: {
        user: props.user ?? form.user.trim(),
        role: form.role,
        scope_type: scopeType,
        scope_id: scoped.value ? props.scopeId : scopeType === null ? null : blankToNull(form.scope_id)
      }
    }))
  })

  if (ok) {
    Object.assign(form, { user: '', role: '', scope_type: '', scope_id: '' })
    await reload()
  }
}

async function revoke(assignment: GuardianAssignment): Promise<void> {
  const name = assignment.role?.name ?? assignment.id

  if (!client || !window.confirm(t('guardian.access.assignments.confirm_revoke', { role: name, user: assignment.user_id }))) {
    return
  }

  if (await revoking.run(async () => guardianData(await client.DELETE('/role-assignments/{assignment}', { params: { path: { assignment: assignment.id } } })))) {
    await reload()
  }
}

function go(next: number): void {
  page.value = next
}
</script>

<template>
  <div class="space-y-4" data-testid="guardian-assignments">
    <form v-if="filters" class="atrium-querybar" data-testid="guardian-assignments-filters" @submit.prevent="applyFilters">
      <UFormField v-if="user === null" :label="t('guardian.access.assignments.fields.user')">
        <UInput v-model="filter.user" class="w-40" data-testid="guardian-assignments-filter-user" />
      </UFormField>
      <UFormField :label="t('guardian.access.assignments.fields.role')">
        <UInput v-model="filter.role" class="w-40" data-testid="guardian-assignments-filter-role" />
      </UFormField>
      <template v-if="!scoped">
        <UFormField :label="t('guardian.access.assignments.fields.scope_type')">
          <select v-model="filter.scope_type" class="w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-assignments-filter-scope-type">
            <option value="">{{ t('guardian.access.assignments.any_scope') }}</option>
            <option v-for="scope in scopeTypes" :key="scope.key" :value="scope.type">{{ scope.key }}</option>
          </select>
        </UFormField>
        <UFormField :label="t('guardian.access.assignments.fields.scope_id')">
          <UInput v-model="filter.scope_id" class="w-32" data-testid="guardian-assignments-filter-scope-id" />
        </UFormField>
      </template>
      <UButton type="submit" icon="i-lucide-filter" data-testid="guardian-assignments-filter">{{ t('guardian.access.filter') }}</UButton>
      <UButton variant="ghost" icon="i-lucide-x" data-testid="guardian-assignments-clear" @click="clearFilters">{{ t('guardian.access.clear') }}</UButton>
    </form>

    <GuardianState :ready="!pending && data !== null" :failed="failed" :status="status" :compact="!filters">
      <div class="space-y-4">
        <GuardianErrors :action="revoking" testid="guardian-revoke" />
        <p v-if="rows.length === 0" class="atrium-empty" data-testid="guardian-assignments-empty">{{ t('guardian.access.assignments.empty') }}</p>
        <table v-else class="w-full text-left text-sm" data-testid="guardian-assignments-table">
          <thead class="text-muted">
            <tr>
              <th v-if="user === null" class="py-2 pr-3 font-medium">{{ t('guardian.access.assignments.fields.user') }}</th>
              <th class="py-2 pr-3 font-medium">{{ t('guardian.access.assignments.fields.role') }}</th>
              <th class="py-2 pr-3 font-medium">{{ t('guardian.access.assignments.fields.scope') }}</th>
              <th class="py-2 pr-3 font-medium">{{ t('guardian.access.assignments.fields.assigned_at') }}</th>
              <th class="py-2" />
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="assignment in rows" :key="assignment.id" :data-testid="`guardian-assignment-${assignment.id}`">
              <td v-if="user === null" class="py-2 pr-3">
                <RouterLink :to="userPath(assignment.user_id)" class="hover:underline" data-testid="guardian-assignment-user">{{ assignment.user_id }}</RouterLink>
              </td>
              <td class="py-2 pr-3">
                <RouterLink v-if="assignment.role" :to="rolePath(assignment.role.slug)" class="font-medium hover:underline" data-testid="guardian-assignment-role">{{ assignment.role.name }}</RouterLink>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="py-2 pr-3">{{ scopeOf(assignment) }}</td>
              <td class="py-2 pr-3 text-muted">{{ formatDate(assignment.assigned_at) ?? '—' }}</td>
              <td class="py-2 text-right">
                <UButton size="xs" color="error" variant="ghost" icon="i-lucide-x" :data-testid="`guardian-assignment-revoke-${assignment.id}`" @click="revoke(assignment)">
                  {{ t('guardian.access.assignments.revoke') }}
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>

        <GuardianPager :current="paging.current" :last="paging.last" testid="guardian-assignments" @go="go" />

        <form class="flex flex-wrap items-end gap-3" data-testid="guardian-assign-form" @submit.prevent="assign">
          <UFormField v-if="user === null" :label="t('guardian.access.assignments.fields.user')" :error="action.error('user')" required>
            <UInput v-model="form.user" class="w-40" data-testid="guardian-assign-user" />
          </UFormField>
          <UFormField :label="t('guardian.access.assignments.fields.role')" required>
            <select v-model="form.role" class="w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-assign-role">
              <option value="" disabled>{{ t('guardian.access.assignments.pick_role') }}</option>
              <option v-for="role in roles" :key="role.slug" :value="role.slug">{{ role.name }}</option>
            </select>
          </UFormField>
          <template v-if="!scoped">
            <UFormField :label="t('guardian.access.assignments.fields.scope_type')">
              <select v-model="form.scope_type" class="w-44 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-assign-scope-type">
                <option value="">{{ t('guardian.access.scopes.global') }}</option>
                <option v-for="scope in scopeTypes" :key="scope.key" :value="scope.type">{{ scope.key }}</option>
              </select>
            </UFormField>
            <UFormField v-if="form.scope_type" :label="t('guardian.access.assignments.fields.scope_id')" required>
              <UInput v-model="form.scope_id" class="w-32" data-testid="guardian-assign-scope-id" />
            </UFormField>
          </template>
          <UButton type="submit" icon="i-lucide-plus" :loading="action.busy.value" data-testid="guardian-assign-submit">{{ t('guardian.access.assignments.assign') }}</UButton>
        </form>
        <GuardianErrors :action="action" testid="guardian-assign" />
      </div>
    </GuardianState>
  </div>
</template>
