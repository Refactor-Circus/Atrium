import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * PLAYGROUND ONLY. A stand-in for every suite package's API, so the
 * playground renders each integration's pages populated without the
 * packages installed (the workbench points the integrations here:
 * `workbench/app/Atrium/DemoSuite.php`).
 *
 *   GET /_suite/showroom/products  ->  a page of believable products
 *
 * Answers come from the package's vendored `openapi.json`
 * (`layer/app/integrations/{pkg}/client/`): the operation's 2xx schema,
 * filled with deterministic values chosen from each property's name and
 * format. Writes answer with the same shape and change nothing. Where a
 * schema types a list loosely (`data: string[]`), the resource schema named
 * after the path (`/products` -> `ProductResource`) fills it instead.
 *
 * Demo states: a path holding `__fail` answers 500, and a list queried with
 * `__empty` in any parameter answers an empty page.
 */

type Schema = Record<string, any>
interface Doc { paths: Record<string, Record<string, any>>, components?: { schemas?: Record<string, Schema>, responses?: Record<string, any> } }

const docs = new Map<string, Doc | null>()

function layerRoot(): string {
  const candidates = [resolve(process.cwd(), '../layer'), resolve(process.cwd(), 'nuxt/layer'), resolve(process.cwd(), 'layer')]

  return candidates.find(dir => existsSync(join(dir, 'app/integrations'))) ?? candidates[0]!
}

function doc(pkg: string): Doc | null {
  if (!docs.has(pkg)) {
    const file = join(layerRoot(), 'app/integrations', pkg, 'client/openapi.json')

    docs.set(pkg, /^[a-z]+$/.test(pkg) && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) as Doc : null)
  }

  return docs.get(pkg)!
}

function hash(text: string): number {
  let h = 2166136261

  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  }

  return h >>> 0
}

const WORDS = ['Aurora', 'Vector', 'Helix', 'Nimbus', 'Quartz', 'Orbit', 'Cobalt', 'Pulse', 'Atlas', 'Zenith', 'Ember', 'Nova', 'Prism', 'Vertex', 'Lumen', 'Strata']
const NOUNS = ['Mortise lock', 'Exit device', 'Door closer', 'Hinge set', 'Access panel', 'Card reader', 'Strike plate', 'Cylinder', 'Lever trim', 'Kick plate', 'Power supply', 'Keypad']
const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Linus Torvalds', 'Margaret Hamilton', 'Dennis Ritchie', 'Barbara Liskov', 'Ken Thompson', 'Radia Perlman', 'Tim Berners-Lee', 'Frances Allen']
const COMPANIES = ['Northwind Traders', 'Initech', 'Umbrella Health', 'Stark Industries', 'Wayne Enterprises', 'Hooli', 'Globex', 'Soylent Corp', 'Tyrell Systems', 'Wonka Industries']
const SENTENCES = [
  'Synchronised from the upstream catalogue on the last nightly run.',
  'Applies to every channel unless a narrower rule overrides it.',
  'Created during the spring onboarding import.',
  'Reviewed and approved by the operations team.',
  'Pending verification against the supplier feed.'
]

interface Ctx { doc: Doc, seed: string, depth: number, params: Record<string, string> }

function pick<T>(list: readonly T[], seed: string): T {
  return list[hash(seed) % list.length]!
}

function deref(schema: Schema | undefined, d: Doc): Schema {
  let current = schema ?? {}
  let guard = 0

  while (current.$ref && guard++ < 10) {
    const name = String(current.$ref).split('/').pop()!
    current = (String(current.$ref).includes('/responses/') ? d.components?.responses?.[name] : d.components?.schemas?.[name]) ?? {}
  }

  return current
}

function typeOf(schema: Schema): string | undefined {
  const type = schema.type

  if (Array.isArray(type)) {
    return type.find((t: string) => t !== 'null')
  }

  return type ?? (schema.properties ? 'object' : schema.items ? 'array' : schema.enum ? 'string' : undefined)
}

function isWeak(schema: Schema | undefined, d: Doc): boolean {
  const s = deref(schema, d)
  const type = typeOf(s)

  return type === undefined || type === 'string' || (type === 'object' && !s.properties)
}

function pascal(segment: string): string {
  return segment.split(/[-_]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
}

function singular(word: string): string {
  return word.endsWith('ies') ? `${word.slice(0, -3)}y` : word.endsWith('sses') ? word.slice(0, -2) : word.endsWith('s') ? word.slice(0, -1) : word
}

/** The resource schema named after a path's last static segment. */
function resourceFor(template: string, d: Doc): Schema | undefined {
  const segments = template.split('/').filter(s => s && !s.startsWith('{'))
  const names = Object.keys(d.components?.schemas ?? {})

  for (const segment of segments.reverse()) {
    const base = pascal(singular(segment))
    const found = names.find(n => n.toLowerCase() === `${base}resource`.toLowerCase())
      ?? names.find(n => n.toLowerCase() === base.toLowerCase())
      ?? names.find(n => n.toLowerCase().endsWith(`${base}resource`.toLowerCase()))

    if (found) {
      return d.components!.schemas![found]
    }
  }

  return undefined
}

function stringFor(name: string, schema: Schema, ctx: Ctx, index: number): string {
  const seed = `${ctx.seed}:${name}:${index}`
  const n = hash(seed)
  const lower = name.toLowerCase()

  if (schema.enum?.length) {
    return pick(schema.enum.filter((v: unknown) => v !== null), seed) as string
  }

  for (const [param, value] of Object.entries(ctx.params)) {
    if (ctx.depth <= 2 && (lower === param.toLowerCase() || ['id', 'code', 'slug', 'identifier', 'key', 'name', 'uuid'].includes(lower)) && index === 0 && lower.replace(/_/g, '') === param.toLowerCase().replace(/_/g, '')) {
      return value
    }
  }

  if (schema.format === 'date-time' || lower.endsWith('_at') || lower.endsWith('_since') || lower.endsWith('until')) {
    return new Date(Date.UTC(2026, 10, 23, 9) - (n % (60 * 24 * 21)) * 60_000).toISOString()
  }

  if (schema.format === 'date' || lower.endsWith('_on') || lower === 'date') {
    return new Date(Date.UTC(2026, 10, 23) - (n % 90) * 86_400_000).toISOString().slice(0, 10)
  }

  if (schema.format === 'email' || lower.includes('email')) {
    return `${pick(PEOPLE, seed).split(' ')[0]!.toLowerCase()}@${pick(['acme', 'globex', 'initech', 'hooli'], `${seed}d`)}.test`
  }

  if (schema.format === 'uri' || lower.endsWith('url') || lower === 'href' || lower.endsWith('_uri')) {
    return `https://assets.example.test/${(n % 9000 + 1000).toString(36)}`
  }

  if (lower === 'uuid' || schema.format === 'uuid' || lower.endsWith('_uuid')) {
    return `${(n >>> 0).toString(16).padStart(8, '0')}-4b1e-4c${(n % 99).toString().padStart(2, '0')}-9a${(n % 7)}e-1f2c3d4e5f6a`.slice(0, 36)
  }

  if (lower === 'ip' || lower.includes('ip_address') || lower === 'cidr') {
    return `203.0.113.${n % 254 + 1}${lower === 'cidr' ? '/32' : ''}`
  }

  if (lower === 'id' || lower.endsWith('_id')) {
    return String(1000 + (n % 8999))
  }

  if (['code', 'identifier', 'sku', 'key', 'slug', 'handle', 'reference', 'number', 'external_id'].includes(lower) || lower.endsWith('_code') || lower.endsWith('_key')) {
    const word = pick(WORDS, seed).toLowerCase()

    return lower === 'sku' || lower === 'identifier' || lower === 'number' ? `${word.slice(0, 3).toUpperCase()}-${1000 + (n % 8999)}` : `${word}-${n % 97}`
  }

  if (lower === 'locale') {
    return 'en_US'
  }

  if (lower === 'currency') {
    return 'USD'
  }

  if (lower.includes('user') || lower.includes('author') || lower.includes('actor') || lower.includes('causer') || lower === 'owner_name' || lower.includes('person')) {
    return pick(PEOPLE, seed)
  }

  if (lower.includes('company') || lower.includes('organization') || lower.includes('organisation') || lower.includes('tenant')) {
    return pick(COMPANIES, seed)
  }

  if ((lower === 'name' || lower === 'display_name') && /user|member|impersonat|identit/.test(ctx.seed.split(':')[0]!)) {
    return pick(PEOPLE, seed)
  }

  if (lower === 'name' && /organi[sz]ation|tenant|compan/.test(ctx.seed.split(':')[0]!)) {
    return pick(COMPANIES, seed)
  }

  if (lower === 'name' || lower === 'label' || lower === 'title' || lower.endsWith('_name') || lower.endsWith('_label')) {
    return `${pick(WORDS, seed)} ${pick(NOUNS, `${seed}n`)}`
  }

  if (lower.includes('description') || lower.includes('message') || lower.includes('summary') || lower.includes('notes') || lower.includes('reason') || lower.includes('instructions') || lower === 'body' || lower === 'text') {
    return pick(SENTENCES, seed)
  }

  if (lower.includes('status') || lower === 'state') {
    return pick(['active', 'pending', 'completed', 'failed'], seed)
  }

  if (lower === 'type' || lower.endsWith('_type') || lower === 'kind' || lower === 'driver' || lower === 'method') {
    return pick(['standard', 'scheduled', 'manual', 'webhook'], seed)
  }

  if (lower.includes('version')) {
    return `v${1 + (n % 4)}.${n % 10}.${n % 7}`
  }

  return `${pick(WORDS, seed)} ${n % 100}`
}

function generate(schema: Schema | undefined, name: string, ctx: Ctx, index = 0): unknown {
  const s = deref(schema, ctx.doc)

  if (ctx.depth > 7) {
    return null
  }

  const choice = s.oneOf ?? s.anyOf

  if (choice) {
    const options = (choice as Schema[]).filter(option => deref(option, ctx.doc).type !== 'null')

    return generate(options[0] ?? {}, name, ctx, index)
  }

  if (s.allOf) {
    return Object.assign({}, ...(s.allOf as Schema[]).map(part => generate(part, name, ctx, index)))
  }

  const type = typeOf(s)
  const seed = `${ctx.seed}:${name}:${index}`

  // Showroom's associations: `{type: {products, product_models, groups}}`.
  if ((name === 'associations' || name === 'quantified_associations') && ctx.seed.startsWith('showroom')) {
    return { related: { products: [`${pick(WORDS, seed).slice(0, 3).toUpperCase()}-2041`], product_models: [], groups: [] } }
  }

  // Showroom's attribute values: `{code: [{scope, locale, data}]}`.
  if (name === 'values' && ctx.seed.startsWith('showroom')) {
    return {
      name: [{ scope: null, locale: 'en_US', data: `${pick(WORDS, seed)} ${pick(NOUNS, `${seed}n`)}` }],
      description: [{ scope: null, locale: 'en_US', data: pick(SENTENCES, seed) }]
    }
  }
  const n = hash(seed)
  const lower = name.toLowerCase()
  const inner = { ...ctx, depth: ctx.depth + 1, seed }

  switch (type) {
    case 'object': {
      if (!s.properties) {
        // Loosely typed collections the pages read as lists of codes.
        if (lower === 'categories' || lower === 'flags') {
          return [0, 1].map(i => `${pick(WORDS, `${seed}${i}`).toLowerCase()}-${i + 1}`)
        }

        if (lower === 'labels' || lower.endsWith('_labels') || lower === 'translations') {
          return { en_US: `${pick(WORDS, seed)} ${pick(NOUNS, `${seed}n`)}` }
        }

        return {}
      }

      return Object.fromEntries(Object.entries(s.properties as Record<string, Schema>).map(([key, value]) => [key, generate(value, key, inner, 0)]))
    }
    case 'array': {
      const count = ctx.depth <= 1 ? 14 : ctx.depth <= 3 ? 3 : 1

      return Array.from({ length: count }, (_, i) => generate(s.items ?? { type: 'string' }, singular(name), { ...inner, seed: `${seed}#${i}` }, i))
    }
    case 'integer':
    case 'number': {
      const max = typeof s.maximum === 'number' ? s.maximum : lower.includes('ratio') || lower.includes('percent') ? 100 : lower.includes('count') || lower.includes('total') ? 480 : 240
      const min = typeof s.minimum === 'number' ? s.minimum : 0

      return min + (n % Math.max(1, max - min + 1))
    }
    case 'boolean':
      return n % 4 !== 0
    case 'null':
      return null
    default:
      return stringFor(name, s, ctx, index)
  }
}

/** Answers for operations whose schema says too little to fill (`items: {}`). */
const OVERRIDES: Record<string, (params: Record<string, string>) => unknown> = {
  'showroom GET /products/{product}/versions': () => ({
    data: [3, 2, 1].map(version => ({
      version,
      status: version === 3 ? 'draft' : 'approved',
      published: version === 2,
      changes: version === 1 ? { created: true } : { name: 'changed', description: 'changed' },
      author_type: 'user',
      author_id: 7,
      created_at: new Date(Date.UTC(2026, 10, 20 - version * 3, 10)).toISOString()
    }))
  })
}

function match(d: Doc, path: string, method: string): { template: string, operation: any, params: Record<string, string> } | null {
  let best: { template: string, operation: any, params: Record<string, string>, score: number } | null = null

  for (const [template, operations] of Object.entries(d.paths)) {
    const operation = operations[method]

    if (!operation) {
      continue
    }

    const names: string[] = []
    const pattern = new RegExp(`^${template.replace(/\{([^}]+)\}/g, (_, param: string) => { names.push(param); return '([^/]+)' })}/?$`)
    const found = pattern.exec(path)

    if (found) {
      const score = template.split('/').filter(s => s && !s.startsWith('{')).length

      if (!best || score > best.score) {
        best = { template, operation, params: Object.fromEntries(names.map((param, i) => [param, decodeURIComponent(found[i + 1]!)])), score }
      }
    }
  }

  return best
}

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': getRequestHeader(event, 'origin') ?? '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  })

  const method = event.method.toLowerCase()

  if (method === 'options') {
    setResponseStatus(event, 204)

    return ''
  }

  const [pkg = '', ...rest] = (getRouterParam(event, 'path') ?? '').split('/')
  const d = doc(pkg)
  const path = `/${rest.join('/')}`.split('?')[0]!
  const found = d ? match(d, path, method) : null

  if (!d || !found) {
    setResponseStatus(event, 404)

    return { message: `No ${method.toUpperCase()} ${path} in ${pkg || 'this'} API.` }
  }

  const query = getQuery(event)

  // Demo states: an id `__fail` answers 500, a search for `__empty` nothing.
  if (path.includes('__fail')) {
    setResponseStatus(event, 500)

    return { message: 'The stand-in failed on purpose.' }
  }

  const [status, response] = Object.entries(found.operation.responses ?? {}).find(([code]) => code.startsWith('2')) ?? ['204', null]
  const schema = deref(response as Schema | undefined, d).content?.['application/json']?.schema as Schema | undefined

  setResponseStatus(event, Number(status))

  if (!schema) {
    return status === '204' ? '' : {}
  }

  const override = OVERRIDES[`${pkg} ${method.toUpperCase()} ${found.template}`]

  if (override) {
    return override(found.params)
  }

  const ctx: Ctx = { doc: d, seed: `${pkg}${found.template}:${String(query.page ?? 1)}`, depth: 0, params: found.params }
  const resolved = deref(schema, d)
  const isList = method === 'get' && !found.template.endsWith('}')

  if (resolved.properties?.data !== undefined && isWeak(typeOf(deref(resolved.properties.data, d)) === 'array' ? deref(resolved.properties.data, d).items : resolved.properties.data, d)) {
    const resource = resourceFor(found.template, d)

    if (resource) {
      const isArray = typeOf(deref(resolved.properties.data, d)) === 'array' || isList
      const body = generate({ ...resolved, properties: { ...resolved.properties, data: isArray ? { type: 'array', items: resource } : resource } }, 'root', ctx) as Record<string, unknown>

      return isList ? withPaging(body, query) : body
    }
  }

  const body = generate(resolved, 'root', ctx)

  return isList && body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>).data) ? withPaging(body as Record<string, unknown>, query) : body
})

function withPaging(body: Record<string, unknown>, query: Record<string, unknown>): Record<string, unknown> {
  const page = Number(query.page ?? 1) || 1

  if (Object.values(query).some(value => String(value).includes('__empty'))) {
    return { ...body, data: [], meta: { ...(body.meta as object ?? {}), current_page: 1, last_page: 1, per_page: 15, from: null, to: null, total: 0 }, links: { first: '?page=1', last: '?page=1', prev: null, next: null } }
  }

  const count = Array.isArray(body.data) ? body.data.length : 0

  return {
    ...body,
    meta: { ...(body.meta as object ?? {}), current_page: page, last_page: 4, per_page: count, from: (page - 1) * count + 1, to: page * count, total: count * 4 - 5 },
    links: { first: '?page=1', last: '?page=4', prev: page > 1 ? `?page=${page - 1}` : null, next: page < 4 ? `?page=${page + 1}` : null }
  }
}
