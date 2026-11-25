<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { isExternalUrl } from '../utils/atriumLink'

/**
 * A link that is a route inside the SPA (under the client path) or, for
 * `external` or an absolute http(s) URL, a plain anchor: what Nuxt's
 * <NuxtLink> did. Takes the props atriumLink() returns.
 */
const props = defineProps<{
  to: string
  external?: boolean
  target?: string
  rel?: string
}>()

const outside = computed(() => props.external === true || isExternalUrl(props.to))
</script>

<template>
  <a v-if="outside" :href="props.to" :target="props.target" :rel="props.rel"><slot /></a>
  <RouterLink v-else :to="props.to" :target="props.target"><slot /></RouterLink>
</template>
