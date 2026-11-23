<script setup lang="ts">
import GuardianErrors from '../access/GuardianErrors.vue'
import { formatDate, guardianData, useGuardianAction, useGuardianLoad, type GuardianClient, type GuardianPage } from '../two-factor/guardian'
import { IDENTITIES_PAGE_SIZE, type GuardianSsoIdentity } from './sso'

/**
 * A user's SSO identities (the `guardian.sso-identities` section, AC 96),
 * ported from v1's `user-sso-identities` view: each linked identity
 * (`guardian.users.sso-identities.index`), with its connection, email or
 * subject and last sign-in, and unlinking one
 * (`guardian.sso-identities.destroy`) after a confirmation. As in v1, it
 * renders nothing while the user has none, nor while it loads; a 403 shows
 * the no-access state.
 */
const props = withDefaults(defineProps<{ user: string, client?: GuardianClient | null }>(), { client: undefined })

const { t } = useI18n()
const unlinking = useGuardianAction()

const { client, data, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<GuardianPage<GuardianSsoIdentity>>(await guardian.GET('/users/{user}/sso-identities', {
    params: { path: { user: props.user }, query: { per_page: IDENTITIES_PAGE_SIZE } }
  })), () => props.user, props.client === undefined ? undefined : props.client)

const identities = computed(() => data.value?.data ?? [])

async function unlink(identity: GuardianSsoIdentity): Promise<void> {
  const name = identity.email ?? identity.subject

  if (!client || !window.confirm(t('guardian.sso.identities.confirm_unlink', { name, connection: identity.connection }))) {
    return
  }

  if (await unlinking.run(async () => guardianData(await client.DELETE('/sso-identities/{identity}', { params: { path: { identity: identity.id } } })))) {
    await reload()
  }
}
</script>

<template>
  <AtriumNoAccess v-if="failed && status === 403" compact />
  <UCard v-else-if="identities.length > 0" data-testid="guardian-sso-identities">
    <template #header>
      <h3 class="font-semibold">{{ t('guardian.sso.identities.title') }}</h3>
    </template>
    <ul class="divide-y divide-default text-sm">
      <li v-for="identity in identities" :key="identity.id" class="flex items-center justify-between gap-2 py-2" :data-testid="`guardian-sso-identity-${identity.id}`">
        <span>
          {{ identity.connection }} — {{ identity.email ?? identity.subject }}
          <span class="text-muted">{{ t('guardian.sso.identities.last_login') }}: {{ formatDate(identity.last_login_at) ?? t('guardian.sso.never') }}</span>
        </span>
        <UButton size="xs" variant="ghost" color="error" icon="i-lucide-unlink" :data-testid="`guardian-sso-identity-unlink-${identity.id}`" @click="unlink(identity)">{{ t('guardian.sso.identities.unlink') }}</UButton>
      </li>
    </ul>
    <GuardianErrors :action="unlinking" testid="guardian-sso-identity-unlink" />
  </UCard>
</template>
