import type { RouteRecordRaw } from 'vue-router'

/**
 * Atrium's own pages. Every other page is a module's, added with
 * `router.addRoute()` before the first navigation (D-082). Names follow
 * Nuxt's file-based ones, which screen declarations and links still use.
 */
export const coreRoutes: RouteRecordRaw[] = [
  { path: '/', name: 'index', component: () => import('./pages/DashboardIndexPage.vue') },
  { path: '/d/:slug', name: 'd-slug', component: () => import('./pages/DashboardPage.vue') },
  { path: '/settings', name: 'settings', component: () => import('./pages/SettingsIndexPage.vue') },
  { path: '/settings/:panel', name: 'settings-panel', component: () => import('./pages/SettingsPanelPage.vue') },
  // A link to a page no module provides: each package ships its own pages.
  { path: '/:path(.*)*', name: 'path', component: () => import('./pages/NotFoundPage.vue') }
]
