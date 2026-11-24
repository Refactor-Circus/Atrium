import { afterEach, describe, expect, it } from 'vitest'
import { searchCortex } from '../src/atrium'
import { withSetup } from '@refactor-circus/atrium/testing'
import { integrationEntry, integrationShell, mockPackageApi, reply, resetPackageApis, useShell } from '@refactor-circus/atrium/testing'
import { cortexCalls, runnableAgents } from './support'
import { useAtrium } from '@refactor-circus/atrium'
import { runInAtrium } from '@refactor-circus/atrium/testing'

/*
 * The `cortex` search source (AC 62): `cortex.search.index?q=`, results
 * linking to `/cortex/virtual-agents/:key` or `/cortex/concrete-agents/:key`
 * by `type`, capped at `search.per_source`. A failure rejects, so ⌘K drops
 * the source.
 */

async function search(q: string, limit = 5) {
  return runInAtrium(() => searchCortex(q, { limit }))
}

describe('the cortex search source', () => {
  afterEach(() => resetPackageApis())

  it('is registered under the cortex key', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.searchSources.get('cortex')).toBe(searchCortex)
  })

  it('searches cortex.search.index and links each result by its type', async () => {
    await useShell(integrationShell([integrationEntry('cortex')]))
    mockPackageApi('cortex', { 'GET /search': { data: runnableAgents } })

    const results = await search('tri')

    expect(cortexCalls('GET', '/search')[0]?.query).toEqual({ q: 'tri' })
    expect(results.map(result => [result.title, result.link])).toEqual([
      ['Triage', { path: '/cortex/virtual-agents/triage', external: false }],
      ['support-triage', { path: '/cortex/concrete-agents/support-triage', external: false }]
    ])
    expect(results.map(result => result.subtitle)).toEqual(['Virtual agent', 'Concrete agent'])
  })

  it('caps its results at the limit', async () => {
    await useShell(integrationShell([integrationEntry('cortex')]))
    mockPackageApi('cortex', { 'GET /search': { data: runnableAgents } })

    expect(await search('tri', 1)).toHaveLength(1)
  })

  it('rejects on a 403, so the search drops it', async () => {
    await useShell(integrationShell([integrationEntry('cortex')]))
    mockPackageApi('cortex', { 'GET /search': reply(403) })

    await expect(search('tri')).rejects.toMatchObject({ status: 403 })
  })

  it('returns nothing, and calls nothing, while Cortex is inactive', async () => {
    await useShell(integrationShell([integrationEntry('cortex', { active: false })]))
    mockPackageApi('cortex', { 'GET /search': { data: runnableAgents } })

    expect(await search('tri')).toEqual([])
    expect(cortexCalls('GET', '/search')).toEqual([])
  })
})
