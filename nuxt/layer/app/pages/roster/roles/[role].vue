<script setup lang="ts">
import AccessState from '../../../integrations/roster/components/access/AccessState.vue'
import RolePermissions from '../../../integrations/roster/components/access/RolePermissions.vue'
import { usePermissionCatalogue, type RosterRoleDetail } from '../../../integrations/roster/components/access/access'
import RosterActionError from '../../../integrations/roster/components/users/RosterActionError.vue'
import {
  blankToNull,
  rosterData,
  useRosterAction,
  useRosterLoad,
  type RosterOne
} from '../../../integrations/roster/components/users/users'

/**
 * `roster.role`: one role (`roster.roles.show`), ported from v1's
 * `roles/show`. v1's form (name, description and the permission
 * checkboxes) saves through `roster.roles.update`; a role that is not built
 * in is deleted through `roster.roles.destroy`, then the list opens. A super
 * role has every permission, so it shows v1's hint instead of the form.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const action = useRosterAction()
const permissions = usePermissionCatalogue()

const id = computed(() => String(route.params.role))

const { client, data, pending, failed, status, reload } = useRosterLoad(async roster =>
  rosterData<RosterOne<RosterRoleDetail>>(await roster.GET('/roles/{role}', { params: { path: { role: id.value } } })).data, id)

const form = reactive({ name: '', description: '', permissions: [] as string[] })

watch(data, (role) => {
  form.name = role?.name ?? ''
  form.description = role?.description ?? ''
  form.permissions = [...(role?.permissions ?? [])]
}, { immediate: true })

async function save(): Promise<void> {
  if (!client) {
    return
  }

  const ok = await action.run(async () => rosterData(await client.PATCH('/roles/{role}', {
    params: { path: { role: id.value } },
    body: { name: form.name, description: blankToNull(form.description), permissions: form.permissions }
  })))

  if (ok) {
    await reload()
  }
}

async function destroy(): Promise<void> {
  if (!client) {
    return
  }

  if (await action.run(async () => rosterData(await client.DELETE('/roles/{role}', { params: { path: { role: id.value } } })))) {
    await router.push('/roster/roles')
  }
}
</script>

<template>
  <div class="space-y-4" data-testid="roster-role">
    <div class="flex items-center gap-3">
      <UButton to="/roster/roles" icon="i-lucide-arrow-left" color="neutral" variant="ghost" :aria-label="t('roster.roles.title')" data-testid="roster-role-back" />
      <div v-if="data">
        <h1 class="text-xl font-semibold" data-testid="roster-role-title">{{ data.name }}</h1>
        <p class="text-sm text-muted" data-testid="roster-role-scope">{{ t(`roster.roles.scopes.${data.scope}`) }} · {{ data.organization ?? t('roster.roles.shared') }}</p>
      </div>
    </div>

    <AtriumIntegrationScreen screen-key="roster.role" :record="id">
      <AccessState :ready="!pending && data !== null" :failed="failed" :status="status" :not-found="t('roster.roles.not_found')">
        <div v-if="data" class="space-y-4">
          <RosterActionError :action="action" />

          <UCard>
            <p v-if="data.super" class="text-sm" data-testid="roster-role-super">{{ t('roster.roles.super_hint') }}</p>
            <form v-else class="flex max-w-3xl flex-col gap-4" data-testid="roster-role-form" @submit.prevent="save">
              <UFormField :label="t('roster.roles.fields.name')" :error="action.error('name')" required>
                <UInput v-model="form.name" class="w-full" data-testid="roster-role-name" />
              </UFormField>
              <UFormField :label="t('roster.roles.fields.description')" :error="action.error('description')">
                <UTextarea v-model="form.description" :rows="2" class="w-full" data-testid="roster-role-description" />
              </UFormField>

              <RolePermissions v-model="form.permissions" :permissions="permissions" id-prefix="roster-role" :error="action.error('permissions')" />

              <div>
                <UButton type="submit" icon="i-lucide-check" :loading="action.busy.value" data-testid="roster-role-save">{{ t('roster.roles.save') }}</UButton>
              </div>
            </form>
          </UCard>

          <UButton
            v-if="!data.system"
            color="error"
            variant="outline"
            icon="i-lucide-trash-2"
            :loading="action.busy.value"
            data-testid="roster-role-delete"
            @click="destroy"
          >
            {{ t('roster.roles.delete') }}
          </UButton>
        </div>
      </AccessState>
    </AtriumIntegrationScreen>
  </div>
</template>
