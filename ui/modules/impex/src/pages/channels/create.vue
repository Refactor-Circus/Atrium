<script setup lang="ts">
import ImpexChannelFields from '../../components/ImpexChannelFields.vue'
import ImpexFlash from '../../components/ImpexFlash.vue'
import { CHANNEL_DIRECTIONS, channelBody, channelPath, emptyChannelForm, looseBody, useImpexAction } from '../../components/shared'
import type { components } from '../../../client/schema'

/**
 * `impex.channel-create`: v1's "New channel" form, posting the name,
 * direction, transport, status, body policy, options and signing secret to
 * `impex.channels.store`, then opening the channel.
 */
const { t } = useI18n()
const router = useRouter()
const { client } = useAtriumIntegration('impex')

const action = useImpexAction()
const form = reactive({ name: '', direction: 'inbound' as components['schemas']['Direction'], ...emptyChannelForm() })

const directionItems = computed(() => CHANNEL_DIRECTIONS.map(direction => ({ label: t(`impex.directions.${direction}`), value: direction })))

async function create(): Promise<void> {
  if (!client) {
    return
  }

  const fields = channelBody(form)

  if (fields === null) {
    action.invalid('options', t('impex.channel.options_invalid'))
    return
  }

  const body = looseBody<components['schemas']['StoreChannelRequest']>({ name: form.name, direction: form.direction, ...fields })

  await action.run(
    async () => integrationData(await client.POST('/channels', { body })),
    async (answer) => {
      await router.push(channelPath(answer.data.name))
    }
  )
}
</script>

<template>
  <div class="space-y-4" data-testid="impex-channel-create">
    <h1 class="text-xl font-semibold">{{ t('impex.channel.create_title') }}</h1>

    <AtriumIntegrationScreen screen-key="impex.channel-create">
      <div class="space-y-4">
        <ImpexFlash :action="action" />

        <UCard>
          <form class="flex flex-col gap-4" data-testid="impex-channel-create-form" @submit.prevent="create">
            <div class="flex flex-wrap items-end gap-3">
              <UFormField :label="t('impex.channels.name')" :hint="t('impex.channel.name_hint')" class="w-64">
                <UInput v-model="form.name" name="name" required />
              </UFormField>
              <UFormField :label="t('impex.channels.direction')" class="w-44">
                <USelect v-model="form.direction" :items="directionItems" name="direction" />
              </UFormField>
              <ImpexChannelFields :form="form" />
            </div>
            <div>
              <UButton type="submit" icon="i-lucide-plus" :loading="action.busy.value" data-testid="impex-channel-create-submit">{{ t('impex.channel.create') }}</UButton>
            </div>
          </form>
        </UCard>
      </div>
    </AtriumIntegrationScreen>
  </div>
</template>
