import { describe, expect, it } from 'vitest'
import Guardian, { screens } from '../src/atrium'
import { missingI18nKeys } from '@refactor-circus/atrium/testing'
import fixture from '@refactor-circus/atrium/fixtures/integrations/guardian.json'

/*
 * Guardian's `src/atrium.ts` (AC 49, 82) against what its PHP integration declares
 * in `fixtures/integrations/guardian.json`: a route name for every screen,
 * and no widget, settings panel or search source (D-057).
 */

/** The name Nuxt gives the page at a declared path: `/guardian/roles/:role` is `guardian-roles-role`. */
function routeNameFor(path: string): string {
  return path.slice(1).split('/').map(part => part.replace(/^:/, '')).join('-')
}

describe('the guardian screens map', () => {
  it('has an entry for every screen key in the fixture, and no other', () => {
    const declared = fixture.screens.map(screen => screen.key)

    expect(Object.keys(screens).sort()).toEqual([...declared].sort())
    expect(declared).toHaveLength(15)
  })

  it('names, for each screen, the page at its declared path', () => {
    for (const screen of fixture.screens) {
      expect(screens[screen.key], screen.key).toBe(routeNameFor(screen.path))
    }
  })

  it('sends the static options AC 82 lists', () => {
    const options = Object.fromEntries(fixture.screens.map(screen => [screen.key, screen.options]))

    expect(options['guardian.security']).toEqual({ token_abilities: ['*'], token_max_lifetime_days: 365 })
    expect(options['guardian.roles']).toEqual({ scope_types: [] })
    expect(options['guardian.user']).toEqual({ scope_types: [], token_abilities: ['*'] })
    expect(options['guardian.ip-rules']).toEqual({ mode: 'denylist' })
  })
})

describe('the guardian declarations', () => {
  it('declares nine nav items in one Security group, under /guardian/', () => {
    expect(fixture.navigation.map(item => item.link?.path)).toEqual([
      '/guardian/security',
      '/guardian/roles',
      '/guardian/permissions',
      '/guardian/role-assignments',
      '/guardian/security-events',
      '/guardian/lockouts',
      '/guardian/ip-rules',
      '/guardian/two-factor-policies',
      '/guardian/password-policy'
    ])

    expect(new Set(fixture.navigation.map(item => item.group))).toEqual(new Set(['Security']))
  })

  it('declares and registers no widget, settings panel, search source or live resolver', () => {
    expect(fixture.widgets).toEqual([])
    expect(fixture.settings).toBeNull()
    expect(fixture.search_sources).toEqual([])
    expect(Guardian.widgets ?? {}).toEqual({})
    expect(Guardian.settingsPanels ?? {}).toEqual({})
    expect(Guardian.searchSources ?? {}).toEqual({})
    expect(Guardian.liveResolvers ?? {}).toEqual({})
  })
})

describe('the guardian strings', () => {
  it('has every t() key it uses in its locale files', () => {
    expect(missingI18nKeys('guardian')).toEqual([])
  })
})
