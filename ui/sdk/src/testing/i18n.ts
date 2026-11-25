import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * Checks a module's `t('…')` keys against its locale files (AC 53): every
 * literal key its sources use must be in Atrium's own `en.json` or one of
 * the module's.
 */

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`
// into a served asset URL, which `fileURLToPath()` refuses.
const here = import.meta.url

/** Atrium's own strings (`locales/en.json` of the SDK). */
export const atriumLocaleFile = fileURLToPath(new URL('../../locales/en.json', here))

/**
 * The literal keys of every `t('…')` / `$t('…')` call in `source`. Keys
 * built at run time (a template literal with `${…}`) are left out.
 */
export function i18nKeysIn(source: string): string[] {
  const keys = new Set<string>()

  for (const match of source.matchAll(/(?<![\w$.])\$?t\(\s*(['"`])([^'"`]+?)\1/g)) {
    const key = match[2]!

    if (!key.includes('${')) {
      keys.add(key)
    }
  }

  return [...keys]
}

/**
 * Whether the nested `messages` hold a string (or plural) at the dotted `key`.
 * Loaded messages may hold a string compiled to a message AST
 * (`{type: 0, body}`) rather than the string itself; either counts.
 */
export function hasI18nKey(messages: unknown, key: string): boolean {
  let node: unknown = messages

  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node) || isCompiledMessage(node)) {
      return false
    }

    node = (node as Record<string, unknown>)[part]
  }

  return typeof node === 'string' || isCompiledMessage(node)
}

function isCompiledMessage(node: unknown): boolean {
  return typeof node === 'object' && node !== null && (node as { type?: unknown }).type === 0 && 'body' in node
}

/** Every `.vue` and `.ts` file under `directory` (a `client` folder left out). */
export function filesUnder(directory: string): string[] {
  let entries: string[]

  try {
    entries = readdirSync(directory)
  } catch {
    return []
  }

  return entries.flatMap((entry) => {
    const path = join(directory, entry)

    if (statSync(path).isDirectory()) {
      return entry === 'client' ? [] : filesUnder(path)
    }

    return /\.(vue|ts)$/.test(entry) ? [path] : []
  })
}

/** The `*.en.json` files in `directory`. */
export function localeFilesIn(directory: string): string[] {
  return readdirSync(directory).filter(file => file.endsWith('.en.json')).map(file => join(directory, file))
}

/**
 * Every `t()` key used under `sources` that neither Atrium's `en.json` nor
 * any of `locales` holds, as `file: key` (relative to `root`). Given a
 * module's key instead, its suite's folder is the module: `src/`, with the
 * `*.en.json` files in `src/locales`.
 */
export function missingI18nKeys(options: string | { root: string, sources: string[], locales: string[] }): string[] {
  if (typeof options === 'string') {
    const root = process.cwd()

    return missingI18nKeys({ root, sources: [join(root, 'src')], locales: localeFilesIn(join(root, 'src/locales')) })
  }

  const messages = [atriumLocaleFile, ...options.locales].map(file => JSON.parse(readFileSync(file, 'utf8')) as unknown)

  return options.sources.flatMap(directory => filesUnder(directory)).flatMap(file => i18nKeysIn(readFileSync(file, 'utf8'))
    .filter(key => !messages.some(set => hasI18nKey(set, key)))
    .map(key => `${relative(options.root, file)}: ${key}`))
}
