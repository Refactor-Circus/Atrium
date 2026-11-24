import type { RouteRecordRaw } from 'vue-router'

/**
 * PennantPlus's pages, added to Atrium's router before its first navigation.
 * Names follow Nuxt's file-based ones (`pages/{pkg}/runs/[run].vue` ->
 * `{pkg}-runs-run`), which the screen declarations name.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/pennantplus/features', name: 'pennantplus-features', component: () => import('./pages/features.vue') }
]
