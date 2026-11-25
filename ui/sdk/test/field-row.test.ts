import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { atriumUiConfig } from '../vite/ui-config.mjs'

/*
 * The field-row tokens (D-097) are the SDK's: theme.css, which Atrium's
 * stylesheet and every module's (module.css) import, defines
 * `--spacing-field-label` (a form field's label row) and `--spacing-field`
 * (a control's height), so `mt-field-label` and `h-field` mean the same on
 * the page and in every module, and no module ships a token of its own.
 */

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`.
const here = import.meta.url
const read = (path: string): string => readFileSync(fileURLToPath(new URL(path, here)), 'utf8')
const theme = read('../css/theme.css')
const moduleCss = read('../css/module.css')
const app = read('../../app/src/assets/atrium.css')

function token(name: string): string {
  const match = theme.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm'))

  expect(match, name).not.toBeNull()

  return match![1]!.trim()
}

function rem(value: string): number {
  const match = value.match(/^([\d.]+)rem$/)

  expect(match, value).not.toBeNull()

  return Number(match![1])
}

describe('the field-row tokens', () => {
  it('are in the SDK theme, which Atrium\'s stylesheet and module.css both import', () => {
    expect(theme).toMatch(/@theme inline \{[^}]*--spacing-field-label: calc\(var\(--text-xs--line-height\) \+ var\(--spacing\)\);/)
    expect(theme).toMatch(/@theme inline \{[^}]*--spacing-field: calc\(var\(--text-sm--line-height\) \+ var\(--spacing\) \* 2\);/)
    expect(moduleCss).toContain('@import "./theme.css";')
    expect(app).toContain('@import "@refactor-circus/atrium/theme.css";')
  })

  it('derive from the form field and control the Nuxt UI theme lays out', () => {
    const { slots } = atriumUiConfig.formField as { slots: Record<string, string> }
    const input = atriumUiConfig.input as { variants: { size: { md: { base: string } } } }

    // The label row: the label's text-xs line, then the control's mt-1 (one --spacing).
    expect(slots.label!.split(' ')).toContain('text-xs')
    expect(slots.container!.split(' ')).toContain('mt-1')
    // A control: one text-sm line between py-1 (one --spacing above and below).
    expect(input.variants.size.md.base.split(' ')).toEqual(expect.arrayContaining(['py-1', 'text-sm']))

    const spacing = rem(token('--spacing'))

    // 19.6px and 27.2px at a 16px root.
    expect(rem(token('--text-xs--line-height')) + spacing).toBeCloseTo(1.225, 6)
    expect(rem(token('--text-sm--line-height')) + spacing * 2).toBeCloseTo(1.7, 6)
  })
})
