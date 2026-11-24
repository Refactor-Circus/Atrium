import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { screens } from '../../src/atrium'
import fixture from '@refactor-circus/atrium/fixtures/integrations/guardian.json'
import { missingI18nKeys } from '@refactor-circus/atrium/testing'
import { useRouter } from '@refactor-circus/atrium/testing'

/*
 * The roles, permissions, assignments and user area of Guardian (AC 49, 89,
 * 90): each screen key has a layer page at the path the PHP integration
 * declares, framed with its own screen key so it calls `atrium.screens.show`
 * with it, and every `t()` key exists.
 */

const PAGES: Record<string, string> = {
  'guardian.roles': 'roles/index.vue',
  'guardian.role': 'roles/[role].vue',
  'guardian.permissions': 'permissions/index.vue',
  'guardian.role-assignments': 'role-assignments/index.vue',
  'guardian.user': 'users/[user].vue'
}

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`.
const here = import.meta.url

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(`../../src/pages/${file}`, here)), 'utf8')
}

describe('the guardian access pages', () => {
  it.each(Object.keys(PAGES))('has a page for %s at its declared path, named in the screens map', (key) => {
    const declared = fixture.screens.find(screen => screen.key === key)
    const route = useRouter().getRoutes().find(candidate => candidate.name === screens[key])

    expect(declared, key).toBeDefined()
    expect(route, key).toBeDefined()
    expect(route!.path.replace(/\(\)/g, '')).toBe(declared!.path)
  })

  it.each(Object.entries(PAGES))('frames the %s page with its own screen key', (key, file) => {
    expect(source(file)).toContain(`screen-key="${key}"`)
  })

  it('has every t() key it uses in its locale files', () => {
    expect(missingI18nKeys('guardian')).toEqual([])
  })
})
