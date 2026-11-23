// Not ported (D-032)
// Guardian v1's Atrium UI (`src/Atrium`, `resources/views/atrium`: the SSO and
// SCIM tabs, the SSO identities section and the SSO connection page) leaves out
// these features, which have no v2 API route (D-073):
// - Hiding the SSO and SCIM forms, the connection's settings and delete, and the
//   unlink buttons from a viewer without `guardian.sso.manage` or
//   `guardian.scim.manage`. v1 asked Roster's `Authorizer`; no v2 route reports
//   these abilities, so the controls show and a 403 shows the no-access notice
//   (D-031).
// - The SSO connection page's organization name in its header. The v2
//   connection carries the organization's slug only, so the slug is shown.
// - `guardian.atrium.organization_route`, the connection page's back link. The
//   layer links to `/roster/organizations/:organization?tab=guardian.sso` while
//   the Roster integration is active instead.
// - The flashed status messages after creating, saving, deleting, issuing,
//   revoking and unlinking. Each form shows its own result in place.
import { defineAtriumIntegration } from '../../composables/useAtriumIntegration'
import { GUARDIAN_HANDLER_KEY, guardianTwoFactorHandler } from './components/two-factor/handler'

/*
 * Guardian in the layer (AC 82 to 98): the security package's screens. The
 * pages live under `app/pages/guardian/`, split by area: the current user's
 * security, the two-factor challenge and setup pages (outside the shell,
 * D-050), roles, permissions and their assignments (moved from Roster,
 * AC 99), one user's security, the security administration screens and SSO
 * connections. Guardian declares no widgets, settings panel or search
 * sources (D-057).
 *
 * It registers one response handler, `guardian.two-factor` (AC 84, D-049),
 * whether or not the shell lists Guardian as active: it sends a user who
 * owes a second factor to the challenge or setup page, and shows Guardian's
 * enrolment deadline as an app-wide notice.
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

export default defineAtriumIntegration((atrium) => {
  atrium.responseHandler(GUARDIAN_HANDLER_KEY, guardianTwoFactorHandler(atrium))
})
