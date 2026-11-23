<script setup lang="ts">
import { useCortexAction, type CortexVersion, type CortexVersionsApi } from './cortex'
import CortexActionError from './CortexActionError.vue'

/**
 * A versioned text: a virtual agent's prompt, or the override of a concrete
 * agent's prompt, a tool's description or a server's instructions. It shows
 * the text in force, lists the versions (each viewable, and publishable when
 * not published), saves a new version (published at once by default) and,
 * for an override, removes it after a confirmation. Every change emits
 * `changed`, so the page reloads what it shows.
 *
 * A 403 on the versions list hides it, as v1 showed it only to those allowed.
 */
const props = defineProps<{
  api: CortexVersionsApi
  live: string | null
  liveTitle: string
  published: number | null
  /** An override of a text declared in code, rather than a prompt of its own */
  override?: boolean
}>()

const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const action = useCortexAction()

const versions = shallowRef<CortexVersion[]>([])
const versionsHidden = ref(false)
const expanded = ref<number | null>(null)
const content = ref(props.live ?? '')
const publish = ref(true)

watch(() => props.live, (value) => {
  content.value = value ?? ''
})

async function loadVersions(): Promise<void> {
  try {
    versions.value = [...await props.api.list()].sort((a, b) => b.version - a.version)
    versionsHidden.value = false
  } catch (error) {
    versionsHidden.value = atriumStatus(error) === 403
    versions.value = []
  }
}

async function changed(ok: boolean): Promise<void> {
  if (ok) {
    emit('changed')
    await loadVersions()
  }
}

async function store(): Promise<void> {
  await changed(await action.run(() => props.api.store({ content: content.value, publish: publish.value })))
}

async function publishVersion(version: number): Promise<void> {
  await changed(await action.run(() => props.api.publish(version)))
}

async function removeOverride(): Promise<void> {
  const destroy = props.api.destroy

  if (!destroy || !window.confirm(t('cortex.versions.confirm_remove'))) {
    return
  }

  await changed(await action.run(() => destroy()))
}

void loadVersions()
</script>

<template>
  <div class="flex flex-col gap-5" data-testid="cortex-versions">
    <CortexActionError :forbidden="action.forbidden.value" :message="action.message.value" />

    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-medium">{{ liveTitle }}</h3>
          <template v-if="override">
            <UBadge v-if="published !== null" color="success" variant="subtle" :label="t('cortex.versions.overridden', { version: published })" data-status="overridden" />
            <UBadge v-else color="neutral" variant="subtle" :label="t('cortex.versions.from_code')" data-status="from_code" />
          </template>
        </div>
        <p v-if="override" class="mt-1 text-sm text-muted">
          {{ published !== null ? t('cortex.versions.override_hint') : t('cortex.versions.no_override_hint') }}
        </p>
      </template>
      <pre class="overflow-x-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-xs" data-testid="cortex-live">{{ live ?? '' }}</pre>
    </UCard>

    <UCard v-if="!versionsHidden" data-testid="cortex-versions-card">
      <template #header>
        <h3 class="font-medium">{{ t('cortex.versions.title') }}</h3>
      </template>
      <p v-if="versions.length === 0" class="text-sm text-muted">{{ t('cortex.versions.none') }}</p>
      <ul v-else class="divide-y divide-default">
        <li v-for="version in versions" :key="version.version" class="py-2" :data-testid="`cortex-version-${version.version}`">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium">v{{ version.version }}</span>
            <UBadge v-if="version.version === published" color="success" variant="subtle" :label="t('cortex.versions.published')" data-status="published" />
            <span v-if="version.created_at" class="text-xs text-muted">{{ version.created_at }}</span>
            <div class="ml-auto flex items-center gap-2">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :icon="expanded === version.version ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :label="expanded === version.version ? t('cortex.versions.hide') : t('cortex.versions.view')"
                :data-testid="`cortex-view-${version.version}`"
                @click="() => { expanded = expanded === version.version ? null : version.version }"
              />
              <UButton
                v-if="version.version !== published"
                size="xs"
                variant="outline"
                icon="i-lucide-badge-check"
                :label="t('cortex.versions.publish')"
                :loading="action.busy.value"
                :data-testid="`cortex-publish-${version.version}`"
                @click="publishVersion(version.version)"
              />
            </div>
          </div>
          <pre v-if="expanded === version.version" class="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-xs">{{ version.content }}</pre>
        </li>
      </ul>
    </UCard>

    <UCard data-testid="cortex-new-version">
      <template #header>
        <h3 class="font-medium">{{ t('cortex.versions.new') }}</h3>
      </template>
      <form class="flex flex-col gap-4" @submit.prevent="store">
        <UFormField :label="t('cortex.versions.content')" :error="action.error('content')" required>
          <UTextarea v-model="content" :rows="8" class="w-full font-mono" data-testid="cortex-version-content" />
        </UFormField>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input v-model="publish" type="checkbox" class="accent-(--ui-primary)" data-testid="cortex-version-publish">
          {{ t('cortex.versions.publish_now') }}
        </label>
        <div>
          <UButton type="submit" icon="i-lucide-file-plus" :label="t('cortex.versions.add')" :loading="action.busy.value" data-testid="cortex-add-version" />
        </div>
      </form>
    </UCard>

    <div v-if="override && api.destroy && published !== null">
      <UButton
        color="error"
        variant="outline"
        icon="i-lucide-trash"
        :label="t('cortex.versions.remove')"
        data-testid="cortex-remove-override"
        @click="removeOverride"
      />
    </div>
  </div>
</template>
