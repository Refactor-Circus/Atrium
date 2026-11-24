import type { RouteRecordRaw } from 'vue-router'

/**
 * Keen's pages, added to Atrium's router before its first navigation.
 * Names follow Nuxt's file-based ones (`pages/{pkg}/runs/[run].vue` ->
 * `{pkg}-runs-run`), which the screen declarations name.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/keen/entries/:entry', name: 'keen-entries-entry', component: () => import('./pages/entries/[entry].vue') },
  { path: '/keen/entries', name: 'keen-entries', component: () => import('./pages/entries/index.vue') },
  { path: '/keen/history/:package', name: 'keen-history-package', component: () => import('./pages/history/[package].vue') }
]
