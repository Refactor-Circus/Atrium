import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import type { components } from '../client/schema'
import type {
  CortexConcreteAgent,
  CortexRedirectDomain,
  CortexServer,
  CortexSettingsSummary,
  CortexTool
} from '../src/components/cortex'
import type { AtriumIntegrationScreen } from '@refactor-circus/atrium'
import { settle } from '@refactor-circus/atrium/testing'
import { mountIntegration, packageCalls, type PackageCall } from '@refactor-circus/atrium/testing'

/*
 * Shared pieces of the Cortex screen suites (AC 54, 55): payloads typed with
 * `satisfies` against the vendored `components` (or, where Scramble types a
 * resource loosely, against the shape the page reads, `cortex.ts`), the
 * `atrium.screens.show` answer, and a page mounter.
 *
 * Each suite mocks `useAtriumApi` itself (`mockNuxtImport` is per file) and
 * answers `/screens/{key}` with `screenOf(key)`.
 */

type Schemas = components['schemas']

export const virtualAgent = {
  name: 'Triage',
  slug: 'triage',
  description: 'Sorts incoming tickets',
  instructions: 'You sort tickets.',
  published_version: 2,
  provider: 'openai',
  model: 'gpt-5',
  settings: { temperature: 0.2 },
  tools: ['lookup-order'],
  sub_agents: [],
  concrete_sub_agents: [],
  created_at: '2026-11-01T10:00:00+00:00',
  updated_at: '2026-11-02T10:00:00+00:00'
} satisfies Schemas['VirtualAgentResource']

export const versions = [
  { version: 1, content: 'You sort.', created_at: '2026-11-01T10:00:00+00:00' },
  { version: 2, content: 'You sort tickets.', created_at: '2026-11-02T10:00:00+00:00' }
] satisfies Schemas['VirtualAgentVersionResource'][]

export const concreteAgent = {
  name: 'support-triage',
  overridable: true,
  tools_overridable: true,
  instructions: 'You triage support.',
  tools: ['lookup-order'],
  default_instructions: 'You triage support.',
  default_tools: ['lookup-order'],
  published_version: null,
  tools_overridden: false
} satisfies CortexConcreteAgent

export const tools = [
  { name: 'lookup-order', description: 'Finds an order', schema: {}, tags: ['orders'] },
  { name: 'create-ticket', description: 'Opens a ticket', schema: {}, tags: ['support'] }
] satisfies CortexTool[]

export const toolDescription = {
  tool: 'lookup-order',
  published_version: null,
  published_content: null,
  created_at: null,
  updated_at: null
} satisfies Schemas['ToolDescriptionResource']

export const server = {
  name: 'support',
  instructions: 'Serve support tools.',
  tools: ['lookup-order'],
  tools_overridden: true,
  missing_tools: [],
  ambiguous_tools: []
} satisfies CortexServer

export const instruction = {
  server: 'support',
  published_version: 1,
  published_content: 'Serve support tools carefully.',
  created_at: null,
  updated_at: null
} satisfies Schemas['McpInstructionResource']

export const redirectDomain = {
  id: '01JD7Z5K3W',
  domain: 'https://claude.ai',
  owner_type: null,
  owner_id: null,
  created_at: '2026-11-01T10:00:00+00:00',
  updated_at: '2026-11-01T10:00:00+00:00'
} satisfies CortexRedirectDomain

export const settingsSummary = {
  providers: [{ name: 'openai', models: ['gpt-5'] }, { name: 'anthropic', models: ['claude'] }],
  tool_count: 9,
  agent_count: 4,
  server_count: 1,
  cache_enabled: true
} satisfies CortexSettingsSummary

export const runnableAgents = [
  { type: 'virtual_agent', key: 'triage', name: 'Triage' },
  { type: 'concrete_agent', key: 'support-triage', name: 'support-triage' }
] satisfies Schemas['AgentReferenceResource'][]

/** The `atrium.screens.show` answer for a Cortex screen with no extensions. */
export function screenOf(key: string, record: string | null = null): { data: AtriumIntegrationScreen } {
  return {
    data: {
      key,
      kind: record === null ? 'list' : 'detail',
      path: '/cortex',
      subject_type: null,
      record,
      open_tab: 'overview',
      tabs: [],
      sections: {},
      rows: {}
    }
  }
}

/** A `useAtriumApi()` stand-in answering `/screens/{key}` with `screenOf()`. */
export function screensApi(path: string, options?: { query?: Record<string, unknown> }): Promise<unknown> {
  const match = /^\/screens\/(.+)$/.exec(path)
  const record = options?.query?.record

  return match
    ? Promise.resolve(screenOf(decodeURIComponent(match[1]!), typeof record === 'string' ? record : null))
    : Promise.reject(new Error(`Unexpected Atrium API call: ${path}`))
}

// A page left mounted keeps watching the route and reloads when the next
// test navigates, so every suite that mounts Cortex pages unmounts them after
// each test.
enableAutoUnmount(afterEach)

/** Mounts a Cortex page at `route`, with Cortex active in the shell, and lets it load. */
export async function mountCortexPage<T>(page: T, route: string) {
  const wrapper = await mountIntegration(page, 'cortex', { route })
  await settle()

  return wrapper
}

/** The Cortex calls with `method` to the route template `route` (`/virtual-agents/{agent}`). */
export function cortexCalls(method: string, route: string): PackageCall[] {
  return packageCalls.filter(call => call.pkg === 'cortex' && call.method === method && call.route === route)
}

/** Answers every `window.confirm()` with `answer`. */
export function confirmWith(answer: boolean) {
  return vi.spyOn(window, 'confirm').mockReturnValue(answer)
}
