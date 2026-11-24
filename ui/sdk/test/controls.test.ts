import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineComponent, h, ref, type Component } from 'vue'
import { AtriumSelect } from '../src/index'
import { UCheckbox, UInput, UInputNumber, USelect, USelectMenu, USwitch, UTable } from '../src/ui'
import {
  chooseOption,
  fieldValue,
  findField,
  findInput,
  findSelect,
  hasField,
  hasTableRow,
  isChecked,
  isDisabled,
  mountSuspended,
  openSelectLabels,
  pickOption,
  selectItems,
  selectLabels,
  selectValue,
  selectValues,
  setChecked,
  setField,
  setNumber,
  tableCell,
  tableCellText,
  tableColumn,
  tableHeaders,
  tableRow,
  tableRows,
  toggle
} from '../src/testing/index'

/*
 * The shared helpers modules drive Nuxt UI with in their suites (D-093):
 * <UTable> rows by the test id on their first cell, selects (Reka listboxes
 * in a portal) by their items and v-model, checkboxes, switches and number
 * fields as a person uses them.
 */

enableAutoUnmount(afterEach)

const runs = [
  { id: 'run-1', flow: 'orders.sync', status: 'running' },
  { id: 'run-2', flow: 'stock.pull', status: 'failed' }
]

const Table = defineComponent({
  props: { rows: { type: Array, default: () => runs } },
  setup(props) {
    const columns = [
      { accessorKey: 'flow', header: 'Flow', cell: ({ row }: { row: { original: typeof runs[number] } }) => h('span', { 'data-testid': `runs-row-${row.original.id}` }, row.original.flow) },
      { accessorKey: 'status', header: 'Status' }
    ]

    return () => h(UTable as unknown as Component, { data: props.rows as never, columns: columns as never, 'data-testid': 'runs' })
  }
})

describe('<UTable> helpers', () => {
  it('lists the data rows, finds a row by its first cell\'s test id and reads cells by heading', async () => {
    const wrapper = await mountSuspended(Table)

    expect(tableRows(wrapper, 'runs')).toHaveLength(2)
    expect(tableRows(wrapper)).toHaveLength(2)
    expect(tableHeaders(wrapper, 'runs')).toEqual(['Flow', 'Status'])

    const row = tableRow(wrapper, 'runs-row-run-2')
    expect(row.element.tagName).toBe('TR')
    expect(tableCellText(row, 'Status')).toBe('failed')
    expect(tableCellText(row, 'status')).toBe('failed')
    expect(tableCellText(row, 0)).toBe('stock.pull')
    expect(tableCell(row, 'Flow').element.tagName).toBe('TD')
    expect(tableColumn(wrapper, 'runs', 'Status')).toEqual(['running', 'failed'])
    expect(() => tableCell(row, 'Owner')).toThrow('No column "Owner"')
  })

  it('reports a missing row without throwing, and counts no empty-state row', async () => {
    const wrapper = await mountSuspended(Table, { props: { rows: [] } })

    expect(tableRows(wrapper, 'runs')).toEqual([])
    expect(tableRow(wrapper, 'runs-row-run-1').exists()).toBe(false)
    expect(hasTableRow(wrapper, 'runs-row-run-1')).toBe(false)
    expect(() => tableRows(wrapper, 'elsewhere')).toThrow('data-testid "elsewhere"')
  })
})

const statuses = [
  { label: 'Running', value: 'running' },
  { type: 'separator' },
  { label: 'Failed', value: 'failed' }
]

const Selects = defineComponent({
  setup() {
    const status = ref<string | undefined>('running')
    const tag = ref<string | undefined>(undefined)
    const scope = ref<string | null>('')
    const changes: unknown[] = []

    return { status, tag, scope, changes, render: () => h('div', [
      h(USelect as unknown as Component, { 'items': statuses as never, 'modelValue': status.value, 'onUpdate:modelValue': (value: string) => { status.value = value }, 'onChange': (event: Event) => changes.push(event.type), 'data-testid': 'status' }),
      h(USelectMenu as unknown as Component, { 'items': ['alpha', 'beta'], 'modelValue': tag.value, 'onUpdate:modelValue': (value: string) => { tag.value = value }, 'data-testid': 'tag' }),
      h(AtriumSelect as unknown as Component, { 'items': [{ label: 'Team', value: 'team' }], 'blank': 'Global', 'modelValue': scope.value, 'onUpdate:modelValue': (value: string | null) => { scope.value = value }, 'data-testid': 'scope' })
    ]) }
  },
  render() {
    return this.render()
  }
})

describe('select helpers', () => {
  it('reads a <USelect>\'s items (separators left out) and value', async () => {
    const wrapper = await mountSuspended(Selects)

    expect((findSelect(wrapper, 'status').props() as { items: unknown }).items).toBe(statuses)
    expect(selectItems(wrapper, 'status')).toEqual([{ value: 'running', label: 'Running' }, { value: 'failed', label: 'Failed' }])
    expect(selectValues(wrapper, 'status')).toEqual(['running', 'failed'])
    expect(selectLabels(wrapper, 'tag')).toEqual(['alpha', 'beta'])
    expect(selectValue(wrapper, 'status')).toBe('running')
    expect(() => findSelect(wrapper, 'nothing')).toThrow('data-testid "nothing"')
  })

  it('chooses a value through v-model, refusing one the select does not offer', async () => {
    const wrapper = await mountSuspended(Selects)
    const vm = wrapper.vm as unknown as { status: string, tag: string }

    await chooseOption(wrapper, 'status', 'failed')
    expect(vm.status).toBe('failed')
    expect(selectValue(wrapper, 'status')).toBe('failed')

    await chooseOption(wrapper, 'tag', 'beta')
    expect(vm.tag).toBe('beta')

    await expect(chooseOption(wrapper, 'status', 'paused')).rejects.toThrow('offers no "paused"')
  })

  it('opens a <USelect>\'s portal listbox and clicks an option by its label', async () => {
    const wrapper = await mountSuspended(Selects, { attachTo: document.body })
    const vm = wrapper.vm as unknown as { status: string, changes: string[] }

    expect(await openSelectLabels(wrapper, 'status')).toEqual(['Running', 'Failed'])

    await pickOption(wrapper, 'status', 'Failed')
    expect(vm.status).toBe('failed')
    expect(vm.changes).toContain('change')

    await expect(pickOption(wrapper, 'status', 'Paused')).rejects.toThrow('no option "Paused"')
  })

  it('opens a <USelectMenu> and clicks an option by its label', async () => {
    const wrapper = await mountSuspended(Selects, { attachTo: document.body })
    const vm = wrapper.vm as unknown as { tag: string }

    await pickOption(wrapper, 'tag', 'beta')
    expect(vm.tag).toBe('beta')
  })
})

describe('<AtriumSelect>', () => {
  it('offers its blank item first and keeps \'\' in the model for it', async () => {
    const wrapper = await mountSuspended(Selects)
    const vm = wrapper.vm as unknown as { scope: string | null }

    expect(selectItems(wrapper, 'scope')).toEqual([{ value: '', label: 'Global' }, { value: 'team', label: 'Team' }])
    expect(selectValue(wrapper, 'scope')).toBe('')
    expect(wrapper.find('[data-testid="scope"]').text()).toContain('Global')

    await chooseOption(wrapper, 'scope', 'team')
    expect(vm.scope).toBe('team')

    await chooseOption(wrapper, 'scope', '')
    expect(vm.scope).toBe('')
  })

  it('never hands <USelect> an empty value, and picks the blank item by its label', async () => {
    const wrapper = await mountSuspended(Selects, { attachTo: document.body })
    const vm = wrapper.vm as unknown as { scope: string | null }
    const inner = wrapper.findComponent(AtriumSelect as unknown as Component).findComponent(USelect as unknown as Component)

    const inner_ = inner.props() as { items: { value: unknown }[], modelValue: unknown }

    expect(inner_.items.map(item => item.value)).not.toContain('')
    expect(inner_.modelValue).not.toBe('')

    await pickOption(wrapper, 'scope', 'Team')
    expect(vm.scope).toBe('team')

    await pickOption(wrapper, 'scope', 'Global')
    expect(vm.scope).toBe('')
  })

  it('stands for null with blank-value null, and offers no blank item without `blank`', async () => {
    const values: unknown[] = []
    const wrapper = await mountSuspended(defineComponent({
      setup: () => () => h('div', [
        h(AtriumSelect as unknown as Component, { 'items': ['a', 'b'], 'blank': 'Any', 'blankValue': null, 'modelValue': null, 'onUpdate:modelValue': (value: unknown) => values.push(value), 'data-testid': 'any' }),
        h(AtriumSelect as unknown as Component, { 'items': ['a', 'b'], 'modelValue': 'a', 'data-testid': 'plain' })
      ])
    }))

    expect(selectValues(wrapper, 'any')).toEqual([null, 'a', 'b'])
    await chooseOption(wrapper, 'any', null)
    await chooseOption(wrapper, 'any', 'b')
    expect(values).toEqual([null, 'b'])
    expect(selectValues(wrapper, 'plain')).toEqual(['a', 'b'])
  })
})

const Fields = defineComponent({
  setup() {
    const agree = ref(false)
    const live = ref(true)
    const limit = ref<number | null>(5)
    const name = ref('Ada')

    return { agree, live, limit, name, render: () => h('div', [
      h(UCheckbox as unknown as Component, { 'modelValue': agree.value, 'onUpdate:modelValue': (value: boolean) => { agree.value = value }, 'label': 'Agree', 'data-testid': 'agree' }),
      h(USwitch as unknown as Component, { 'modelValue': live.value, 'onUpdate:modelValue': (value: boolean) => { live.value = value }, 'data-testid': 'live' }),
      h(UInputNumber as unknown as Component, { 'modelValue': limit.value, 'onUpdate:modelValue': (value: number | null) => { limit.value = value }, 'data-testid': 'limit' }),
      h(UInput as unknown as Component, { 'modelValue': name.value, 'onUpdate:modelValue': (value: string) => { name.value = value }, 'disabled': true, 'data-testid': 'name' })
    ]) }
  },
  render() {
    return this.render()
  }
})

describe('checkbox, switch, number and field helpers', () => {
  it('reads and toggles a <UCheckbox> and a <USwitch>', async () => {
    const wrapper = await mountSuspended(Fields)
    const vm = wrapper.vm as unknown as { agree: boolean, live: boolean }

    expect(isChecked(wrapper, 'agree')).toBe(false)
    expect(isChecked(wrapper, 'live')).toBe(true)

    await toggle(wrapper, 'agree')
    expect(vm.agree).toBe(true)
    expect(isChecked(wrapper, 'agree')).toBe(true)

    await setChecked(wrapper, 'live', true)
    expect(vm.live).toBe(true)
    await setChecked(wrapper, 'live', false)
    expect(vm.live).toBe(false)
  })

  it('types a number into a <UInputNumber> and commits it', async () => {
    const wrapper = await mountSuspended(Fields)
    const vm = wrapper.vm as unknown as { limit: number | null }

    expect(findInput(wrapper, 'limit').element.tagName).toBe('INPUT')

    await setNumber(wrapper, 'limit', 42)
    expect(vm.limit).toBe(42)
  })

  it('finds any Nuxt UI field by its test id and sets it through v-model', async () => {
    const wrapper = await mountSuspended(Fields)
    const vm = wrapper.vm as unknown as { name: string, limit: number }

    expect(findField(wrapper, 'limit').exists()).toBe(true)
    expect(hasField(wrapper, 'name')).toBe(true)
    expect(hasField(wrapper, 'missing')).toBe(false)
    expect(fieldValue(wrapper, 'name')).toBe('Ada')
    expect(isDisabled(wrapper, 'name')).toBe(true)
    expect(isDisabled(wrapper, 'limit')).toBe(false)

    await setField(wrapper, 'name', 'Grace')
    expect(vm.name).toBe('Grace')
    await setField(wrapper, 'limit', 7)
    expect(fieldValue(wrapper, 'limit')).toBe(7)
  })
})
