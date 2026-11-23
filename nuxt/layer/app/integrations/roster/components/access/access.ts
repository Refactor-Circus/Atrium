import { shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import type { components } from '../../client/schema'
import { rosterData, useRoster, type RosterPage } from '../users/users'

/*
 * What the Roster roles and permissions screens share (AC 54, 69): their
 * payload types, the role scopes and the permission catalogue the role forms
 * tick. Loading, paging and actions come from the users area
 * (`../users/users`), which every Roster screen shares.
 */

type Schemas = components['schemas']

export type RosterRoleScope = Schemas['RoleScope']
export type RosterRoleDetail = Schemas['RoleResource']
export type RosterPermission = Schemas['PermissionResource']

/** Every role scope, in Roster's order (`RoleScope`). */
export const ROLE_SCOPES: readonly RosterRoleScope[] = ['global', 'organization', 'team']

/** v1 loads at most this many permissions for the role forms (Roster's page maximum). */
export const PERMISSION_CATALOGUE_SIZE = 200

/** The layer path of a role's page. */
export function rolePath(id: string): string {
  return `/roster/roles/${encodeURIComponent(id)}`
}

/**
 * Every permission a role can be given (`roster.permissions.index`, one page
 * of `PERMISSION_CATALOGUE_SIZE`), for the role forms' checkboxes. A failure
 * leaves the list empty: the rest of the form still works.
 */
export function usePermissionCatalogue(): ShallowRef<RosterPermission[]> {
  const client = useRoster()
  const permissions = shallowRef<RosterPermission[]>([])

  async function load(): Promise<void> {
    if (!client) {
      return
    }

    try {
      permissions.value = rosterData<RosterPage<RosterPermission>>(await client.GET('/permissions', {
        params: { query: { per_page: PERMISSION_CATALOGUE_SIZE } }
      })).data
    } catch {
      permissions.value = []
    }
  }

  void load()

  return permissions
}
