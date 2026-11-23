<script setup lang="ts">
import { refDebounced } from '@vueuse/core'

/** The ⌘K search button and palette (useAtriumSearch). */
const { t } = useI18n()
const open = ref(false)
const term = ref('')
const debounced = refDebounced(term, 250)

const { groups, loading, search } = useAtriumSearch(() => { open.value = false })

function show() {
  open.value = true
}

defineShortcuts({ meta_k: () => { open.value = !open.value } })

watch(debounced, q => search(q))
</script>

<template>
  <UButton
    icon="i-lucide-search"
    color="neutral"
    variant="outline"
    class="w-full justify-start text-muted"
    data-testid="atrium-search"
    @click="show"
  >
    {{ t('atrium.search.button') }}
    <template #trailing>
      <UKbd value="meta" />
      <UKbd value="K" />
    </template>
  </UButton>

  <UModal v-model:open="open" :ui="{ content: 'p-0' }">
    <template #content>
      <UCommandPalette
        v-model:search-term="term"
        :groups="groups"
        :loading="loading"
        :placeholder="t('atrium.search.placeholder')"
        class="h-96"
      />
    </template>
  </UModal>
</template>
