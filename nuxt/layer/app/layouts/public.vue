<script setup lang="ts">
/**
 * The layout of a public page (`definePageMeta({ atrium: { public: true } })`,
 * D-038), such as an invitation a signed-out visitor opens: the page alone,
 * centred on the deck's canvas, with no shell. It loads nothing, so it never
 * sends the visitor to sign in before they see the page.
 */
</script>

<template>
  <div class="atrium-canvas atrium-content flex min-h-svh items-center justify-center p-4 sm:p-6" data-testid="atrium-public-layout">
    <main class="w-full max-w-md">
      <slot />
    </main>
  </div>
</template>
