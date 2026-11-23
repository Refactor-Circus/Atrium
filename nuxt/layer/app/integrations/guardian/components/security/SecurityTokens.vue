<script setup lang="ts">
import GuardianActionError from '../two-factor/GuardianActionError.vue'
import GuardianState from '../two-factor/GuardianState.vue'
import { formatDate, guardianData, untypedBody, useGuardianAction, useGuardianLoad } from '../two-factor/guardian'
import { expiryOf, latestExpiry, type GuardianToken } from './security'

/**
 * The API tokens section of `/guardian/security` (AC 88, D-054): the user's
 * tokens (`guardian.tokens.index`); issuing one (`guardian.tokens.store`)
 * with a name, abilities chosen from the screen's `token_abilities` and an
 * optional expiry no later than `token_max_lifetime_days`, whose plain token
 * shows once with copy and is never stored; and revoking one
 * (`guardian.tokens.destroy`) after a confirmation. A 501 (no token driver)
 * shows "API tokens are not enabled" and no form.
 */
const props = defineProps<{ abilities: string[], maxDays: number | null }>()

const { t } = useI18n()
const issue = useGuardianAction()
const revoking = useGuardianAction()

const form = reactive({ name: '', abilities: [...props.abilities], expires: '' })
const plain = ref<string | null>(null)
const copied = ref(false)
const expiryError = ref<string | null>(null)

const latest = computed(() => latestExpiry(props.maxDays))

const { client, data: tokens, pending, failed, status, reload } = useGuardianLoad(async guardian =>
  guardianData<{ data: GuardianToken[] }>(await guardian.GET('/tokens')).data)

const disabled = computed(() => failed.value && status.value === 501)

function toggleAbility(ability: string, on: boolean): void {
  form.abilities = on ? [...new Set([...form.abilities, ability])] : form.abilities.filter(candidate => candidate !== ability)
}

async function submit(): Promise<void> {
  expiryError.value = null

  if (!client) {
    return
  }

  if (form.expires && latest.value && form.expires > latest.value) {
    expiryError.value = t('guardian.security.tokens.expiry_too_late', { days: props.maxDays ?? 0 })
    return
  }

  let token: string | null = null
  const ok = await issue.run(async () => {
    token = guardianData<{ plain_text_token: string }>(await client.POST('/tokens', {
      body: untypedBody({
        name: form.name.trim(),
        abilities: form.abilities,
        expires_at: form.expires ? expiryOf(form.expires) : null
      })
    })).plain_text_token
  })

  if (ok) {
    plain.value = token
    copied.value = false
    form.name = ''
    form.expires = ''
    await reload()
  }
}

async function copy(): Promise<void> {
  if (plain.value) {
    await navigator.clipboard?.writeText(plain.value)
    copied.value = true
  }
}

async function revoke(token: GuardianToken): Promise<void> {
  if (!client || !window.confirm(t('guardian.security.tokens.confirm_revoke', { name: token.name }))) {
    return
  }

  if (await revoking.run(async () => guardianData(await client.DELETE('/tokens/{token}', { params: { path: { token: token.id } } })))) {
    await reload()
  }
}

function hidePlain(): void {
  plain.value = null
}

onBeforeUnmount(hidePlain)
</script>

<template>
  <UCard data-testid="guardian-security-tokens">
    <template #header>
      <h2 class="font-semibold">{{ t('guardian.security.tokens.title') }}</h2>
    </template>
    <UAlert v-if="disabled" color="neutral" variant="subtle" icon="i-lucide-key-round" :title="t('guardian.security.tokens.not_enabled')" data-testid="guardian-tokens-disabled" />
    <GuardianState v-else :ready="!pending && tokens !== null" :failed="failed" :status="status" compact>
      <div class="space-y-4">
        <UAlert v-if="plain" color="success" variant="subtle" :title="t('guardian.security.tokens.plain_once')" data-testid="guardian-token-plain">
          <template #description>
            <code class="break-all font-mono" data-testid="guardian-token-plain-value">{{ plain }}</code>
          </template>
          <template #actions>
            <UButton size="xs" icon="i-lucide-copy" color="neutral" variant="soft" data-testid="guardian-token-copy" @click="copy">
              {{ copied ? t('guardian.security.tokens.copied') : t('guardian.security.tokens.copy') }}
            </UButton>
            <UButton size="xs" color="neutral" variant="ghost" data-testid="guardian-token-hide" @click="hidePlain">{{ t('guardian.security.tokens.done') }}</UButton>
          </template>
        </UAlert>

        <GuardianActionError :action="revoking" />
        <ul class="divide-y divide-default text-sm">
          <li v-for="token in tokens ?? []" :key="token.id" class="flex flex-wrap items-center justify-between gap-2 py-2" :data-testid="`guardian-token-${token.id}`">
            <span>
              <strong>{{ token.name }}</strong>
              <span class="text-muted"> · {{ token.abilities.join(', ') }} · {{ token.expires_at ? t('guardian.security.tokens.expires', { date: formatDate(token.expires_at) }) : t('guardian.security.tokens.no_expiry') }}</span>
            </span>
            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" :data-testid="`guardian-token-revoke-${token.id}`" @click="revoke(token)">
              {{ t('guardian.security.tokens.revoke') }}
            </UButton>
          </li>
          <li v-if="(tokens ?? []).length === 0" class="py-2 text-muted">{{ t('guardian.security.tokens.none') }}</li>
        </ul>

        <GuardianActionError :action="issue" />
        <form class="space-y-3" data-testid="guardian-token-form" @submit.prevent="submit">
          <UFormField :label="t('guardian.security.tokens.name')" :error="issue.error('name')" required>
            <UInput v-model="form.name" data-testid="guardian-token-name" />
          </UFormField>
          <UFormField :label="t('guardian.security.tokens.abilities')" :error="issue.error('abilities')">
            <div class="flex flex-wrap gap-3">
              <label v-for="ability in abilities" :key="ability" class="flex items-center gap-2 text-sm">
                <input type="checkbox" class="accent-(--ui-primary)" :value="ability" :checked="form.abilities.includes(ability)" :data-testid="`guardian-token-ability-${ability}`" @change="toggleAbility(ability, ($event.target as HTMLInputElement).checked)">
                {{ ability === '*' ? t('guardian.security.tokens.every_ability') : ability }}
              </label>
            </div>
          </UFormField>
          <UFormField :label="t('guardian.security.tokens.expires_at')" :hint="latest ? t('guardian.security.tokens.expiry_hint', { date: latest }) : undefined" :error="expiryError ?? issue.error('expires_at')">
            <UInput v-model="form.expires" type="date" :max="latest ?? undefined" data-testid="guardian-token-expires" />
          </UFormField>
          <UButton type="submit" icon="i-lucide-plus" :loading="issue.busy.value" data-testid="guardian-token-submit">{{ t('guardian.security.tokens.issue') }}</UButton>
        </form>
      </div>
    </GuardianState>
  </UCard>
</template>
