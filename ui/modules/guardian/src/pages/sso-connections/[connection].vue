<script setup lang="ts">
import GuardianErrors from '../../components/access/GuardianErrors.vue'
import SsoConnectionFields from '../../components/sso/SsoConnectionFields.vue'
import { fieldsOf, organizationSsoPath, SECRET_FIELDS, settingsBody, type GuardianSsoConnection, type GuardianSsoField } from '../../components/sso/sso'
import GuardianState from '../../components/two-factor/GuardianState.vue'
import { guardianData, untypedBody, useGuardianAction, useGuardianLoad, type GuardianOne } from '../../components/two-factor/guardian'
import { useAtriumIntegration } from '@refactor-circus/atrium'
import { isExternalUrl } from '@refactor-circus/atrium'

/**
 * `guardian.sso-connection` (AC 96): one SSO connection
 * (`guardian.sso-connections.show`), ported from v1's `sso-connection` view
 * and `SsoUiController`. It shows the URLs the identity provider needs and
 * the linked identities' count; updates the `name`, `enabled`, `enforced`
 * and `jit` flags and the protocol's settings (`.update`, D-072), where a
 * blank secret keeps the stored one; and deletes the connection (`.destroy`)
 * after a confirmation. While the Roster integration is active it links
 * back to the organization's SSO tab, where a delete also returns. The v1
 * features with no v2 route are listed at the top of
 * `integrations/guardian/index.ts` (D-032, D-073).
 */
const { t } = useI18n()
const route = useRoute()
const save = useGuardianAction()
const remove = useGuardianAction()
const roster = useAtriumIntegration('roster')

const slug = computed(() => String(route.params.connection))

const { client, data: connection, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianOne<GuardianSsoConnection>>(await guardian.GET('/sso-connections/{connection}', { params: { path: { connection: slug.value } } })).data, slug)

useHead({ title: () => connection.value?.name ?? t('guardian.sso.connection.title') })

const back = computed(() => roster.active && connection.value?.organization ? organizationSsoPath(connection.value.organization) : null)
const form = reactive({ name: '', enabled: true, enforced: false, jit: true })
const settings = reactive<Partial<Record<GuardianSsoField, string>>>({})
const saved = ref(false)

watch(connection, (current) => {
  if (!current) {
    return
  }

  Object.assign(form, { name: current.name, enabled: current.enabled, enforced: current.enforced, jit: current.jit })

  for (const field of fieldsOf(current.protocol)) {
    settings[field] = SECRET_FIELDS.includes(field) ? '' : current.settings?.[field] ?? ''
  }
}, { immediate: true })

async function update(): Promise<void> {
  const current = connection.value

  if (!client || !current) {
    return
  }

  saved.value = false
  saved.value = await save.run(async () => guardianData(await client.PATCH('/sso-connections/{connection}', {
    params: { path: { connection: current.slug } },
    body: untypedBody({
      name: form.name.trim(),
      enabled: form.enabled,
      enforced: form.enforced,
      jit: form.jit,
      ...settingsBody(current.protocol, settings, true)
    })
  })))

  if (saved.value) {
    await reload()
  }
}

async function destroy(): Promise<void> {
  const current = connection.value

  if (!client || !current || !window.confirm(t('guardian.sso.connection.confirm_delete', { name: current.name }))) {
    return
  }

  const target = back.value

  if (await remove.run(async () => guardianData(await client.DELETE('/sso-connections/{connection}', { params: { path: { connection: current.slug } } })))) {
    await navigateTo(target ?? '/')
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="connection?.name ?? t('guardian.sso.connection.title')">
        <template #leading>
          <UButton v-if="back" :to="back" variant="ghost" icon="i-lucide-arrow-left" :aria-label="t('guardian.sso.connection.back')" data-testid="guardian-sso-back" />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <AtriumIntegrationScreen screen-key="guardian.sso-connection" :record="slug">
        <GuardianState :ready="!pending && connection !== null" :failed="failed" :status="status" :not-found="t('guardian.sso.connection.not_found')">
          <div v-if="connection" class="space-y-4" data-testid="guardian-sso-connection">
            <UCard>
              <template #header>
                <h2 class="font-semibold">{{ t(`guardian.sso.protocols.${connection.protocol}`, connection.protocol) }} · {{ connection.organization }}</h2>
              </template>
              <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[14rem_1fr]">
                <dt class="text-muted">{{ t('guardian.sso.connection.callback_url') }}</dt>
                <dd class="break-all font-mono text-xs" data-testid="guardian-sso-callback-url">{{ connection.callback_url ?? '—' }}</dd>
                <template v-if="connection.metadata_url">
                  <dt class="text-muted">{{ t('guardian.sso.connection.metadata_url') }}</dt>
                  <dd class="break-all font-mono text-xs" data-testid="guardian-sso-metadata-url">{{ connection.metadata_url }}</dd>
                </template>
                <dt class="text-muted">{{ t('guardian.sso.identities.title') }}</dt>
                <dd data-testid="guardian-sso-identities-count">{{ connection.identities_count ?? '—' }}</dd>
              </dl>
              <UButton
                v-if="connection.sign_in_url && isExternalUrl(connection.sign_in_url)"
                :to="connection.sign_in_url"
                external
                target="_blank"
                rel="noopener"
                class="mt-3"
                variant="ghost"
                icon="i-lucide-external-link"
                data-testid="guardian-sso-test-sign-in"
              >
                {{ t('guardian.sso.connection.test_sign_in') }}
              </UButton>
            </UCard>

            <UCard>
              <template #header>
                <h2 class="font-semibold">{{ t('guardian.sso.connection.settings') }}</h2>
              </template>
              <form class="max-w-3xl space-y-4" data-testid="guardian-sso-form" @submit.prevent="update">
                <UFormField :label="t('guardian.sso.fields.name')" :error="save.error('name')" required>
                  <UInput v-model="form.name" class="w-72" data-testid="guardian-sso-name" />
                </UFormField>
                <SsoConnectionFields :protocol="connection.protocol" :values="settings" :action="save" editing testid="guardian-sso" />
                <div class="flex flex-wrap gap-4 text-sm">
                  <label class="flex items-center gap-1">
                    <input v-model="form.jit" type="checkbox" data-testid="guardian-sso-jit">
                    {{ t('guardian.sso.fields.jit') }}
                  </label>
                  <label class="flex items-center gap-1">
                    <input v-model="form.enforced" type="checkbox" data-testid="guardian-sso-enforced">
                    {{ t('guardian.sso.fields.enforced') }}
                  </label>
                  <label class="flex items-center gap-1">
                    <input v-model="form.enabled" type="checkbox" data-testid="guardian-sso-enabled">
                    {{ t('guardian.sso.fields.enabled') }}
                  </label>
                </div>
                <GuardianErrors v-if="Object.keys(save.errors.value).length === 0" :action="save" testid="guardian-sso-save" />
                <div class="flex items-center gap-3">
                  <UButton type="submit" icon="i-lucide-check" :loading="save.busy.value" data-testid="guardian-sso-save">{{ t('guardian.sso.save') }}</UButton>
                  <span v-if="saved" class="text-sm text-muted" data-testid="guardian-sso-saved">{{ t('guardian.sso.saved') }}</span>
                </div>
              </form>
            </UCard>

            <div class="space-y-2">
              <UButton color="error" variant="soft" icon="i-lucide-trash" data-testid="guardian-sso-delete" @click="destroy">{{ t('guardian.sso.connection.delete') }}</UButton>
              <GuardianErrors :action="remove" testid="guardian-sso-delete" />
            </div>
          </div>
        </GuardianState>
      </AtriumIntegrationScreen>
    </template>
  </UDashboardPanel>
</template>
