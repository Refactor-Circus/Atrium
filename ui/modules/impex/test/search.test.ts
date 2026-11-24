import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { searchRuns } from '../src/atrium'
import { withSetup } from '@refactor-circus/atrium/testing'
import { integrationEntry, integrationShell, mockPackageApi, reply, resetPackageApis, useShell } from '@refactor-circus/atrium/testing'
import { callsTo, failedRun, run } from './support'
import { useAtrium, useAtriumI18n } from '@refactor-circus/atrium'
import { runInAtrium } from '@refactor-circus/atrium/testing'

/*
 * The `impex` search source (AC 62): runs from `impex.search.index`, capped
 * at the shell's `search.per_source`, each linking to `/impex/runs/:id`.
 * A failing request rejects, so ⌘K drops the source alone.
 */

async function search(q: string, limit: number) {
  return runInAtrium(() => searchRuns(q, { limit }))
}

describe('the impex search source', () => {
  beforeEach(async () => {
    resetPackageApis()
    await useShell(integrationShell([integrationEntry('impex')]))
  })

  afterEach(() => {
    resetPackageApis()
  })

  it('is registered under its v1 key', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.searchSources.get('impex')).toBe(searchRuns)
  })

  it('asks impex.search.index with the query and the limit', async () => {
    const calls = mockPackageApi('impex', { 'GET /search': { data: [run] } })

    await search('orders', 5)

    expect(callsTo(calls, 'GET', '/search').map(call => call.query)).toEqual([{ q: 'orders', limit: '5' }])
  })

  it('links each run to its page', async () => {
    mockPackageApi('impex', { 'GET /search': { data: [run, failedRun] } })

    const results = await search('orders', 5)

    expect(results.map(result => result.link)).toEqual([
      { path: '/impex/runs/run-1', external: false },
      { path: '/impex/runs/run-2', external: false }
    ])
    expect(results[0]!.title).toBe('orders.sync')
    expect(results[1]!.subtitle).toBe('failed')
  })

  it('caps its results at the per-source limit', async () => {
    mockPackageApi('impex', { 'GET /search': { data: [run, failedRun, { ...run, id: 'run-3' }] } })

    expect(await search('orders', 2)).toHaveLength(2)
  })

  it('rejects when the API answers 403, so the search drops it', async () => {
    mockPackageApi('impex', { 'GET /search': reply(403) })

    await expect(search('orders', 5)).rejects.toThrow()
  })

  it('asks nothing while Impex is not active', async () => {
    await useShell(integrationShell([integrationEntry('impex', { active: false })]))
    const calls = mockPackageApi('impex', { 'GET /search': { data: [run] } })

    expect(await search('orders', 5)).toEqual([])
    expect(calls).toEqual([])
  })
})
