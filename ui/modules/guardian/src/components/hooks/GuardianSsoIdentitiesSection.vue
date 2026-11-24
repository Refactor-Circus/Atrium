<script setup lang="ts">
import GuardianSsoIdentities from '../sso/GuardianSsoIdentities.vue'
import { useGuardian } from '../two-factor/guardian'
import { recordKey } from './hooks'

/**
 * The `guardian.sso-identities` section (AC 96 to 98): group 35's SSO
 * identities of the screen's user record, which render nothing while the
 * user has none. Without a record or Guardian's client it renders nothing.
 */
const props = defineProps<{ data: Record<string, unknown>, record?: unknown }>()

const client = useGuardian()
const user = computed(() => recordKey(props.record))
</script>

<template>
  <div v-if="user && client" data-testid="hooks-guardian-sso-identities">
    <GuardianSsoIdentities :key="user" :user="user" />
  </div>
</template>
