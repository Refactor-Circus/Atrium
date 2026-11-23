<script setup lang="ts">
import GuardianActionError from './GuardianActionError.vue'
import {
  guardianData,
  useGuardianAction,
  type GuardianClient,
  type GuardianConfirmedFactor,
  type GuardianOne,
  type GuardianOneTimeType
} from './guardian'

/**
 * Enrols an email or SMS code (AC 87, D-053): `two-factor/one-time-codes`
 * with the type and destination sends a code, and `.../confirm` with it
 * confirms the method. No route says which channels this site can send, so
 * both are offered (within the policy's methods); a 422
 * `method_unavailable` says "not available on this site" and hides that
 * type for as long as the component lives. A 429 on a resend shows the wait.
 */
const props = defineProps<{ client: GuardianClient, types: GuardianOneTimeType[] }>()
const emit = defineEmits<{ confirmed: [codes: string[] | null] }>()

const { t } = useI18n()
const send = useGuardianAction()
const confirm = useGuardianAction()

const unavailable = ref<GuardianOneTimeType[]>([])
const type = ref<GuardianOneTimeType | null>(null)
const destination = ref('')
const sent = ref(false)
const code = ref('')
const notice = ref<string | null>(null)

const offered = computed(() => props.types.filter(candidate => !unavailable.value.includes(candidate)))

watch(offered, (types) => {
  if (type.value === null || !types.includes(type.value)) {
    type.value = types[0] ?? null
  }
}, { immediate: true })

async function sendCode(): Promise<void> {
  const chosen = type.value

  if (!chosen) {
    return
  }

  notice.value = null
  const ok = await send.run(async () => {
    guardianData(await props.client.POST('/two-factor/one-time-codes', {
      body: { type: chosen, destination: destination.value.trim() }
    }))
  })

  if (ok) {
    sent.value = true
  } else if (send.code.value === 'method_unavailable') {
    unavailable.value = [...unavailable.value, chosen]
    notice.value = t('guardian.two_factor.one_time.unavailable', { type: t(`guardian.two_factor.types.${chosen}`) })
    sent.value = false
  }
}

async function submit(): Promise<void> {
  const chosen = type.value

  if (!chosen) {
    return
  }

  let codes: string[] | null = null
  const ok = await confirm.run(async () => {
    codes = guardianData<GuardianOne<GuardianConfirmedFactor>>(await props.client.POST('/two-factor/one-time-codes/confirm', {
      body: { type: chosen, code: code.value.trim() }
    })).data.recovery_codes ?? null
  })

  code.value = ''

  if (ok) {
    sent.value = false
    destination.value = ''
    emit('confirmed', codes)
  }
}
</script>

<template>
  <div class="space-y-3" data-testid="guardian-one-time">
    <h3 class="font-medium">{{ t('guardian.two_factor.one_time.title') }}</h3>
    <UAlert v-if="notice" color="neutral" variant="subtle" :title="notice" data-testid="guardian-one-time-unavailable" />

    <template v-if="offered.length > 0">
      <form class="flex flex-wrap items-end gap-2" data-testid="guardian-one-time-send" @submit.prevent="sendCode">
        <UFormField :label="t('guardian.two_factor.fields.type')">
          <select v-model="type" class="rounded border border-default bg-default px-2 py-1.5 text-sm" data-testid="guardian-one-time-type">
            <option v-for="candidate in offered" :key="candidate" :value="candidate">{{ t(`guardian.two_factor.types.${candidate}`) }}</option>
          </select>
        </UFormField>
        <UFormField :label="t(type === 'sms' ? 'guardian.two_factor.fields.phone' : 'guardian.two_factor.fields.email')" :error="send.error('destination')" required>
          <UInput v-model="destination" :type="type === 'sms' ? 'tel' : 'email'" data-testid="guardian-one-time-destination" />
        </UFormField>
        <UButton type="submit" :loading="send.busy.value" data-testid="guardian-one-time-submit-send">
          {{ sent ? t('guardian.two_factor.one_time.resend') : t('guardian.two_factor.one_time.send') }}
        </UButton>
      </form>
      <GuardianActionError v-if="send.code.value !== 'method_unavailable'" :action="send" />

      <form v-if="sent" class="flex flex-wrap items-end gap-2" data-testid="guardian-one-time-confirm" @submit.prevent="submit">
        <UFormField :label="t('guardian.two_factor.fields.code')" :hint="t('guardian.two_factor.one_time.sent')" :error="confirm.error('code')" required>
          <UInput v-model="code" autocomplete="one-time-code" inputmode="numeric" data-testid="guardian-one-time-code" />
        </UFormField>
        <UButton type="submit" :loading="confirm.busy.value" data-testid="guardian-one-time-submit">{{ t('guardian.two_factor.confirm') }}</UButton>
      </form>
      <GuardianActionError :action="confirm" />
    </template>
  </div>
</template>
