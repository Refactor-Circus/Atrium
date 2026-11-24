<script setup lang="ts">
import { renderSVG } from 'uqr'

/**
 * A QR code drawn in the browser as inline SVG with `uqr` (D-051): the value
 * (an `otpauth://` URI, which holds the TOTP secret) never leaves the page,
 * for a QR service or anything else.
 */
const props = defineProps<{ value: string, label: string }>()

const svg = computed(() => renderSVG(props.value, { border: 2 }))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- uqr's own SVG markup of the value, never the value itself -->
  <div class="size-48 rounded bg-white p-1" role="img" :aria-label="label" data-testid="guardian-qr" v-html="svg" />
</template>
