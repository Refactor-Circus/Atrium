/*
 * A module's integration manifest in its Vitest suite (D-090): the checks
 * Atrium makes when it registers the integration (the schema, then the
 * manifest rules), from the same code the preset runs on every build.
 *
 *   import { expectIntegrationManifest } from '@refactor-circus/atrium/testing'
 *
 *   it('declares a valid integration', () => {
 *     const manifest = expectIntegrationManifest('src/integration.json', 'polycart')
 *     expect(manifest.screens).toHaveLength(3)
 *   })
 */
import { findIntegrationManifest, readIntegrationManifest, validateIntegrationManifest } from '../../vite/manifest.mjs'
import type { IntegrationManifestError, IntegrationManifestResult } from '../../vite/manifest.mjs'

export { validateIntegrationManifest }
export type { IntegrationManifestError, IntegrationManifestResult }

/** An integration manifest's JSON, as `integration.json` holds it. */
export interface IntegrationManifest {
  version: 1
  key: string
  label: string
  features?: string[]
  navigation?: Record<string, unknown>[]
  widgets?: Record<string, unknown>[]
  settings?: Record<string, unknown> | null
  search_sources?: Record<string, unknown>[]
  screens?: { key: string, kind: 'detail' | 'list', path: string, subject_type?: string, subject_model?: string | Record<string, unknown>, options?: Record<string, unknown> }[]
  hooks?: Record<string, unknown>[]
  [field: string]: unknown
}

/**
 * Reads the module's manifest (`path`, relative to the working directory:
 * by default `src/integration.json`, else `integration.json`) and checks it
 * as Atrium does; throws with the JSON pointer of the first problem, or when
 * its key is not `key`. Returns the manifest.
 */
export function expectIntegrationManifest(path?: string, key?: string): IntegrationManifest {
  const file = path ?? findIntegrationManifest()

  if (file === null) {
    throw new Error('No integration manifest: add src/integration.json (MODULES.md, "Writing a module").')
  }

  const manifest = readIntegrationManifest(file) as unknown as IntegrationManifest

  if (key !== undefined && manifest.key !== key) {
    throw new Error(`The integration manifest [${file}] declares the key [${manifest.key}], not [${key}].`)
  }

  return manifest
}
