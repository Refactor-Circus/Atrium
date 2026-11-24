<script setup lang="ts">
import { useGuardianPageClient } from '../../components/two-factor/client'
import {
  formatDate,
  guardedRedirect,
  guardianData,
  offeredMethods,
  type GuardianOne,
  type GuardianTwoFactorStatus
} from '../../components/two-factor/guardian'
import GuardianRecoveryCodes from '../../components/two-factor/GuardianRecoveryCodes.vue'
import GuardianTwoFactorMethods from '../../components/two-factor/GuardianTwoFactorMethods.vue'
import { atriumStatus } from '@refactor-circus/atrium'

/**
 * `guardian.two-factor-setup`: where Guardian's
 * `two_factor_enrollment_required` 403 sends a user (AC 86, D-050). Public
 * and shell-less, as the challenge page is, with the same client.
 *
 * It shows the methods the policy allows (`allowed_methods`) and the
 * enrolment deadline, and offers only those methods, through the shared
 * two-factor components. After the first confirmed method it shows the
 * recovery codes once, then reloads the shell and continues to `redirect`
 * when that is a path inside the SPA, else to `/`.
 */

type State = 'loading' | 'ready' | 'failed' | 'forbidden'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useAtriumShellStore()
const client = useGuardianPageClient()

useHead({ title: () => t('guardian.two_factor.setup.title') })

const state = ref<State>('loading')
const status = shallowRef<GuardianTwoFactorStatus | null>(null)
const codes = ref<string[] | null>(null)

const allowed = computed(() => offeredMethods(status.value))

async function load(): Promise<void> {
  try {
    status.value = guardianData<GuardianOne<GuardianTwoFactorStatus>>(await client.GET('/two-factor')).data
    state.value = 'ready'
  } catch (error) {
    state.value = atriumStatus(error) === 403 ? 'forbidden' : 'failed'
  }
}

async function proceed(): Promise<void> {
  codes.value = null
  await store.load(true)
  await router.replace(guardedRedirect(route.query.redirect))
}

async function confirmed(recovery: string[] | null): Promise<void> {
  if (recovery && recovery.length > 0) {
    codes.value = recovery
    return
  }

  await proceed()
}

onBeforeUnmount(() => {
  codes.value = null
})

void load()
</script>

<template>
  <UCard data-testid="guardian-setup">
    <template #header>
      <h1 class="text-lg font-semibold">{{ t('guardian.two_factor.setup.title') }}</h1>
      <p class="text-sm text-muted">{{ t('guardian.two_factor.setup.intro') }}</p>
    </template>

    <USkeleton v-if="state === 'loading'" class="h-32" data-testid="guardian-setup-loading" />
    <AtriumNoAccess v-else-if="state === 'forbidden'" />
    <AtriumErrorCard v-else-if="state === 'failed' || !status" :message="t('guardian.two_factor.setup.load_failed')" />

    <GuardianRecoveryCodes v-else-if="codes" :codes="codes" @done="proceed" />

    <div v-else class="space-y-4">
      <p class="text-sm" data-testid="guardian-setup-allowed">
        {{ t('guardian.two_factor.setup.allowed', { methods: allowed.map(type => t(`guardian.two_factor.types.${type}`)).join(', ') }) }}
      </p>
      <UAlert
        v-if="status.enrolment_deadline"
        color="warning"
        variant="subtle"
        :title="t('guardian.two_factor.setup.deadline', { deadline: formatDate(status.enrolment_deadline) ?? status.enrolment_deadline })"
        data-testid="guardian-setup-deadline"
      />
      <GuardianTwoFactorMethods :client="client" :status="status" setup @confirmed="confirmed" />
    </div>
  </UCard>
</template>
