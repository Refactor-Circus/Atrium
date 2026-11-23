import { describe, expect, it } from 'vitest'
import { useAtrium } from '#imports'
import CortexRedirectDomains from '../../../app/integrations/hooks/components/CortexRedirectDomains.vue'
import ImpexRunLink from '../../../app/integrations/hooks/components/ImpexRunLink.vue'
import KeenActivityTab from '../../../app/integrations/hooks/components/KeenActivityTab.vue'
import KeenHistorySection from '../../../app/integrations/hooks/components/KeenHistorySection.vue'
import { activityQuery, historyQuery, ownerOf, runLinkPath } from '../../../app/integrations/hooks/components/hooks'
import { screens } from '../../../app/integrations/hooks/index'
import { withSetup } from '../../support'
import { missingI18nKeys } from '../support'

/*
 * The hooks' layer registrations (AC 65 to 67, 53): each extension key
 * Atrium's `src/Integrations/Hooks` sends has its component, and every
 * string the hooks use is in `hooks.en.json`.
 */

describe('the hook registrations', () => {
  it('registers a component for every hook extension key', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.extensions.get('cortex.mcp')).toBe(CortexRedirectDomains)
    expect(atrium.extensions.get('cortex.redirect-domains')).toBe(CortexRedirectDomains)
    expect(atrium.extensions.get('impex.run-link')).toBe(ImpexRunLink)
    expect(atrium.extensions.get('keen.history')).toBe(KeenHistorySection)
    expect(atrium.extensions.get('keen.activity')).toBe(KeenActivityTab)
  })

  it('declares no screens of its own', () => {
    expect(screens).toEqual({})
  })

  it('has every string it uses in hooks.en.json', () => {
    expect(missingI18nKeys('hooks')).toEqual([])
  })
})

describe('what the hooks read from their data and record', () => {
  it('takes the owner from owner_type and the record key', () => {
    expect(ownerOf({ owner_type: 'roster.user' }, 7)).toEqual({ type: 'roster.user', id: '7' })
    expect(ownerOf({ owner_type: 'roster.user' }, null)).toBeNull()
    expect(ownerOf({}, 'acme')).toBeNull()
  })

  it('links a run id', () => {
    expect(runLinkPath('01JD')).toBe('/impex/runs/01JD')
    expect(runLinkPath('')).toBeNull()
  })

  it('builds the history query', () => {
    expect(historyQuery({ source: 'roster', subject_type: 'roster.user' }, '7')).toEqual({ source: 'roster', subject_type: 'roster.user', subject_id: '7' })
    expect(historyQuery({ source: 'roster', subject_type: null }, '7')).toEqual({ source: 'roster' })
    expect(historyQuery({ source: 'showroom' }, null)).toEqual({ source: 'showroom' })
    expect(historyQuery({}, '7')).toBeNull()
  })

  it('builds the activity query, scoped unless scope is false', () => {
    expect(activityQuery({ source: 'roster', subject_type: 'roster.organization', scope: true }, 'acme'))
      .toEqual({ source: 'roster', scope_type: 'roster.organization', scope_id: 'acme' })
    expect(activityQuery({ source: 'roster', subject_type: 'roster.user', scope: false }, '7'))
      .toEqual({ source: 'roster', subject_type: 'roster.user', subject_id: '7' })
    expect(activityQuery({ source: 'roster', subject_type: 'roster.user' }, null)).toBeNull()
  })
})
