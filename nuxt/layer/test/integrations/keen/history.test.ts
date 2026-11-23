import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import HistoryPage from '../../../app/pages/keen/history/[package].vue'
import { settle } from '../../support'
import { mockPackageApi, mountIntegration, reply, resetPackageApis, type PackageCall } from '../support'
import { keenEntry, keenPackages, keenPage, keenScreenFor } from './keen'

/*
 * The `keen.history` screen (AC 54, 57): one package's audit log,
 * `keen.entries.index` with `source` fixed to the package, for a package
 * `keen.packages.index` lists.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: { query?: Record<string, unknown> }) => Promise<unknown>>()
}))

mockNuxtImport('useAtriumApi', () => () => api)

const entryGets = (calls: readonly PackageCall[]) => calls.filter(call => call.method === 'GET' && call.route === '/entries')

describe('the keen.history screen', () => {
  beforeEach(() => {
    clearNuxtData()
    api.mockReset()
    api.mockImplementation(async (path, options) => keenScreenFor(path, options?.query?.record))
  })

  afterEach(async () => {
    resetPackageApis()
    await useRouter().replace('/')
  })

  it('lists the package\'s entries, with source fixed to the package', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': call => keenPage(call.query.source === 'impex' ? [keenEntry()] : [])
    })

    const wrapper = await mountIntegration(HistoryPage, 'keen', { route: '/keen/history/impex' })
    await settle()

    expect(calls.some(call => call.method === 'GET' && call.route === '/packages')).toBe(true)
    expect(entryGets(calls).at(-1)?.query).toEqual({ source: 'impex' })
    expect(wrapper.findAll('[data-testid="keen-entry-row"]')).toHaveLength(1)
    expect(wrapper.find('[data-testid="keen-filter-source"]').exists()).toBe(false)
  })

  it('keeps the source when other filters are applied', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': keenPage([keenEntry()])
    })

    const wrapper = await mountIntegration(HistoryPage, 'keen', { route: '/keen/history/impex' })
    await settle()

    await wrapper.find('[data-testid="keen-filter-action"]').setValue('run.')
    await wrapper.find('[data-testid="keen-filters"]').trigger('submit')
    await settle()

    expect(useRouter().currentRoute.value.query).toEqual({ action: 'run.' })
    expect(entryGets(calls).at(-1)?.query).toEqual({ source: 'impex', action: 'run.' })
  })

  it('ignores a source in the route query', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': keenPage([])
    })

    await mountIntegration(HistoryPage, 'keen', { route: '/keen/history/impex?source=roster' })
    await settle()

    expect(entryGets(calls).at(-1)?.query).toEqual({ source: 'impex' })
  })

  it('shows a not-found state for a package Keen does not list, without loading entries', async () => {
    const calls = mockPackageApi('keen', {
      'GET /packages': { data: keenPackages },
      'GET /entries': keenPage([])
    })

    const wrapper = await mountIntegration(HistoryPage, 'keen', { route: '/keen/history/cortex' })
    await settle()

    expect(wrapper.find('[data-testid="keen-history-not-found"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="keen-entries"]').exists()).toBe(false)
    expect(entryGets(calls).filter(call => call.query.source === 'cortex')).toEqual([])
  })

  it('shows the no-access state on a 403', async () => {
    mockPackageApi('keen', { 'GET /packages': reply(403), 'GET /entries': reply(403) })

    const wrapper = await mountIntegration(HistoryPage, 'keen', { route: '/keen/history/impex' })
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="keen-filters"]').exists()).toBe(false)
  })
})
