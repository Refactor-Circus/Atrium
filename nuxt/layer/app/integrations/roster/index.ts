import { defineAtriumIntegration } from '../../composables/useAtriumIntegration'
import { searchRosterOrganizations, searchRosterUsers } from './components/search/sources'
import OrganizationsWidget from './components/widgets/OrganizationsWidget.vue'
import UserStatusWidget from './components/widgets/UserStatusWidget.vue'

/*
 * Roster in the layer (AC 60, 62, 69): its two widgets, its two ⌘K sources
 * and the map of its screens to their pages. The pages live under
 * `app/pages/roster/`, split by area (users and impersonations;
 * organizations, teams and the public invitation page; roles, permissions and
 * transfers). Each area's index page lists the v1 actions it does not port
 * (D-032).
 */

/**
 * Each screen key Roster declares (`RosterIntegration::screens()`) to the
 * name of the layer route that renders it: the page at the declared path.
 */
export const screens: Record<string, string> = {
  'roster.users': 'roster-users',
  'roster.user-create': 'roster-users-create',
  'roster.user': 'roster-users-user',
  'roster.organizations': 'roster-organizations',
  'roster.organization-create': 'roster-organizations-create',
  'roster.organization': 'roster-organizations-organization',
  'roster.team': 'roster-organizations-organization-teams-team',
  'roster.roles': 'roster-roles',
  'roster.role': 'roster-roles-role',
  'roster.permissions': 'roster-permissions',
  'roster.impersonations': 'roster-impersonations',
  'roster.transfers': 'roster-transfers',
  'roster.transfer': 'roster-transfers-transfer',
  // The public invitation page (AC 70), outside the shell.
  'roster.invitation': 'roster-invitations-token'
}

export default defineAtriumIntegration((atrium) => {
  atrium
    .widget('roster.user-status', UserStatusWidget)
    .widget('roster.organizations', OrganizationsWidget)
    .searchSource('roster-users', searchRosterUsers)
    .searchSource('roster-organizations', searchRosterOrganizations)
})
