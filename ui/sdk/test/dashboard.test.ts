import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AtriumDashboardResponse, AtriumLayoutWidget } from '../src/types/atrium'
import fixture from './fixtures/dashboard.json'
import { useAtriumDashboard } from '../src/index'
import { clearAtriumData, httpError, mockAtriumApi, settle, withSetup } from '../src/testing/index'

const { api, toast } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: { method?: string, body?: unknown, query?: unknown }) => Promise<unknown>>(),
  toast: { add: vi.fn() }
}))

mockAtriumApi(api)
vi.mock('@nuxt/ui/composables/useToast.js', () => ({ useToast: () => toast }))

function dashboard(version = 3): AtriumDashboardResponse {
  const response = structuredClone(fixture) as AtriumDashboardResponse

  response.data!.version = version

  return response
}

const layout: AtriumLayoutWidget[] = [
  { uuid: '019ab000-0000-7000-8000-000000000001', widget_key: 'demo.revenue', grid_row: 0, grid_column: 0, grid_width: 6, grid_height: 1, settings: {} },
  { widget_key: 'demo.goals', grid_row: 0, grid_column: 6, grid_width: 6, grid_height: 2, settings: {} }
]

const calls = (method: string, path: string) =>
  api.mock.calls.filter(([p, options]) => p === path && (options?.method ?? 'GET') === method)

describe('useAtriumDashboard()', () => {
  beforeEach(() => {
    clearAtriumData()
    api.mockReset()
    toast.add.mockReset()
  })

  it('creates the first dashboard with POST dashboards when the user has none, then loads it', async () => {
    let created = false

    api.mockImplementation(async (path, options) => {
      if (path === '/dashboards' && options?.method === 'POST') {
        created = true
        return { data: dashboard().data }
      }

      if (path === '/dashboard') {
        return created ? dashboard() : { data: null }
      }

      return { data: [] }
    })

    const { dashboard: current } = await withSetup(() => useAtriumDashboard(undefined))
    await settle()

    expect(calls('POST', '/dashboards')).toEqual([['/dashboards', { method: 'POST', body: { name: 'Dashboard' } }]])
    expect(calls('GET', '/dashboard')).toHaveLength(2)
    expect(current.value?.slug).toBe('overview')
  })

  it('creates nothing when the user already has a dashboard', async () => {
    api.mockImplementation(async path => path === '/dashboard' ? dashboard() : { data: [] })

    await withSetup(() => useAtriumDashboard(undefined))
    await settle()

    expect(calls('POST', '/dashboards')).toEqual([])
  })

  it('loads a dashboard by slug, with its abilities from meta', async () => {
    api.mockImplementation(async path => path === '/dashboards/overview' ? dashboard() : { data: [] })

    const { dashboard: current, abilities } = await withSetup(() => useAtriumDashboard('overview'))
    await settle()

    expect(current.value?.widgets).toHaveLength(8)
    expect(abilities.value).toEqual({ update: true, delete: true })
  })

  it('saves the layout with the version it loaded, and takes the dashboard the server returns', async () => {
    api.mockImplementation(async (path, options) => {
      if (path === '/dashboards/overview/layout') return dashboard(4)
      if (path === '/dashboards/overview') return dashboard(3)
      return { data: [] }
    })

    const { dashboard: current, saveLayout } = await withSetup(() => useAtriumDashboard('overview'))
    await settle()
    await saveLayout(layout)

    expect(calls('PUT', '/dashboards/overview/layout')).toEqual([
      ['/dashboards/overview/layout', { method: 'PUT', body: { version: 3, widgets: layout } }]
    ])
    expect(current.value?.version).toBe(4)
  })

  it('on a 409 reloads the dashboard and tells the user, instead of failing', async () => {
    let loads = 0

    api.mockImplementation(async (path) => {
      if (path === '/dashboards/overview/layout') throw httpError(409)
      if (path === '/dashboards/overview') return dashboard(3 + loads++)
      return { data: [] }
    })

    const { dashboard: current, saveLayout } = await withSetup(() => useAtriumDashboard('overview'))
    await settle()

    await expect(saveLayout(layout)).resolves.toBeUndefined()
    await settle()

    expect(calls('GET', '/dashboards/overview')).toHaveLength(2)
    expect(current.value?.version).toBe(4)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
      title: 'This dashboard was changed elsewhere and has been reloaded. Your edits were not saved.'
    }))
  })

  it('rethrows other failures for the caller to report', async () => {
    api.mockImplementation(async (path) => {
      if (path === '/dashboards/overview/layout') throw httpError(422)
      if (path === '/dashboards/overview') return dashboard()
      return { data: [] }
    })

    const { saveLayout } = await withSetup(() => useAtriumDashboard('overview'))
    await settle()

    await expect(saveLayout(layout)).rejects.toMatchObject({ status: 422 })
  })

  it('renames with the version it loaded, and reloads on a 409', async () => {
    let loads = 0

    api.mockImplementation(async (path, options) => {
      if (path === '/dashboards/overview' && options?.method === 'PUT') throw httpError(409)
      if (path === '/dashboards/overview') return dashboard(3 + loads++)
      return { data: [] }
    })

    const { rename } = await withSetup(() => useAtriumDashboard('overview'))
    await settle()
    await rename('Sales')

    expect(calls('PUT', '/dashboards/overview')).toEqual([
      ['/dashboards/overview', { method: 'PUT', body: { name: 'Sales', version: 3 } }]
    ])
    expect(calls('GET', '/dashboards/overview')).toHaveLength(2)
  })
})
