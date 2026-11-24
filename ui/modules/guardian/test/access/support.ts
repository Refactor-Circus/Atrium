import type { components } from '../../client/schema'

/*
 * Shared payloads of the Guardian roles, permissions, assignments and user
 * suites (AC 89, 90), typed with `satisfies` against the vendored schema.
 */

type Schemas = components['schemas']

export const editor = {
  slug: 'editor',
  name: 'Editor',
  scope: 'any',
  owner_type: null,
  owner_id: null,
  description: 'Edits content.',
  super: false,
  system: false,
  permissions: ['posts.edit'],
  created_at: null,
  updated_at: null
} satisfies Schemas['RoleResource']

export const superAdmin = {
  ...editor,
  slug: 'super-admin',
  name: 'Super admin',
  scope: 'global',
  description: null,
  super: true,
  system: true,
  permissions: []
} satisfies Schemas['RoleResource']

export const postsEdit = { name: 'posts.edit', description: 'Edit posts.', system: false, created_at: null, updated_at: null } satisfies Schemas['PermissionResource']
export const rolesView = { name: 'guardian.roles.view', description: null, system: true, created_at: null, updated_at: null } satisfies Schemas['PermissionResource']

export const assignment = {
  id: 'asg-1',
  user_id: '7',
  role: { slug: 'editor', name: 'Editor', scope: 'any', super: false },
  scope_type: 'org',
  scope_id: 'acme',
  assigned_at: '2026-11-01T10:00:00+00:00'
} satisfies Schemas['RoleAssignmentResource']

export const globalAssignment = { ...assignment, id: 'asg-2', scope_type: null, scope_id: null } satisfies Schemas['RoleAssignmentResource']

/** The scope types a test screen sends (D-062). */
export const SCOPE_TYPES = [{ key: 'organization', type: 'org' }, { key: 'team', type: 'team' }]

/** A 422 from the escalation guard, naming the permissions the actor lacks. */
export const ESCALATION = { message: 'You may not grant these.', errors: { role: ['You lack the permissions posts.publish and posts.delete.'] } }
