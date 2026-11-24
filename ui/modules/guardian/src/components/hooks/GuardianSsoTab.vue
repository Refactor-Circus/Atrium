<script setup lang="ts">
import GuardianSsoConnections from '../sso/GuardianSsoConnections.vue'
import { useGuardian } from '../two-factor/guardian'
import { recordKey } from './hooks'

/**
 * The `guardian.sso` tab (AC 96 to 98): group 35's SSO connections of the
 * screen's organization record. Without a record or Guardian's client it
 * renders nothing.
 */
const props = defineProps<{ data: Record<string, unknown>, record?: unknown }>()

const client = useGuardian()
const organization = computed(() => recordKey(props.record))
</script>

<template>
  <div v-if="organization && client" data-testid="hooks-guardian-sso">
    <GuardianSsoConnections :key="organization" :organization="organization" />
  </div>
</template>
