import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { screens } from '../src/atrium'
import fixture from '@refactor-circus/atrium/fixtures/integrations/cortex.json'
import { missingI18nKeys } from '@refactor-circus/atrium/testing'
import { useRouter } from '@refactor-circus/atrium/testing'

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`
// into a served asset URL, which `fileURLToPath()` refuses.
const here = import.meta.url

/*
 * The Cortex integration as a whole (AC 49, 53, 55): every screen the PHP
 * integration declares (`fixtures/integrations/cortex.json`, written by
 * `CortexIntegrationTest`) has a layer page at its declared path, `src/atrium.ts`
 * maps each to that page's route, and every `t()` key the Cortex pages and
 * components use exists in `cortex.en.json`.
 */

/** Each screen's page file, under `src/pages/`. */
const PAGES: Record<string, string> = {
  'cortex.virtual-agents': 'virtual-agents/index.vue',
  'cortex.virtual-agent-create': 'virtual-agents/create.vue',
  'cortex.virtual-agent': 'virtual-agents/[slug].vue',
  'cortex.concrete-agents': 'concrete-agents/index.vue',
  'cortex.concrete-agent': 'concrete-agents/[agent].vue',
  'cortex.tools': 'tools/index.vue',
  'cortex.tool-description': 'tools/[tool]/description.vue',
  'cortex.servers': 'servers/index.vue',
  'cortex.server-instructions': 'servers/[server]/instructions.vue',
  'cortex.redirect-domains': 'redirect-domains.vue',
  'cortex.run': 'run.vue'
}

/** A route's path as declared in PHP: Nuxt's `:slug()` param form becomes `:slug`. */
function declared(path: string): string {
  return path.replace(/\(\)/g, '')
}

describe('the cortex integration', () => {
  it('declares the eleven v1 screens', () => {
    expect(fixture.screens.map(screen => screen.key)).toEqual([
      'cortex.virtual-agents',
      'cortex.virtual-agent-create',
      'cortex.virtual-agent',
      'cortex.concrete-agents',
      'cortex.concrete-agent',
      'cortex.tools',
      'cortex.tool-description',
      'cortex.servers',
      'cortex.server-instructions',
      'cortex.redirect-domains',
      'cortex.run'
    ])
  })

  it.each(fixture.screens.map(screen => [screen.key, screen.path] as const))('has a page for %s at %s, named in the screens map', (key, path) => {
    const name = screens[key]
    const route = useRouter().getRoutes().find(candidate => candidate.name === name)

    expect(name, key).toBeDefined()
    expect(route, `${key} -> ${name}`).toBeDefined()
    expect(declared(route!.path)).toBe(path)
  })

  it('maps no screen the PHP integration does not declare', () => {
    expect(Object.keys(screens).sort()).toEqual(fixture.screens.map(screen => screen.key).sort())
  })

  it.each(Object.entries(PAGES))('frames the %s page with its own screen key, so it calls atrium.screens.show with it', (key, file) => {
    const source = readFileSync(fileURLToPath(new URL(`../src/pages/${file}`, here)), 'utf8')

    expect(source).toContain(`screen-key="${key}"`)
  })

  it('declares the cortex panel and search source with static data', () => {
    expect(fixture.settings?.key).toBe('cortex')
    expect(fixture.settings?.data).toEqual({})
    expect(fixture.search_sources.map(source => source.key)).toEqual(['cortex'])
  })

  it('lists the old actions with no v2 route in a Not ported (D-032) comment', () => {
    const index = readFileSync(fileURLToPath(new URL('../src/atrium.ts', here)), 'utf8')

    expect(index.startsWith('// Not ported (D-032)')).toBe(true)
  })

  it('has every t() key it uses in its locale files', () => {
    expect(missingI18nKeys('cortex')).toEqual([])
  })
})
