import type { Plugin, UserConfig } from 'vite'

export declare const ATRIUM_SHARED_API: string
export declare const ATRIUM_SHARED: Readonly<Record<string, string>>
export declare const ATRIUM_SHARED_MODULES: readonly string[]
export declare const ATRIUM_SDK_ROOT: string
export declare const atriumUiConfig: Record<string, unknown>

export interface AtriumModuleOptions {
  /** The module's key: its integration's (or plugin's) key */
  key: string
  /** The entry that calls defineAtriumModule(), `src/atrium.ts` */
  entry?: string
  /** Where the build goes, `dist/atrium` */
  outDir?: string
  /** What the build hash covers, relative to the config's folder */
  inputs?: string[]
  root?: string
  /** Vitest overrides */
  test?: AtriumTestOptions
  /** Anything else, merged over the result */
  vite?: UserConfig
}

export interface AtriumTestOptions {
  root?: string
  include?: string[]
  setupFiles?: string[]
  dirs?: string[]
  [key: string]: unknown
}

export declare function atriumModule(options: AtriumModuleOptions): UserConfig
export declare function atriumTestConfig(options?: AtriumTestOptions): UserConfig & { test: Record<string, unknown> }
export declare function nuxtUi(options?: { dts?: string | false, dirs?: string[] }): Promise<Plugin[]>
export declare function atriumSdkExports(): string[]
export declare function atriumComponentNames(): string[]
export declare function atriumAutoImports(options?: { ui?: boolean, dirs?: string[] }): unknown[]
export declare function atriumComponentResolver(options?: { ui?: boolean, direct?: boolean }): (name: string) => { name: string, from: string } | undefined
export declare function hashInputs(root: string, inputs: string[]): string
export declare function stylesheetClasses(css: string): string[]
export declare function atriumBuildInfo(options: { key: string, root: string, inputs: string[], outDir: string, extend?: (outDir: string) => Record<string, unknown> }): Plugin
