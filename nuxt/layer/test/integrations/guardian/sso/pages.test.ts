import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { useRouter } from '#imports'
import { screens } from '../../../../app/integrations/guardian/index'
import fixture from '../../../fixtures/integrations/guardian.json'
import { missingI18nKeys } from '../../support'

/*
 * The SSO area of Guardian (AC 49, 96, D-032, D-073): `guardian.sso-connection`
 * has its page at the declared path, framed with its own screen key; the
 * v1 features with no v2 route are listed in `index.ts`; every `t()` key
 * exists.
 */

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`.
const here = import.meta.url

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(`../../../../app/${file}`, here)), 'utf8')
}

describe('the guardian SSO pages', () => {
  it('has a page for guardian.sso-connection at its declared path, named in the screens map', () => {
    const declared = fixture.screens.find(screen => screen.key === 'guardian.sso-connection')
    const route = useRouter().getRoutes().find(candidate => candidate.name === screens['guardian.sso-connection'])

    expect(declared).toBeDefined()
    expect(route).toBeDefined()
    expect(route!.path.replace(/\(\)/g, '')).toBe(declared!.path)
    expect(source('pages/guardian/sso-connections/[connection].vue')).toContain('screen-key="guardian.sso-connection"')
  })

  it('lists the v1 features with no v2 route at the top of index.ts', () => {
    const index = source('integrations/guardian/index.ts')

    expect(index.startsWith('// Not ported (D-032)')).toBe(true)
    expect(index).toContain('guardian.sso.manage')
    expect(index).toContain('guardian.atrium.organization_route')
  })

  it('has every t() key it uses in its locale files', () => {
    expect(missingI18nKeys('guardian')).toEqual([])
  })
})
