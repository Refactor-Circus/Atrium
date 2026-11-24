// Builds a fresh consumer app against a copy of nuxt/layer, outside the pnpm
// workspace, the way a host gets the layer from git (giget downloads only
// the `nuxt/layer` subdirectory). It fails when the layer reaches outside its
// own folder, depends on a `workspace:` package, or does not build for an
// app that extends it, or when the client lacks the bundled Lucide icons a
// static SPA (no `/api/_nuxt_icon` server) needs: names the source never
// mentions, since the API sends them at runtime.
//
//   node nuxt/layer/test/consumer/build.mjs        (KEEP_CONSUMER=1 keeps the temp dir)

import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const layerSource = fileURLToPath(new URL('../../', import.meta.url))
const workspace = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'))
const layerPackage = JSON.parse(readFileSync(join(layerSource, 'package.json'), 'utf8'))

/** Local build output and dev-only parts that giget's copy would not carry, or the host would not use. */
const SKIPPED = new Set(['node_modules', '.nuxt', '.output', '.data', 'dist', 'test'])

function fail(message) {
  console.error(`[consumer] ${message}`)
  process.exit(1)
}

function run(cwd, args) {
  console.log(`[consumer] pnpm ${args.join(' ')}  (in ${basename(cwd)})`)

  const result = spawnSync('pnpm', args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' }
  })

  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(' ')} failed in ${basename(cwd)}`)
  }
}

const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const workspaceDeps = sections.flatMap(section => Object.entries(layerPackage[section] ?? {})
  .filter(([, version]) => String(version).startsWith('workspace:'))
  .map(([name]) => name))

if (workspaceDeps.length > 0) {
  fail(`nuxt/layer/package.json has workspace: dependencies, which a host cannot install: ${workspaceDeps.join(', ')}`)
}

const temp = mkdtempSync(join(tmpdir(), 'atrium-consumer-'))
const layer = join(temp, 'layer')
const app = join(temp, 'app')

try {
  cpSync(layerSource, layer, {
    recursive: true,
    filter: source => !relative(layerSource, source).split(/[\\/]/).some(part => SKIPPED.has(part))
  })

  mkdirSync(join(app, 'app', 'plugins'), { recursive: true })

  writeFileSync(join(app, 'package.json'), `${JSON.stringify({
    name: 'atrium-consumer',
    private: true,
    type: 'module',
    packageManager: workspace.packageManager,
    scripts: { build: 'nuxt build' },
    dependencies: { nuxt: layerPackage.devDependencies.nuxt }
  }, null, 2)}\n`)

  writeFileSync(join(app, 'nuxt.config.ts'), [
    '// A host app: extends the layer, points it at its API, and registers components.',
    'export default defineNuxtConfig({',
    "  extends: ['../layer'],",
    "  runtimeConfig: { public: { atrium: { apiBase: 'https://api.example.test/atrium/api' } } },",
    "  compatibilityDate: '2026-11-01'",
    '})',
    ''
  ].join('\n'))

  writeFileSync(join(app, 'app', 'plugins', 'atrium.ts'), [
    "import { defineComponent, h } from 'vue'",
    '',
    'export default defineNuxtPlugin(() => {',
    '  const atrium = useAtrium()',
    '',
    "  atrium.auth({ credentials: 'include', onUnauthorized: () => navigateTo('/') })",
    "  atrium.widget('consumer.hello', defineComponent({ setup: () => () => h('p', 'Hello') }))",
    '})',
    ''
  ].join('\n'))

  // No lockfile here: the monorepo's pins the workspace only, as a host's own
  // lockfile pins its install of the layer.
  run(layer, ['install', '--no-frozen-lockfile'])
  run(app, ['install', '--no-frozen-lockfile'])
  run(app, ['run', 'build'])

  const assets = join(app, '.output', 'public', '_nuxt')
  const client = readdirSync(assets).filter(file => file.endsWith('.js')).map(file => readFileSync(join(assets, file), 'utf8')).join('\n')

  for (const icon of ['ferris-wheel', 'shopping-cart']) {
    if (!client.includes(`"${icon}"`) && !client.includes(`'${icon}'`)) {
      throw new Error(`the client bundle lacks the Lucide icon [${icon}]: a static SPA would render no icons`)
    }
  }

  console.log('[consumer] a fresh app extending nuxt/layer builds, with the Lucide icons in its client bundle.')
} catch (error) {
  console.error(`[consumer] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  if (process.env.KEEP_CONSUMER) {
    console.log(`[consumer] kept ${temp}`)
  } else {
    rmSync(temp, { recursive: true, force: true })
  }
}
