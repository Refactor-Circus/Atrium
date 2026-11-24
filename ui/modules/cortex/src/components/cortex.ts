import { ref, shallowRef } from 'vue'
import type { components } from '../../client/schema'
import { AtriumIntegrationError, useAtriumIntegration, type AtriumIntegrationClient } from '@refactor-circus/atrium'
import { atriumStatus } from '@refactor-circus/atrium'

/*
 * Shared pieces of the Cortex pages: the payload types, the client, a loader
 * and a mutation runner.
 *
 * The types come from the vendored `client/schema.d.ts` where it is right.
 * Scramble types some of Cortex's resources loosely (lists and booleans as
 * `string`, the tool-picker bodies as no body at all), so those are declared
 * here as Cortex's resources build them; the gaps are Cortex's to fix in its
 * `schema()` declarations.
 */

type Schemas = components['schemas']

export type CortexClient = AtriumIntegrationClient<'cortex'>

export type CortexVirtualAgent = Schemas['VirtualAgentResource']
export type CortexAgentReference = Schemas['AgentReferenceResource']
export type CortexConcreteAgentOverride = Schemas['ConcreteAgentOverrideResource']
export type CortexToolDescription = Schemas['ToolDescriptionResource']
export type CortexServerInstruction = Schemas['McpInstructionResource']
export type CortexAgentRun = Schemas['AgentRunResource']

/** A version of a versioned text: a virtual agent's prompt, or an override. */
export interface CortexVersion {
  version: number
  content: string
  created_at: string | null
}

/** `ConcreteAgentResource` (the schema types its lists and booleans as `string`). */
export interface CortexConcreteAgent {
  name: string
  overridable: boolean
  tools_overridable: boolean
  instructions: string
  tools: string[]
  default_instructions?: string | null
  default_tools: string[]
  published_version: number | null
  tools_overridden: boolean
}

/** `ToolResource` (the schema types `schema` and `tags` as `string`). */
export interface CortexTool {
  name: string
  description: string
  schema: Record<string, unknown>
  tags: string[]
}

/** `McpServerResource` (the schema leaves out its tool report). */
export interface CortexServer {
  name: string
  instructions: string
  tools: string[]
  tools_overridden: boolean
  missing_tools: string[]
  ambiguous_tools: string[]
}

/** One entry of `providers.index` (the schema types the list as `string`). */
export interface CortexProvider {
  name: string
  models: string[]
  default_model: string | null
}

/** `SettingsSummaryResource` (the schema types every field as `string`). */
export interface CortexSettingsSummary {
  providers: { name: string, models: string[] }[]
  tool_count: number
  agent_count: number
  server_count: number
  cache_enabled: boolean
}

/** `RedirectDomainResource` (the schema types its lists as `string`). */
export interface CortexRedirectDomain {
  id: string
  domain: string
  owner_type: string | null
  owner_id: string | null
  created_at: string | null
  updated_at: string | null
}

/** A JSON:API-style list, with Laravel's paginator `meta` when it pages. */
export interface CortexList<T> {
  data: T[]
  meta?: { current_page?: number, last_page?: number }
}

/** One record under `data`. */
export interface CortexOne<T> {
  data: T
}

/**
 * The routes of one versioned text, for <CortexVersions>: its versions, a new
 * version, publishing one, and removing the override (back to the code's).
 */
export interface CortexVersionsApi {
  list: () => Promise<CortexVersion[]>
  store: (body: { content: string, publish: boolean }) => Promise<unknown>
  publish: (version: number) => Promise<unknown>
  destroy?: () => Promise<unknown>
}

/** A checkbox of the tool picker. */
export interface CortexPickerTool {
  name: string
  label: string
  tags: string[]
}

/**
 * The Cortex client, signed by the app's auth adapter; null while the
 * integration is not active (the page then shows as unavailable).
 */
export function useCortex(): CortexClient | null {
  return useAtriumIntegration('cortex').client
}

/**
 * The data of an `openapi-fetch` answer as `T`, or an `AtriumIntegrationError`
 * carrying its status and body. For the answers the vendored schema types
 * loosely, the page names the shape Cortex really sends.
 */
export function cortexData<T>(result: { data?: unknown, error?: unknown, response: Response }): T {
  if (!result.response.ok) {
    throw new AtriumIntegrationError(result.response.status, result.error)
  }

  return result.data as T
}

/**
 * A request body the vendored schema does not type (Scramble documents the
 * tool-picker routes without one), sent as Cortex validates it.
 */
export function untypedBody<T>(body: T): never {
  return body as never
}

/**
 * Loads a page's data from Cortex, and again on `reload()`. `pending` is true
 * only while there is nothing to show yet, so a reload keeps the page (and
 * its forms) mounted. `status` is the HTTP status of a failed load (403
 * shows no access, 404 not found).
 */
export function useCortexLoad<T>(load: (client: CortexClient) => Promise<T>) {
  const client = useCortex()
  const data = shallowRef<T | null>(null)
  const pending = ref(true)
  const failed = ref(false)
  const status = ref<number | null>(null)

  async function reload(): Promise<void> {
    if (!client) {
      pending.value = false
      return
    }

    pending.value = data.value === null

    try {
      data.value = await load(client)
      failed.value = false
      status.value = null
    } catch (error) {
      failed.value = true
      status.value = atriumStatus(error)
    } finally {
      pending.value = false
    }
  }

  void reload()

  return { client, data, pending, failed, status, reload }
}

/**
 * Runs a mutation against Cortex. A 422 fills `errors` (by field), a 403 sets
 * `forbidden`, and any other failure sets `message`; `run()` resolves whether
 * the mutation succeeded, so the page reloads only then.
 */
export function useCortexAction() {
  const errors = ref<Record<string, string[]>>({})
  const message = ref<string | null>(null)
  const forbidden = ref(false)
  const busy = ref(false)

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    busy.value = true
    errors.value = {}
    message.value = null
    forbidden.value = false

    try {
      await action()
      return true
    } catch (error) {
      const status = atriumStatus(error)
      const body = (error instanceof AtriumIntegrationError ? error.body : null) as { message?: unknown, errors?: Record<string, string[]> } | null

      if (status === 403) {
        forbidden.value = true
      } else if (status === 422 && body?.errors) {
        errors.value = body.errors
      } else {
        message.value = typeof body?.message === 'string' ? body.message : error instanceof Error ? error.message : String(error)
      }

      return false
    } finally {
      busy.value = false
    }
  }

  /** The first error of `field`, or of any of its entries (`tools.*`). */
  function error(field: string): string | undefined {
    const own = errors.value[field]?.[0]

    if (own) {
      return own
    }

    const entry = Object.keys(errors.value).find(key => key.startsWith(`${field}.`))

    return entry ? errors.value[entry]?.[0] : undefined
  }

  return { errors, message, forbidden, busy, run, error }
}
