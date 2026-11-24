/*
 * Driving Nuxt UI in a module's Vitest suite (D-093). Modules compose Nuxt UI
 * (D-091), whose fields are not native elements: a <USelect> is a Reka
 * listbox rendered in a portal only while open, <UCheckbox> and <USwitch>
 * are `role="checkbox"` / `role="switch"` buttons, <UInputNumber> commits on
 * blur, and a <UTable> row carries no attributes of its own. These read and
 * drive them by `data-testid`, as the page's tests select everything.
 *
 * The <UTable> row convention: `UTable` (4.1) puts no attribute on a `<tr>`,
 * so a page puts the row's test id on its first cell's content
 * (`<ULink :data-testid="`runs-row-${row.original.id}`">` in `#flow-cell`),
 * and `tableRow(wrapper, 'runs-row-1')` finds the row holding it.
 */
import { DOMWrapper, type VueWrapper } from '@vue/test-utils'
import USelect from '@nuxt/ui/components/Select.vue'
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import UInputMenu from '@nuxt/ui/components/InputMenu.vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import USwitch from '@nuxt/ui/components/Switch.vue'
import UTextarea from '@nuxt/ui/components/Textarea.vue'
import AtriumSelect from '../components/AtriumSelect.vue'
import { settle } from './app'

/** Where a helper looks: a mounted wrapper or an element in it. */
export type AtriumTestRoot = VueWrapper | DOMWrapper<Element>

/** `[data-testid="…"]`. */
export function byTestId(testid: string): string {
  return `[data-testid="${testid.replaceAll('"', '\\"')}"]`
}

function required(root: AtriumTestRoot, testid: string, what: string): DOMWrapper<Element> {
  const found = root.find(byTestId(testid))

  if (!found.exists()) {
    throw new Error(`No ${what} with data-testid "${testid}"`)
  }

  return found as DOMWrapper<Element>
}

// --- <UTable> ---------------------------------------------------------------

/** The `<table>` of the <UTable> marked `testid` (or the first one under `root`). */
function tableOf(root: AtriumTestRoot, testid?: string): HTMLTableElement {
  const scope = testid === undefined ? root : required(root, testid, '<UTable>')
  const element = scope.element as Element
  const table = element.matches('table') ? element : element.querySelector('table')

  if (!table) {
    throw new Error(testid === undefined ? 'No <UTable> here' : `No <table> under data-testid "${testid}"`)
  }

  return table as HTMLTableElement
}

/**
 * The data rows of the <UTable> marked `testid` (or the first table under
 * `root`), in order: not its empty or loading row, nor an expanded row's.
 */
export function tableRows(root: AtriumTestRoot, testid?: string): DOMWrapper<HTMLTableRowElement>[] {
  const table = tableOf(root, testid)

  return [...table.tBodies]
    .flatMap(body => [...body.querySelectorAll<HTMLTableRowElement>(':scope > tr')])
    .filter(row => row.hasAttribute('data-selected'))
    .map(row => new DOMWrapper(row))
}

/**
 * The <UTable> row holding the element marked `testid` (the page marks each
 * row's first cell). When nothing holds it, a wrapper whose `exists()` is
 * false, so `expect(tableRow(w, 'x').exists()).toBe(false)` reads well.
 */
export function tableRow(root: AtriumTestRoot, testid: string): DOMWrapper<HTMLTableRowElement> {
  const marker = root.find(byTestId(testid))

  if (!marker.exists()) {
    return marker as unknown as DOMWrapper<HTMLTableRowElement>
  }

  const row = marker.element.closest('tr')

  if (!row) {
    throw new Error(`data-testid "${testid}" is not inside a table row`)
  }

  return new DOMWrapper(row)
}

/** Whether a row holding the element marked `testid` is on the page. */
export function hasTableRow(root: AtriumTestRoot, testid: string): boolean {
  return tableRow(root, testid).exists()
}

/** The column headings of the <UTable> marked `testid` (or the first under `root`), as text. */
export function tableHeaders(root: AtriumTestRoot, testid?: string): string[] {
  const head = tableOf(root, testid).tHead

  return head ? [...head.querySelectorAll('tr:first-child > th')].map(th => th.textContent?.trim() ?? '') : []
}

/**
 * A row's cell in `column`: its heading's text (as shown, case-insensitive)
 * or its index.
 */
export function tableCell(row: DOMWrapper<HTMLTableRowElement>, column: string | number): DOMWrapper<HTMLTableCellElement> {
  const element = row.element as HTMLTableRowElement
  let index = column

  if (typeof column === 'string') {
    const table = element.closest('table')
    const headers = table ? tableHeaders(new DOMWrapper(table)) : []

    index = headers.findIndex(header => header.toLowerCase() === column.toLowerCase())

    if (index === -1) {
      throw new Error(`No column "${column}"; the table has ${JSON.stringify(headers)}`)
    }
  }

  const cell = element.querySelectorAll<HTMLTableCellElement>(':scope > td, :scope > th')[index as number]

  if (!cell) {
    throw new Error(`The row has no cell ${String(column)}`)
  }

  return new DOMWrapper(cell)
}

/** A row's text in `column` (a heading or an index), trimmed. */
export function tableCellText(row: DOMWrapper<HTMLTableRowElement>, column: string | number): string {
  return tableCell(row, column).text().trim()
}

/** Every data row's text in `column` of the <UTable> marked `testid`. */
export function tableColumn(root: AtriumTestRoot, testid: string, column: string | number): string[] {
  return tableRows(root, testid).map(row => tableCellText(row, column))
}

// --- <USelect>, <USelectMenu>, <AtriumSelect> ---------------------------------

/** A select's item, as `{ value, label }` (a plain value stands for both). */
export interface AtriumSelectOption {
  value: unknown
  label: string
}

type SelectProps = {
  items?: unknown[]
  modelValue?: unknown
  valueKey?: string
  labelKey?: string
  blank?: string | null
  blankValue?: '' | null
}

function marks(candidate: VueWrapper, selector: string): boolean {
  const element = candidate.element as Node

  return (element instanceof Element && element.matches(selector)) || candidate.find(selector).exists()
}

type SelectKind = 'atrium' | 'select' | 'menu'

const SELECTS: [SelectKind, unknown][] = [['atrium', AtriumSelect], ['select', USelect], ['menu', USelectMenu]]

function locate(wrapper: VueWrapper, testid: string): { select: VueWrapper, kind: SelectKind } {
  const selector = byTestId(testid)

  for (const [kind, component] of SELECTS) {
    const found = wrapper.findAllComponents(component as never).find(candidate => marks(candidate as VueWrapper, selector))

    if (found) {
      return { select: found as VueWrapper, kind }
    }
  }

  throw new Error(`No <USelect>, <USelectMenu> or <AtriumSelect> with data-testid "${testid}"`)
}

/**
 * The <AtriumSelect>, <USelect> or <USelectMenu> marked `testid` (on
 * <USelect> the test id lands on its trigger, on <USelectMenu> on its root).
 * An <AtriumSelect> wins over the <USelect> inside it.
 */
export function findSelect(wrapper: VueWrapper, testid: string): VueWrapper {
  return locate(wrapper, testid).select
}

/** What the select marked `testid` offers, groups flattened, labels and separators left out. */
export function selectItems(wrapper: VueWrapper, testid: string): AtriumSelectOption[] {
  const { select, kind } = locate(wrapper, testid)
  const props = select.props() as SelectProps
  const valueKey = props.valueKey ?? 'value'
  const labelKey = props.labelKey ?? 'label'

  const items = (props.items ?? []).flat().flatMap((item): AtriumSelectOption[] => {
    if (typeof item !== 'object' || item === null) {
      return [{ value: item, label: String(item) }]
    }

    const record = item as Record<string, unknown>

    if (record.type === 'label' || record.type === 'separator') {
      return []
    }

    return [{ value: record[valueKey], label: String(record[labelKey] ?? record[valueKey] ?? '') }]
  })

  if (kind === 'atrium' && props.blank !== null && props.blank !== undefined) {
    return [{ value: props.blankValue === null ? null : '', label: props.blank }, ...items]
  }

  return items
}

/** The values the select marked `testid` offers. */
export function selectValues(wrapper: VueWrapper, testid: string): unknown[] {
  return selectItems(wrapper, testid).map(item => item.value)
}

/** The labels the select marked `testid` offers. */
export function selectLabels(wrapper: VueWrapper, testid: string): string[] {
  return selectItems(wrapper, testid).map(item => item.label)
}

/** The value the select marked `testid` holds (its `modelValue`). */
export function selectValue(wrapper: VueWrapper, testid: string): unknown {
  return (findSelect(wrapper, testid).props() as SelectProps).modelValue
}

/**
 * Chooses `value` (an array for a `multiple` select) in the select marked
 * `testid`, as choosing its item does: the component emits
 * `update:modelValue`, so `v-model` and listeners see it. Fails when the
 * select does not offer the value. The quick, robust way; `pickOption()`
 * opens the list and clicks instead.
 */
export async function chooseOption(wrapper: VueWrapper, testid: string, value: unknown): Promise<void> {
  const offered = selectValues(wrapper, testid)

  for (const one of Array.isArray(value) ? value : [value]) {
    if (!offered.some(candidate => candidate === one)) {
      throw new Error(`The select "${testid}" offers no ${JSON.stringify(one)}; it offers ${JSON.stringify(offered)}`)
    }
  }

  findSelect(wrapper, testid).vm.$emit('update:modelValue', value)
  await settle()
}

/** The open listbox's options, rendered in a portal on `document.body`. */
function openOptions(): HTMLElement[] {
  return [...document.body.querySelectorAll<HTMLElement>('[role="listbox"] [role="option"]')]
}

async function open(wrapper: VueWrapper, testid: string): Promise<HTMLElement[]> {
  const { select, kind } = locate(wrapper, testid)
  const marked = select.find(byTestId(testid))
  const root = marked.exists() ? marked.element : select.element as Element
  const trigger = root.matches('button, [role="combobox"]') ? root : root.querySelector('button, [role="combobox"]') ?? root

  if (kind === 'menu') {
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  } else {
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
  }

  await settle()

  return openOptions()
}

/** Closes an open listbox with Escape. */
async function close(): Promise<void> {
  const listbox = document.body.querySelector('[role="listbox"]')

  listbox?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settle()
}

/**
 * The labels the open list of the select marked `testid` shows: opens it
 * (the portal), reads its options and closes it again.
 */
export async function openSelectLabels(wrapper: VueWrapper, testid: string): Promise<string[]> {
  const labels = (await open(wrapper, testid)).map(option => option.textContent?.trim() ?? '')

  await close()

  return labels
}

/**
 * Opens the select marked `testid` and clicks the option labelled `label`,
 * as a person does: the end-to-end way, through Reka's portal-rendered
 * listbox (<USelect> opens on pointerdown and picks on pointerup,
 * <USelectMenu> on click). Fails when no option has that label.
 */
export async function pickOption(wrapper: VueWrapper, testid: string, label: string): Promise<void> {
  const options = await open(wrapper, testid)
  const option = options.find(candidate => candidate.textContent?.trim() === label)

  if (!option) {
    await close()
    throw new Error(`The select "${testid}" shows no option "${label}"; it shows ${JSON.stringify(options.map(candidate => candidate.textContent?.trim()))}`)
  }

  option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }))
  option.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await settle()
}

// --- <UCheckbox>, <USwitch>, inputs ---------------------------------------------

/** The `role="checkbox"` / `role="switch"` button marked `testid` (or inside it). */
function checkable(root: AtriumTestRoot, testid: string): DOMWrapper<Element> {
  const found = required(root, testid, '<UCheckbox> or <USwitch>')

  return found.element.matches('[role="checkbox"], [role="switch"]')
    ? found
    : found.find('[role="checkbox"], [role="switch"]') as DOMWrapper<Element>
}

/** Whether the <UCheckbox> or <USwitch> marked `testid` is on (`'indeterminate'` for a mixed checkbox). */
export function isChecked(root: AtriumTestRoot, testid: string): boolean | 'indeterminate' {
  const state = checkable(root, testid).attributes('aria-checked')

  return state === 'mixed' ? 'indeterminate' : state === 'true'
}

/** Clicks the <UCheckbox> or <USwitch> marked `testid`. */
export async function toggle(root: AtriumTestRoot, testid: string): Promise<void> {
  await checkable(root, testid).trigger('click')
  await settle()
}

/** Turns the <UCheckbox> or <USwitch> marked `testid` on or off, clicking it only when it differs. */
export async function setChecked(root: AtriumTestRoot, testid: string, on: boolean): Promise<void> {
  if (isChecked(root, testid) !== on) {
    await toggle(root, testid)
  }
}

/** The `<input>` / `<textarea>` marked `testid`: the element itself, or the one Nuxt UI wraps. */
export function findInput(root: AtriumTestRoot, testid: string): DOMWrapper<HTMLInputElement> {
  const found = required(root, testid, 'field')

  return (found.element.matches('input, textarea, select') ? found : found.find('input, textarea, select')) as DOMWrapper<HTMLInputElement>
}

/**
 * Types `value` into the <UInputNumber> marked `testid` and commits it (on
 * blur, as the field does), so its `update:modelValue` carries the number.
 */
export async function setNumber(root: AtriumTestRoot, testid: string, value: number | string): Promise<void> {
  const input = findInput(root, testid)

  await input.setValue(String(value))
  await input.trigger('blur')
  await settle()
}

// --- Any Nuxt UI field, through its v-model ------------------------------------

const FIELDS = [AtriumSelect, USelect, USelectMenu, UInputMenu, UCheckbox, USwitch, UInputNumber, URadioGroup, UInput, UTextarea]

/**
 * The Nuxt UI field (or <AtriumSelect>) given `data-testid="{testid}"`:
 * <USelect>, <USelectMenu>, <UInputMenu>, <UCheckbox>, <USwitch>,
 * <UInputNumber>, <URadioGroup>, <UInput> or <UTextarea>, found by the
 * attribute it was given wherever Nuxt UI renders it.
 */
export function findField(wrapper: VueWrapper, testid: string): VueWrapper {
  for (const component of FIELDS) {
    const found = wrapper.findAllComponents(component as never).find(candidate => (candidate as VueWrapper).vm.$attrs['data-testid'] === testid)

    if (found) {
      return found as VueWrapper
    }
  }

  throw new Error(`No Nuxt UI field with data-testid "${testid}"`)
}

/** Whether a Nuxt UI field marked `testid` is rendered. */
export function hasField(wrapper: VueWrapper, testid: string): boolean {
  try {
    findField(wrapper, testid)

    return true
  } catch {
    return false
  }
}

/** The value the field marked `testid` holds (its `modelValue`). */
export function fieldValue(wrapper: VueWrapper, testid: string): unknown {
  return (findField(wrapper, testid).props() as { modelValue?: unknown }).modelValue
}

/** Whether the field marked `testid` is disabled. */
export function isDisabled(wrapper: VueWrapper, testid: string): boolean {
  return (findField(wrapper, testid).props() as { disabled?: unknown }).disabled === true
}

/**
 * Sets the field marked `testid` through its `v-model`, as using it does:
 * the field emits `update:modelValue` with `value` (unchecked; for a
 * select, `chooseOption()` checks the value is offered).
 */
export async function setField(wrapper: VueWrapper, testid: string, value: unknown): Promise<void> {
  findField(wrapper, testid).vm.$emit('update:modelValue', value)
  await settle()
}
