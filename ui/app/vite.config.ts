import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { atriumBuildInfo, nuxtUi, stylesheetClasses } from '@refactor-circus/atrium/vite'
import { defineConfig } from 'vite'

/*
 * Atrium's own front end (D-079): built once, committed to `dist/` at the
 * repository root and served by the package, so no host needs Node. Every
 * shared specifier (D-082) is an entry of its own, so the page's import map
 * can point modules at the very chunks the app uses.
 */
const root = fileURLToPath(new URL('.', import.meta.url))
const ui = fileURLToPath(new URL('..', import.meta.url))
const outDir = fileURLToPath(new URL('../../dist', import.meta.url))

/** Each shared specifier, and the entry that re-exports it. */
const shared: Record<string, string> = {
  vue: 'src/shared/vue.ts',
  'vue-router': 'src/shared/vue-router.ts',
  pinia: 'src/shared/pinia.ts',
  'vue-i18n': 'src/shared/vue-i18n.ts',
  '@vueuse/core': 'src/shared/vueuse-core.ts',
  'openapi-fetch': 'src/shared/openapi-fetch.ts',
  '@refactor-circus/atrium': 'src/shared/atrium.ts',
  '@refactor-circus/atrium/ui': 'src/shared/atrium-ui.ts'
}

/**
 * What the Blade page needs from the manifest, for build.json: the app's
 * entry (script and styles) and the file of every shared specifier.
 */
function pageManifest(out: string): Record<string, unknown> {
  const manifest = JSON.parse(readFileSync(`${out}/.vite/manifest.json`, 'utf8')) as Record<string, { file: string, css?: string[] }>
  const entry = manifest['src/main.ts']!
  // The app's stylesheet, and those of the shared entries (a component's
  // scoped styles), which a module may render without the app having.
  const styles = [...new Set([entry, ...Object.values(shared).map(source => manifest[source]!)].flatMap(chunk => chunk.css ?? []))]

  writeCoreClasses(out, entry.css ?? [])

  return {
    entry: { script: entry.file, styles },
    imports: Object.fromEntries(Object.entries(shared).map(([specifier, source]) => [specifier, manifest[source]!.file]))
  }
}

/**
 * Lists every utility class Atrium's stylesheet defines, for module builds
 * to leave out (D-084): a module's stylesheet loads after Atrium's, in a
 * later layer, so a class it emitted again (`hidden`) would beat Atrium's
 * responsive one (`lg:flex`) on Atrium's own elements.
 */
function writeCoreClasses(out: string, styles: string[]): void {
  const classes = styles.flatMap(file => stylesheetClasses(readFileSync(`${out}/${file}`, 'utf8')))
  const list = [...new Set(classes)].sort().map(name => name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')).join(' ')

  writeFileSync(fileURLToPath(new URL('../sdk/css/core-classes.css', import.meta.url)), `/*
 * Every utility class Atrium's own stylesheet defines, which a module's
 * stylesheet leaves out (module.css imports this). Written by Atrium's build
 * (ui/app/vite.config.ts); do not edit.
 */
@source not inline("${list}");
`)
}

export default defineConfig({
  root,
  base: './',
  plugins: [
    vue(),
    nuxtUi({ dts: 'types/auto-imports.d.ts' }),
    atriumBuildInfo({
      key: 'atrium',
      root: ui,
      outDir,
      inputs: ['app/src', 'app/package.json', 'app/vite.config.ts', 'sdk/src', 'sdk/css', 'sdk/locales', 'sdk/vite', 'sdk/package.json', 'pnpm-lock.yaml'],
      extend: pageManifest
    })
  ],
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    __VUE_I18N_FULL_INSTALL__: 'true',
    __VUE_I18N_LEGACY_API__: 'false',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
  },
  build: {
    outDir,
    emptyOutDir: true,
    manifest: true,
    target: 'es2022',
    copyPublicDir: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: { atrium: 'src/main.ts', ...Object.fromEntries(Object.entries(shared).map(([specifier, source]) => [`shared/${specifier.replace(/[@/]/g, '-').replace(/^-/, '')}`, source])) },
      preserveEntrySignatures: 'exports-only',
      output: {
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts']
  }
})
