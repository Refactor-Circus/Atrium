import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { useNuxtApp } from '#imports'
import { withSetup } from './support'
import { hasI18nKey, i18nKeysIn, integrationLocaleFiles, missingI18nKeys } from './integrations/support'

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`
// into a served asset URL, which `fileURLToPath()` refuses.
const here = import.meta.url

/*
 * Integration strings (AC 53): each integration's layer strings live in
 * `i18n/locales/integrations/{pkg}.en.json` (Roster and Showroom also have one
 * file per screen area, the hooks `hooks.en.json`), merged into `en`. Every
 * `t()` key used under `app/integrations/{pkg}` and `app/pages/{pkg}` must
 * exist in them.
 */

const LOCALE_FILES = [
  'cortex', 'impex', 'keen', 'pennantplus', 'polycart',
  'guardian', 'guardian-two-factor', 'guardian-security', 'guardian-access', 'guardian-admin', 'guardian-sso',
  'roster', 'roster-users', 'roster-organizations', 'roster-access',
  'showroom', 'showroom-catalog', 'showroom-structure', 'showroom-assets',
  'hooks'
]

const INTEGRATIONS = ['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom', 'hooks']

const locales = fileURLToPath(new URL('../i18n/locales/', here))

describe('i18nKeysIn()', () => {
  it('finds the literal keys of t() and $t() calls', () => {
    const source = [
      `const { t } = useI18n()`,
      `t('impex.runs.title')`,
      `t("impex.runs.empty", { count })`,
      '<p>{{ $t(`impex.runs.cancel`) }}</p>',
      `t( 'impex.runs.retry' )`
    ].join('\n')

    expect(i18nKeysIn(source).sort()).toEqual(['impex.runs.cancel', 'impex.runs.empty', 'impex.runs.retry', 'impex.runs.title'])
  })

  it('leaves out keys built at run time and calls that are not t()', () => {
    const source = [
      't(`impex.status.${run.status}`)',
      `format('impex.not.a.key')`,
      `client.get('impex.nope')`,
      `useStat('impex.nope')`
    ].join('\n')

    expect(i18nKeysIn(source)).toEqual([])
  })
})

describe('hasI18nKey()', () => {
  const messages = { impex: { runs: { title: 'Runs', counts: { active: '{n} active' } } } }

  it('finds a nested string by its dotted key', () => {
    expect(hasI18nKey(messages, 'impex.runs.title')).toBe(true)
    expect(hasI18nKey(messages, 'impex.runs.counts.active')).toBe(true)
  })

  it('misses an absent key, and a key naming a group rather than a string', () => {
    expect(hasI18nKey(messages, 'impex.runs.empty')).toBe(false)
    expect(hasI18nKey(messages, 'impex.runs')).toBe(false)
    expect(hasI18nKey(messages, 'roster.users.title')).toBe(false)
  })
})

describe('the integration locale files', () => {
  it('ship one English file per integration, screen area and the hooks', () => {
    for (const name of LOCALE_FILES) {
      const path = `${locales}integrations/${name}.en.json`

      expect(existsSync(path), name).toBe(true)
      expect(typeof JSON.parse(readFileSync(path, 'utf8')), name).toBe('object')
    }
  })

  it('give each package its own file and its screen areas', () => {
    const names = (pkg: string) => integrationLocaleFiles(pkg).map(path => path.slice(locales.length))

    expect(names('roster').sort()).toEqual(['en.json', 'integrations/roster-access.en.json', 'integrations/roster-organizations.en.json', 'integrations/roster-users.en.json', 'integrations/roster.en.json'])
    expect(names('keen')).toEqual(['en.json', 'integrations/keen.en.json'])
    expect(names('guardian').sort()).toEqual([
      'en.json',
      'integrations/guardian-access.en.json',
      'integrations/guardian-admin.en.json',
      'integrations/guardian-security.en.json',
      'integrations/guardian-sso.en.json',
      'integrations/guardian-two-factor.en.json',
      'integrations/guardian.en.json'
    ])
  })

  it('are merged into the en locale', async () => {
    const i18n = await withSetup(() => useNuxtApp().$i18n)
    const en = i18n.getLocaleMessage('en') as Record<string, unknown>

    expect(hasI18nKey(en, 'atrium.integrations.unavailable.absent_title')).toBe(true)
  })
})

describe('every t() key an integration uses', () => {
  it.each(INTEGRATIONS)('exists in the %s locale files', (pkg) => {
    expect(missingI18nKeys(pkg)).toEqual([])
  })
})
