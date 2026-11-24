import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { activeRuns } from '../src/atrium'
import type { AtriumNavSection } from '@refactor-circus/atrium'
import { settle, withSetup } from '@refactor-circus/atrium/testing'
import { integrationEntry, integrationShell, mockPackageApi, reply, resetPackageApis, useShell } from '@refactor-circus/atrium/testing'
import { callsTo, stats } from './support'
import { AtriumNavigation, useAtrium, useAtriumI18n } from '@refactor-circus/atrium'
import { mountSuspended, runInAtrium } from '@refactor-circus/atrium/testing'

/*
 * The `impex.active-runs` live resolver (AC 63): the Runs nav badge is
 * `impex.stats.show` `runs.active`, or no badge when that is 0 or the
 * request fails.
 */

async function resolve() {
  return runInAtrium(() => activeRuns())
}

const sections: AtriumNavSection[] = [{
  key: 'group-impex',
  label: 'Impex',
  icon: null,
  grouped: true,
  link: null,
  items: [{
    label: 'Runs',
    icon: 'i-lucide-circle-play',
    link: { path: '/impex/runs', external: false },
    badge: null,
    live: { key: 'impex.active-runs', options: {} },
    children: []
  }]
}]

describe('the impex.active-runs live resolver', () => {
  beforeEach(async () => {
    resetPackageApis()
    await useShell(integrationShell([integrationEntry('impex')]))
  })

  afterEach(() => {
    resetPackageApis()
  })

  it('is registered under impex.active-runs', async () => {
    const atrium = await withSetup(() => useAtrium())

    expect(atrium.liveResolvers.get('impex.active-runs')).toBe(activeRuns)
  })

  it('sets the badge to the number of active runs', async () => {
    const calls = mockPackageApi('impex', { 'GET /stats': { data: stats } })

    expect(await resolve()).toEqual({ badge: 3 })
    expect(callsTo(calls, 'GET', '/stats')).toHaveLength(1)
  })

  it('sets no badge when no run is active', async () => {
    mockPackageApi('impex', { 'GET /stats': { data: { ...stats, runs: { ...stats.runs, active: 0 } } } })

    expect(await resolve()).toEqual({ badge: null })
  })

  it('sets no badge when the request fails', async () => {
    mockPackageApi('impex', { 'GET /stats': reply(500) })

    expect(await resolve()).toEqual({ badge: null })
  })

  it('sets no badge when the request is forbidden', async () => {
    mockPackageApi('impex', { 'GET /stats': reply(403) })

    expect(await resolve()).toEqual({ badge: null })
  })

  it('shows the count on the Runs nav item', async () => {
    mockPackageApi('impex', { 'GET /stats': { data: stats } })
    await useShell(integrationShell([integrationEntry('impex')], { navigation: structuredClone(sections) }))

    const wrapper = await mountSuspended(AtriumNavigation)
    await settle()

    expect(wrapper.find('a[href="/impex/runs"]').text()).toContain('3')
  })
})
