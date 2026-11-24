import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import pennantplus, { screens } from '../src/atrium'
import { withSetup } from '@refactor-circus/atrium/testing'
import { hasI18nKey, missingI18nKeys } from '@refactor-circus/atrium/testing'
import { useAtrium } from '@refactor-circus/atrium'
import { useRouter } from '@refactor-circus/atrium/testing'

/*
 * The PennantPlus integration's layer side (AC 49, 53, 58): every screen and
 * nav path PHP declares (`test/fixtures/integrations/pennantplus.json`, written
 * by `PennantPlusIntegrationTest`) has its page; its `index.ts` maps each
 * screen key to that page's route; and every `t()` key it uses exists.
 */

interface Declarations {
  key: string
  navigation: { link: { path: string, external: boolean } | null }[]
  widgets: unknown[]
  settings: unknown
  search_sources: unknown[]
  screens: { key: string, kind: string, path: string, subject_type: string | null }[]
}

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`
// into a served asset URL, which `readFileSync()` refuses.
const here = import.meta.url

const fixture = JSON.parse(readFileSync(new URL('../../fixtures/integrations/pennantplus.json', here), 'utf8')) as Declarations

const locale = JSON.parse(readFileSync(new URL('../../../i18n/locales/integrations/pennantplus.en.json', here), 'utf8')) as unknown

/** A Nuxt route path as PHP declares it: `:param()` read as `:param`. */
function declaredPath(path: string): string {
  return path.replace(/\(\)/g, '')
}

describe('the pennantplus fixture', () => {
  it('declares the one screen and nav item of AC 58', () => {
    expect(fixture.key).toBe('pennantplus')
    expect(fixture.screens.map(screen => [screen.key, screen.kind, screen.path])).toEqual([
      ['pennantplus.features', 'list', '/pennantplus/features']
    ])
    expect(fixture.navigation.map(item => item.link?.path)).toEqual(['/pennantplus/features'])
    expect(fixture.widgets).toEqual([])
    expect(fixture.settings).toBeNull()
    expect(fixture.search_sources).toEqual([])
  })

  it('has a screens entry in index.ts for every screen key, and nothing else', () => {
    expect(Object.keys(screens).sort()).toEqual(fixture.screens.map(screen => screen.key).sort())
  })

  it('has a page for every screen, at the path PHP declares', async () => {
    const routes = (await withSetup(() => useRouter())).getRoutes()

    for (const screen of fixture.screens) {
      const route = routes.find(candidate => candidate.name === screens[screen.key])

      expect(route, screen.key).toBeDefined()
      expect(declaredPath(route!.path), screen.key).toBe(screen.path)
    }
  })

  it('has a page for every nav link', async () => {
    const router = await withSetup(() => useRouter())

    for (const item of fixture.navigation) {
      const resolved = router.resolve(item.link!.path)

      expect(resolved.name, item.link!.path).toBe(screens['pennantplus.features'])
    }
  })
})

describe('the pennantplus registrations', () => {
  it('registers nothing on the registry: PennantPlus has no widget, panel, search source or live resolver', async () => {
    const atrium = await withSetup(() => useAtrium())
    const calls: string[] = []
    const spy = new Proxy(atrium, {
      get(target, property, receiver) {
        const value = Reflect.get(target, property, receiver)

        if (typeof value === 'function' && ['widget', 'extension', 'settingsPanel', 'searchSource', 'live'].includes(String(property))) {
          return (...args: unknown[]) => {
            calls.push(String(property))

            return value.apply(target, args)
          }
        }

        return value
      }
    })

    pennantplus(spy)

    expect(calls).toEqual([])
  })
})

describe('the pennantplus strings', () => {
  it('uses only t() keys its locale files hold', () => {
    expect(missingI18nKeys('pennantplus')).toEqual([])
  })

  it('carries v1\'s confirmation and notices', () => {
    for (const key of ['pennantplus.features.purge_confirm', 'pennantplus.features.forget_confirm', 'pennantplus.features.value_saved', 'pennantplus.features.value_forgotten', 'pennantplus.features.feature_purged']) {
      expect(hasI18nKey(locale, key), key).toBe(true)
    }
  })
})
