<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UCommandPalette from '@nuxt/ui/components/CommandPalette.vue'
import UIcon from '@nuxt/ui/runtime/vue/components/Icon.vue'
import UKbd from '@nuxt/ui/components/Kbd.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'
import { useAtriumSearch } from '../composables/useAtriumSearch'
import { useAtriumPalette } from '../composables/useAtriumPalette'

import { refDebounced } from '@vueuse/core'
import { defineShortcuts } from '@nuxt/ui/composables/defineShortcuts.js'

/**
 * ⌘K: jump anywhere (D-077). The launcher button (a full one from `md`, an
 * icon below) opens a palette of the pages visited lately, every page in the
 * navigation, the search results once the term is long enough
 * (useAtriumSearch) and the shell actions (useAtriumPalette).
 */
const { t } = useI18n()
const open = ref(false)
const term = ref('')
const debounced = refDebounced(term, 250)

const { groups: results, loading, search } = useAtriumSearch(() => { open.value = false })
const { groups } = useAtriumPalette(term, results, () => { open.value = false })

function show() {
  open.value = true
}

defineShortcuts({ meta_k: () => { open.value = !open.value } })

watch(debounced, q => search(q))
watch(open, (value) => {
  if (!value) {
    term.value = ''
  }
})
</script>

<template>
  <UButton
    color="neutral"
    variant="outline"
    class="hidden h-7 w-full justify-start gap-2 ps-2 pe-1 text-muted md:flex"
    data-testid="atrium-search"
    @click="show"
  >
    <UIcon name="i-lucide-search" class="size-3.5 shrink-0" />
    <span class="flex-1 truncate text-start">{{ t('atrium.search.button') }}</span>
    <span class="flex gap-0.5">
      <UKbd value="meta" size="sm" />
      <UKbd value="K" size="sm" />
    </span>
  </UButton>
  <UButton
    icon="i-lucide-search"
    color="neutral"
    variant="ghost"
    size="sm"
    class="md:hidden"
    :aria-label="t('atrium.search.button')"
    data-testid="atrium-search-compact"
    @click="show"
  />

  <UModal v-model:open="open" :ui="{ content: 'atrium-hud p-0 sm:max-w-2xl top-[12vh] translate-y-0 sm:top-[14vh] ring-0' }" :title="t('atrium.search.button')" :description="t('atrium.search.placeholder')">
    <template #content>
      <div class="flex items-center gap-2 border-b border-default px-3 py-1.5" aria-hidden="true">
        <span class="atrium-code">{{ t('atrium.shell.command') }}</span>
        <span class="atrium-label">{{ t('atrium.shell.jump') }}</span>
        <span class="atrium-label ms-auto">{{ t('atrium.shell.escape') }}</span>
      </div>
      <UCommandPalette
        v-model:search-term="term"
        :groups="groups"
        :loading="loading"
        :placeholder="t('atrium.search.placeholder')"
        class="h-[min(28rem,70vh)]"
        data-testid="atrium-palette"
        @update:open="(value: boolean) => open = value"
      />
    </template>
  </UModal>
</template>
