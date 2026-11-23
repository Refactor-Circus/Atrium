import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { filesUnder, layerRoot } from '../support'

/*
 * Roles and permissions left Roster for Guardian (AC 99, D-046). Nothing
 * under `app/` or `test/` names a removed Roster operation, links to the old
 * `/roster/roles` or `/roster/permissions` pages, or calls one of the removed
 * paths through Roster's client. The vendored clients (`client/`) are left
 * out: they are checked by `VendoredClientsTest`.
 */

/** The operation names Roster's addendum build removed. */
const REMOVED_OPERATIONS = /\broster\.(?:roles\.|permissions\.|users\.roles\.|users\.permissions\b|organizations\.role-assignments\.)/

/** The layer links to the removed Roster pages. */
const REMOVED_LINKS = /\/roster\/(?:roles|permissions)\b/

/** A call or mock of a removed Roster path, in Roster's own code and tests. */
const REMOVED_PATHS = /['"`](?:(?:GET|POST|PUT|PATCH|DELETE) )?\/(?:roles|permissions|users\/\{user\}\/(?:roles|permissions)|organizations\/\{organization\}\/role-assignments)(?:\/[^'"`]*)?['"`]/

const self = 'test/integrations/roster/removed-access.test.ts'

function sources(...directories: string[]): Array<{ file: string, text: string }> {
  return directories
    .flatMap(directory => filesUnder(join(layerRoot, directory)))
    .map(path => ({ file: relative(layerRoot, path), text: readFileSync(path, 'utf8') }))
    .filter(source => source.file !== self)
}

function offenders(pattern: RegExp, ...directories: string[]): string[] {
  return sources(...directories)
    .filter(source => pattern.test(source.text))
    .map(source => `${source.file}: ${source.text.match(pattern)![0]}`)
}

describe('the roles and permissions removed from Roster', () => {
  it('finds the layer sources it greps', () => {
    expect(sources('app', 'test').length).toBeGreaterThan(100)
  })

  it('names no removed Roster operation under app/ or test/', () => {
    expect(offenders(REMOVED_OPERATIONS, 'app', 'test')).toEqual([])
  })

  it('links to neither /roster/roles nor /roster/permissions under app/ or test/', () => {
    expect(offenders(REMOVED_LINKS, 'app', 'test')).toEqual([])
  })

  it('calls and mocks none of the removed paths through Roster\'s client', () => {
    expect(offenders(REMOVED_PATHS, 'app/integrations/roster', 'app/pages/roster', 'test/integrations/roster')).toEqual([])
  })

  it('would catch each removed name, link and path', () => {
    expect(REMOVED_OPERATIONS.test('roster.roles.index')).toBe(true)
    expect(REMOVED_OPERATIONS.test('roster.users.permissions')).toBe(true)
    expect(REMOVED_OPERATIONS.test('roster.organizations.role-assignments.index')).toBe(true)
    expect(REMOVED_OPERATIONS.test('roster.users.index')).toBe(false)
    expect(REMOVED_LINKS.test('navigateTo(\'/roster/roles/1\')')).toBe(true)
    expect(REMOVED_LINKS.test('/roster/users')).toBe(false)
    expect(REMOVED_PATHS.test('roster.GET(\'/users/{user}/roles\', path)')).toBe(true)
    expect(REMOVED_PATHS.test('\'GET /roles\': page([])')).toBe(true)
    expect(REMOVED_PATHS.test('\'GET /organizations/{organization}/role-assignments\'')).toBe(true)
    expect(REMOVED_PATHS.test('\'GET /organizations/{organization}/members\'')).toBe(false)
  })
})
