<script setup lang="ts">
import type { AtriumScreen } from '../../types/atrium'

/**
 * A screen: its tabs and the sections of every slot it declares.
 *
 * The open tab comes from the API (`screen.open_tab`, from `?tab=`), which
 * resolves only that tab's data. Choosing a tab puts it in the query, and the
 * page refetches. A built-in tab renders the default slot (with the tab's
 * key); a registered tab renders its package's component with its data.
 */
const props = defineProps<{ screen: AtriumScreen | null | undefined, record?: unknown }>()

const route = useRoute()
const router = useRouter()
const { resolve } = useAtriumIcon()

/** Slots with a fixed place around the content; any other renders after it. */
const PLACED = ['header.actions', 'before', 'after', 'aside']

const tabs = computed(() => props.screen?.tabs ?? [])
const openTab = computed(() => tabs.value.find(t => t.key === props.screen?.open_tab) ?? null)
const items = computed(() => tabs.value.map(t => ({ label: t.label, value: t.key, icon: resolve(t.icon) })))
const otherSlots = computed(() => Object.keys(props.screen?.sections ?? {}).filter(name => !PLACED.includes(name)))
const hasAside = computed(() => (props.screen?.sections.aside?.length ?? 0) > 0)

function open(key: string | number) {
  const first = tabs.value[0]?.key

  router.replace({ query: { ...route.query, tab: key === first ? undefined : String(key) } })
}
</script>

<template>
  <div class="space-y-4" data-testid="atrium-screen">
    <AtriumSections :screen="screen" name="header.actions" :record="record" />

    <div v-if="tabs.length > 1" data-testid="atrium-screen-tabs">
      <UTabs
        :items="items"
        :model-value="screen?.open_tab"
        :content="false"
        variant="link"
        @update:model-value="open"
      />
    </div>

    <div :class="hasAside ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]' : ''">
      <div class="min-w-0 space-y-4">
        <AtriumSections :screen="screen" name="before" :record="record" />

        <slot v-if="!openTab || openTab.built_in" :tab="openTab?.key ?? null" />
        <AtriumExtension v-else-if="openTab.data !== undefined || openTab.error" :extension="openTab" :record="record" />
        <USkeleton v-else class="h-32" />

        <AtriumSections :screen="screen" name="after" :record="record" />
        <AtriumSections v-for="name in otherSlots" :key="name" :screen="screen" :name="name" :record="record" />
      </div>

      <aside v-if="hasAside">
        <AtriumSections :screen="screen" name="aside" :record="record" />
      </aside>
    </div>
  </div>
</template>
