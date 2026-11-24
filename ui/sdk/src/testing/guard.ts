/*
 * The Nuxt UI guard (D-091, D-093): a module's pages and components compose
 * Nuxt UI, so none renders a raw interactive element Nuxt UI provides.
 * Atrium's own suite runs it over `ui/sdk/src` and `ui/app/src`; a module's
 * runs it over its `src`:
 *
 *   import { rawHtmlIn } from '@refactor-circus/atrium/testing'
 *
 *   it('composes Nuxt UI, with no raw HTML controls', () => {
 *     expect(rawHtmlIn('src')).toEqual([])
 *   })
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

/** Each raw element the guard refuses, with the pattern that finds it in a template. */
export const RAW_HTML_ELEMENTS = [
  ['<button>', /<button[\s>/]/],
  ['<input>', /<input[\s>/]/],
  ['<select>', /<select[\s>/]/],
  ['<textarea>', /<textarea[\s>/]/],
  ['<table>', /<table[\s>/]/],
  ['<details>', /<details[\s>/]/],
  ['<a href>', /<a\s[^>]*:?href=/]
] as const

export type RawHtmlElement = typeof RAW_HTML_ELEMENTS[number][0]

/** A `.vue` file that renders raw elements, with its path relative to the folder searched. */
export interface RawHtmlFinding {
  file: string
  elements: RawHtmlElement[]
}

/** The raw elements a template (or a whole `.vue` source) renders, comments left out. */
export function rawHtmlElements(source: string, allowed: readonly RawHtmlElement[] = []): RawHtmlElement[] {
  const start = source.indexOf('<template>')
  const template = (start === -1 ? source : source.slice(start)).replace(/<!--[\s\S]*?-->/g, '')

  return RAW_HTML_ELEMENTS.filter(([name, pattern]) => !allowed.includes(name) && pattern.test(template)).map(([name]) => name)
}

/** Every `.vue` file under `dir`, sorted. */
export function vueFilesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => entry.isDirectory()
      ? (entry.name === 'node_modules' || entry.name === 'dist' ? [] : vueFilesIn(join(dir, entry.name)))
      : entry.name.endsWith('.vue') ? [join(dir, entry.name)] : [])
    .sort()
}

/**
 * The `.vue` files under `dir` (relative to the working directory, a
 * module's `atrium/`) that render a raw `<button>`, `<input>`, `<select>`,
 * `<textarea>`, `<table>`, `<details>` or `<a href>`. `allow` lets a file
 * (its path relative to `dir`, `/`-separated) keep named elements.
 */
export function rawHtmlIn(dir: string, allow: Record<string, readonly RawHtmlElement[]> = {}): RawHtmlFinding[] {
  const root = resolve(dir)
  const files = vueFilesIn(root)

  if (files.length === 0) {
    throw new Error(`No .vue files under ${root}`)
  }

  return files.flatMap((path) => {
    const file = relative(root, path).replaceAll('\\', '/')
    const elements = rawHtmlElements(readFileSync(path, 'utf8'), allow[file] ?? [])

    return elements.length > 0 ? [{ file, elements }] : []
  })
}
