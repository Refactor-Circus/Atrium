<script setup lang="ts">
import { BODY_POLICIES, CHANNEL_STATUSES, CHANNEL_TRANSPORTS, type ImpexChannelForm } from './shared'

/**
 * The fields a stored channel's create and edit forms share, as v1's:
 * transport, status, body policy, signing secret and the options as JSON.
 */
const props = defineProps<{ form: ImpexChannelForm }>()

const { t } = useI18n()

// The form is the page's reactive object: the fields write into it.
const form = props.form

const transportItems = CHANNEL_TRANSPORTS.map(transport => ({ label: transport, value: transport }))
const statusItems = computed(() => CHANNEL_STATUSES.map(status => ({ label: t(`impex.statuses.${status}`), value: status })))
const policyItems = computed(() => BODY_POLICIES.map(policy => ({ label: t(`impex.body_policies.${policy}`), value: policy })))
</script>

<template>
  <UFormField :label="t('impex.channels.transport')" class="w-44">
    <USelect v-model="form.transport" :items="transportItems" name="transport" />
  </UFormField>
  <UFormField :label="t('impex.channels.status')" class="w-44">
    <USelect v-model="form.status" :items="statusItems" name="status" />
  </UFormField>
  <UFormField :label="t('impex.channel.body_policy')" class="w-56">
    <USelect v-model="form.body_policy" :items="policyItems" name="body_policy" />
  </UFormField>
  <UFormField :label="t('impex.channel.signing_secret')" :hint="t('impex.channel.signing_secret_hint')" class="w-72">
    <UInput v-model="form.signing_secret" name="signing_secret" type="password" autocomplete="new-password" />
  </UFormField>
  <UFormField :label="t('impex.channel.options')" :hint="t('impex.channel.options_hint')" class="w-full">
    <UTextarea v-model="form.options_json" name="options_json" :rows="6" class="w-full font-mono" />
  </UFormField>
</template>
