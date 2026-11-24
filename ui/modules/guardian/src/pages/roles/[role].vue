<script setup lang="ts">
import GuardianErrors from '../../components/access/GuardianErrors.vue'
import GuardianRolePermissions from '../../components/access/GuardianRolePermissions.vue'
import { blankToNull, ROLE_SCOPES, scopeKeyOf, scopeTypesOf, usePermissionCatalogue, type GuardianRole } from '../../components/access/access'
import GuardianState from '../../components/two-factor/GuardianState.vue'
import { guardianData, useGuardianAction, useGuardianLoad, type GuardianOne } from '../../components/two-factor/guardian'

/**
 * `guardian.role`: one role (`guardian.roles.show`), moved from Roster's
 * `roster.role` (AC 89, 99). Its name, description and permissions (picked
 * from `guardian.permissions.index`) update through `guardian.roles.update`;
 * a super role has no permission list. It is deleted through
 * `guardian.roles.destroy` after a confirmation, then the roles list opens.
 */
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const save = useGuardianAction()
const remove = useGuardianAction()

const slug = computed(() => String(route.params.role))

const { data: screen } = useAtriumScreen('guardian.role', slug)
const scopeTypes = computed(() => scopeTypesOf(screen.value?.data.options as Record<string, unknown> | undefined))

const { client, data: role, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianOne<GuardianRole>>(await guardian.GET('/roles/{role}', { params: { path: { role: slug.value } } })).data, slug)

const permissions = usePermissionCatalogue(client)
const form = reactive({ name: '', description: '', permissions: [] as string[] })
const saved = ref(false)

useHead({ title: () => role.value?.name ?? t('guardian.access.roles.role') })

watch(role, (current) => {
  form.name = current?.name ?? ''
  form.description = current?.description ?? ''
  form.permissions = [...(current?.permissions ?? [])]
}, { immediate: true })

function scopeLabel(scope: string): string {
  return (ROLE_SCOPES as readonly string[]).includes(scope) ? t(`guardian.access.scopes.${scope}`) : scopeKeyOf(scope, scopeTypes.value) ?? scope
}

async function update(): Promise<void> {
  if (!client || !role.value) {
    return
  }

  const current = role.value
  saved.value = false
  saved.value = await save.run(async () => {
    guardianData(await client.PATCH('/roles/{role}', {
      params: { path: { role: current.slug } },
      body: {
        name: form.name.trim(),
        description: blankToNull(form.description),
        ...(current.super ? {} : { permissions: form.permissions })
      }
    }))
  })

  if (saved.value) {
    await reload()
  }
}

async function destroy(): Promise<void> {
  if (!client || !role.value || !window.confirm(t('guardian.access.roles.confirm_delete', { name: role.value.name }))) {
    return
  }

  const current = role.value

  if (await remove.run(async () => guardianData(await client.DELETE('/roles/{role}', { params: { path: { role: current.slug } } })))) {
    await router.push('/guardian/roles')
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="role?.name ?? t('guardian.access.roles.role')">
        <template #leading>
          <UButton to="/guardian/roles" variant="ghost" color="neutral" icon="i-lucide-arrow-left" :aria-label="t('guardian.access.roles.title')" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.role" :record="slug">
        <GuardianState :ready="!pending && role !== null" :failed="failed" :status="status" :not-found="t('guardian.access.roles.not_found')">
          <div v-if="role" class="space-y-4" data-testid="guardian-role">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <code data-testid="guardian-role-slug">{{ role.slug }}</code>
              <UBadge color="neutral" variant="subtle" data-testid="guardian-role-scope">{{ scopeLabel(role.scope) }}</UBadge>
              <UBadge v-if="role.super" color="error" variant="subtle">{{ t('guardian.access.roles.super') }}</UBadge>
              <UBadge v-if="role.system" color="neutral" variant="subtle">{{ t('guardian.access.roles.built_in') }}</UBadge>
            </div>

            <UCard>
              <form class="flex max-w-3xl flex-col gap-4" data-testid="guardian-role-form" @submit.prevent="update">
                <UAlert v-if="saved" color="success" variant="subtle" :title="t('guardian.access.saved')" data-testid="guardian-role-saved" />
                <GuardianErrors :action="save" testid="guardian-role-save" />
                <UFormField :label="t('guardian.access.roles.fields.name')" required>
                  <UInput v-model="form.name" class="w-72" data-testid="guardian-role-name" />
                </UFormField>
                <UFormField :label="t('guardian.access.roles.fields.description')">
                  <UTextarea v-model="form.description" :rows="2" class="w-full" data-testid="guardian-role-description" />
                </UFormField>
                <p v-if="role.super" class="text-sm text-muted">{{ t('guardian.access.roles.super_hint') }}</p>
                <GuardianRolePermissions v-else v-model="form.permissions" :permissions="permissions" id-prefix="guardian-role" />
                <div>
                  <UButton type="submit" icon="i-lucide-save" :loading="save.busy.value" data-testid="guardian-role-save">{{ t('guardian.access.save') }}</UButton>
                </div>
              </form>
            </UCard>

            <UCard>
              <GuardianErrors :action="remove" testid="guardian-role-delete" />
              <UButton color="error" variant="soft" icon="i-lucide-trash-2" :loading="remove.busy.value" data-testid="guardian-role-delete" @click="destroy">
                {{ t('guardian.access.roles.delete') }}
              </UButton>
            </UCard>
          </div>
        </GuardianState>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
