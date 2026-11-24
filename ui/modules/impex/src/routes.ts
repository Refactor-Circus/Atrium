import type { RouteRecordRaw } from 'vue-router'

/**
 * Impex's pages, added to Atrium's router before its first navigation.
 * Names follow Nuxt's file-based ones (`pages/{pkg}/runs/[run].vue` ->
 * `{pkg}-runs-run`), which the screen declarations name.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/impex/channels/:name', name: 'impex-channels-name', component: () => import('./pages/channels/[name].vue') },
  { path: '/impex/channels/create', name: 'impex-channels-create', component: () => import('./pages/channels/create.vue') },
  { path: '/impex/channels', name: 'impex-channels', component: () => import('./pages/channels/index.vue') },
  { path: '/impex/flows', name: 'impex-flows', component: () => import('./pages/flows/index.vue') },
  { path: '/impex/messages/:message', name: 'impex-messages-message', component: () => import('./pages/messages/[message].vue') },
  { path: '/impex/messages', name: 'impex-messages', component: () => import('./pages/messages/index.vue') },
  { path: '/impex/runs/:run', name: 'impex-runs-run', component: () => import('./pages/runs/[run].vue') },
  { path: '/impex/runs', name: 'impex-runs', component: () => import('./pages/runs/index.vue') },
  { path: '/impex/subscriptions/:subscription', name: 'impex-subscriptions-subscription', component: () => import('./pages/subscriptions/[subscription].vue') },
  { path: '/impex/subscriptions', name: 'impex-subscriptions', component: () => import('./pages/subscriptions/index.vue') }
]
