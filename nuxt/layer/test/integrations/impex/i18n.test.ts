import { describe, expect, it } from 'vitest'
import { useNuxtApp } from '#imports'
import messages from '../../../i18n/locales/integrations/impex.en.json'
import { withSetup } from '../../support'
import { hasI18nKey, missingI18nKeys } from '../support'

/*
 * Impex's layer strings (AC 53): every `t()` key used under
 * `app/integrations/impex` and `app/pages/impex` exists in
 * `i18n/locales/integrations/impex.en.json`, which is merged into `en`, and
 * every value a status, direction or body policy label is built from has a
 * string.
 */

describe('the Impex strings', () => {
  it('hold every literal t() key the Impex pages and components use', () => {
    expect(missingI18nKeys('impex')).toEqual([])
  })

  it.each([
    ['statuses', ['pending', 'running', 'waiting', 'rolling_back', 'completed', 'failed', 'cancelled', 'undone', 'skipped', 'active', 'disabled', 'paused', 'succeeded']],
    ['directions', ['inbound', 'outbound']],
    ['body_policies', ['all', 'failures', 'none']]
  ])('label every one of the %s built at run time', (group, values) => {
    for (const value of values) {
      expect(hasI18nKey(messages, `impex.${group}.${value}`), `impex.${group}.${value}`).toBe(true)
    }
  })

  it('are merged into the en locale', async () => {
    const i18n = await withSetup(() => useNuxtApp().$i18n)

    expect(hasI18nKey(i18n.getLocaleMessage('en'), 'impex.runs.title')).toBe(true)
  })
})
