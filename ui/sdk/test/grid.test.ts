import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { AtriumDashboardGrid } from '#components'
import type { AtriumDashboard, AtriumLayoutWidget } from '../app/types/atrium'
import { atriumLayout } from '../app/utils/atriumLayout'
import { settle } from './support'
import fixture from './fixtures/dashboard.json'

const { api, toast } = vi.hoisted(() => ({
  api: vi.fn(async () => ({ data: {} })),
  toast: { add: vi.fn() }
}))

mockNuxtImport('useAtriumApi', () => () => api)
mockNuxtImport('useToast', () => () => toast)

const dashboard = fixture.data as AtriumDashboard

/** The layout the fixture dashboard is in, as the layout payload sends it. */
const unchanged: AtriumLayoutWidget[] = fixture.data.widgets.map(w => ({
  uuid: w.uuid,
  widget_key: w.key,
  grid_row: w.grid.row,
  grid_column: w.grid.column,
  grid_width: w.grid.width,
  grid_height: w.grid.height,
  settings: {}
}))

async function mountGrid(save = vi.fn(async () => {})) {
  const wrapper = await mountSuspended(AtriumDashboardGrid, { props: { dashboard, editable: true, save } })

  return { wrapper, save }
}

describe('atriumLayout()', () => {
  it('lays placements out on 12 columns, row by row, naming kept ones by uuid', () => {
    expect(atriumLayout(dashboard.widgets ?? [])).toEqual(unchanged)
  })

  it('sends a placement without a uuid as new', () => {
    const [first] = atriumLayout([{ uuid: null, key: 'demo.goals', grid: { row: null, column: null, width: 6, height: 2 }, settings: {} }])

    expect(first).toEqual({ widget_key: 'demo.goals', grid_row: 0, grid_column: 0, grid_width: 6, grid_height: 2, settings: {} })
    expect(first).not.toHaveProperty('uuid')
  })
})

describe('AtriumDashboardGrid', () => {
  beforeEach(() => {
    toast.add.mockReset()
  })

  it('renders a card per placement', async () => {
    const { wrapper } = await mountGrid()

    expect(wrapper.findAll('[data-testid="atrium-widget"]')).toHaveLength(8)
  })

  it('sends the layout payload, with the placement uuids and layout fields, on save', async () => {
    const { wrapper, save } = await mountGrid()

    await wrapper.find('[data-testid="atrium-edit-layout"]').trigger('click')
    await wrapper.find('[data-testid="atrium-save-layout"]').trigger('click')
    await settle()

    expect(save).toHaveBeenCalledExactlyOnceWith(unchanged)
    expect(wrapper.find('[data-testid="atrium-save-layout"]').exists()).toBe(false)
  })

  it('leaves a removed placement out of the payload', async () => {
    const { wrapper, save } = await mountGrid()

    await wrapper.find('[data-testid="atrium-edit-layout"]').trigger('click')
    await wrapper.findAll('[data-testid="atrium-remove-widget"]')[1]!.trigger('click')
    await wrapper.find('[data-testid="atrium-save-layout"]').trigger('click')
    await settle()

    const sent = save.mock.calls[0]![0] as AtriumLayoutWidget[]

    expect(sent.map(w => w.uuid)).not.toContain(fixture.data.widgets[1]!.uuid)
    expect(sent).toHaveLength(7)
  })

  it('stays in edit mode and reports a failed save', async () => {
    const { wrapper } = await mountGrid(vi.fn(async () => { throw new Error('nope') }))

    await wrapper.find('[data-testid="atrium-edit-layout"]').trigger('click')
    await wrapper.find('[data-testid="atrium-save-layout"]').trigger('click')
    await settle()

    expect(wrapper.find('[data-testid="atrium-save-layout"]').exists()).toBe(true)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: 'The layout could not be saved', color: 'error' }))
  })

  it('offers no editing without the update ability', async () => {
    const wrapper = await mountSuspended(AtriumDashboardGrid, { props: { dashboard, editable: false, save: vi.fn() } })

    expect(wrapper.find('[data-testid="atrium-edit-layout"]').exists()).toBe(false)
  })
})
