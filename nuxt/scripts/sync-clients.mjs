// Copies each suite package's API description and generated types into the
// layer (D-020), until the package v2 tags exist and the layer can depend on
// each package's client by git instead.
//
//   pnpm -C nuxt sync:clients                  every package
//   pnpm -C nuxt sync:clients cortex impex     only these
//
// For each package it reads the sibling checkout `$ATRIUM_SUITE_PATH/{Pkg}`
// (ATRIUM_SUITE_PATH defaults to the folder this repository sits in) and
// writes `nuxt/layer/app/integrations/{pkg}/client/`:
//
//   openapi.json     the package's `openapi.json`, as committed there
//   schema.d.ts      the package's `client/src/schema.d.ts`, verbatim
//   openapi.sha256   the SHA-256 of `openapi.json` with LF line endings
//
// It checks every source first and writes nothing when one is missing (D-039):
// a screen typed against a guessed schema would hide the drift this guards.
// `tests/Feature/Integrations/VendoredClientsTest.php` checks the copies.

import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The suite packages the layer integrates, by key, with their checkout folder name. */
const PACKAGES = {
  cortex: 'Cortex',
  impex: 'Impex',
  keen: 'Keen',
  pennantplus: 'PennantPlus',
  polycart: 'Polycart',
  roster: 'Roster',
  showroom: 'Showroom'
}

const repository = fileURLToPath(new URL('../../', import.meta.url))
const suite = resolve(process.env.ATRIUM_SUITE_PATH || dirname(repository))
const integrations = join(repository, 'nuxt', 'layer', 'app', 'integrations')

function fail(message) {
  console.error(`[sync:clients] ${message}`)
  process.exit(1)
}

const requested = process.argv.slice(2)
const unknown = requested.filter(key => !(key in PACKAGES))

if (unknown.length > 0) {
  fail(`Unknown package ${unknown.join(', ')}. Known: ${Object.keys(PACKAGES).join(', ')}.`)
}

const keys = requested.length > 0 ? requested : Object.keys(PACKAGES)

const sources = keys.map(key => {
  const checkout = join(suite, PACKAGES[key])

  return {
    key,
    checkout,
    openapi: join(checkout, 'openapi.json'),
    schema: join(checkout, 'client', 'src', 'schema.d.ts')
  }
})

const missing = sources.flatMap(source => [source.openapi, source.schema]
  .filter(path => !existsSync(path))
  .map(path => `${PACKAGES[source.key]} (${source.key}): ${path} is missing`))

if (missing.length > 0) {
  fail([
    'Cannot sync, a package build is missing. Nothing was written.',
    ...missing.map(line => `  - ${line}`),
    `Build the package's v2 API and client, or point ATRIUM_SUITE_PATH at the folder holding its checkout (now ${suite}).`
  ].join('\n'))
}

for (const source of sources) {
  const target = join(integrations, source.key, 'client')
  const openapi = readFileSync(source.openapi, 'utf8')
  const sha = createHash('sha256').update(openapi.replace(/\r\n/g, '\n'), 'utf8').digest('hex')

  mkdirSync(target, { recursive: true })
  copyFileSync(source.openapi, join(target, 'openapi.json'))
  copyFileSync(source.schema, join(target, 'schema.d.ts'))
  writeFileSync(join(target, 'openapi.sha256'), `${sha}\n`)

  console.log(`[sync:clients] ${source.key}: ${sha} from ${source.checkout}`)
}
