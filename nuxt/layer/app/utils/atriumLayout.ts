import type { AtriumGrid, AtriumLayoutWidget } from '../types/atrium'

/** What the layout payload needs of a placement, kept or new. */
export interface AtriumLayoutPlacement {
  uuid?: string | null
  key: string
  grid: AtriumGrid
  settings: Record<string, unknown>
}

export const ATRIUM_GRID_COLUMNS = 12

/**
 * The layout payload for placements in display order: each goes on the
 * current row at the next free column, and onto a new row when it no longer
 * fits the 12 columns. A placement with a uuid keeps it; one without is new.
 */
export function atriumLayout(placements: AtriumLayoutPlacement[]): AtriumLayoutWidget[] {
  let row = 0
  let column = 0

  return placements.map((placement) => {
    const width = atriumWidth(placement.grid)
    const height = atriumHeight(placement.grid)

    if (column > 0 && column + width > ATRIUM_GRID_COLUMNS) {
      row++
      column = 0
    }

    const widget: AtriumLayoutWidget = {
      ...(placement.uuid ? { uuid: placement.uuid } : {}),
      widget_key: placement.key,
      grid_row: row,
      grid_column: column,
      grid_width: width,
      grid_height: height,
      settings: placement.settings
    }

    column += width

    return widget
  })
}

/** Placements in reading order: by row, then column. */
export function atriumOrdered<T extends { grid: AtriumGrid }>(placements: T[]): T[] {
  return [...placements].sort((a, b) =>
    (a.grid.row ?? 0) - (b.grid.row ?? 0) || (a.grid.column ?? 0) - (b.grid.column ?? 0))
}

export function atriumWidth(grid: AtriumGrid): number {
  return Math.min(ATRIUM_GRID_COLUMNS, Math.max(1, grid.width ?? 4))
}

export function atriumHeight(grid: AtriumGrid): number {
  return Math.max(1, grid.height ?? 2)
}
