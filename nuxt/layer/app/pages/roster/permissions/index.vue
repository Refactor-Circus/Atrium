<script setup lang="ts">
import AccessState from '../../../integrations/roster/components/access/AccessState.vue'
import type { RosterPermission } from '../../../integrations/roster/components/access/access'
import RosterActionError from '../../../integrations/roster/components/users/RosterActionError.vue'
import RosterPager from '../../../integrations/roster/components/users/RosterPager.vue'
import {
  blankToNull,
  pageOf,
  queryPage,
  rosterData,
  useRosterAction,
  useRosterLoad,
  type RosterPage
} from '../../../integrations/roster/components/users/users'

/**
 * `roster.permissions`: every permission (`roster.permissions.index`), a
 * page at a time, ported from v1's `permissions/index`. v1's form (name and
 * description) posts to `roster.permissions.store`; each row's description
 * saves through `roster.permissions.update`, and a permission that is not
 * built in is deleted through `roster.permissions.destroy`. Permissions are
 * addressed by name.
 */
const { t } = useI18n()
const route = useRoute()
const creating = useRosterAction()
const action = useRosterAction()

const query = computed(() => {
  const page = queryPage(route.query.page)

  return page > 1 ? { page } : {}
})

const { client, data, pending, failed, status, reload } = useRosterLoad(async roster =>
  rosterData<RosterPage<RosterPermission>>(await roster.GET('/permissions', { params: { query: query.value } })), query)

const permissions = computed(() => data.value?.data ?? [])
const paging = computed(() => pageOf(data.value))

/** Each row's description, by permission name, as typed. */
const descriptions = reactive<Record<string, string>>({})

/** The row the last save or delete was for, so its field error shows there. */
const acting = ref<string | null>(null)

watch(permissions, (list) => {
  for (const permission of list) {
    descriptions[permission.name] = permission.description ?? ''
  }
}, { immediate: true })

const form = reactive({ name: '', description: '' })

async function create(): Promise<void> {
  if (!client) {
    return
  }

  const ok = await creating.run(async () => rosterData(await client.POST('/permissions', {
    body: { name: form.name, description: blankToNull(form.description) }
  })))

  if (ok) {
    form.name = ''
    form.description = ''
    await reload()
  }
}

async function save(permission: RosterPermission): Promise<void> {
  if (!client) {
    return
  }

  acting.value = permission.name

  const ok = await action.run(async () => rosterData(await client.PATCH('/permissions/{permission}', {
    params: { path: { permission: permission.name } },
    body: { description: blankToNull(descriptions[permission.name]) }
  })))

  if (ok) {
    await reload()
  }
}

async function destroy(permission: RosterPermission): Promise<void> {
  if (!client) {
    return
  }

  acting.value = permission.name

  if (await action.run(async () => rosterData(await client.DELETE('/permissions/{permission}', { params: { path: { permission: permission.name } } })))) {
    await reload()
  }
}
</script>

<template>
  <div class="space-y-4" data-testid="roster-permissions">
    <h1 class="text-xl font-semibold">{{ t('roster.permissions.title') }}</h1>

    <AtriumIntegrationScreen screen-key="roster.permissions">
      <AccessState :ready="!pending && data !== null" :failed="failed" :status="status">
        <div class="space-y-4">
          <UCard>
            <template #header>
              <h2 class="font-medium">{{ t('roster.permissions.new') }}</h2>
            </template>
            <form class="flex flex-col gap-3" data-testid="roster-permission-new-form" @submit.prevent="create">
              <RosterActionError :action="creating" />
              <div class="flex flex-wrap items-start gap-3">
                <UFormField :label="t('roster.permissions.fields.name')" :hint="t('roster.permissions.name_hint')" :error="creating.error('name')" required>
                  <UInput v-model="form.name" class="w-64" data-testid="roster-permission-new-name" />
                </UFormField>
                <UFormField :label="t('roster.permissions.fields.description')" :error="creating.error('description')">
                  <UInput v-model="form.description" class="w-80" data-testid="roster-permission-new-description" />
                </UFormField>
                <UButton type="submit" icon="i-lucide-plus" class="mt-6" :loading="creating.busy.value" data-testid="roster-permission-new-submit">{{ t('roster.permissions.create') }}</UButton>
              </div>
            </form>
          </UCard>

          <RosterActionError :action="action" />

          <p v-if="permissions.length === 0" class="text-sm text-muted" data-testid="roster-permissions-empty">{{ t('roster.permissions.empty') }}</p>
          <table v-else class="w-full text-left text-sm" data-testid="roster-permissions-table">
            <thead class="text-muted">
              <tr>
                <th class="py-2 pr-3 font-medium">{{ t('roster.permissions.fields.name') }}</th>
                <th class="py-2 pr-3 font-medium">{{ t('roster.permissions.fields.description') }}</th>
                <th class="py-2 text-right font-medium">{{ t('roster.permissions.fields.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="permission in permissions" :key="permission.name" :data-testid="`roster-permission-row-${permission.name}`">
                <td class="py-2 pr-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <code>{{ permission.name }}</code>
                    <UBadge v-if="permission.system" color="neutral" variant="subtle">{{ t('roster.permissions.built_in') }}</UBadge>
                  </div>
                </td>
                <td class="py-2 pr-3">
                  <UFormField :error="acting === permission.name ? action.error('description') : undefined">
                    <UInput
                      v-model="descriptions[permission.name]"
                      class="w-80"
                      :aria-label="t('roster.permissions.fields.description')"
                      :data-testid="`roster-permission-description-${permission.name}`"
                    />
                  </UFormField>
                </td>
                <td class="py-2">
                  <div class="flex justify-end gap-2">
                    <UButton
                      size="sm"
                      variant="ghost"
                      icon="i-lucide-check"
                      :loading="action.busy.value && acting === permission.name"
                      :data-testid="`roster-permission-save-${permission.name}`"
                      @click="save(permission)"
                    >
                      {{ t('roster.permissions.save') }}
                    </UButton>
                    <UButton
                      v-if="!permission.system"
                      size="sm"
                      color="error"
                      variant="outline"
                      icon="i-lucide-trash-2"
                      :loading="action.busy.value && acting === permission.name"
                      :data-testid="`roster-permission-delete-${permission.name}`"
                      @click="destroy(permission)"
                    >
                      {{ t('roster.permissions.delete') }}
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <RosterPager :current="paging.current" :last="paging.last" testid="roster-permissions" />
        </div>
      </AccessState>
    </AtriumIntegrationScreen>
  </div>
</template>
