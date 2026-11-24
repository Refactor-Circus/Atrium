<script setup lang="ts">
import {
  cortexData,
  untypedBody,
  useCortex,
  useCortexAction,
  type CortexConcreteAgent,
  type CortexList,
  type CortexOne,
  type CortexProvider,
  type CortexTool,
  type CortexVirtualAgent
} from './cortex'
import CortexActionError from './CortexActionError.vue'
import CortexToolPicker from './CortexToolPicker.vue'

/**
 * A virtual agent's form: `virtual-agents.store` for a new agent,
 * `virtual-agents.update` for `agent`. Saving a changed prompt adds a version
 * and publishes it. Its options come from `providers.index`, `tools.index`,
 * `virtual-agents.index` (sub-agents) and `concrete-agents.index`; a list the
 * user may not read is left empty.
 *
 * A provider or model saved earlier stays selectable even when no provider
 * offers it any more, so editing never silently rewrites it.
 */
const props = defineProps<{ agent: CortexVirtualAgent | null }>()

const emit = defineEmits<{ saved: [agent: CortexVirtualAgent] }>()

const SETTINGS = ['temperature', 'max_steps', 'max_tokens', 'top_p'] as const

type SettingKey = typeof SETTINGS[number]

const { t } = useI18n()
const client = useCortex()
const action = useCortexAction()

const providers = shallowRef<CortexProvider[]>([])
const tools = shallowRef<CortexTool[]>([])
const agents = shallowRef<CortexVirtualAgent[]>([])
const concreteAgents = shallowRef<CortexConcreteAgent[]>([])

function fresh() {
  const settings = (props.agent?.settings ?? {}) as Partial<Record<SettingKey, unknown>>

  return {
    name: props.agent?.name ?? '',
    slug: '',
    description: props.agent?.description ?? '',
    instructions: props.agent?.instructions ?? '',
    provider: props.agent?.provider ?? '',
    model: props.agent?.model ?? '',
    settings: Object.fromEntries(SETTINGS.map(key => [key, settings[key] === undefined || settings[key] === null ? '' : String(settings[key])])) as Record<SettingKey, string>,
    tools: [...(props.agent?.tools ?? [])],
    sub_agents: [...((props.agent?.sub_agents ?? []) as string[])],
    concrete_sub_agents: [...(props.agent?.concrete_sub_agents ?? [])]
  }
}

const form = reactive(fresh())

watch(() => props.agent, () => Object.assign(form, fresh()))

const providerNames = computed(() => {
  const names = providers.value.map(provider => provider.name)

  return form.provider && !names.includes(form.provider) ? [form.provider, ...names] : names
})

const models = computed(() => [...new Set([
  ...providers.value.flatMap(provider => provider.models),
  ...(props.agent?.model ? [props.agent.model] : [])
])])

const pickerTools = computed(() => tools.value.map(tool => ({ name: tool.name, label: tool.name, tags: tool.tags })))
const subAgentOptions = computed(() => agents.value.filter(option => option.slug !== props.agent?.slug))

/** Choosing a provider moves to its default model, unless a model is already picked. */
function syncModel(): void {
  const preferred = providers.value.find(provider => provider.name === form.provider)?.default_model

  if (preferred && !form.model) {
    form.model = preferred
  }
}

async function loadOptions(): Promise<void> {
  if (!client) {
    return
  }

  const [providerList, toolList, agentList, concreteList] = await Promise.allSettled([
    client.GET('/providers').then(result => cortexData<CortexList<CortexProvider>>(result).data),
    client.GET('/tools').then(result => cortexData<CortexList<CortexTool>>(result).data),
    client.GET('/virtual-agents', { params: { query: { per_page: 100 } } }).then(result => cortexData<CortexList<CortexVirtualAgent>>(result).data),
    client.GET('/concrete-agents').then(result => cortexData<CortexList<CortexConcreteAgent>>(result).data)
  ])

  providers.value = providerList.status === 'fulfilled' ? providerList.value : []
  tools.value = toolList.status === 'fulfilled' ? toolList.value : []
  agents.value = agentList.status === 'fulfilled' ? agentList.value : []
  concreteAgents.value = concreteList.status === 'fulfilled' ? concreteList.value : []
}

/**
 * The form as Cortex validates it: blank settings left out, numbers as numbers.
 * A number input's v-model hands back a number once edited, so each setting
 * is read as a string first.
 */
function payload() {
  const settings = Object.fromEntries(SETTINGS
    .filter(key => String(form.settings[key] ?? '').trim() !== '')
    .map(key => [key, Number(form.settings[key])]))

  return {
    name: form.name,
    ...(props.agent ? {} : { slug: form.slug }),
    description: form.description === '' ? null : form.description,
    instructions: form.instructions,
    provider: form.provider === '' ? null : form.provider,
    model: form.model === '' ? null : form.model,
    settings: Object.keys(settings).length ? settings : null,
    tools: form.tools,
    sub_agents: form.sub_agents,
    concrete_sub_agents: form.concrete_sub_agents
  }
}

async function save(): Promise<void> {
  if (!client) {
    return
  }

  let saved: CortexVirtualAgent | null = null
  const agent = props.agent

  const ok = await action.run(async () => {
    const result = agent
      ? await client.PATCH('/virtual-agents/{agent}', { params: { path: { agent: agent.slug } }, body: untypedBody(payload()) })
      : await client.POST('/virtual-agents', { body: untypedBody(payload()) })

    saved = cortexData<CortexOne<CortexVirtualAgent>>(result).data
  })

  if (ok && saved) {
    emit('saved', saved)
  }
}

void loadOptions()
</script>

<template>
  <UCard>
    <form class="flex flex-col gap-4" data-testid="cortex-agent-form" @submit.prevent="save">
      <CortexActionError :forbidden="action.forbidden.value" :message="action.message.value" />

      <UFormField :label="t('cortex.agent.name')" :error="action.error('name')" required>
        <UInput v-model="form.name" class="w-full" data-testid="cortex-agent-name" />
      </UFormField>

      <UFormField v-if="!agent" :label="t('cortex.agent.slug')" :hint="t('cortex.agent.slug_hint')" :error="action.error('slug')" required>
        <UInput v-model="form.slug" class="w-full" data-testid="cortex-agent-slug" />
      </UFormField>

      <UFormField :label="t('cortex.agent.description')" :error="action.error('description')">
        <UTextarea v-model="form.description" class="w-full" data-testid="cortex-agent-description" />
      </UFormField>

      <UFormField :label="t('cortex.agent.prompt')" :help="t('cortex.agent.prompt_hint')" :error="action.error('instructions')" required>
        <UTextarea v-model="form.instructions" :rows="10" class="w-full font-mono" data-testid="cortex-agent-instructions" />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField :label="t('cortex.agent.provider')" :error="action.error('provider')">
          <select v-model="form.provider" class="w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="cortex-agent-provider" @change="syncModel">
            <option value="">{{ t('cortex.agent.provider_default') }}</option>
            <option v-for="name in providerNames" :key="name" :value="name">{{ name }}</option>
          </select>
        </UFormField>

        <UFormField :label="t('cortex.agent.model')" :error="action.error('model')">
          <select v-model="form.model" class="w-full rounded-md border border-default bg-default px-2.5 py-1.5 text-sm" data-testid="cortex-agent-model">
            <option value="">{{ t('cortex.agent.provider_default') }}</option>
            <option v-for="model in models" :key="model" :value="model">{{ model }}</option>
          </select>
        </UFormField>
      </div>

      <fieldset class="flex flex-col gap-3">
        <legend class="mb-2 text-sm font-medium">{{ t('cortex.agent.settings') }}</legend>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField :label="t('cortex.agent.temperature')" :error="action.error('settings.temperature')">
            <UInput v-model="form.settings.temperature" type="number" step="0.1" min="0" max="2" class="w-full" data-testid="cortex-agent-temperature" />
          </UFormField>
          <UFormField :label="t('cortex.agent.max_steps')" :error="action.error('settings.max_steps')">
            <UInput v-model="form.settings.max_steps" type="number" min="1" class="w-full" data-testid="cortex-agent-max-steps" />
          </UFormField>
          <UFormField :label="t('cortex.agent.max_tokens')" :error="action.error('settings.max_tokens')">
            <UInput v-model="form.settings.max_tokens" type="number" min="1" class="w-full" data-testid="cortex-agent-max-tokens" />
          </UFormField>
          <UFormField :label="t('cortex.agent.top_p')" :error="action.error('settings.top_p')">
            <UInput v-model="form.settings.top_p" type="number" step="0.05" min="0" max="1" class="w-full" data-testid="cortex-agent-top-p" />
          </UFormField>
        </div>
      </fieldset>

      <UFormField v-if="pickerTools.length" :label="t('cortex.agent.tools')" :error="action.error('tools')">
        <CortexToolPicker v-model="form.tools" :tools="pickerTools" id-prefix="cortex-agent-tool-" />
      </UFormField>

      <UFormField v-if="subAgentOptions.length" :label="t('cortex.agent.sub_agents')" :error="action.error('sub_agents')">
        <div class="flex flex-col gap-2">
          <label v-for="option in subAgentOptions" :key="option.slug" class="flex items-center gap-2 text-sm">
            <input v-model="form.sub_agents" type="checkbox" class="accent-(--ui-primary)" :value="option.slug" :data-testid="`cortex-sub-agent-${option.slug}`">
            {{ option.name }}
          </label>
        </div>
      </UFormField>

      <UFormField v-if="concreteAgents.length" :label="t('cortex.agent.concrete_sub_agents')" :error="action.error('concrete_sub_agents')">
        <div class="flex flex-col gap-2">
          <label v-for="option in concreteAgents" :key="option.name" class="flex items-center gap-2 text-sm">
            <input v-model="form.concrete_sub_agents" type="checkbox" class="accent-(--ui-primary)" :value="option.name" :data-testid="`cortex-concrete-sub-agent-${option.name}`">
            {{ option.name }}
          </label>
        </div>
      </UFormField>

      <div class="flex items-center gap-2">
        <UButton type="submit" icon="i-lucide-check" :label="t('cortex.agent.save')" :loading="action.busy.value" data-testid="cortex-save-agent" />
        <UButton to="/cortex/virtual-agents" color="neutral" variant="ghost" :label="t('cortex.agent.cancel')" />
      </div>
    </form>
  </UCard>
</template>
