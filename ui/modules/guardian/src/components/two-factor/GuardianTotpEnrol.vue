<script setup lang="ts">
import GuardianActionError from './GuardianActionError.vue'
import GuardianQrCode from './GuardianQrCode.vue'
import {
  guardianData,
  useGuardianAction,
  type GuardianClient,
  type GuardianConfirmedFactor,
  type GuardianOne
} from './guardian'

/**
 * Enrols an authenticator app (AC 87): `two-factor/totp` answers the secret
 * and its `otpauth://` URI, shown as a QR code drawn in the browser and as
 * text for manual entry (D-051); `two-factor/totp/confirm` with a code from
 * the app confirms it, answering the recovery codes on the first factor.
 * The secret and URI live only in this component: never stored, logged or
 * sent anywhere else, and dropped once confirmed or unmounted.
 */
const props = defineProps<{ client: GuardianClient }>()
const emit = defineEmits<{ confirmed: [codes: string[] | null] }>()

const { t } = useI18n()
const start = useGuardianAction()
const confirm = useGuardianAction()

const label = ref('')
const code = ref('')
const secret = ref<string | null>(null)
const uri = ref<string | null>(null)

function forget(): void {
  secret.value = null
  uri.value = null
  code.value = ''
}

async function begin(): Promise<void> {
  await start.run(async () => {
    const enrolment = guardianData<GuardianOne<{ secret: string, otpauth_uri: string }>>(await props.client.POST('/two-factor/totp', {
      body: { label: label.value.trim() || null }
    })).data

    secret.value = enrolment.secret
    uri.value = enrolment.otpauth_uri
  })
}

async function submit(): Promise<void> {
  let codes: string[] | null = null
  const confirmed = await confirm.run(async () => {
    codes = guardianData<GuardianOne<GuardianConfirmedFactor>>(await props.client.POST('/two-factor/totp/confirm', {
      body: { code: code.value.trim() }
    })).data.recovery_codes ?? null
  })

  code.value = ''

  if (confirmed) {
    forget()
    emit('confirmed', codes)
  }
}

onBeforeUnmount(forget)
</script>

<template>
  <div class="space-y-3" data-testid="guardian-totp">
    <h3 class="font-medium">{{ t('guardian.two_factor.totp.title') }}</h3>
    <GuardianActionError :action="start" />

    <form v-if="!uri" class="flex flex-wrap items-end gap-2" data-testid="guardian-totp-start" @submit.prevent="begin">
      <UFormField :label="t('guardian.two_factor.fields.label')" :error="start.error('label')">
        <UInput v-model="label" data-testid="guardian-totp-label" />
      </UFormField>
      <UButton type="submit" :loading="start.busy.value" data-testid="guardian-totp-begin">{{ t('guardian.two_factor.totp.begin') }}</UButton>
    </form>

    <div v-else class="space-y-3">
      <p class="text-sm text-muted">{{ t('guardian.two_factor.totp.scan') }}</p>
      <GuardianQrCode :value="uri" :label="t('guardian.two_factor.totp.qr_label')" />
      <p class="text-sm">
        {{ t('guardian.two_factor.totp.manual') }}
        <code class="break-all font-mono" data-testid="guardian-totp-secret">{{ secret }}</code>
      </p>
      <GuardianActionError :action="confirm" />
      <form class="flex flex-wrap items-end gap-2" data-testid="guardian-totp-confirm" @submit.prevent="submit">
        <UFormField :label="t('guardian.two_factor.fields.code')" :error="confirm.error('code')" required>
          <UInput v-model="code" autocomplete="one-time-code" inputmode="numeric" data-testid="guardian-totp-code" />
        </UFormField>
        <UButton type="submit" :loading="confirm.busy.value" data-testid="guardian-totp-submit">{{ t('guardian.two_factor.confirm') }}</UButton>
      </form>
    </div>
  </div>
</template>
