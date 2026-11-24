/*
 * @refactor-circus/atrium/vite: how Atrium's front end and every module
 * build (D-082, D-084).
 *
 *   // a module's vite.config.ts
 *   import { atriumModule } from '@refactor-circus/atrium/vite'
 *
 *   export default atriumModule({ key: 'polycart' })
 *
 * `atriumModule()` builds `src/atrium.ts` as one ES module
 * (`dist/atrium/atrium.js`, its lazy pages beside it, and one stylesheet,
 * `dist/atrium/atrium.css`) with every shared specifier left to the page's
 * import map, and runs the module's Vitest suite against the same Nuxt UI
 * theme the page uses. Atrium's own build uses the same pieces.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import tailwind from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { copyIntegrationManifest } from './manifest.mjs'
import { ATRIUM_SHARED, ATRIUM_SHARED_API, ATRIUM_SHARED_MODULES } from './shared.mjs'
import { atriumUiConfig } from './ui-config.mjs'

export { ATRIUM_SHARED, ATRIUM_SHARED_API, ATRIUM_SHARED_MODULES, atriumUiConfig }
export { copyIntegrationManifest, findIntegrationManifest, readIntegrationManifest, validateIntegrationManifest } from './manifest.mjs'

/** The SDK's own folder (`ui/sdk` in Atrium's repository). */
export const ATRIUM_SDK_ROOT = fileURLToPath(new URL('..', import.meta.url))

/** Matches the SDK's own source files. */
const sdkSources = new RegExp(`^${join(ATRIUM_SDK_ROOT, 'src').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\\\/]`)

/**
 * What the component resolver leaves alone: Nuxt UI's default (`node_modules`
 * but Nuxt UI's own, `.git`, `.nuxt`) and the SDK's sources, as one RegExp.
 */
const componentsExclude = new RegExp(`[\\\\/]node_modules[\\\\/](?!\\.pnpm|@nuxt\\/ui|@compodium\\/examples)|[\\\\/]\\.git[\\\\/]|[\\\\/]\\.nuxt[\\\\/]|${sdkSources.source}`)

const VALUE_EXPORT = /^export (?:async )?(?:function|const|class|let) (\w+)/gm

/** The SDK's value exports (composables, helpers, the registry), for auto-imports. */
export function atriumSdkExports() {
  const names = new Set()
  const src = join(ATRIUM_SDK_ROOT, 'src')

  for (const dir of ['runtime', 'composables', 'stores', 'utils', '.']) {
    for (const file of readdirSync(join(src, dir))) {
      if (!file.endsWith('.ts') || file.endsWith('.d.ts') || file === 'index.ts' || file === 'ui.ts') {
        continue
      }

      for (const match of readFileSync(join(src, dir, file), 'utf8').matchAll(VALUE_EXPORT)) {
        names.add(match[1])
      }
    }
  }

  names.add('useHead')

  return [...names].sort()
}

/** The SDK's `Atrium*` components. */
export function atriumComponentNames() {
  return readdirSync(join(ATRIUM_SDK_ROOT, 'src/components'))
    .filter(file => file.endsWith('.vue'))
    .map(file => file.slice(0, -'.vue'.length))
    .sort()
}

/**
 * What every Atrium build auto-imports, as Nuxt did: Vue, Vue Router, Pinia,
 * `useI18n`, the SDK's composables and helpers, and (`ui: true`) Nuxt UI's
 * composables from the shared `@refactor-circus/atrium/ui`.
 */
export function atriumAutoImports({ ui = true, dirs = [] } = {}) {
  return [
    'vue',
    'vue-router',
    'pinia',
    { 'vue-i18n': ['useI18n'] },
    { '@refactor-circus/atrium': atriumSdkExports() },
    ...(ui ? [{ '@refactor-circus/atrium/ui': ['useToast', 'useOverlay', 'defineShortcuts', 'useKbd', 'useLocale'] }] : []),
    ...dirs.map(dir => ({ dirs: [dir] }))
  ]
}

/**
 * Resolves `<AtriumScreen>` and friends to the SDK and, with `ui: true`,
 * `<UButton>` and friends to the shared `@refactor-circus/atrium/ui`.
 */
export function atriumComponentResolver({ ui = true, direct = false } = {}) {
  const atrium = new Set(atriumComponentNames())

  return (name) => {
    if (atrium.has(name)) {
      // Atrium's own build and the tests import the component file itself
      // (the barrel would import back into the SDK); a module imports the
      // shared SDK, which the import map provides.
      return direct
        ? { name: 'default', from: join(ATRIUM_SDK_ROOT, 'src/components', `${name}.vue`) }
        : { name, from: '@refactor-circus/atrium' }
    }

    if (ui && /^U[A-Z]/.test(name)) {
      return { name, from: '@refactor-circus/atrium/ui' }
    }

    return undefined
  }
}

const SKIPPED = new Set(['node_modules', 'dist', '.DS_Store', '.git'])

/**
 * The SHA-256 of a build's sources (D-085): each file under `inputs`
 * (paths relative to `root`, directories walked, `node_modules`, `dist`
 * and dotfiles skipped) as `{path}\0{sha256 of its content, CRLF as LF}\n`,
 * sorted by path. Atrium's PHP suite recomputes it from `build.json` to
 * fail on a build older than its sources.
 */
export function hashInputs(root, inputs) {
  const files = []

  const walk = (path) => {
    const absolute = resolve(root, path)

    if (!existsSync(absolute)) {
      return
    }

    if (statSync(absolute).isDirectory()) {
      for (const entry of readdirSync(absolute)) {
        if (!SKIPPED.has(entry) && !entry.startsWith('.')) {
          walk(`${path}/${entry}`)
        }
      }

      return
    }

    files.push(path)
  }

  for (const input of inputs) {
    walk(input.replace(/\/+$/, ''))
  }

  const lines = [...new Set(files)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).map((path) => {
    const content = readFileSync(resolve(root, path)).toString('latin1').replace(/\r\n/g, '\n')

    return `${path}\0${createHash('sha256').update(Buffer.from(content, 'latin1')).digest('hex')}\n`
  })

  return createHash('sha256').update(lines.join('')).digest('hex')
}

/**
 * The utility classes a stylesheet defines (`lg:flex`, `bg-(--x)`), read
 * from its selectors.
 */
export function stylesheetClasses(css) {
  const classes = new Set()

  for (const match of css.matchAll(/\.((?:\\.|[^\s.:,{>~+[\]()#*\\])+)/g)) {
    const name = match[1]
      .replace(/\\([0-9a-fA-F]{1,6}) ?/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
      .replace(/\\(.)/g, '$1')

    if (!/^[0-9]/.test(name)) {
      classes.add(name)
    }
  }

  return [...classes].sort()
}

/**
 * Writes `build.json` beside the build: the module key, the shared API it
 * was built for, and the hash of its sources with what to recompute it from
 * (plus whatever `extend(outDir)` returns). The integration manifest is
 * copied first (`copyIntegrationManifest()`) and its source added to the
 * hashed inputs when they do not already cover it.
 */
export function atriumBuildInfo({ key, root, inputs, outDir, integration, extend = () => ({}) }) {
  return {
    name: 'atrium:build-info',
    apply: 'build',
    writeBundle: {
      order: 'post',
      sequential: true,
      handler() {
        const out = resolve(root, outDir)
        mkdirSync(out, { recursive: true })

        const manifest = copyIntegrationManifest({ root, outDir, integration })

        if (manifest !== null && !inputs.some(input => manifest === input.replace(/\/+$/, '') || manifest.startsWith(`${input.replace(/\/+$/, '')}/`))) {
          inputs = [...inputs, manifest]
        }

        // Before hashing: `extend` may write a source (Atrium's class list).
        const extra = extend(out)
        const info = {
          key,
          shared_api: ATRIUM_SHARED_API,
          root: relative(out, root).split(sep).join('/') || '.',
          inputs,
          hash: hashInputs(root, inputs),
          ...extra
        }

        writeFileSync(join(out, 'build.json'), `${JSON.stringify(info, null, 2)}\n`)
      }
    }
  }
}

/**
 * The Vite config of a module's build and tests (5 lines in the module):
 *
 *   export default atriumModule({ key: 'polycart' })
 *
 * key:      the module's key, its integration's (or plugin's) key
 * entry:    the entry that calls defineAtriumModule(), `src/atrium.ts`
 * integration: the integration manifest, `src/integration.json` (or
 *           `integration.json`) when there is one; checked, copied to
 *           `{outDir}/integration.json` and hashed (D-090)
 * outDir:   where the build goes, `dist/atrium` (what composer.json's
 *           `extra.atrium.scripts`/`styles` point at, relative to the package)
 * inputs:   what the build hash covers, relative to the config's folder
 * test:     Vitest overrides (`include`, `setupFiles`, …)
 * vite:     anything else, merged over the result
 */
export function atriumModule(options) {
  const {
    key,
    entry = 'src/atrium.ts',
    outDir = 'dist/atrium',
    inputs = ['src', 'client', 'package.json', 'vite.config.ts'],
    root = process.cwd(),
    integration,
    test = {},
    vite = {}
  } = options

  if (!key || !/^[a-z0-9][a-z0-9_-]*$/.test(key)) {
    throw new Error(`[atrium] atriumModule() needs a lowercase key, not "${key}".`)
  }

  if (process.env.VITEST) {
    return { ...atriumTestConfig({ root, ...test }), ...vite }
  }

  return {
    root,
    plugins: [
      vue(),
      AutoImport({ imports: atriumAutoImports(), dts: 'auto-imports.d.ts', vueTemplate: true }),
      Components({ dirs: [], resolvers: [atriumComponentResolver()], dts: 'components.d.ts' }),
      tailwind(),
      atriumBuildInfo({ key, root, inputs, outDir, integration })
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    },
    build: {
      outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      lib: {
        entry,
        formats: ['es'],
        fileName: () => 'atrium.js',
        cssFileName: 'atrium'
      },
      rollupOptions: {
        external: id => ATRIUM_SHARED_MODULES.includes(id),
        output: {
          chunkFileNames: 'chunks/[name]-[hash].js',
          // The stylesheet keeps the name composer.json declares.
          assetFileNames: asset => (asset.names ?? [asset.name]).includes('atrium.css') ? 'atrium.css' : 'assets/[name]-[hash][extname]'
        }
      }
    },
    ...vite
  }
}

/**
 * The Vitest config Atrium's suites and every module's share: Vue, Nuxt UI
 * compiled with Atrium's theme, the same auto-imports as the builds, the SDK
 * and Nuxt UI inlined, happy-dom, and the SDK's test setup (a fresh app,
 * router, Pinia and i18n per file: `@refactor-circus/atrium/testing`).
 */
export function atriumTestConfig({ root = process.cwd(), include = ['test/**/*.test.ts'], setupFiles = [], dirs = [], ...rest } = {}) {
  return {
    root,
    plugins: [vue(), nuxtUi({ dts: false, dirs })],
    resolve: {
      dedupe: ['vue', 'vue-router', 'pinia', 'vue-i18n', '@vueuse/core', '@unhead/vue', 'openapi-fetch']
    },
    test: {
      environment: 'happy-dom',
      // Nothing a test renders may load a file or leave for the network.
      environmentOptions: {
        happyDOM: {
          url: 'http://localhost:3000',
          settings: {
            disableJavaScriptFileLoading: true,
            disableCSSFileLoading: true,
            disableIframePageLoading: true,
            handleDisabledFileLoadingAsSuccess: true
          }
        }
      },
      include,
      setupFiles: [join(ATRIUM_SDK_ROOT, 'src/testing/setup.ts'), ...setupFiles],
      server: { deps: { inline: ['@nuxt/ui', '@refactor-circus/atrium'] } },
      ...rest
    }
  }
}

/**
 * Nuxt UI's Vite plugin in Vue mode, with Atrium's theme and auto-imports:
 * what Atrium's own build and every test run compile the shared components
 * with. (A module's build does not use it: it imports the components
 * Atrium compiled, through the import map.)
 */
export function nuxtUi({ dts = false, dirs = [] } = {}) {
  // `dts` is the folder the declaration files go in (false for none).
  const autoImportsDts = dts ? `${dts}/auto-imports.d.ts` : false
  const componentsDts = dts ? `${dts}/components.d.ts` : false

  return import('@nuxt/ui/vite').then(({ default: ui }) => ui({
    ui: atriumUiConfig,
    colorMode: true,
    // The SDK's own sources import what they use: a library must not lean
    // on its consumer's auto-imports.
    autoImport: { imports: atriumAutoImports({ ui: false }), dirs, dts: autoImportsDts, vueTemplate: true, exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, sdkSources] },
    // Nor on its component resolver: the SDK's `.vue` files import every
    // `Atrium*` and `U*` component they render. Installed from GitHub they
    // sit under `node_modules`, which Nuxt UI's default `exclude` skips, so
    // they are skipped here too and Atrium's own suites see what a module's
    // see. (defu replaces a RegExp, where it would concatenate an array.)
    components: { dirs: [], resolvers: [atriumComponentResolver({ ui: false, direct: true })], dts: componentsDts, exclude: componentsExclude }
  }))
}
