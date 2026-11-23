<script setup lang="ts">
// Not ported (D-032)
// Roster's roles, permissions and transfers screens (`roster.roles`, `roster.role`,
// `roster.permissions`, `roster.transfers`, `roster.transfer`) leave out these v1
// features, which have no v2 API route:
// - Roster's impersonation banner (`roster::impersonation-banner`) on each screen.
//   It is Roster's own view, with no API route.
// - Hiding each form and button by the viewer's permissions (v1's `@rosterCan` and
//   `ScreenAccess::allows()`): the new-role and new-permission forms, the role page's
//   read-only view for those who may view roles but not manage them, and the
//   permission edit controls. No API route reports them, so every control shows and
//   a 403 shows the no-access notice instead (D-031).
// - Offering only the import and export types the viewer may start, and the
//   transfer page's "may confirm" check. No API route reports them either: every
//   type is offered and a 403 shows the no-access notice.
// - The "transfers need Impex" notice (v1's `Transfers::available()`). No API route
//   reports it: starting a transfer without Impex shows Roster's error message.
// - The transfers page's organization name in its header. The v2 list carries the
//   organization's slug only, so the slug is shown.
import AccessState from '../../../integrations/roster/components/access/AccessState.vue'
import RolePermissions from '../../../integrations/roster/components/access/RolePermissions.vue'
import {
  ROLE_SCOPES,
  rolePath,
  usePermissionCatalogue,
  type RosterRoleDetail,
  type RosterRoleScope
} from '../../../integrations/roster/components/access/access'
import RosterActionError from '../../../integrations/roster/components/users/RosterActionError.vue'
import RosterPager from '../../../integrations/roster/components/users/RosterPager.vue'
import {
  blankToNull,
  pageOf,
  queryPage,
  queryValue,
  rosterData,
  useRosterAction,
  useRosterLoad,
  type RosterOne,
  type RosterPage
} from '../../../integrations/roster/components/users/users'

/**
 * `roster.roles`: every role (`roster.roles.index`), ported from v1's
 * `roles/index`. The scope and organization filters live in the URL and go
 * to the endpoint as its query, a page at a time. v1's new-role form (name,
 * scope, organization, description and permissions) posts to
 * `roster.roles.store`, in the filtered organization by default, then opens
 * the new role.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const action = useRosterAction()
const permissions = usePermissionCatalogue()

const query = computed(() => {
  const scope = queryValue(route.query.scope) as RosterRoleScope | undefined
  const organization = queryValue(route.query.organization)
  const page = queryPage(route.query.page)

  return {
    ...(scope ? { scope } : {}),
    ...(organization ? { organization } : {}),
    ...(page > 1 ? { page } : {})
  }
})

const { client, data, pending, failed, status } = useRosterLoad(async roster =>
  rosterData<RosterPage<RosterRoleDetail>>(await roster.GET('/roles', { params: { query: query.value } })), query)

const roles = computed(() => data.value?.data ?? [])
const paging = computed(() => pageOf(data.value))

const filters = reactive({ scope: '', organization: '' })
const form = reactive({ name: '', scope: 'global' as RosterRoleScope, organization: '', description: '', permissions: [] as string[] })

watch(() => [route.query.scope, route.query.organization], () => {
  filters.scope = queryValue(route.query.scope) ?? ''
  filters.organization = queryValue(route.query.organization) ?? ''
  // New roles go in the filtered organization, as in v1.
  form.organization = filters.organization
}, { immediate: true })

function filter(): void {
  router.replace({ query: { ...route.query, scope: filters.scope || undefined, organization: filters.organization || undefined, page: undefined } })
}

function clear(): void {
  router.replace({ query: { ...route.query, scope: undefined, organization: undefined, page: undefined } })
}

async function create(): Promise<void> {
  if (!client) {
    return
  }

  const created: { role: RosterRoleDetail | null } = { role: null }

  const ok = await action.run(async () => {
    created.role = rosterData<RosterOne<RosterRoleDetail>>(await client.POST('/roles', {
      body: {
        name: form.name,
        scope: form.scope,
        organization: blankToNull(form.organization),
        description: blankToNull(form.description),
        permissions: form.permissions
      }
    })).data
  })

  if (ok && created.role !== null) {
    await router.push(rolePath(created.role.id))
  }
}
</script>

<template>
  <div class="space-y-4" data-testid="roster-roles">
    <h1 class="text-xl font-semibold">{{ t('roster.roles.title') }}</h1>

    <AtriumIntegrationScreen screen-key="roster.roles">
      <div class="space-y-4">
        <form class="flex flex-wrap items-end gap-3" data-testid="roster-roles-filters" @submit.prevent="filter">
          <UFormField :label="t('roster.roles.fields.scope')">
            <select v-model="filters.scope" class="w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="roster-roles-scope">
              <option value="">{{ t('roster.roles.filters.all_scopes') }}</option>
              <option v-for="scope in ROLE_SCOPES" :key="scope" :value="scope">{{ t(`roster.roles.scopes.${scope}`) }}</option>
            </select>
          </UFormField>
          <UFormField :label="t('roster.roles.fields.organization')" :hint="t('roster.roles.filters.organization_hint')">
            <UInput v-model="filters.organization" class="w-56" data-testid="roster-roles-organization" />
          </UFormField>
          <UButton type="submit" icon="i-lucide-filter" data-testid="roster-roles-filter">{{ t('roster.roles.filters.filter') }}</UButton>
          <UButton variant="ghost" icon="i-lucide-x" data-testid="roster-roles-clear" @click="clear">{{ t('roster.roles.filters.clear') }}</UButton>
        </form>

        <AccessState :ready="!pending && data !== null" :failed="failed" :status="status">
          <div class="space-y-4">
            <p v-if="roles.length === 0" class="text-sm text-muted" data-testid="roster-roles-empty">{{ t('roster.roles.empty') }}</p>
            <table v-else class="w-full text-left text-sm" data-testid="roster-roles-table">
              <thead class="text-muted">
                <tr>
                  <th class="py-2 pr-3 font-medium">{{ t('roster.roles.fields.role') }}</th>
                  <th class="py-2 pr-3 font-medium">{{ t('roster.roles.fields.scope') }}</th>
                  <th class="py-2 pr-3 font-medium">{{ t('roster.roles.fields.organization') }}</th>
                  <th class="py-2 font-medium">{{ t('roster.roles.fields.permissions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="role in roles" :key="role.id" :data-testid="`roster-role-row-${role.id}`">
                  <td class="py-2 pr-3">
                    <div class="flex flex-wrap items-center gap-2">
                      <NuxtLink :to="rolePath(role.id)" class="font-medium hover:underline">{{ role.name }}</NuxtLink>
                      <UBadge v-if="role.super" color="error" variant="subtle">{{ t('roster.roles.super') }}</UBadge>
                      <UBadge v-if="role.system" color="neutral" variant="subtle">{{ t('roster.roles.built_in') }}</UBadge>
                    </div>
                  </td>
                  <td class="py-2 pr-3">{{ t(`roster.roles.scopes.${role.scope}`) }}</td>
                  <td class="py-2 pr-3">{{ role.organization ?? t('roster.roles.shared') }}</td>
                  <td class="py-2" :data-testid="`roster-role-permissions-${role.id}`">{{ role.super ? t('roster.roles.everything') : (role.permissions?.length ?? 0) }}</td>
                </tr>
              </tbody>
            </table>

            <RosterPager :current="paging.current" :last="paging.last" testid="roster-roles" />

            <UCard>
              <template #header>
                <h2 class="font-medium">{{ t('roster.roles.new') }}</h2>
              </template>
              <form class="flex max-w-3xl flex-col gap-4" data-testid="roster-role-new-form" @submit.prevent="create">
                <RosterActionError :action="action" />

                <div class="flex flex-wrap gap-3">
                  <UFormField :label="t('roster.roles.fields.name')" :error="action.error('name')" required>
                    <UInput v-model="form.name" class="w-56" data-testid="roster-role-new-name" />
                  </UFormField>
                  <UFormField :label="t('roster.roles.fields.scope')" :error="action.error('scope')">
                    <select v-model="form.scope" class="w-48 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="roster-role-new-scope">
                      <option v-for="scope in ROLE_SCOPES" :key="scope" :value="scope">{{ t(`roster.roles.scopes.${scope}`) }}</option>
                    </select>
                  </UFormField>
                  <UFormField :label="t('roster.roles.fields.organization')" :hint="t('roster.roles.organization_hint')" :error="action.error('organization')">
                    <UInput v-model="form.organization" class="w-56" data-testid="roster-role-new-organization" />
                  </UFormField>
                </div>
                <UFormField :label="t('roster.roles.fields.description')" :error="action.error('description')">
                  <UTextarea v-model="form.description" :rows="2" class="w-full" data-testid="roster-role-new-description" />
                </UFormField>

                <RolePermissions v-model="form.permissions" :permissions="permissions" id-prefix="roster-role-new" :error="action.error('permissions')" />

                <div>
                  <UButton type="submit" icon="i-lucide-plus" :loading="action.busy.value" data-testid="roster-role-new-submit">{{ t('roster.roles.create') }}</UButton>
                </div>
              </form>
            </UCard>
          </div>
        </AccessState>
      </div>
    </AtriumIntegrationScreen>
  </div>
</template>
