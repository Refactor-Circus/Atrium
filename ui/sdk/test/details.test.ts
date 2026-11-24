import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { AtriumDetails } from '../src/index'
import { mountSuspended } from '../src/testing/index'

/*
 * <AtriumDetails> (D-093): a record's facts as a description list, with a
 * per-item slot, links, monospaced values and a placeholder for no value.
 */

const items = [
  { key: 'id', label: 'ID', value: 'run-1', mono: true },
  { key: 'trigger', label: 'Trigger', value: 'api' },
  { key: 'parent', label: 'Parent', value: 'run-0', href: '/impex/runs/run-0' },
  { key: 'finished', label: 'Finished', value: null },
  { key: 'tags', label: 'Tags', wide: true },
  { label: 'Attempts', value: 3, testid: 'run-attempts' }
]

describe('<AtriumDetails>', () => {
  it('lists each label and its value, with a test id per value', async () => {
    const wrapper = await mountSuspended(AtriumDetails, { props: { items } })

    expect(wrapper.element.tagName).toBe('DL')
    expect(wrapper.findAll('dt').map(dt => dt.text())).toEqual(['ID', 'Trigger', 'Parent', 'Finished', 'Tags', 'Attempts'])
    expect(wrapper.find('[data-testid="atrium-details-trigger"]').text()).toBe('api')
    expect(wrapper.find('[data-testid="run-attempts"]').text()).toBe('3')
    expect(wrapper.find('[data-testid="atrium-details-id"]').classes()).toContain('atrium-mono')
  })

  it('links a value with href and shows the placeholder for no value', async () => {
    const wrapper = await mountSuspended(AtriumDetails, { props: { items, empty: 'none' } })

    expect(wrapper.find('[data-testid="atrium-details-parent"] a').attributes('href')).toBe('/impex/runs/run-0')
    expect(wrapper.find('[data-testid="atrium-details-finished"]').text()).toBe('none')
    expect(wrapper.find('[data-testid="atrium-details-tags"]').text()).toBe('none')
  })

  it('renders an item\'s slot in place of its value', async () => {
    const wrapper = await mountSuspended(AtriumDetails, {
      props: { items },
      slots: { tags: ({ item }: { item: { label: string } }) => h('span', { 'data-testid': 'tag' }, `${item.label}: nightly`) }
    })

    expect(wrapper.find('[data-testid="atrium-details-tags"] [data-testid="tag"]').text()).toBe('Tags: nightly')
  })

  it('stacks labels over values in a grid with columns, a wide item spanning it', async () => {
    const wrapper = await mountSuspended(AtriumDetails, { props: { items, columns: 2 }, attrs: { 'data-testid': 'impex-run-details' } })

    expect(wrapper.attributes('data-testid')).toBe('impex-run-details')
    expect(wrapper.classes()).toContain('sm:grid-cols-2')
    expect(wrapper.findAll('dl > div')).toHaveLength(6)
    expect(wrapper.find('[data-testid="atrium-details-tags"]').element.parentElement!.className).toContain('sm:col-span-full')
  })
})
