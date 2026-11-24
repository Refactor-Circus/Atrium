<script setup lang="ts">
import GuardianErrors from '../access/GuardianErrors.vue'
import GuardianPager from '../access/GuardianPager.vue'
import { pageOf } from '../access/access'
import GuardianState from '../two-factor/GuardianState.vue'
import { guardianData, untypedBody, useGuardianAction, useGuardianLoad, type GuardianClient, type GuardianPage } from '../two-factor/guardian'
import SsoConnectionFields from './SsoConnectionFields.vue'
import { connectionPath, settingsBody, SSO_PAGE_SIZE, SSO_PROTOCOLS, type GuardianSsoConnection, type GuardianSsoField, type GuardianSsoProtocol } from './sso'

/**
 * An organization's SSO connections (the `guardian.sso` tab, AC 96), ported
 * from v1's `organization-sso` view: the list
 * (`guardian.organizations.sso-connections.index`, a page at a time), each
 * linked to its page, and a new connection (`.store`) with its `name`,
 * `protocol` and that protocol's settings (D-072), which opens the new
 * connection's page. A 403 shows the no-access state.
 */
const props = withDefaults(defineProps<{ organization: string, client?: GuardianClient | null }>(), { client: undefined })

const { t } = useI18n()
const create = useGuardianAction()

const page = ref(1)
const query = computed(() => ({ per_page: SSO_PAGE_SIZE, ...(page.value > 1 ? { page: page.value } : {}) }))

const { client, data, pending, failed, status } = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianSsoConnection>>(await guardian.GET('/organizations/{organization}/sso-connections', {
    params: { path: { organization: props.organization }, query: query.value }
  })), () => [props.organization, query.value], props.client === undefined ? undefined : props.client)

const rows = computed(() => data.value?.data ?? [])
const paging = computed(() => pageOf(data.value))
const form = reactive({ name: '', protocol: 'oidc' as GuardianSsoProtocol })
const settings = reactive<Partial<Record<GuardianSsoField, string>>>({})

async function add(): Promise<void> {
  if (!client) {
    return
  }

  const created: { connection: GuardianSsoConnection | null } = { connection: null }
  const ok = await create.run(async () => {
    created.connection = guardianData<{ data: GuardianSsoConnection }>(await client.POST('/organizations/{organization}/sso-connections', {
      params: { path: { organization: props.organization } },
      body: untypedBody({ name: form.name.trim(), protocol: form.protocol, ...settingsBody(form.protocol, settings) })
    })).data
  })

  if (ok && created.connection) {
    await navigateTo(connectionPath(created.connection.slug))
  }
}

function go(next: number): void {
  page.value = next
}
</script>

<template>
  <div class="space-y-4" data-testid="guardian-sso-connections">
    <GuardianState :ready="!pending && data !== null" :failed="failed" :status="status" compact>
      <div class="space-y-4">
        <p v-if="rows.length === 0" class="atrium-empty" data-testid="guardian-sso-connections-empty">{{ t('guardian.sso.connections.empty') }}</p>
        <table v-else class="w-full text-left text-sm">
          <thead class="text-muted">
            <tr>
              <th class="py-2 pr-3 font-medium">{{ t('guardian.sso.fields.name') }}</th>
              <th class="py-2 pr-3 font-medium">{{ t('guardian.sso.fields.protocol') }}</th>
              <th class="py-2 font-medium">{{ t('guardian.sso.identities.title') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="connection in rows" :key="connection.slug" :data-testid="`guardian-sso-connection-${connection.slug}`">
              <td class="py-2 pr-3">
                <div class="flex flex-wrap items-center gap-2">
                  <RouterLink :to="connectionPath(connection.slug)" class="font-medium hover:underline" data-testid="guardian-sso-connection-link">{{ connection.name }}</RouterLink>
                  <UBadge v-if="connection.enforced" color="warning" variant="subtle">{{ t('guardian.sso.enforced_badge') }}</UBadge>
                  <UBadge v-if="!connection.enabled" color="neutral" variant="subtle">{{ t('guardian.sso.disabled_badge') }}</UBadge>
                </div>
              </td>
              <td class="py-2 pr-3">{{ t(`guardian.sso.protocols.${connection.protocol}`, connection.protocol) }}</td>
              <td class="py-2">{{ connection.identities_count ?? '—' }}</td>
            </tr>
          </tbody>
        </table>

        <GuardianPager :current="paging.current" :last="paging.last" testid="guardian-sso-connections" @go="go" />

        <UCard>
          <template #header>
            <h3 class="font-medium">{{ t('guardian.sso.connections.new') }}</h3>
          </template>
          <form class="space-y-3" data-testid="guardian-sso-new-form" @submit.prevent="add">
            <div class="flex flex-wrap items-end gap-3">
              <UFormField :label="t('guardian.sso.fields.name')" :error="create.error('name')" required>
                <UInput v-model="form.name" class="w-56" data-testid="guardian-sso-new-name" />
              </UFormField>
              <UFormField :label="t('guardian.sso.fields.protocol')" :error="create.error('protocol')" required>
                <select v-model="form.protocol" class="w-56 rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="guardian-sso-new-protocol">
                  <option v-for="protocol in SSO_PROTOCOLS" :key="protocol" :value="protocol">{{ t(`guardian.sso.protocols.${protocol}`) }}</option>
                </select>
              </UFormField>
            </div>
            <SsoConnectionFields :protocol="form.protocol" :values="settings" :action="create" testid="guardian-sso-new" />
            <GuardianErrors v-if="Object.keys(create.errors.value).length === 0" :action="create" testid="guardian-sso-new" />
            <UButton type="submit" icon="i-lucide-plus" :loading="create.busy.value" data-testid="guardian-sso-new-submit">{{ t('guardian.sso.connections.create') }}</UButton>
          </form>
        </UCard>
      </div>
    </GuardianState>
  </div>
</template>
