<script setup lang="ts">
import { useAtriumShellStore } from '../stores/atriumShell'
import { useI18n } from 'vue-i18n'
import { ref, computed, watch } from 'vue'
import { ATRIUM_SDK_VERSION } from '../runtime/version'
import { compareApiVersion, atriumMajorMinor } from '../utils/atriumVersion'

/**
 * Warns, without blocking anything, when Atrium's API (the shell's
 * `api_version`) and this layer differ in major or minor version: once in
 * the console, and in a banner the user can dismiss.
 */
const store = useAtriumShellStore()
const { t } = useI18n()

const dismissed = ref(false)

const api = computed(() => store.shell?.api_version ?? null)
const layer = computed(() => ATRIUM_SDK_VERSION)
const mismatch = computed(() => store.shell !== null && compareApiVersion(api.value, layer.value) !== 'equal')
const message = computed(() => t('atrium.version.mismatch', { api: api.value ?? '?', layer: atriumMajorMinor(layer.value) ?? layer.value }))

function dismiss() {
  dismissed.value = true
}

watch(mismatch, (differs) => {
  if (differs) {
    console.warn(`[atrium] ${message.value}. ${t('atrium.version.hint')}`)
  }
}, { immediate: true })
</script>

<template>
  <div v-if="mismatch && !dismissed" class="p-2" data-testid="atrium-version-banner">
    <UAlert
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="message"
      :description="t('atrium.version.hint')"
    >
      <template #actions>
        <UButton size="xs" color="warning" variant="ghost" data-testid="atrium-version-dismiss" @click="dismiss">
          {{ t('atrium.version.dismiss') }}
        </UButton>
      </template>
    </UAlert>
  </div>
</template>
