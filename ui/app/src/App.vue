<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import AtriumDefaultLayout from './layouts/AtriumDefaultLayout.vue'
import AtriumPublicLayout from './layouts/AtriumPublicLayout.vue'

/**
 * The app's root (D-079): Nuxt UI's <UApp>, the route's layout (the shell,
 * or the public layout for a page that declares `meta.atrium.public`) and
 * the page. A page is remounted when its params change, as Nuxt's pages
 * were, and not when only its query does.
 */
function pageKey(route: RouteLocationNormalizedLoaded): string {
  const path = route.matched.at(-1)?.path ?? route.path

  return path.replace(/:(\w+)(\([^)]*\))?[?+*]?/g, (_, name: string) => String(route.params[name] ?? ''))
}
</script>

<template>
  <UApp>
    <RouterView v-slot="{ Component, route }">
      <Suspense>
        <component :is="route.meta.atrium?.public ? AtriumPublicLayout : AtriumDefaultLayout">
          <Suspense>
            <component :is="Component" :key="pageKey(route)" />
          </Suspense>
        </component>
      </Suspense>
    </RouterView>
  </UApp>
</template>
