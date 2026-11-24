// An integration manifest's checks (D-090), the same as Atrium's PHP makes
// (`IntegrationManifests` and `ManifestSchema`): the JSON Schema the SDK
// publishes (`schema/integration.schema.json`), then the manifest rules.
// The preset runs them on every build; `@refactor-circus/atrium/testing`
// re-exports them for a module's Vitest suite. Node only (it reads files).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// Read through a variable: Vite rewrites `new URL('…', import.meta.url)`
// into a served asset URL, which `fileURLToPath()` refuses.
const here = import.meta.url

export const INTEGRATION_SCHEMA_PATH = fileURLToPath(new URL('../schema/integration.schema.json', here))

/** Where a module keeps its manifest, relative to its folder, in order of preference. */
export const INTEGRATION_SOURCES = ['src/integration.json', 'integration.json']

let schema

/** The manifest's JSON Schema. */
export function integrationSchema() {
  schema ??= JSON.parse(readFileSync(INTEGRATION_SCHEMA_PATH, 'utf8'))

  return schema
}

/** The module's manifest source (`src/integration.json`, else `integration.json`), or null. */
export function findIntegrationManifest(root = process.cwd()) {
  for (const source of INTEGRATION_SOURCES) {
    if (existsSync(resolve(root, source))) {
      return resolve(root, source)
    }
  }

  return null
}

/**
 * Every problem with a manifest as `{ pointer, message }` (none when it is
 * valid; like Atrium, it reports the first it finds).
 */
export function validateIntegrationManifest(manifest) {
  const error = check(manifest, integrationSchema(), '', integrationSchema()) ?? (isObject(manifest) ? rules(manifest) : null)

  return { valid: error === null, errors: error === null ? [] : [{ pointer: error[0], message: error[1] }] }
}

/** Reads and validates a manifest file; throws with its path and the JSON pointer of the first problem. */
export function readIntegrationManifest(path) {
  let manifest

  try {
    manifest = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new Error(`The Atrium integration manifest [${path}] is invalid at [/]: ${error.code === 'ENOENT' ? 'the file does not exist' : `it is not valid JSON (${error.message})`}.`)
  }

  const { errors } = validateIntegrationManifest(manifest)

  if (errors.length > 0) {
    throw new Error(`The Atrium integration manifest [${path}] is invalid at [${errors[0].pointer || '/'}]: ${errors[0].message}. See @refactor-circus/atrium/schema/integration.schema.json.`)
  }

  return manifest
}

/**
 * Copies the module's integration manifest (`integration`, a path relative
 * to `root`: `src/integration.json` or `integration.json` by default, D-090)
 * into the build as `integration.json`, after checking it as Atrium will: an
 * invalid manifest fails the build, naming the JSON pointer of the problem.
 * Returns the source's path relative to `root`, or null without one.
 */
export function copyIntegrationManifest({ root, outDir, integration = findIntegrationManifest(root) }) {
  if (!integration) {
    return null
  }

  const source = resolve(root, integration)
  const manifest = readIntegrationManifest(source)
  const out = resolve(root, outDir)

  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'integration.json'), `${JSON.stringify(manifest, null, 2)}\n`)

  return relative(root, source).split(sep).join('/')
}

// --- The JSON Schema subset the manifest schema uses -------------------------

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isObjectLike = value => isObject(value) || (Array.isArray(value) && value.length === 0)
const show = value => JSON.stringify(value)
const escape = name => String(name).replace(/~/g, '~0').replace(/\//g, '~1')
const depth = pointer => pointer.split('/').length - 1

function equal(a, b) {
  return a === b
}

function resolveRef(ref, root) {
  let node = root

  for (const part of ref.slice(2).split('/')) {
    node = node?.[part.replace(/~1/g, '/').replace(/~0/g, '~')]
  }

  if (node === undefined) {
    throw new Error(`The integration manifest schema has no [${ref}].`)
  }

  return node
}

function typeError(value, types, pointer) {
  const list = Array.isArray(types) ? types : [types]
  const ok = list.some((type) => {
    switch (type) {
      case 'string': return typeof value === 'string'
      case 'integer': return typeof value === 'number' && Number.isInteger(value)
      case 'number': return typeof value === 'number'
      case 'boolean': return typeof value === 'boolean'
      case 'null': return value === null
      case 'array': return Array.isArray(value)
      case 'object': return isObjectLike(value)
      default: return false
    }
  })

  return ok ? null : [pointer, `must be ${list.map(type => (/^[aio]/.test(type) ? 'an ' : 'a ') + type).join(' or ')}`]
}

function check(value, schema, pointer, root) {
  if (schema === true) {
    return null
  }

  if (schema === false) {
    return [pointer, 'is not allowed']
  }

  if (typeof schema.$ref === 'string') {
    const error = check(value, resolveRef(schema.$ref, root), pointer, root)

    if (error) {
      return error
    }
  }

  if (schema.type !== undefined) {
    const error = typeError(value, schema.type, pointer)

    if (error) {
      return error
    }
  }

  if ('const' in schema && !equal(value, schema.const)) {
    return [pointer, `must be ${show(schema.const)}`]
  }

  if (Array.isArray(schema.enum) && !schema.enum.some(item => equal(value, item))) {
    return [pointer, `must be one of ${schema.enum.map(show).join(', ')}`]
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) {
      return [pointer, schema.minLength === 1 ? 'must not be empty' : `must be at least ${schema.minLength} characters`]
    }

    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
      return [pointer, `${show(value)} must match ${schema.pattern}`]
    }
  }

  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) {
    return [pointer, `must be at least ${show(schema.minimum)}`]
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      return [pointer, `must hold at least ${schema.minItems} item(s)`]
    }

    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      return [pointer, `must hold at most ${schema.maxItems} item(s)`]
    }

    if (schema.items !== undefined) {
      for (const [index, item] of value.entries()) {
        const error = check(item, schema.items, `${pointer}/${index}`, root)

        if (error) {
          return error
        }
      }
    }
  }

  if (isObjectLike(value)) {
    const error = object(Array.isArray(value) ? {} : value, schema, pointer, root)

    if (error) {
      return error
    }
  }

  for (const part of schema.allOf ?? []) {
    const error = check(value, part, pointer, root)

    if (error) {
      return error
    }
  }

  for (const keyword of ['anyOf', 'oneOf']) {
    if (!Array.isArray(schema[keyword])) {
      continue
    }

    const errors = []
    let matches = 0

    for (const part of schema[keyword]) {
      const error = check(value, part, pointer, root)

      if (error) {
        errors.push(error)
      } else {
        matches++
      }
    }

    if (matches === 0) {
      return telling(errors, pointer)
    }

    if (keyword === 'oneOf' && matches > 1) {
      return [pointer, 'matches more than one of the allowed shapes']
    }
  }

  if (schema.not !== undefined && check(value, schema.not, pointer, root) === null) {
    return [pointer, `is not allowed here${isObject(value) ? ' (an object with a $ key must be an expression)' : ''}`]
  }

  return null
}

// The most telling of several branches' errors: the deepest pointer, and at
// the same depth one that is not about the value's type or constant.
function telling(errors, pointer) {
  let best = null
  let bestScore = -1

  for (const error of errors) {
    const score = depth(error[0]) * 2 + (/^must be (a |an |one of |[[{"0-9tfn])/.test(error[1]) ? 0 : 1)

    if (score > bestScore) {
      best = error
      bestScore = score
    }
  }

  return best ?? [pointer, 'matches none of the allowed shapes']
}

function object(value, schema, pointer, root) {
  for (const required of schema.required ?? []) {
    if (!(required in value)) {
      return [pointer, `must have the property [${required}]`]
    }
  }

  const count = Object.keys(value).length

  if (schema.minProperties !== undefined && count < schema.minProperties) {
    return [pointer, `must have at least ${schema.minProperties} property`]
  }

  if (schema.maxProperties !== undefined && count > schema.maxProperties) {
    return [pointer, `must have at most ${schema.maxProperties} property`]
  }

  const properties = schema.properties ?? {}

  for (const [name, item] of Object.entries(value)) {
    const at = `${pointer}/${escape(name)}`

    if (schema.propertyNames !== undefined) {
      const error = check(name, schema.propertyNames, at, root)

      if (error) {
        return [at, `is no allowed property name: ${error[1]}`]
      }
    }

    let error = null

    if (Object.hasOwn(properties, name)) {
      error = check(item, properties[name], at, root)
    } else if ('additionalProperties' in schema) {
      error = schema.additionalProperties === false ? [at, 'is not a known property'] : check(item, schema.additionalProperties, at, root)
    }

    if (error) {
      return error
    }
  }

  return null
}

// --- The manifest rules -------------------------------------------------------

const fields = value => (isObject(value) ? value : {})

function rules(manifest) {
  const key = manifest.key
  const prefix = `${key}.`

  for (const list of ['screens', 'widgets', 'search_sources']) {
    const seen = new Set()

    for (const [index, item] of (manifest[list] ?? []).entries()) {
      if (seen.has(item.key)) {
        return [`/${list}/${index}/key`, `[${item.key}] is declared twice`]
      }

      seen.add(item.key)
    }
  }

  for (const [index, screen] of (manifest.screens ?? []).entries()) {
    if (!screen.key.startsWith(prefix)) {
      return [`/screens/${index}/key`, `[${screen.key}] must start with [${prefix}]`]
    }

    if (!screen.path.startsWith(`/${key}/`)) {
      return [`/screens/${index}/path`, `[${screen.path}] must start with [/${key}/]`]
    }

    if (screen.options !== undefined) {
      const error = values(screen.options, `/screens/${index}/options`, key, null)

      if (error) {
        return error
      }
    }
  }

  for (const [index, widget] of (manifest.widgets ?? []).entries()) {
    if (!widget.key.startsWith(prefix)) {
      return [`/widgets/${index}/key`, `[${widget.key}] must start with [${prefix}]`]
    }
  }

  const error = navigation(manifest.navigation ?? [], '/navigation', key)

  if (error) {
    return error
  }

  for (const [index, hook] of (manifest.hooks ?? []).entries()) {
    const error = hookRules(hook, `/hooks/${index}`, key)

    if (error) {
      return error
    }
  }

  return null
}

function navigation(items, pointer, key) {
  for (const [index, item] of items.entries()) {
    const at = `${pointer}/${index}`

    if (item.path !== undefined && !item.path.startsWith(`/${key}/`)) {
      return [`${at}/path`, `[${item.path}] must start with [/${key}/]: an integration links only to its own pages`]
    }

    if (item.live !== undefined && !item.live.key.startsWith(`${key}.`)) {
      return [`${at}/live/key`, `[${item.live.key}] must start with [${key}.]`]
    }

    for (const field of ['sort', 'when']) {
      if (item[field] !== undefined) {
        const error = value(item[field], `${at}/${field}`, key, null)

        if (error) {
          return error
        }
      }
    }

    if (item.live?.options !== undefined) {
      const error = values(item.live.options, `${at}/live/options`, key, null)

      if (error) {
        return error
      }
    }

    const error = navigation(item.children ?? [], `${at}/children`, key)

    if (error) {
      return error
    }
  }

  return null
}

function hookRules(hook, pointer, key) {
  const tabs = fields(hook.tabs)
  const sections = fields(hook.sections)

  for (const [kind, extensions] of [['tabs', tabs], ['sections', sections]]) {
    for (const [name, extension] of Object.entries(extensions)) {
      const at = `${pointer}/${kind}/${escape(name)}`

      if (!name.startsWith(`${key}.`)) {
        return [at, `[${name}] must start with [${key}.]`]
      }

      if (extension.data !== undefined) {
        const error = values(extension.data, `${at}/data`, key, hook.format)

        if (error) {
          return error
        }
      }
    }
  }

  const counts = [Object.keys(tabs).length, Object.keys(sections).length]
  const shape = {
    map: counts[0] <= 1 && counts[1] <= 1 && counts[0] + counts[1] > 0 ? null : 'a map hook declares one tab, one section, or one of each',
    targets: counts[0] === 0 && counts[1] === 1 ? null : 'a targets hook declares exactly one section',
    options: counts[0] === 1 && counts[1] === 0 ? null : 'an options hook declares exactly one tab'
  }[hook.format] ?? (counts[0] + counts[1] > 0 ? null : 'a lists hook declares at least one tab or section')

  if (shape !== null) {
    return [pointer, shape]
  }

  for (const [target, placement] of Object.entries(fields(hook.default))) {
    const at = `${pointer}/default/${escape(target)}`

    if (hook.format === 'map' && (placement === 'tab' ? counts[0] === 0 : counts[1] === 0)) {
      return [at, placement === 'tab' ? 'the hook declares no tab' : `the hook declares no section to place in [${placement}]`]
    }

    if (hook.format !== 'lists' || !Array.isArray(placement)) {
      continue
    }

    for (const [index, entry] of placement.entries()) {
      const name = typeof entry === 'string' ? entry : Object.values(entry)[0]

      if (!Object.hasOwn(typeof entry === 'string' ? tabs : sections, name)) {
        return [`${at}/${index}`, `[${name}] is no ${typeof entry === 'string' ? 'tab' : 'section'} this hook declares`]
      }
    }
  }

  return null
}

function values(map, pointer, key, hookFormat) {
  for (const [name, item] of Object.entries(fields(map))) {
    const error = value(item, `${pointer}/${escape(name)}`, key, hookFormat)

    if (error) {
      return error
    }
  }

  return null
}

function value(item, pointer, key, hookFormat) {
  if (Array.isArray(item)) {
    for (const [index, entry] of item.entries()) {
      const error = value(entry, `${pointer}/${index}`, key, hookFormat)

      if (error) {
        return error
      }
    }

    return null
  }

  if (!isObject(item)) {
    return null
  }

  if ('$config' in item) {
    for (const field of ['$config', 'fallback']) {
      if (item[field] !== undefined && !item[field].startsWith(`${key}.`) && !item[field].startsWith(`atrium.integrations.${key}.`)) {
        return [`${pointer}/${escape(field)}`, `[${item[field]}] is not config of this integration: read only [${key}.*] or [atrium.integrations.${key}.*]`]
      }
    }

    return null
  }

  if ('$screen' in item && hookFormat === null) {
    return [pointer, '$screen is only allowed in hook data']
  }

  if ('$option' in item && hookFormat !== 'options') {
    return [pointer, '$option is only allowed in the data of an options hook']
  }

  if ('$subject_scope' in item) {
    if (hookFormat === null) {
      return [pointer, '$subject_scope is only allowed in hook data']
    }

    if (item.$subject_scope?.type !== 'map') {
      return [`${pointer}/$subject_scope/type`, '$subject_scope reads a config value of type map']
    }

    return value(item.$subject_scope, `${pointer}/$subject_scope`, key, hookFormat)
  }

  if ('$screen' in item || '$option' in item) {
    return null
  }

  return values(item, pointer, key, hookFormat)
}
