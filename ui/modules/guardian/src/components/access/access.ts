import { shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import type { components } from '../../../client/schema'
import { guardianData, type GuardianAction, type GuardianClient, type GuardianPage } from '../two-factor/guardian'

/*
 * What Guardian's roles, permissions and assignment screens share (AC 89,
 * 90), moved from Roster's group 21 screens (AC 99): payload types, the
 * scope types the screens are sent (D-048, D-062), paths, and the role and
 * permission catalogues the forms pick from.
 */

type Schemas = components['schemas']

export type GuardianRole = Schemas['RoleResource']
export type GuardianPermission = Schemas['PermissionResource']
export type GuardianAssignment = Schemas['RoleAssignmentResource']
export type GuardianUserAbilities = Schemas['UserAbilitiesResource']

/** A scope type the host resolved, as `GuardianScopeTypes::options()` sends it. */
export interface GuardianScopeType {
  key: string
  type: string
}

/** The role scopes that are not a scope type. */
export const ROLE_SCOPES = ['global', 'any'] as const

/** The most roles or permissions a form loads to pick from (Guardian's page maxima). */
export const ROLE_CATALOGUE_SIZE = 100
export const PERMISSION_CATALOGUE_SIZE = 200

/** How many rows a list loads at once. */
export const ACCESS_PAGE_SIZE = 25

/** The `scope_types` option of a screen, keeping only well-formed entries. */
export function scopeTypesOf(options: Record<string, unknown> | null | undefined): GuardianScopeType[] {
  const list = options?.scope_types

  return Array.isArray(list)
    ? list.filter((entry): entry is GuardianScopeType => typeof entry?.key === 'string' && typeof entry?.type === 'string' && entry.type !== '')
    : []
}

/** The layer path of a role's page. */
export function rolePath(slug: string): string {
  return `/guardian/roles/${encodeURIComponent(slug)}`
}

/** The layer path of a user's security page. */
export function userPath(user: string | number): string {
  return `/guardian/users/${encodeURIComponent(String(user))}`
}

/** The scope key a morph type stands for, else the type itself. */
export function scopeKeyOf(type: string | null | undefined, scopeTypes: GuardianScopeType[]): string | null {
  if (!type) {
    return null
  }

  return scopeTypes.find(entry => entry.type === type)?.key ?? type
}

/** Every message of the last 422, flattened: the escalation guard names the missing permissions there. */
export function errorMessages(action: GuardianAction): string[] {
  return Object.values(action.errors.value).flat()
}

/** A trimmed form value, or null when blank. */
export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()

  return trimmed === '' ? null : trimmed
}

/** The page numbers of a paged answer. */
export function pageOf(page: GuardianPage<unknown> | null): { current: number, last: number } {
  return { current: page?.meta?.current_page ?? 1, last: page?.meta?.last_page ?? 1 }
}

/**
 * Every permission a role can be given (`guardian.permissions.index`, one
 * page of `PERMISSION_CATALOGUE_SIZE`), for the permission picker. A failure
 * leaves it empty: the rest of the form still works.
 */
export function usePermissionCatalogue(client: GuardianClient | null): ShallowRef<GuardianPermission[]> {
  const permissions = shallowRef<GuardianPermission[]>([])

  if (client) {
    void client.GET('/permissions', { params: { query: { per_page: PERMISSION_CATALOGUE_SIZE } } })
      .then(result => permissions.value = guardianData<GuardianPage<GuardianPermission>>(result).data)
      .catch(() => permissions.value = [])
  }

  return permissions
}

/** Every role an assignment can name (`guardian.roles.index`), for the role picker. */
export function useRoleCatalogue(client: GuardianClient | null): ShallowRef<GuardianRole[]> {
  const roles = shallowRef<GuardianRole[]>([])

  if (client) {
    void client.GET('/roles', { params: { query: { per_page: ROLE_CATALOGUE_SIZE } } })
      .then(result => roles.value = guardianData<GuardianPage<GuardianRole>>(result).data)
      .catch(() => roles.value = [])
  }

  return roles
}
