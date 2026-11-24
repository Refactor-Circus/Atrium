import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * Atrium's components compose Nuxt UI (D-091): no SDK component, layout or
 * core page renders a raw interactive element Nuxt UI provides. Buttons are
 * <UButton>, fields <UInput>/<USelect>/<UTextarea>, tables <UTable>,
 * disclosures <UCollapsible> and links <UButton to>, <ULink> or, for an API
 * link that may be external, <AtriumLink> (the one file allowed an <a href>).
 */

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`.
const here = import.meta.url
const ui = fileURLToPath(new URL('../../', here))
const roots = ['sdk/src', 'app/src'].map(dir => join(ui, dir))

const RAW = [
  ['<button>', /<button[\s>/]/],
  ['<input>', /<input[\s>/]/],
  ['<select>', /<select[\s>/]/],
  ['<textarea>', /<textarea[\s>/]/],
  ['<table>', /<table[\s>/]/],
  ['<details>', /<details[\s>/]/],
  ['<a href>', /<a\s[^>]*:?href=/]
] as const

const ALLOWED: Record<string, string[]> = {
  // The safe link primitive: a route or a vetted external URL.
  'sdk/src/components/AtriumLink.vue': ['<a href>']
}

function vueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? vueFiles(join(dir, entry.name))
    : entry.name.endsWith('.vue') ? [join(dir, entry.name)] : [])
}

/** The template, without comments. */
function template(file: string): string {
  const source = readFileSync(file, 'utf8')
  const start = source.indexOf('<template>')

  return start === -1 ? '' : source.slice(start).replace(/<!--[\s\S]*?-->/g, '')
}

function rawElements(source: string, allowed: readonly string[] = []): string[] {
  return RAW.filter(([name, pattern]) => !allowed.includes(name) && pattern.test(source)).map(([name]) => name)
}

describe('Atrium components compose Nuxt UI', () => {
  const files = roots.flatMap(vueFiles)

  it('finds the SDK components, layouts and core pages', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it.each(files.map(file => [relative(ui, file).replaceAll('\\', '/'), file]))('%s renders no raw interactive element', (name, file) => {
    expect(rawElements(template(file), ALLOWED[name]), `${name}: use the Nuxt UI component instead`).toEqual([])
  })

  it('catches each raw element it guards against', () => {
    expect(rawElements('<template><button type="button">x</button></template>')).toEqual(['<button>'])
    expect(rawElements('<input v-model="q"><select></select><textarea />')).toEqual(['<input>', '<select>', '<textarea>'])
    expect(rawElements('<table><tr /></table> <details><summary>x</summary></details>')).toEqual(['<table>', '<details>'])
    expect(rawElements('<a :href="url">x</a>')).toEqual(['<a href>'])
    expect(rawElements('<a :href="url">x</a>', ['<a href>'])).toEqual([])
    expect(rawElements('<UButton to="/x" /><UInput /><UTable /><abbr>x</abbr>')).toEqual([])
  })
})
