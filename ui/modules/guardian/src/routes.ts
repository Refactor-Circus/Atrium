import type { RouteRecordRaw } from 'vue-router'

/**
 * Guardian's pages, added to Atrium's router before its first navigation.
 * Names follow Nuxt's file-based ones (`pages/{pkg}/runs/[run].vue` ->
 * `{pkg}-runs-run`), which the screen declarations name.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/guardian/ip-rules', name: 'guardian-ip-rules', component: () => import('./pages/ip-rules/index.vue') },
  { path: '/guardian/lockouts', name: 'guardian-lockouts', component: () => import('./pages/lockouts/index.vue') },
  { path: '/guardian/password-policy', name: 'guardian-password-policy', component: () => import('./pages/password-policy/index.vue') },
  { path: '/guardian/permissions', name: 'guardian-permissions', component: () => import('./pages/permissions/index.vue') },
  { path: '/guardian/role-assignments', name: 'guardian-role-assignments', component: () => import('./pages/role-assignments/index.vue') },
  { path: '/guardian/roles/:role', name: 'guardian-roles-role', component: () => import('./pages/roles/[role].vue') },
  { path: '/guardian/roles', name: 'guardian-roles', component: () => import('./pages/roles/index.vue') },
  { path: '/guardian/security-events/:event', name: 'guardian-security-events-event', component: () => import('./pages/security-events/[event].vue') },
  { path: '/guardian/security-events', name: 'guardian-security-events', component: () => import('./pages/security-events/index.vue') },
  { path: '/guardian/security', name: 'guardian-security', component: () => import('./pages/security/index.vue') },
  { path: '/guardian/sso-connections/:connection', name: 'guardian-sso-connections-connection', component: () => import('./pages/sso-connections/[connection].vue') },
  { path: '/guardian/two-factor-policies', name: 'guardian-two-factor-policies', component: () => import('./pages/two-factor-policies/index.vue') },
  { path: '/guardian/two-factor/challenge', name: 'guardian-two-factor-challenge', component: () => import('./pages/two-factor/challenge.vue'), meta: { atrium: { public: true } } },
  { path: '/guardian/two-factor/setup', name: 'guardian-two-factor-setup', component: () => import('./pages/two-factor/setup.vue'), meta: { atrium: { public: true } } },
  { path: '/guardian/users/:user', name: 'guardian-users-user', component: () => import('./pages/users/[user].vue') }
]
