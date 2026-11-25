/*
 * Wrapped field rows (D-098). In a row of form fields (D-097) a control with
 * no label of its own takes the field-label offset utility, which drops it by the label row
 * to line up with the fields' controls. When the row wraps (a narrow screen,
 * a long row) and such a control lands on a line with no labelled field, the
 * drop is only a gap: there is no label beside it to line up with.
 *
 * CSS cannot tell which line a flex or grid item wrapped onto, so the app
 * watches the rows: an offset control on a line of offset controls alone
 * gets `data-atrium-field-wrapped`, which Atrium's stylesheet answers with
 * `margin-top: 0`. Wrapping depends on widths only, so dropping the margin
 * never changes which line a control is on. Modules write nothing for it.
 */

export const FIELD_WRAPPED_ATTRIBUTE = 'data-atrium-field-wrapped'

// Assembled, so Atrium's Tailwind build does not see the class and compile it:
// modules compile it from the SDK theme (D-097), and Atrium's class list
// (core-classes.css) would otherwise tell them not to.
const OFFSET = ['mt', 'field', 'label'].join('-')
const OFFSET_CLASS = new RegExp(`(^|:)${OFFSET}$`)

function isOffset(element: Element): boolean {
  for (const name of element.classList) {
    if (OFFSET_CLASS.test(name)) {
      return true
    }
  }

  return false
}

function isRendered(element: Element): boolean {
  return element.getClientRects().length > 0
}

/** Mark the offset controls of one row that sit on a line without a labelled field. */
export function settleFieldRow(row: Element): void {
  const items = [...row.children].filter(isRendered)
  const offset = items.filter(isOffset)

  if (offset.length === 0) {
    return
  }

  offset.forEach(element => element.removeAttribute(FIELD_WRAPPED_ATTRIBUTE))

  // An item's line starts at its top less its own top margin (rows are items-start).
  const placed = items
    .map(element => ({
      element,
      offset: isOffset(element),
      line: element.getBoundingClientRect().top - (Number.parseFloat(getComputedStyle(element).marginTop) || 0)
    }))
    .sort((a, b) => a.line - b.line)

  const lines: (typeof placed)[] = []

  for (const item of placed) {
    const current = lines.at(-1)

    if (current !== undefined && Math.abs(item.line - current[0]!.line) <= 1) {
      current.push(item)
    } else {
      lines.push([item])
    }
  }

  for (const line of lines) {
    if (line.every(item => item.offset)) {
      line.forEach(item => item.element.setAttribute(FIELD_WRAPPED_ATTRIBUTE, ''))
    }
  }
}

/**
 * Keep every field row under `root` settled as it renders, resizes and
 * changes. Returns a function that stops watching.
 */
export function watchFieldRows(root: Element): () => void {
  if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {}
  }

  const watched = new Set<Element>()
  const dirty = new Set<Element>()
  let frame: number | null = null

  const flush = (): void => {
    frame = null

    for (const row of dirty) {
      if (row.isConnected) {
        settleFieldRow(row)
      } else {
        resize.unobserve(row)
        watched.delete(row)
      }
    }

    dirty.clear()
  }

  const schedule = (row: Element): void => {
    dirty.add(row)
    frame ??= requestAnimationFrame(flush)
  }

  const resize = new ResizeObserver(entries => entries.forEach(entry => schedule(entry.target)))

  const scan = (): void => {
    root.querySelectorAll(`[class*="${OFFSET}"]`).forEach(element => {
      const row = element.parentElement

      if (row === null) {
        return
      }

      if (!watched.has(row)) {
        watched.add(row)
        resize.observe(row)
      }

      // A row whose items changed but whose size did not still needs a look.
      schedule(row)
    })
  }

  const mutations = new MutationObserver(scan)

  mutations.observe(root, { childList: true, subtree: true })
  scan()

  return () => {
    mutations.disconnect()
    resize.disconnect()
    watched.clear()
    dirty.clear()

    if (frame !== null) {
      cancelAnimationFrame(frame)
    }
  }
}
