<script setup lang="ts">
import type { GuardianAction } from '../two-factor/guardian'
import { fieldsOf, type GuardianSsoField } from './sso'

/**
 * The settings of one protocol (v1's `partials/sso-fields`): only the
 * fields `protocol` takes, bound to `values`. The client secret is a
 * password input and the certificate a textarea; while `editing`, both are
 * blank and keep what is stored when left so, since Guardian never sends
 * them back. Each shows its own 422.
 */
const props = defineProps<{ protocol: string, values: Partial<Record<GuardianSsoField, string>>, action: GuardianAction, editing?: boolean, testid: string }>()

const { t } = useI18n()

const fields = computed(() => fieldsOf(props.protocol))
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2" :data-testid="`${testid}-fields`">
    <UFormField
      v-for="field in fields"
      :key="field"
      :class="field === 'certificate' ? 'sm:col-span-2' : undefined"
      :label="t(`guardian.sso.fields.${field}`)"
      :hint="field === 'tenant' ? t('guardian.sso.tenant_hint') : editing && (field === 'client_secret' || field === 'certificate') ? t('guardian.sso.secret_hint') : undefined"
      :error="action.error(field)"
    >
      <UTextarea v-if="field === 'certificate'" v-model="values[field]" :rows="3" class="w-full font-mono" :data-testid="`${testid}-${field}`" />
      <UInput
        v-else
        v-model="values[field]"
        :type="field === 'client_secret' ? 'password' : 'text'"
        :autocomplete="field === 'client_secret' ? 'new-password' : 'off'"
        class="w-full"
        :data-testid="`${testid}-${field}`"
      />
    </UFormField>
  </div>
</template>
