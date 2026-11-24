<script setup lang="ts">
import type { GuardianAction } from '../two-factor/guardian'
import GuardianActionError from '../two-factor/GuardianActionError.vue'
import { errorMessages } from './access'

/**
 * A failed access action: every message of a 422 (the escalation guard names
 * the permissions the actor lacks, Guardian AC 15), else the no-access
 * notice or Guardian's message.
 */
const props = defineProps<{ action: GuardianAction, testid: string }>()

const messages = computed(() => errorMessages(props.action))
</script>

<template>
  <UAlert v-if="messages.length > 0" color="error" variant="subtle" :data-testid="`${testid}-errors`">
    <template #description>
      <ul class="list-disc pl-4">
        <li v-for="message in messages" :key="message">{{ message }}</li>
      </ul>
    </template>
  </UAlert>
  <GuardianActionError v-else :action="action" />
</template>
