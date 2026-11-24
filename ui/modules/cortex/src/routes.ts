import type { RouteRecordRaw } from 'vue-router'

/**
 * Cortex's pages, added to Atrium's router before its first navigation.
 * Names follow Nuxt's file-based ones (`pages/{pkg}/runs/[run].vue` ->
 * `{pkg}-runs-run`), which the screen declarations name.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/cortex/concrete-agents/:agent', name: 'cortex-concrete-agents-agent', component: () => import('./pages/concrete-agents/[agent].vue') },
  { path: '/cortex/concrete-agents', name: 'cortex-concrete-agents', component: () => import('./pages/concrete-agents/index.vue') },
  { path: '/cortex/redirect-domains', name: 'cortex-redirect-domains', component: () => import('./pages/redirect-domains.vue') },
  { path: '/cortex/run', name: 'cortex-run', component: () => import('./pages/run.vue') },
  { path: '/cortex/servers/:server/instructions', name: 'cortex-servers-server-instructions', component: () => import('./pages/servers/[server]/instructions.vue') },
  { path: '/cortex/servers', name: 'cortex-servers', component: () => import('./pages/servers/index.vue') },
  { path: '/cortex/tools/:tool/description', name: 'cortex-tools-tool-description', component: () => import('./pages/tools/[tool]/description.vue') },
  { path: '/cortex/tools', name: 'cortex-tools', component: () => import('./pages/tools/index.vue') },
  { path: '/cortex/virtual-agents/:slug', name: 'cortex-virtual-agents-slug', component: () => import('./pages/virtual-agents/[slug].vue') },
  { path: '/cortex/virtual-agents/create', name: 'cortex-virtual-agents-create', component: () => import('./pages/virtual-agents/create.vue') },
  { path: '/cortex/virtual-agents', name: 'cortex-virtual-agents', component: () => import('./pages/virtual-agents/index.vue') }
]
