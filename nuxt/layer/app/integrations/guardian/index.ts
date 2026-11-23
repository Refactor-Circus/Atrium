import { defineAtriumIntegration } from '../../composables/useAtriumIntegration'

/*
 * Guardian in the layer (AC 82 to 98): the security package's screens. The
 * pages live under `app/pages/guardian/`, split by area: the current user's
 * security, the two-factor challenge and setup pages (outside the shell,
 * D-050), roles, permissions and their assignments (moved from Roster,
 * AC 99), one user's security, the security administration screens and SSO
 * connections. Guardian declares no widgets, settings panel or search
 * sources (D-057).
 */

/**
 * Each screen key Guardian declares (`GuardianIntegration::screens()`) to the
 * name of the layer route that renders it: the page at the declared path.
 */
export const screens: Record<string, string> = {
  'guardian.security': 'guardian-security',
  // The two-factor pages (D-050), outside the shell.
  'guardian.two-factor-challenge': 'guardian-two-factor-challenge',
  'guardian.two-factor-setup': 'guardian-two-factor-setup',
  'guardian.roles': 'guardian-roles',
  'guardian.role': 'guardian-roles-role',
  'guardian.permissions': 'guardian-permissions',
  'guardian.role-assignments': 'guardian-role-assignments',
  'guardian.user': 'guardian-users-user',
  'guardian.security-events': 'guardian-security-events',
  'guardian.security-event': 'guardian-security-events-event',
  'guardian.lockouts': 'guardian-lockouts',
  'guardian.ip-rules': 'guardian-ip-rules',
  'guardian.two-factor-policies': 'guardian-two-factor-policies',
  'guardian.password-policy': 'guardian-password-policy',
  'guardian.sso-connection': 'guardian-sso-connections-connection'
}

export default defineAtriumIntegration(() => {})
