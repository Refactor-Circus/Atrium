<script setup lang="ts">
/**
 * The layout of a public page (`definePageMeta({ atrium: { public: true } })`,
 * D-038), such as an invitation a signed-out visitor opens: the page alone,
 * centred, with no shell. It loads nothing, so it never sends the visitor to
 * sign in before they see the page.
 */
</script>

<template>
  <div class="flex min-h-svh items-center justify-center bg-default p-6" data-testid="atrium-public-layout">
    <main class="w-full max-w-lg">
      <slot />
    </main>
  </div>
</template>
