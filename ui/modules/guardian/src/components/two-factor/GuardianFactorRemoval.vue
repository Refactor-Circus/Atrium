<script setup lang="ts">
import GuardianActionError from './GuardianActionError.vue'
import { guardianData, untypedBody, useGuardianAction, type GuardianClient } from './guardian'

/**
 * Removes a confirmed method or a passkey (AC 87). Guardian asks for proof:
 * a current code from another confirmed factor, or a recovery code, sent in
 * the body (never the URL). Removing the last factor while two-factor is
 * required answers 422 `two_factor_required`, shown as why.
 */
const props = defineProps<{ client: GuardianClient, kind: 'method' | 'passkey', id: string, name: string }>()
const emit = defineEmits<{ removed: [] }>()

const { t } = useI18n()
const action = useGuardianAction()
const open = ref(false)
const code = ref('')

const required = computed(() => action.code.value === 'two_factor_required')

function toggle(next: boolean): void {
  open.value = next
}

async function remove(): Promise<void> {
  const body = untypedBody({ code: code.value.trim() })
  const removed = await action.run(async () => {
    guardianData(props.kind === 'method'
      ? await props.client.DELETE('/two-factor/methods/{method}', { params: { path: { method: props.id } }, body })
      : await props.client.DELETE('/two-factor/passkeys/{passkey}', { params: { path: { passkey: props.id } }, body }))
  })

  code.value = ''

  if (removed) {
    open.value = false
    emit('removed')
  }
}
</script>

<template>
  <div :data-testid="`guardian-remove-${id}`">
    <UButton v-if="!open" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" data-testid="guardian-remove-open" @click="toggle(true)">
      {{ t('guardian.two_factor.remove.button') }}
    </UButton>
    <form v-else class="flex flex-wrap items-end gap-2" data-testid="guardian-remove-form" @submit.prevent="remove">
      <UFormField :label="t('guardian.two_factor.remove.proof', { name })" :hint="t('guardian.two_factor.remove.proof_hint')" :error="action.error('code')" required>
        <UInput v-model="code" autocomplete="one-time-code" data-testid="guardian-remove-code" />
      </UFormField>
      <UButton type="submit" color="error" :loading="action.busy.value" data-testid="guardian-remove-submit">{{ t('guardian.two_factor.remove.confirm') }}</UButton>
      <UButton color="neutral" variant="ghost" @click="toggle(false)">{{ t('guardian.two_factor.cancel') }}</UButton>
    </form>
    <UAlert v-if="required" color="warning" variant="subtle" :title="t('guardian.two_factor.remove.required')" :description="action.message.value ?? undefined" data-testid="guardian-remove-required" />
    <GuardianActionError v-else :action="action" />
  </div>
</template>
