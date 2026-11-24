import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * atrium.css bridges a theme's tokens to Nuxt UI's `--ui-*` variables, light
 * and dark, each falling back to the deck's own default (D-076, D-077). The
 * tokens arrive as `--color-*` and useAtriumTheme() mirrors each as
 * `--atrium-token-*`, which is what the bridge reads.
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
    '--ui-bg': ['--atrium-token-surface', '#'],
    '--ui-bg-muted': ['--atrium-token-surface-alt', '#'],
    '--ui-bg-elevated': ['--atrium-token-surface-alt', '#'],
    '--ui-text': ['--atrium-token-on-surface', '#'],
    '--ui-text-highlighted': ['--atrium-token-on-surface-strong', '#'],
    '--ui-border': ['--atrium-token-outline', '#'],
    '--ui-border-accented': ['--atrium-token-outline-strong', '#'],
    '--ui-primary': ['--atrium-token-primary', 'var(--ui-color-primary-600)'],
    '--ui-secondary': ['--atrium-token-secondary', 'var(--ui-color-secondary-500)'],
    '--ui-info': ['--atrium-token-info', 'var(--ui-color-info-600)'],
    '--ui-success': ['--atrium-token-success', 'var(--ui-color-success-600)'],
    '--ui-warning': ['--atrium-token-warning', 'var(--ui-color-warning-600)'],
    '--ui-error': ['--atrium-token-danger', 'var(--ui-color-error-600)'],
    '--ui-radius': ['--atrium-token-radius', '0.25rem'],
    '--atrium-canvas': ['--atrium-token-canvas', '#']
  }

  const dark = {
    '--ui-bg': ['--atrium-token-surface-dark', '#'],
    '--ui-bg-muted': ['--atrium-token-surface-dark-alt', '#'],
    '--ui-text': ['--atrium-token-on-surface-dark', '#'],
    '--ui-text-highlighted': ['--atrium-token-on-surface-dark-strong', '#'],
    '--ui-border': ['--atrium-token-outline-dark', '#'],
    '--ui-border-accented': ['--atrium-token-outline-dark-strong', '#'],
    '--ui-primary': ['--atrium-token-primary-dark', 'var(--ui-color-primary-400)'],
    '--ui-error': ['--atrium-token-danger-dark', 'var(--ui-color-error-400)'],
    '--atrium-canvas': ['--atrium-token-canvas-dark', '#']
  }

  it.each([[':root', light], ['.dark', dark]] as const)('maps the theme tokens in %s, with the deck\'s defaults as fallbacks', (selector, map) => {
    const declarations = block(selector)

    for (const [variable, [token, fallback]] of Object.entries(map)) {
      const line = declarations.split('\n').find(l => l.trim().startsWith(`${variable}:`))

      expect(line, variable).toBeDefined()
      expect(line, variable).toContain(`var(${token},`)
      expect(line, variable).toContain(fallback)
    }
  })

  it('never falls back to a light surface, text or border token in dark mode', () => {
    const declarations = block('.dark')

    for (const token of ['--atrium-token-surface,', '--atrium-token-surface-alt', '--atrium-token-on-surface,', '--atrium-token-outline,', '--atrium-token-canvas,']) {
      expect(declarations, token).not.toContain(`var(${token}`)
    }
  })

  it('never reads a --color-* token, which Nuxt UI defines as var(--ui-*): a cycle', () => {
    expect(css).not.toMatch(/var\(--color-/)
  })

  it('lets a host override the fonts through --font-sans and --font-mono', () => {
    expect(css).toMatch(/--font-sans: "Geist Variable"/)
    expect(css).toMatch(/--font-mono: "Geist Mono Variable"/)
  })
})
