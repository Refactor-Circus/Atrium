<script setup lang="ts">
import GuardianActionError from './GuardianActionError.vue'
import GuardianFactorRemoval from './GuardianFactorRemoval.vue'
import {
  formatDate,
  guardianData,
  untypedBody,
  useGuardianAction,
  type GuardianClient,
  type GuardianConfirmedFactor,
  type GuardianOne,
  type GuardianPasskey
} from './guardian'
import { createPasskey, passkeysSupported } from './webauthn'
import { atriumStatus } from '@refactor-circus/atrium'

/**
 * The user's passkeys (AC 87, D-052): listed from `two-factor/passkeys`,
 * registered through `two-factor/passkeys/options`, the browser's
 * `navigator.credentials.create()` and `two-factor/passkeys` (with a label),
 * and removed with proof of another factor. The controls hide behind a note
 * when Guardian says passkeys are unavailable, when a passkey endpoint
 * answers 501 (no WebAuthn library), or when the browser has no
 * `PublicKeyCredential`. `manage` lists and removes; without it the
 * component only registers (the setup page).
 */
const props = withDefaults(defineProps<{ client: GuardianClient, available: boolean, manage?: boolean }>(), { manage: true })
const emit = defineEmits<{ confirmed: [codes: string[] | null], changed: [] }>()

const { t } = useI18n()
const register = useGuardianAction()

const passkeys = shallowRef<GuardianPasskey[]>([])
const notImplemented = ref(false)
const label = ref('')

const supported = passkeysSupported()
const hidden = computed(() => !props.available || notImplemented.value || !supported)

async function load(): Promise<void> {
  if (!props.manage || !props.available || !supported) {
    return
  }

  try {
    passkeys.value = guardianData<{ data: GuardianPasskey[] }>(await props.client.GET('/two-factor/passkeys')).data
  } catch (error) {
    notImplemented.value = atriumStatus(error) === 501
    passkeys.value = []
  }
}

async function add(): Promise<void> {
  let codes: string[] | null = null
  const ok = await register.run(async () => {
    const options = guardianData<{ data: Record<string, unknown> }>(await props.client.POST('/two-factor/passkeys/options')).data
    const credential = await createPasskey(options)

    codes = guardianData<GuardianOne<GuardianConfirmedFactor>>(await props.client.POST('/two-factor/passkeys', {
      body: untypedBody({ credential, label: label.value.trim() || null })
    })).data.recovery_codes ?? null
  })

  if (register.status.value === 501) {
    notImplemented.value = true
  }

  if (ok) {
    label.value = ''
    await load()
    emit('confirmed', codes)
  }
}

async function removed(): Promise<void> {
  await load()
  emit('changed')
}

void load()
</script>

<template>
  <div class="space-y-3" data-testid="guardian-passkeys">
    <h3 class="font-medium">{{ t('guardian.two_factor.passkeys.title') }}</h3>
    <UAlert v-if="hidden" color="neutral" variant="subtle" :title="t('guardian.two_factor.passkeys.unavailable')" data-testid="guardian-passkeys-unavailable" />

    <template v-else>
      <ul v-if="manage" class="divide-y divide-default text-sm">
        <li v-for="passkey in passkeys" :key="passkey.id" class="flex flex-wrap items-center justify-between gap-2 py-2" :data-testid="`guardian-passkey-${passkey.id}`">
          <span>
            {{ passkey.label ?? t('guardian.two_factor.passkeys.unnamed') }}
            <span class="text-muted">{{ formatDate(passkey.last_used_at) ?? t('guardian.two_factor.never_used') }}</span>
          </span>
          <GuardianFactorRemoval :client="client" kind="passkey" :id="passkey.id" :name="passkey.label ?? t('guardian.two_factor.passkeys.unnamed')" @removed="removed" />
        </li>
        <li v-if="passkeys.length === 0" class="py-2 text-muted">{{ t('guardian.two_factor.passkeys.none') }}</li>
      </ul>

      <GuardianActionError :action="register" />
      <form class="flex flex-wrap items-end gap-2" data-testid="guardian-passkey-register" @submit.prevent="add">
        <UFormField :label="t('guardian.two_factor.fields.label')" :error="register.error('label')">
          <UInput v-model="label" data-testid="guardian-passkey-label" />
        </UFormField>
        <UButton type="submit" icon="i-lucide-key-round" :loading="register.busy.value" data-testid="guardian-passkey-submit">{{ t('guardian.two_factor.passkeys.add') }}</UButton>
      </form>
    </template>
  </div>
</template>
