import type { components } from '../client/schema'
import type { AtriumIntegrationScreen } from '@refactor-circus/atrium'
import { settle } from '@refactor-circus/atrium/testing'
import { integrationEntry, integrationShell, type PackageBody, type PackageCall, resetPackageApis, useShell } from '@refactor-circus/atrium/testing'
import { clearAtriumData, mountSuspended, useRouter } from '@refactor-circus/atrium/testing'

/*
 * What the Impex suites share: payloads typed against the vendored schema
 * with `satisfies`, a screen answer for `atrium.screens.show`, and mounting a
 * page at its path with Impex active in the shell.
 */

type Schemas = components['schemas']

export const run = {
  id: 'run-1',
  flow: 'orders.sync',
  status: 'running',
  trigger: 'api',
  version: null,
  idempotency_key: null,
  tags: null,
  error: null,
  parent_run_id: null,
  close_policy: null,
  expires_at: null,
  started_at: '2026-11-20T10:00:00Z',
  finished_at: null,
  created_at: '2026-11-20T10:00:00Z',
  updated_at: '2026-11-20T10:00:00Z'
} satisfies Schemas['RunResource']

export const failedRun = { ...run, id: 'run-2', status: 'failed', finished_at: '2026-11-20T10:05:00Z' } satisfies Schemas['RunResource']

export const step = {
  id: 'step-1',
  phase: 'forward',
  sequence: 1,
  type: 'action',
  name: 'fetch-orders',
  status: 'completed',
  attempts: 1,
  max_attempts: 3,
  resumptions: 0,
  undone: false,
  undoes_sequence: null,
  unit_id: null,
  expires_at: null,
  error: null,
  has_result: true,
  result_artifact_id: null,
  started_at: '2026-11-20T10:00:00Z',
  completed_at: '2026-11-20T10:00:01Z'
} satisfies Schemas['RunStepResource']

export const message = {
  id: 'msg-1',
  run_id: 'run-1',
  step_id: null,
  direction: 'outbound',
  channel: 'erp',
  transport: 'http',
  endpoint: 'https://erp.example.com/orders',
  method: 'POST',
  status_code: 200,
  headers: null,
  bytes: 512,
  body_preview: '{"ok":true}',
  body_artifact_id: null,
  body_encoding: 'utf-8',
  body_sha256: null,
  delivery_id: null,
  signature_valid: null,
  duration_ms: 42,
  error: null,
  occurred_at: '2026-11-20T10:00:02Z'
} satisfies PackageBody<'impex', 'GET /messages'>['data'][number]

export const flow = { slug: 'orders.sync', class: 'App\\Flows\\SyncOrders', enabled: true, schedule: null } satisfies PackageBody<'impex', 'GET /flows'>['data'][number]

export const storedChannel = {
  id: 'ch-1',
  name: 'erp',
  direction: 'outbound',
  transport: 'http',
  status: 'active',
  body_policy: 'all',
  verifies_signatures: true,
  flow: null,
  path: null,
  options: { url: 'https://erp.example.com' },
  stored: true,
  owner_type: null,
  owner_id: null
} satisfies Schemas['ChannelResource']

export const configuredChannel = { ...storedChannel, id: null, name: 'webhooks.in', direction: 'inbound', stored: false, flow: 'orders.receive' } satisfies Schemas['ChannelResource']

/** A subscription as `impex.subscriptions.index` lists it. */
export const subscriptionRow = {
  id: 'sub-1',
  subscriber_id: 'subscriber-1',
  stream: 'products',
  topics: ['created', 'updated'],
  selection: 'all',
  filter: null,
  format: 'json',
  options: null,
  status: 'active',
  endpoint: { url: 'https://partner.example.com/hook' },
  cursor: '120',
  failures: 0,
  pending: false,
  paused_until: null,
  disabled_at: null,
  last_delivered_at: '2026-11-20T09:00:00Z',
  last_error: null,
  last_export_path: null,
  last_export_at: null,
  created_at: '2026-11-01T00:00:00Z'
} satisfies PackageBody<'impex', 'GET /subscriptions'>['data'][number]

/**
 * The same subscription as `impex.subscriptions.show` answers it. The
 * vendored schema types its `endpoint` as an array (a loose Scramble type);
 * the API sends the object the list documents.
 */
export const subscription = {
  ...subscriptionRow,
  endpoint: subscriptionRow.endpoint as unknown as unknown[]
} satisfies Schemas['SubscriptionResource']

export const delivery = {
  id: 'del-1',
  subscription_id: 'sub-1',
  first_event_id: '100',
  last_event_id: '120',
  events: 21,
  status: 'succeeded',
  message_id: 'msg-1',
  status_code: 200,
  duration_ms: 80,
  error: null,
  attempted_at: '2026-11-20T09:00:00Z'
} satisfies Schemas['DeliveryResource']

export const stats = {
  runs: {
    by_status: { pending: 1, running: 2, waiting: 0, rolling_back: 0, completed: 40, failed: 3, cancelled: 1 },
    active: 3,
    recent_failures: [failedRun]
  },
  messages: { window_hours: 24, inbound: 12, outbound: 34 }
} satisfies Schemas['RunStatsResource']

export const settingsSummary = {
  retention: { completed_runs_days: 30, failed_runs_days: 90, messages_days: 14, artifacts_days: 90, events_days: 30, deliveries_days: 30 },
  limits: { max_step_seconds: 300, resume_margin_seconds: 30, lease_seconds: 360, lock_seconds: 10, max_resumptions: 50, fan_out_max: 500, sync_seconds: 25 },
  artifacts: { disk: null, path: 'impex/artifacts', inline_threshold: 65536, memo_bytes: 4096 },
  preview_bytes: 2048
} satisfies Schemas['SettingsSummaryResource']

/** A cursor page as Impex's list endpoints answer it. */
export function page<T>(data: T[], nextCursor: string | null = null) {
  return { data, meta: { per_page: 25, next_cursor: nextCursor, prev_cursor: null } }
}

/** What `atrium.screens.show` answers for an Impex screen: no extensions. */
export function screenAnswer(key: string, record: string | null = null): { data: AtriumIntegrationScreen } {
  return {
    data: {
      key,
      kind: record === null ? 'list' : 'detail',
      path: '',
      subject_type: null,
      record,
      open_tab: 'overview',
      tabs: [{ key: 'overview', label: 'Overview', icon: null, built_in: true, component: null }],
      sections: { 'header.actions': [], 'before': [], 'after': [], 'aside': [] },
      rows: {}
    }
  }
}

/**
 * A `useAtriumApi()` stand-in: `atrium.screens.show` answers an empty screen
 * for the key it is asked, anything else `{ data: [] }`.
 */
export async function atriumApi(path: string, options?: { query?: Record<string, unknown> }): Promise<unknown> {
  if (path.startsWith('/screens/')) {
    const record = options?.query?.record

    return screenAnswer(decodeURIComponent(path.slice('/screens/'.length)), typeof record === 'string' ? record : null)
  }

  return { data: [] }
}

/** Impex active in the shell, nothing cached, and the route at `/`. */
export async function resetImpex(): Promise<void> {
  clearAtriumData()
  resetPackageApis()
  await useShell(integrationShell([integrationEntry('impex')]))
}

/** Forgets the mocked APIs and goes back to `/`. */
export async function leaveImpex(): Promise<void> {
  resetPackageApis()
  await useRouter().replace('/')
}

/**
 * Mounts an Impex page at `path` (with its query), as the router would
 * render it there, and lets its requests settle.
 */
export async function mountImpexPage<T>(component: T, path: string): ReturnType<typeof mountSuspended<T>> {
  await useRouter().push(path)

  const wrapper = await mountSuspended(component, { route: path } as Parameters<typeof mountSuspended<T>>[1])
  await settle()

  return wrapper
}

/** The calls matching a method and route template. */
export function callsTo(calls: readonly PackageCall[], method: string, route: string): PackageCall[] {
  return calls.filter(call => call.method === method && call.route === route)
}
