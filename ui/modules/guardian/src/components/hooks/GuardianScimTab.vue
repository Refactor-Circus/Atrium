<script setup lang="ts">
import GuardianScimTokens from '../sso/GuardianScimTokens.vue'
import { useGuardian } from '../two-factor/guardian'
import { recordKey } from './hooks'

/**
 * The `guardian.scim` tab (AC 96 to 98): group 35's SCIM tokens of the
 * screen's organization record, with the `scim_path` Atrium sends for the
 * base URL (D-058). Without a record or Guardian's client it renders
 * nothing.
 */
const props = defineProps<{ data: Record<string, unknown>, record?: unknown }>()

const client = useGuardian()
const organization = computed(() => recordKey(props.record))
const scimPath = computed(() => typeof props.data.scim_path === 'string' ? props.data.scim_path : null)
</script>

<template>
  <div v-if="organization && client" data-testid="hooks-guardian-scim">
    <GuardianScimTokens :key="organization" :organization="organization" :scim-path="scimPath" />
  </div>
</template>
