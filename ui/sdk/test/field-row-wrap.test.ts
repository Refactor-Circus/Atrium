import { afterEach, describe, expect, it, vi } from 'vitest'
import { FIELD_WRAPPED_ATTRIBUTE, settleFieldRow } from '../src/runtime/fieldRows'

/*
 * D-098: a label-less control (`mt-field-label`) that wraps onto a line with
 * no labelled field loses its label offset; one beside a labelled field keeps
 * it. happy-dom has no layout, so each item's box is stubbed: `top` is where
 * it sits, `margin` its top margin (an offset control's 19.6px).
 */
type Box = { cls?: string, top: number, margin?: number, hidden?: boolean }

function row(boxes: Box[]): HTMLElement[] {
  const container = document.createElement('div')

  const items = boxes.map(box => {
    const element = document.createElement('div')

    if (box.cls) {
      element.className = box.cls
    }

    element.style.marginTop = `${box.margin ?? 0}px`
    element.getBoundingClientRect = () => ({ top: box.top } as DOMRect)
    element.getClientRects = () => (box.hidden ? [] : [{}]) as unknown as DOMRectList
    container.append(element)

    return element
  })

  document.body.append(container)
  settleFieldRow(container)

  return items
}

const wrapped = (element: HTMLElement | undefined): boolean => element!.hasAttribute(FIELD_WRAPPED_ATTRIBUTE)

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('wrapped field rows', () => {
  it('keeps the offset of controls on a line with a labelled field', () => {
    const [field, submit, clear] = row([
      { top: 0 },
      { cls: 'mt-field-label', top: 19.6, margin: 19.6 },
      { cls: 'mt-field-label', top: 19.6, margin: 19.6 }
    ])

    expect([field, submit, clear].map(wrapped)).toEqual([false, false, false])
  })

  it('drops the offset of controls that wrapped onto a line of their own', () => {
    const [search, status, submit, clear] = row([
      { top: 0 },
      { top: 0 },
      { cls: 'mt-field-label', top: 80.6, margin: 19.6 },
      { cls: 'mt-field-label', top: 80.6, margin: 19.6 }
    ])

    expect([search, status, submit, clear].map(wrapped)).toEqual([false, false, true, true])
  })

  it('splits a wrapped line from the one above when only some controls wrapped', () => {
    const [field, submit, clear] = row([
      { top: 0 },
      { cls: 'mt-field-label', top: 19.6, margin: 19.6 },
      { cls: 'mt-field-label', top: 80.6, margin: 19.6 }
    ])

    expect([field, submit, clear].map(wrapped)).toEqual([false, false, true])
  })

  it('reads responsive offsets and ignores items that are not rendered', () => {
    const [field, submit] = row([
      { top: 0, hidden: true },
      { cls: 'sm:mt-field-label', top: 50, margin: 0 }
    ])

    expect(wrapped(field!)).toBe(false)
    expect(wrapped(submit!)).toBe(true)
  })

  it('gives a control back its offset once the row is wide enough again', () => {
    const container = document.createElement('div')
    const field = document.createElement('div')
    const submit = document.createElement('div')
    let top = 61

    submit.className = 'mt-field-label'
    submit.setAttribute(FIELD_WRAPPED_ATTRIBUTE, '')
    field.getBoundingClientRect = () => ({ top: 0 } as DOMRect)
    submit.getBoundingClientRect = () => ({ top } as DOMRect)
    field.getClientRects = submit.getClientRects = () => [{}] as unknown as DOMRectList
    submit.style.marginTop = '19.6px'
    container.append(field, submit)
    document.body.append(container)

    top = 19.6
    settleFieldRow(container)

    expect(wrapped(submit)).toBe(false)
  })
})
