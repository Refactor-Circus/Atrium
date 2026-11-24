import { describe, expect, it } from 'vitest'
import { useAtriumI18n } from '../src/index'
import { hasI18nKey, i18nKeysIn, missingI18nKeys } from '../src/testing/index'

/*
 * Module strings (AC 53): each module ships its own locale files
 * (`src/locales/*.en.json`), merged into `en` when it registers, and its
 * suite checks every `t()` key it uses with missingI18nKeys(). These are the
 * helpers that check.
 */

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

describe('Atrium\'s own strings', () => {
  it('are loaded into the en locale, for every module to share', () => {
    const en = useAtriumI18n().getLocaleMessage('en') as Record<string, unknown>

    expect(hasI18nKey(en, 'atrium.integrations.unavailable.absent_title')).toBe(true)
  })

  it('are checked against each module by its own suite (missingI18nKeys)', () => {
    expect(missingI18nKeys({ root: '/', sources: [], locales: [] })).toEqual([])
  })
})
