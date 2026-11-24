import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * atrium.css bridges a theme's `--color-*` tokens to Nuxt UI's `--ui-*`
 * variables, light and dark, each falling back to Nuxt UI's default (D-076).
 */

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`.
const here = import.meta.url
const css = readFileSync(fileURLToPath(new URL('../app/assets/css/atrium.css', here)), 'utf8')

function block(selector: string): string {
  const match = css.match(new RegExp(`^${selector.replace('.', '\\.')} \\{([^}]*)\\}`, 'm'))

  expect(match, selector).not.toBeNull()

  return match![1]!
}

describe('atrium.css theme bridge', () => {
  const light = {
    '--ui-bg': ['--color-surface', '--color-white'],
    '--ui-bg-muted': ['--color-surface-alt', '--ui-color-neutral-50'],
    '--ui-bg-elevated': ['--color-surface-alt', '--ui-color-neutral-100'],
    '--ui-text': ['--color-on-surface', '--ui-color-neutral-700'],
    '--ui-text-highlighted': ['--color-on-surface-strong', '--ui-color-neutral-900'],
    '--ui-border': ['--color-outline', '--ui-color-neutral-200'],
    '--ui-border-accented': ['--color-outline-strong', '--ui-color-neutral-300'],
    '--ui-primary': ['--color-primary', '--ui-color-primary-500'],
    '--ui-secondary': ['--color-secondary', '--ui-color-secondary-500'],
    '--ui-info': ['--color-info', '--ui-color-info-500'],
    '--ui-success': ['--color-success', '--ui-color-success-500'],
    '--ui-warning': ['--color-warning', '--ui-color-warning-500'],
    '--ui-error': ['--color-danger', '--ui-color-error-500'],
    '--atrium-canvas': ['--color-canvas', '--ui-color-neutral-50']
  }

  const dark = {
    '--ui-bg': ['--color-surface-dark', '--ui-color-neutral-900'],
    '--ui-bg-muted': ['--color-surface-dark-alt', '--ui-color-neutral-800'],
    '--ui-text': ['--color-on-surface-dark', '--ui-color-neutral-200'],
    '--ui-text-highlighted': ['--color-on-surface-dark-strong', '--color-white'],
    '--ui-border': ['--color-outline-dark', '--ui-color-neutral-800'],
    '--ui-border-accented': ['--color-outline-dark-strong', '--ui-color-neutral-700'],
    '--ui-primary': ['--color-primary-dark', '--ui-color-primary-400'],
    '--ui-error': ['--color-danger-dark', '--ui-color-error-400'],
    '--atrium-canvas': ['--color-canvas-dark', '--ui-color-neutral-950']
  }

  it.each([[':root', light], ['.dark', dark]] as const)('maps the theme tokens in %s, with Nuxt UI\'s defaults as fallbacks', (selector, map) => {
    const declarations = block(selector)

    for (const [variable, [token, fallback]] of Object.entries(map)) {
      const line = declarations.split('\n').find(l => l.trim().startsWith(`${variable}:`))

      expect(line, variable).toBeDefined()
      expect(line, variable).toContain(`var(${token},`)
      expect(line, variable).toContain(`var(${fallback})`)
    }
  })

  it('never falls back to a light surface, text or border token in dark mode', () => {
    const declarations = block('.dark')

    for (const token of ['--color-surface,', '--color-surface-alt', '--color-on-surface,', '--color-outline,', '--color-canvas,']) {
      expect(declarations, token).not.toContain(`var(${token}`)
    }
  })
})
