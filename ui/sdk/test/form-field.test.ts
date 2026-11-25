import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { atriumUiConfig } from '../vite/ui-config.mjs'
import { UFormField, UInput } from '../src/ui'
import { mountSuspended } from '../src/testing/index'

/*
 * <UFormField> in Atrium's theme (D-095): the label is alone on its row and
 * the hint drops below the control, so a narrow field's hint never runs into
 * its label ("SlugLeave blank…") and fields side by side keep their labels
 * and controls in line, with no change in any module.
 */
describe('the form field theme', () => {
  it('lays the field out as a column whose hint comes last', () => {
    const { slots } = atriumUiConfig.formField as { slots: Record<string, string> }

    expect(slots.root!.split(' ')).toEqual(expect.arrayContaining(['flex', 'flex-col']))
    expect(slots.wrapper).toBe('contents')
    expect(slots.labelWrapper).toBe('contents')
    expect(slots.hint!.split(' ')).toEqual(expect.arrayContaining(['order-last', 'mt-1']))
  })

  it('renders the label and the hint apart, the hint ordered after the control', async () => {
    const wrapper = await mountSuspended(UFormField, {
      props: { label: 'Slug', hint: 'Leave blank to make one from the name.', name: 'slug', class: 'w-44' },
      slots: { default: () => h(UInput as never, { 'data-testid': 'slug' }) }
    })

    const root = wrapper.find('.w-44')
    const label = root.find('label')
    const hint = root.find('[id$="-hint"]')

    expect(root.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col']))
    expect(label.text()).toBe('Slug')
    expect(hint.text()).toBe('Leave blank to make one from the name.')
    expect(label.element.contains(hint.element)).toBe(false)
    // The label row and its wrapper take no box of their own, so the root's
    // column places the label, the control and (last) the hint.
    expect(label.element.parentElement!.classList.contains('contents')).toBe(true)
    expect(label.element.parentElement!.parentElement!.classList.contains('contents')).toBe(true)
    expect(hint.element.parentElement!.classList.contains('contents')).toBe(true)
    expect(hint.classes()).toContain('order-last')
    // Nuxt UI's flex label row (label and hint side by side) is gone.
    expect(label.element.parentElement!.classList.contains('flex')).toBe(false)
    expect(root.find('[data-testid="slug"]').exists()).toBe(true)
  })
})
