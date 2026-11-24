<script setup lang="ts">
import GuardianErrors from '../../components/access/GuardianErrors.vue'
import GuardianPager from '../../components/access/GuardianPager.vue'
import { blankToNull, pageOf, type GuardianPermission } from '../../components/access/access'
import GuardianState from '../../components/two-factor/GuardianState.vue'
import { guardianData, useGuardianAction, useGuardianLoad, type GuardianPage } from '../../components/two-factor/guardian'

/**
 * `guardian.permissions`: every permission (`guardian.permissions.index`), a
 * page at a time and searchable, moved from Roster's `roster.permissions`
 * (AC 89, 99). Each row edits its description in place and its name unless
 * it is a `system` permission (from Keystone's abilities), whose rename and
 * delete are disabled. New permissions go to `guardian.permissions.store`;
 * a delete asks first.
 */
const { t } = useI18n()
const create = useGuardianAction()
const update = useGuardianAction()
const remove = useGuardianAction()

useHead({ title: () => t('guardian.access.permissions.title') })

const page = ref(1)
const search = ref('')
const applied = ref('')
const query = computed(() => ({ per_page: 50, ...(applied.value ? { search: applied.value } : {}), ...(page.value > 1 ? { page: page.value } : {}) }))

const { client, data, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianPermission>>(await guardian.GET('/permissions', { params: { query: query.value } })), query)

const rows = computed(() => data.value?.data ?? [])
const paging = computed(() => pageOf(data.value))
const edits = reactive<Record<string, { name: string, description: string }>>({})
const form = reactive({ name: '', description: '' })

watch(rows, (current) => {
  for (const permission of current) {
    edits[permission.name] = { name: permission.name, description: permission.description ?? '' }
  }
}, { immediate: true })

function find(): void {
  page.value = 1
  applied.value = search.value.trim()
}

function go(next: number): void {
  page.value = next
}

async function add(): Promise<void> {
  if (!client) {
    return
  }

  if (await create.run(async () => guardianData(await client.POST('/permissions', { body: { name: form.name.trim(), description: blankToNull(form.description) } })))) {
    form.name = ''
    form.description = ''
    await reload()
  }
}

async function save(permission: GuardianPermission): Promise<void> {
  const edit = edits[permission.name]

  if (!client || !edit) {
    return
  }

  const body = permission.system
    ? { description: blankToNull(edit.description) }
    : { name: edit.name.trim(), description: blankToNull(edit.description) }

  if (await update.run(async () => guardianData(await client.PATCH('/permissions/{permission}', { params: { path: { permission: permission.name } }, body })))) {
    await reload()
  }
}

async function destroy(permission: GuardianPermission): Promise<void> {
  if (!client || permission.system || !window.confirm(t('guardian.access.permissions.confirm_delete', { name: permission.name }))) {
    return
  }

  if (await remove.run(async () => guardianData(await client.DELETE('/permissions/{permission}', { params: { path: { permission: permission.name } } })))) {
    await reload()
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('guardian.access.permissions.title')" />
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.permissions">
        <div class="space-y-4" data-testid="guardian-permissions">
          <form class="flex flex-wrap items-end gap-3" data-testid="guardian-permissions-search" @submit.prevent="find">
            <UFormField :label="t('guardian.access.permissions.search')">
              <UInput v-model="search" class="w-64" data-testid="guardian-permissions-search-input" />
            </UFormField>
            <UButton type="submit" icon="i-lucide-search">{{ t('guardian.access.filter') }}</UButton>
          </form>

          <GuardianState :ready="!pending && data !== null" :failed="failed" :status="status">
            <div class="space-y-4">
              <GuardianErrors :action="update" testid="guardian-permission-update" />
              <GuardianErrors :action="remove" testid="guardian-permission-delete" />
              <p v-if="rows.length === 0" class="atrium-empty" data-testid="guardian-permissions-empty">{{ t('guardian.access.permissions.empty') }}</p>
              <table v-else class="w-full text-left text-sm" data-testid="guardian-permissions-table">
                <thead class="text-muted">
                  <tr>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.access.permissions.fields.name') }}</th>
                    <th class="py-2 pr-3 font-medium">{{ t('guardian.access.permissions.fields.description') }}</th>
                    <th class="py-2" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr v-for="permission in rows" :key="permission.name" :data-testid="`guardian-permission-${permission.name}`">
                    <td class="py-2 pr-3">
                      <div class="flex items-center gap-2">
                        <UInput v-if="edits[permission.name]" v-model="edits[permission.name]!.name" :disabled="permission.system" class="w-56" data-testid="guardian-permission-name" />
                        <UBadge v-if="permission.system" color="neutral" variant="subtle">{{ t('guardian.access.permissions.built_in') }}</UBadge>
                      </div>
                    </td>
                    <td class="py-2 pr-3">
                      <UInput v-if="edits[permission.name]" v-model="edits[permission.name]!.description" class="w-full" data-testid="guardian-permission-description" />
                    </td>
                    <td class="py-2 text-right whitespace-nowrap">
                      <UButton size="xs" variant="soft" data-testid="guardian-permission-save" @click="save(permission)">{{ t('guardian.access.save') }}</UButton>
                      <UButton size="xs" color="error" variant="ghost" :disabled="permission.system" data-testid="guardian-permission-delete" @click="destroy(permission)">{{ t('guardian.access.permissions.delete') }}</UButton>
                    </td>
                  </tr>
                </tbody>
              </table>

              <GuardianPager :current="paging.current" :last="paging.last" testid="guardian-permissions" @go="go" />

              <UCard>
                <template #header>
                  <h2 class="font-medium">{{ t('guardian.access.permissions.new') }}</h2>
                </template>
                <form class="flex flex-wrap items-end gap-3" data-testid="guardian-permission-new-form" @submit.prevent="add">
                  <UFormField :label="t('guardian.access.permissions.fields.name')" :hint="t('guardian.access.permissions.name_hint')" :error="create.error('name')" required>
                    <UInput v-model="form.name" class="w-56" data-testid="guardian-permission-new-name" />
                  </UFormField>
                  <UFormField :label="t('guardian.access.permissions.fields.description')" :error="create.error('description')">
                    <UInput v-model="form.description" class="w-72" data-testid="guardian-permission-new-description" />
                  </UFormField>
                  <UButton type="submit" icon="i-lucide-plus" :loading="create.busy.value" data-testid="guardian-permission-new-submit">{{ t('guardian.access.permissions.create') }}</UButton>
                </form>
              </UCard>
            </div>
          </GuardianState>
        </div>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
