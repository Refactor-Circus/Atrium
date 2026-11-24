<script setup lang="ts">
import { useGuardianPageClient } from '../../components/two-factor/client'
import {
  guardedRedirect,
  guardianData,
  untypedBody,
  useGuardianAction,
  type GuardianChallengeMethod,
  type GuardianOne,
  type GuardianTwoFactorStatus
} from '../../components/two-factor/guardian'
import GuardianActionError from '../../components/two-factor/GuardianActionError.vue'
import { getPasskey, passkeysSupported } from '../../components/two-factor/webauthn'
import { atriumStatus } from '@refactor-circus/atrium'

/**
 * `guardian.two-factor-challenge`: the second step of signing in (AC 85,
 * D-050), where Guardian's `two_factor_challenge_required` 403 sends a user.
 * The session owes a challenge, so the shell cannot load: the page is
 * public, renders in the public layout and reaches Guardian through a
 * client of its own, calling no `atrium.screens.show`.
 *
 * It reads `GET two-factor` and offers each method the user has: an
 * authenticator code, an email or SMS code (with "send code",
 * `two-factor/challenge/send`), a passkey (`two-factor/challenge/passkey-options`,
 * then `navigator.credentials.get()`), and a recovery code. It answers with
 * `POST two-factor/challenge`. On 204 it reloads the shell and goes to
 * `redirect` when that is a path inside the SPA, else to `/`. A 422 shows
 * the error, a 429 a "too many attempts" state, and a 401 calls the auth
 * adapter's `onUnauthorized()` (in the client).
 *
 * Codes go only in `one-time-code` inputs and the request body: never the
 * URL, the title, the console or storage.
 */

type State = 'loading' | 'ready' | 'failed' | 'throttled'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useAtriumShellStore()
const client = useGuardianPageClient()
const action = useGuardianAction()

useHead({ title: () => t('guardian.two_factor.challenge.title') })

const state = ref<State>('loading')
const status = shallowRef<GuardianTwoFactorStatus | null>(null)
const method = ref<GuardianChallengeMethod | null>(null)
const code = ref('')
const sent = ref(false)

/** The ways this user can pass, in Guardian's order. */
const methods = computed<GuardianChallengeMethod[]>(() => {
  const current = status.value

  if (!current) {
    return []
  }

  const confirmed = new Set(current.methods.filter(item => item.confirmed_at !== null).map(item => item.type))
  const offered: GuardianChallengeMethod[] = []

  for (const type of ['totp', 'email', 'sms'] as const) {
    if (confirmed.has(type)) {
      offered.push(type)
    }
  }

  if (current.passkeys.length > 0 && current.passkeys_available && passkeysSupported()) {
    offered.push('passkey')
  }

  if (current.recovery_codes_remaining > 0) {
    offered.push('recovery')
  }

  return offered
})

watch(methods, (offered) => {
  if (method.value === null || !offered.includes(method.value)) {
    method.value = offered[0] ?? null
  }
})

watch(method, () => {
  code.value = ''
  sent.value = false
  action.reset()
})

function choose(next: GuardianChallengeMethod): void {
  method.value = next
}

async function load(): Promise<void> {
  state.value = 'loading'

  try {
    status.value = guardianData<GuardianOne<GuardianTwoFactorStatus>>(await client.GET('/two-factor')).data
    state.value = 'ready'
  } catch (error) {
    state.value = atriumStatus(error) === 429 ? 'throttled' : 'failed'
  }
}

/** Where the user goes once through. */
async function done(): Promise<void> {
  await store.load(true)
  await router.replace(guardedRedirect(route.query.redirect))
}

/** Settles a failed attempt: a 429 is the "too many attempts" state, the rest show in place. */
function settle(passed: boolean): Promise<void> | void {
  if (passed) {
    return done()
  }

  if (action.status.value === 429) {
    state.value = 'throttled'
  }
}

async function sendCode(): Promise<void> {
  const chosen = method.value

  if (chosen !== 'email' && chosen !== 'sms') {
    return
  }

  sent.value = await action.run(async () => {
    guardianData(await client.POST('/two-factor/challenge/send', { body: { method: chosen } }))
  })

  await settle(false)
}

async function submitCode(): Promise<void> {
  const chosen = method.value

  if (!chosen || chosen === 'passkey') {
    return
  }

  const body = { method: chosen, code: code.value.trim() }

  code.value = ''

  await settle(await action.run(async () => {
    guardianData(await client.POST('/two-factor/challenge', { body }))
  }))
}

async function usePasskey(): Promise<void> {
  await settle(await action.run(async () => {
    const options = guardianData<{ data: Record<string, unknown> }>(await client.POST('/two-factor/challenge/passkey-options')).data
    const assertion = await getPasskey(options)

    guardianData(await client.POST('/two-factor/challenge', { body: untypedBody({ method: 'passkey', assertion }) }))
  }))
}

/** The error a 422 names, by field or in general. */
const error = computed(() => action.error('code') ?? action.error('assertion') ?? action.error('method') ?? (action.status.value === 422 ? action.message.value : null))

void load()
</script>

<template>
  <UCard data-testid="guardian-challenge">
    <template #header>
      <h1 class="text-lg font-semibold">{{ t('guardian.two_factor.challenge.title') }}</h1>
      <p class="text-sm text-muted">{{ t('guardian.two_factor.challenge.intro') }}</p>
    </template>

    <USkeleton v-if="state === 'loading'" class="h-32" data-testid="guardian-challenge-loading" />

    <UAlert
      v-else-if="state === 'throttled'"
      color="warning"
      variant="subtle"
      icon="i-lucide-timer"
      :title="t('guardian.two_factor.throttled')"
      :description="action.retryAfter.value ? t('guardian.two_factor.retry_after', { seconds: action.retryAfter.value }) : t('guardian.two_factor.challenge.try_later')"
      data-testid="guardian-challenge-throttled"
    />

    <AtriumErrorCard v-else-if="state === 'failed'" :message="t('guardian.two_factor.challenge.load_failed')" />

    <div v-else class="space-y-4">
      <UAlert v-if="methods.length === 0" color="neutral" variant="subtle" :title="t('guardian.two_factor.challenge.no_methods')" data-testid="guardian-challenge-none" />

      <div v-else class="flex flex-wrap gap-1" role="tablist" data-testid="guardian-challenge-methods">
        <UButton
          v-for="candidate in methods"
          :key="candidate"
          size="sm"
          :color="method === candidate ? 'primary' : 'neutral'"
          :variant="method === candidate ? 'solid' : 'ghost'"
          :aria-pressed="method === candidate"
          :data-testid="`guardian-challenge-method-${candidate}`"
          @click="choose(candidate)"
        >
          {{ t(`guardian.two_factor.challenge.methods.${candidate}`) }}
        </UButton>
      </div>

      <UAlert v-if="error" color="error" variant="subtle" :title="error" data-testid="guardian-challenge-error" />
      <GuardianActionError v-else-if="action.status.value !== 422 && action.status.value !== 429" :action="action" />

      <UButton
        v-if="method === 'passkey'"
        icon="i-lucide-key-round"
        :loading="action.busy.value"
        data-testid="guardian-challenge-passkey"
        @click="usePasskey"
      >
        {{ t('guardian.two_factor.challenge.use_passkey') }}
      </UButton>

      <form v-else-if="method" class="space-y-3" data-testid="guardian-challenge-form" @submit.prevent="submitCode">
        <div v-if="method === 'email' || method === 'sms'" class="flex items-center gap-2">
          <UButton type="button" color="neutral" variant="soft" :loading="action.busy.value" data-testid="guardian-challenge-send" @click="sendCode">
            {{ sent ? t('guardian.two_factor.one_time.resend') : t('guardian.two_factor.one_time.send') }}
          </UButton>
          <span v-if="sent" class="text-sm text-muted" data-testid="guardian-challenge-sent">{{ t('guardian.two_factor.one_time.sent') }}</span>
        </div>
        <UFormField :label="t(method === 'recovery' ? 'guardian.two_factor.fields.recovery_code' : 'guardian.two_factor.fields.code')" required>
          <UInput v-model="code" autocomplete="one-time-code" :inputmode="method === 'recovery' ? 'text' : 'numeric'" autofocus data-testid="guardian-challenge-code" />
        </UFormField>
        <UButton type="submit" :loading="action.busy.value" data-testid="guardian-challenge-submit">{{ t('guardian.two_factor.challenge.submit') }}</UButton>
      </form>
    </div>
  </UCard>
</template>
