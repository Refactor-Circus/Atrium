<script setup lang="ts">
import GuardianActionError from './GuardianActionError.vue'
import GuardianFactorRemoval from './GuardianFactorRemoval.vue'
import GuardianOneTimeCodes from './GuardianOneTimeCodes.vue'
import GuardianPasskeys from './GuardianPasskeys.vue'
import GuardianRecoveryCodes from './GuardianRecoveryCodes.vue'
import GuardianTotpEnrol from './GuardianTotpEnrol.vue'
import {
  confirmedMethods,
  formatDate,
  guardianData,
  offeredMethods,
  useGuardianAction,
  type GuardianClient,
  type GuardianOne,
  type GuardianOneTimeType,
  type GuardianTwoFactorStatus
} from './guardian'

/**
 * The user's two-factor methods, from `GET two-factor` (AC 87, 88): the
 * confirmed methods with removal, enrolment of every method the policy
 * allows (only `allowed_methods` while two-factor is required), passkeys,
 * and the recovery codes: the remaining count, and a regeneration after a
 * confirmation, whose codes show once. `setup` (the setup page) enrols only,
 * and hands the first factor's recovery codes to the page.
 */
const props = withDefaults(defineProps<{ client: GuardianClient, status: GuardianTwoFactorStatus, setup?: boolean }>(), { setup: false })
const emit = defineEmits<{ changed: [], confirmed: [codes: string[] | null] }>()

const { t } = useI18n()
const regenerate = useGuardianAction()
const codes = ref<string[] | null>(null)

const offered = computed(() => offeredMethods(props.status))
const oneTimeTypes = computed(() => offered.value.filter((type): type is GuardianOneTimeType => type === 'email' || type === 'sms'))
const methods = computed(() => confirmedMethods(props.status))

function confirmed(recovery: string[] | null): void {
  if (props.setup) {
    emit('confirmed', recovery)
    return
  }

  codes.value = recovery && recovery.length > 0 ? recovery : null
  emit('changed')
}

async function regenerateCodes(): Promise<void> {
  if (!window.confirm(t('guardian.two_factor.recovery.confirm_regenerate'))) {
    return
  }

  await regenerate.run(async () => {
    codes.value = guardianData<GuardianOne<{ recovery_codes: string[] }>>(await props.client.POST('/two-factor/recovery-codes')).data.recovery_codes
  })

  emit('changed')
}

onBeforeUnmount(() => {
  codes.value = null
})
</script>

<template>
  <div class="space-y-4" data-testid="guardian-two-factor-methods">
    <GuardianRecoveryCodes v-if="codes" :codes="codes" @done="codes = null" />

    <section v-if="!setup" class="space-y-2">
      <h3 class="font-medium">{{ t('guardian.two_factor.methods.title') }}</h3>
      <ul class="divide-y divide-default text-sm">
        <li v-for="method in methods" :key="method.id" class="flex flex-wrap items-center justify-between gap-2 py-2" :data-testid="`guardian-method-${method.id}`">
          <span>
            <strong>{{ t(`guardian.two_factor.types.${method.type}`) }}</strong>
            {{ method.label ?? method.destination ?? '' }}
            <span class="text-muted">{{ formatDate(method.last_used_at) ?? t('guardian.two_factor.never_used') }}</span>
          </span>
          <GuardianFactorRemoval :client="client" kind="method" :id="method.id" :name="t(`guardian.two_factor.types.${method.type}`)" @removed="emit('changed')" />
        </li>
        <li v-if="methods.length === 0" class="py-2 text-muted">{{ t('guardian.two_factor.methods.none') }}</li>
      </ul>
    </section>

    <GuardianTotpEnrol v-if="offered.includes('totp')" :client="client" @confirmed="confirmed" />
    <GuardianOneTimeCodes v-if="oneTimeTypes.length > 0" :client="client" :types="oneTimeTypes" @confirmed="confirmed" />
    <GuardianPasskeys v-if="offered.includes('passkey')" :client="client" :available="status.passkeys_available" :manage="!setup" @confirmed="confirmed" @changed="emit('changed')" />

    <section v-if="!setup && status.enabled" class="space-y-2" data-testid="guardian-recovery">
      <h3 class="font-medium">{{ t('guardian.two_factor.recovery.title') }}</h3>
      <p class="text-sm" data-testid="guardian-recovery-remaining">{{ t('guardian.two_factor.recovery.remaining', { count: status.recovery_codes_remaining }) }}</p>
      <GuardianActionError :action="regenerate" />
      <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="regenerate.busy.value" data-testid="guardian-recovery-regenerate" @click="regenerateCodes">
        {{ t('guardian.two_factor.recovery.regenerate') }}
      </UButton>
    </section>
  </div>
</template>
