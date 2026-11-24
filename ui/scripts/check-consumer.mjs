// Installs the SDK the way a module outside Atrium does and builds, type-checks
// and tests a tiny module against it (D-088).
//
//   pnpm -C ui test:consumer          (composer test:ui runs it)
//   ATRIUM_KEEP_CONSUMER=1 …          keep the temporary folder for a look
//
// Inside Atrium's workspace `workspace:*` links `ui/sdk`, so its sources sit
// outside any node_modules. A module installs the SDK from GitHub, which puts
// them under `node_modules/.pnpm/…/node_modules/@refactor-circus/atrium`: the
// SDK packed here lands there too, beside only the dependencies a module
// declares (the SDK's peers, the test and type tools; nothing else). So the
// SDK's components must import what they render, and its type-checked
// sources must find every type they import, through its own dependencies.
//
// The module (`scripts/consumer/`) is built (the SDK stays external: none of
// its code may be in the output; its `src/integration.json` is checked and
// copied to `dist/atrium/integration.json`, D-090), type-checked with
// vue-tsc (which reads the SDK's `.vue` and `.ts` sources) and tested with
// Vitest; a test fails on an unresolved component, and the run fails on a
// test that reaches the network.

import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ui = fileURLToPath(new URL('..', import.meta.url))
const sdk = join(ui, 'sdk')
const manifest = JSON.parse(readFileSync(join(sdk, 'package.json'), 'utf8'))
const tools = ['@types/node', '@vue/test-utils', 'happy-dom', 'typescript', 'vitest', 'vue-tsc']
const temp = realpathSync(mkdtempSync(join(tmpdir(), 'atrium-consumer-')))
const module = join(temp, 'module')

function run(command, args, cwd) {
  console.log(`[consumer] ${command} ${args.join(' ')}`)

  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '1' } })
}

function step(command, args, cwd) {
  try {
    return run(command, args, cwd)
  } catch (error) {
    process.stdout.write(error.stdout ?? '')
    process.stderr.write(error.stderr ?? '')
    throw new Error(`[consumer] failed: ${command} ${args.join(' ')} (kept in ${temp})`)
  }
}

let failed = false

try {
  step('pnpm', ['pack', '--pack-destination', temp], sdk)
  const tarball = readdirSync(temp).find(file => file.endsWith('.tgz'))

  cpSync(fileURLToPath(new URL('./consumer', import.meta.url)), module, { recursive: true })
  writeFileSync(join(module, 'package.json'), `${JSON.stringify({
    name: '@refactor-circus/consumer-atrium',
    private: true,
    type: 'module',
    devDependencies: {
      '@refactor-circus/atrium': `file:../${tarball}`,
      ...manifest.peerDependencies,
      ...Object.fromEntries(tools.map(name => [name, manifest.devDependencies[name]]))
    },
    pnpm: JSON.parse(readFileSync(join(ui, 'package.json'), 'utf8')).pnpm
  }, null, 2)}\n`)

  step('pnpm', ['install', '--prefer-offline', '--ignore-workspace', '--reporter=silent'], module)

  const installed = realpathSync(join(module, 'node_modules/@refactor-circus/atrium'))

  if (!/[\\/]node_modules[\\/]\.pnpm[\\/].*[\\/]node_modules[\\/]@refactor-circus[\\/]atrium$/.test(installed)) {
    throw new Error(`[consumer] the SDK is not installed as a module's is: ${installed}`)
  }

  step('pnpm', ['exec', 'vite', 'build', '--logLevel', 'warn'], module)

  const built = readFileSync(join(module, 'dist/atrium/atrium.js'), 'utf8')

  if (!built.includes('@refactor-circus/atrium') || built.includes('atrium-no-access')) {
    throw new Error('[consumer] the build bundled the SDK instead of importing it from the page')
  }

  // The preset checks src/integration.json and copies it beside the build (D-090).
  const integration = JSON.parse(readFileSync(join(module, 'dist/atrium/integration.json'), 'utf8'))
  const info = JSON.parse(readFileSync(join(module, 'dist/atrium/build.json'), 'utf8'))

  if (integration.key !== 'consumer' || !info.inputs.includes('src')) {
    throw new Error('[consumer] the build did not ship the module\'s integration manifest, or does not hash it')
  }

  step('pnpm', ['exec', 'vue-tsc', '--noEmit', '-p', 'tsconfig.json'], module)

  const output = step('pnpm', ['exec', 'vitest', 'run'], module)

  if (/ECONNREFUSED|Failed to resolve component/.test(output)) {
    process.stdout.write(output)
    throw new Error('[consumer] the module\'s suite reached the network or left a component unresolved')
  }

  console.log('[consumer] the installed SDK builds, type-checks and tests')
} catch (error) {
  failed = true
  console.error(error.message)
} finally {
  if (!failed && !process.env.ATRIUM_KEEP_CONSUMER) {
    rmSync(temp, { recursive: true, force: true })
  } else {
    console.log(`[consumer] kept ${temp}`)
  }
}

process.exitCode = failed ? 1 : 0
