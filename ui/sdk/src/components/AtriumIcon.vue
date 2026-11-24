<script setup lang="ts">
import UIcon from '@nuxt/ui/runtime/vue/components/Icon.vue'
import { computed } from 'vue'
import { useAtriumIcon } from '../composables/useAtriumIcon'

/**
 * An icon from the API: an Iconify name (`i-lucide-house`). A name no
 * installed collection has (and the Iconify API is not opted in to) renders
 * the fallback icon instead, with the name it replaced in `data-fallback`.
 */
const props = defineProps<{ icon: string | null | undefined }>()

const { resolve } = useAtriumIcon()

const name = computed(() => resolve(props.icon))
const replaced = computed(() => props.icon && name.value !== props.icon ? props.icon : undefined)
</script>

<template>
  <span
    v-if="name"
    class="inline-flex shrink-0"
    data-testid="atrium-icon"
    :data-icon="name"
    :data-fallback="replaced"
  >
    <UIcon :name="name" class="size-5" />
  </span>
</template>
