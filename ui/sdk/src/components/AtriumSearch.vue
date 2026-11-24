<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UDashboardSearch from '@nuxt/ui/components/DashboardSearch.vue'
import UDashboardSearchButton from '@nuxt/ui/components/DashboardSearchButton.vue'
import { useDashboard } from '@nuxt/ui/utils/dashboard'
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'
import { useAtriumSearch } from '../composables/useAtriumSearch'
import { useAtriumPalette } from '../composables/useAtriumPalette'

import { refDebounced } from '@vueuse/core'

/**
 * ⌘K: jump anywhere (D-077), Nuxt UI's <UDashboardSearchButton> and
 * <UDashboardSearch>. The launcher (a full one from `md`, an icon below)
 * opens a palette of the pages visited lately, every page in the
 * navigation, the search results once the term is long enough
 * (useAtriumSearch) and the shell actions (useAtriumPalette, which carries
 * the colour modes and themes, so the palette's own colour-mode group is off).
 */
const { t } = useI18n()
const open = ref(false)
const term = ref('')
const debounced = refDebounced(term, 250)

const { groups: results, loading, search } = useAtriumSearch(() => { open.value = false })
const { groups } = useAtriumPalette(term, results, () => { open.value = false })

// Inside a <UDashboardGroup> (the shell) the button already toggles the
// palette through the dashboard's context, an async runtime hook: opening it
// here as well made that toggle shut it again straight away (D-095). Only
// outside a group, where the button's own toggle does nothing, open it here.
const dashboard = useDashboard(null)

function show() {
  if (!dashboard) {
    open.value = true
  }
}

watch(debounced, q => search(q))
watch(open, (value) => {
  if (!value) {
    term.value = ''
  }
})
</script>

<template>
  <UDashboardSearchButton
    :label="t('atrium.search.button')"
    class="hidden w-56 md:flex lg:w-64"
    data-testid="atrium-search"
    @click="show"
  />
  <UDashboardSearchButton
    :label="t('atrium.search.button')"
    collapsed
    size="sm"
    class="md:hidden"
    data-testid="atrium-search-compact"
    @click="show"
  />

  <UDashboardSearch
    v-model:open="open"
    v-model:search-term="term"
    :groups="groups"
    :loading="loading"
    :color-mode="false"
    :title="t('atrium.search.button')"
    :description="t('atrium.search.placeholder')"
    :placeholder="t('atrium.search.placeholder')"
    data-testid="atrium-palette"
  >
    <template #footer>
      <div class="flex items-center gap-2 px-2 py-0.5" aria-hidden="true">
        <UBadge :label="t('atrium.shell.command')" color="primary" variant="soft" class="tracking-[0.1em] uppercase" />
        <span class="atrium-label">{{ t('atrium.shell.jump') }}</span>
        <span class="atrium-label ms-auto">{{ t('atrium.shell.escape') }}</span>
      </div>
    </template>
  </UDashboardSearch>
</template>
