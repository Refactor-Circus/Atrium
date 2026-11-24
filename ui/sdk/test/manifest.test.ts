import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { expectIntegrationManifest, validateIntegrationManifest } from '@refactor-circus/atrium/testing'
import { copyIntegrationManifest } from '../vite/manifest.mjs'
import cases from './fixtures/manifests/cases.json'

/*
 * Integration manifests (D-090): the SDK checks them exactly as Atrium's PHP
 * does. The shared cases (`fixtures/manifests/cases.json`) are refused at
 * the same JSON pointers by `tests/Feature/Integrations/ManifestTest.php`,
 * and the suite's manifests (Atrium's `tests/Fixtures/Manifests`) pass both.
 */

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`.
const here = import.meta.url
const suite = fileURLToPath(new URL('../../../tests/Fixtures/Manifests', here))
const temporary: string[] = []

function folder(): string {
  const path = mkdtempSync(join(tmpdir(), 'atrium-manifest-'))
  temporary.push(path)

  return path
}

afterEach(() => {
  for (const path of temporary.splice(0)) {
    rmSync(path, { recursive: true, force: true })
  }
})

describe('validateIntegrationManifest()', () => {
  it('accepts the shared valid case', () => {
    expect(validateIntegrationManifest(cases.valid)).toEqual({ valid: true, errors: [] })
  })

  it.each(cases.invalid.map(entry => [entry.name, entry.pointer, entry.manifest] as const))('refuses %s at %s', (_name, pointer, manifest) => {
    const result = validateIntegrationManifest(manifest)

    expect(result.valid).toBe(false)
    expect(result.errors[0]?.pointer).toBe(pointer)
  })

  it.each(readdirSync(suite))('accepts the %s suite manifest', (key) => {
    const manifest = JSON.parse(readFileSync(join(suite, key, 'integration.json'), 'utf8'))

    expect(validateIntegrationManifest(manifest).errors).toEqual([])
    expect(manifest.key).toBe(key)
  })
})

describe('expectIntegrationManifest()', () => {
  it('returns a valid manifest with the expected key', () => {
    expect(expectIntegrationManifest(join(suite, 'polycart/integration.json'), 'polycart').label).toBe('Polycart')
  })

  it('throws with the JSON pointer of the first problem', () => {
    const path = join(folder(), 'integration.json')
    writeFileSync(path, JSON.stringify({ ...cases.valid, label: '' }))

    expect(() => expectIntegrationManifest(path)).toThrow(`[${path}] is invalid at [/label]: must not be empty`)
  })

  it('throws for another key, and without a manifest', () => {
    expect(() => expectIntegrationManifest(join(suite, 'polycart/integration.json'), 'roster')).toThrow('declares the key [polycart], not [roster]')
    expect(() => expectIntegrationManifest(join(folder(), 'missing.json'))).toThrow('the file does not exist')
  })
})

describe('the preset', () => {
  it('copies src/integration.json into the build, checked', () => {
    const root = folder()
    mkdirSync(join(root, 'src'))
    writeFileSync(join(root, 'src/integration.json'), JSON.stringify(cases.valid))

    expect(copyIntegrationManifest({ root, outDir: 'dist/atrium' })).toBe('src/integration.json')
    expect(JSON.parse(readFileSync(join(root, 'dist/atrium/integration.json'), 'utf8'))).toEqual(cases.valid)
  })

  it('fails the build on an invalid manifest, and copies nothing without one', () => {
    const root = folder()

    expect(copyIntegrationManifest({ root, outDir: 'dist/atrium' })).toBeNull()

    writeFileSync(join(root, 'integration.json'), JSON.stringify({ ...cases.valid, key: 'Bad Key' }))

    expect(() => copyIntegrationManifest({ root, outDir: 'dist/atrium' })).toThrow('is invalid at [/key]')
  })
})
