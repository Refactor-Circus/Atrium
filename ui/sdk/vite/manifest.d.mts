/** A problem with an integration manifest: the JSON pointer of the value, and what is wrong with it. */
export interface IntegrationManifestError {
  pointer: string
  message: string
}

export interface IntegrationManifestResult {
  valid: boolean
  errors: IntegrationManifestError[]
}

/** The path of the manifest's JSON Schema, `@refactor-circus/atrium/schema/integration.schema.json`. */
export declare const INTEGRATION_SCHEMA_PATH: string
/** Where a module keeps its manifest, relative to its folder: `src/integration.json`, else `integration.json`. */
export declare const INTEGRATION_SOURCES: readonly string[]
/** The manifest's JSON Schema. */
export declare function integrationSchema(): Record<string, unknown>
/** The module's manifest source under `root`, or null. */
export declare function findIntegrationManifest(root?: string): string | null
/** Checks a manifest as Atrium does: the schema, then the manifest rules. */
export declare function validateIntegrationManifest(manifest: unknown): IntegrationManifestResult
/** Reads and checks a manifest file; throws with its path and the JSON pointer of the first problem. */
export declare function readIntegrationManifest(path: string): Record<string, unknown>
/** Checks the module's integration manifest and copies it into the build as `integration.json`; its source relative to `root`, or null without one. */
export declare function copyIntegrationManifest(options: { root: string, outDir: string, integration?: string | null }): string | null
