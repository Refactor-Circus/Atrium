<script setup lang="ts">
import AtriumLink from './AtriumLink.vue'
import UIcon from '@nuxt/ui/runtime/vue/components/Icon.vue'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { isUnderPath, type AtriumNavEntry } from '../composables/useAtriumNavigation'
import NavList from './AtriumNavList.vue'

/**
 * A section's pages as a compact list: each item a route, an external link
 * (new tab, `rel="noopener noreferrer"`) or, for a link the layer refuses, a
 * plain label. An item with children has a disclosure, open while it holds
 * the route.
 */
const props = defineProps<{ items: AtriumNavEntry[], activePath: string | null, depth?: number }>()

const route = useRoute()

function holds(items: AtriumNavEntry[]): boolean {
  return items.some(nav => (nav.path !== null && isUnderPath(route.path, nav.path)) || holds(nav.children))
}

const open = ref<Record<string, boolean>>({})

function isOpen(nav: AtriumNavEntry, index: number): boolean {
  return open.value[`${index}:${nav.label}`] ?? holds(nav.children)
}

function toggle(nav: AtriumNavEntry, index: number): void {
  open.value = { ...open.value, [`${index}:${nav.label}`]: !isOpen(nav, index) }
}
</script>

<template>
  <ul class="flex flex-col gap-px" :class="props.depth ? 'ms-3 border-s border-default ps-1.5' : ''">
    <li v-for="(nav, index) in props.items" :key="`${index}:${nav.label}`">
      <div class="flex items-center gap-0.5">
        <AtriumLink
          v-if="nav.link"
          v-bind="nav.link"
          class="atrium-nav-link min-w-0 flex-1"
          :data-active="nav.path !== null && nav.path === props.activePath"
          :aria-current="nav.path !== null && nav.path === props.activePath ? 'page' : undefined"
        >
          <UIcon v-if="nav.icon" :name="nav.icon" class="atrium-nav-icon size-3.5 shrink-0 opacity-80" />
          <span class="truncate">{{ nav.label }}</span>
          <UIcon v-if="nav.link.external" name="i-lucide-arrow-up-right" class="size-3 shrink-0 text-dimmed" />
          <span v-if="nav.badge" class="atrium-nav-badge">{{ nav.badge }}</span>
        </AtriumLink>
        <span v-else class="atrium-nav-link min-w-0 flex-1 cursor-default">
          <UIcon v-if="nav.icon" :name="nav.icon" class="atrium-nav-icon size-3.5 shrink-0 opacity-80" />
          <span class="truncate">{{ nav.label }}</span>
          <span v-if="nav.badge" class="atrium-nav-badge">{{ nav.badge }}</span>
        </span>
        <button
          v-if="nav.children.length"
          type="button"
          class="grid size-6 shrink-0 place-items-center rounded-(--ui-radius) text-dimmed hover:bg-elevated hover:text-highlighted"
          :aria-expanded="isOpen(nav, index)"
          :aria-label="nav.label"
          @click="toggle(nav, index)"
        >
          <UIcon name="i-lucide-chevron-right" class="size-3.5 transition-transform duration-150" :class="isOpen(nav, index) ? 'rotate-90' : ''" />
        </button>
      </div>
      <NavList v-if="nav.children.length" v-show="isOpen(nav, index)" :items="nav.children" :active-path="props.activePath" :depth="(props.depth ?? 0) + 1" />
    </li>
  </ul>
</template>
