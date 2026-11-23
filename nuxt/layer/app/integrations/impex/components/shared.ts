import { ref, shallowRef, watch } from 'vue'
import type { Ref, ShallowRef, WatchSource } from 'vue'
import { atriumStatus, integrationData, useAtriumIntegration, useIntegrationQuery } from '#imports'
import type { AtriumIntegrationClient } from '../../../composables/useAtriumIntegration'
import type { AtriumIntegrationQuery } from '../../../composables/useIntegrationQuery'
import type { components } from '../client/schema'

/*
 * What the Impex pages, widgets and panel share: the typed client, loading a
 * resource or a cursor-paged list, running an action (field errors on a 422,
 * no access on a 403), and the one `impex.stats.show` request the widgets
 * share per dashboard load (D-029).
 */

type Schemas = components['schemas']

export type ImpexClient = AtriumIntegrationClient<'impex'>
export type ImpexRun = Schemas['RunResource']
export type ImpexRunStatus = Schemas['RunStatus']
export type ImpexStats = Schemas['RunStatsResource']
export type ImpexSettingsSummary = Schemas['SettingsSummaryResource']

/** Every run status, in the order the API's `by_status` lists them. */
export const RUN_STATUSES: readonly ImpexRunStatus[] = ['pending', 'running', 'waiting', 'rolling_back', 'completed', 'failed', 'cancelled']

/** Every way a run can be started. */
export const RUN_TRIGGERS: readonly Schemas['RunTrigger'][] = ['api', 'mcp', 'command', 'schedule', 'channel', 'code', 'child']

/** The transports a channel form offers: the v2 API lists none (D-032). */
export const CHANNEL_TRANSPORTS = ['http', 'mail', 'file'] as const

export const CHANNEL_DIRECTIONS: readonly Schemas['Direction'][] = ['inbound', 'outbound']
export const CHANNEL_STATUSES: readonly Schemas['ChannelStatus'][] = ['active', 'disabled']
export const BODY_POLICIES: readonly Schemas['BodyPolicy'][] = ['all', 'failures', 'none']
export const SUBSCRIPTION_STATUSES: readonly Schemas['SubscriptionStatus'][] = ['active', 'paused', 'disabled']

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

/** The badge colour of a run, step, channel, subscription or delivery status. */
export function statusColor(status: string | null | undefined): BadgeColor {
  switch (status) {
    case 'completed':
    case 'succeeded':
    case 'active':
      return 'success'
    case 'failed':
    case 'disabled':
      return 'error'
    case 'waiting':
    case 'rolling_back':
    case 'paused':
      return 'warning'
    case 'running':
    case 'pending':
      return 'info'
    default:
      return 'neutral'
  }
}

/** The layer path of a run's page. */
export function runPath(id: string): string {
  return `/impex/runs/${encodeURIComponent(id)}`
}

/** The layer path of a channel's page. */
export function channelPath(name: string): string {
  return `/impex/channels/${encodeURIComponent(name)}`
}

/** The layer path of a subscription's page. */
export function subscriptionPath(id: string): string {
  return `/impex/subscriptions/${encodeURIComponent(id)}`
}

/**
 * Where a subscription pushes (its URL or mail address), or null for a
 * feed-only one. The vendored schema types `endpoint` loosely.
 */
export function endpointOf(endpoint: unknown): string | null {
  if (typeof endpoint !== 'object' || endpoint === null) {
    return null
  }

  const { url, to } = endpoint as { url?: unknown, to?: unknown }

  return typeof url === 'string' && url !== '' ? url : typeof to === 'string' && to !== '' ? to : null
}

/** The fields a stored channel's create and edit forms share, as v1's. */
export interface ImpexChannelForm {
  transport: string
  status: Schemas['ChannelStatus']
  body_policy: Schemas['BodyPolicy']
  /** Left blank to keep the channel's secret */
  signing_secret: string
  /** The transport settings, as JSON */
  options_json: string
}

/** The shared fields, blank or from a channel. */
export function emptyChannelForm(channel?: Schemas['ChannelResource']): ImpexChannelForm {
  return {
    transport: channel?.transport ?? 'http',
    status: channel?.status ?? 'active',
    body_policy: channel?.body_policy ?? 'all',
    signing_secret: '',
    options_json: JSON.stringify(channel?.options ?? {}, null, 2)
  }
}

/**
 * The shared fields as the API takes them: the options decoded, and the
 * signing secret sent only when one was typed, so a blank field keeps the
 * channel's. Null when the options are not a JSON object.
 */
export function channelBody(form: ImpexChannelForm): Record<string, unknown> | null {
  const parsed = parseJson(form.options_json)
  const options = parsed === undefined ? {} : 'value' in parsed ? parsed.value : null

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    return null
  }

  return {
    transport: form.transport,
    status: form.status,
    body_policy: form.body_policy,
    options,
    ...(form.signing_secret !== '' ? { credentials: { signing_secret: form.signing_secret } } : {})
  }
}

/** A timestamp as the user's locale shows it, or null. */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

/** A route query value as one string, or undefined. */
export function queryValue(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value

  return typeof first === 'string' && first !== '' ? first : undefined
}

/** Whether an API flag that may arrive as a boolean or a string is on. */
export function isOn(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

/**
 * The JSON a form field holds: undefined when blank, the decoded value, or
 * an `invalid` marker the form turns into a field error.
 */
export function parseJson(text: string): { value: unknown } | { invalid: true } | undefined {
  if (text.trim() === '') {
    return undefined
  }

  try {
    return { value: JSON.parse(text) as unknown }
  } catch {
    return { invalid: true }
  }
}

/**
 * Body fields the vendored schema types loosely (Scramble types a JSON
 * object field as `string[]`), sent as the API reads them.
 */
export function looseBody<T>(body: Record<string, unknown>): T {
  return body as unknown as T
}

export interface ImpexResource<T> {
  client: ImpexClient | null
  data: ShallowRef<T | null>
  error: ShallowRef<unknown>
  pending: Ref<boolean>
  reload: () => Promise<void>
}

/**
 * Loads what a page shows from Impex's API once set up, and again whenever
 * `source` changes. A failure stays in `error` for <ImpexState>.
 */
export function useImpexResource<T>(load: (client: ImpexClient) => Promise<T>, source?: WatchSource): ImpexResource<T> {
  const { client } = useAtriumIntegration('impex')
  const data = shallowRef<T | null>(null)
  const error = shallowRef<unknown>(null)
  const pending = ref(false)

  async function reload(): Promise<void> {
    if (!client) {
      return
    }

    pending.value = true
    error.value = null

    try {
      data.value = await load(client)
    } catch (failure) {
      error.value = failure
    } finally {
      pending.value = false
    }
  }

  if (source) {
    watch(source, () => void reload())
  }

  void reload()

  return { client, data, error, pending, reload }
}

interface CursorPage<T> {
  data: T[]
  meta?: { next_cursor: string | null }
}

export interface ImpexList<T> {
  rows: ShallowRef<T[]>
  nextCursor: Ref<string | null>
  error: ShallowRef<unknown>
  pending: Ref<boolean>
  /** Loads the first page again */
  reload: () => Promise<void>
  /** Appends the next page, by the cursor the last one gave */
  loadMore: () => Promise<void>
}

/**
 * A cursor-paged list, as Impex's list endpoints page: the first page once
 * set up and whenever `source` (the filters) changes, then the next page by
 * `meta.next_cursor` on demand.
 */
export function useImpexList<T>(fetchPage: (client: ImpexClient, cursor: string | undefined) => Promise<CursorPage<T>>, source?: WatchSource): ImpexList<T> {
  const { client } = useAtriumIntegration('impex')
  const rows = shallowRef<T[]>([])
  const nextCursor = ref<string | null>(null)
  const error = shallowRef<unknown>(null)
  const pending = ref(false)

  async function fetch(cursor: string | undefined): Promise<void> {
    if (!client) {
      return
    }

    pending.value = true
    error.value = null

    try {
      const page = await fetchPage(client, cursor)

      rows.value = cursor === undefined ? page.data : [...rows.value, ...page.data]
      nextCursor.value = page.meta?.next_cursor ?? null
    } catch (failure) {
      error.value = failure
    } finally {
      pending.value = false
    }
  }

  if (source) {
    watch(source, () => void fetch(undefined), { deep: true })
  }

  void fetch(undefined)

  return {
    rows,
    nextCursor,
    error,
    pending,
    reload: () => fetch(undefined),
    loadMore: () => fetch(nextCursor.value ?? undefined)
  }
}

export interface ImpexAction {
  busy: Ref<boolean>
  /** The field errors of the last 422, by field */
  errors: Ref<Record<string, string[]>>
  /** What the last action did, for the flash */
  notice: Ref<string | null>
  /** Why the last action failed, other than a 422 or 403 */
  failure: Ref<string | null>
  /** The last action answered 403 */
  forbidden: Ref<boolean>
  /**
   * Runs `request` (an `openapi-fetch` call, checked with `integrationData`)
   * and then `done` with its data. Returns whether it succeeded.
   */
  run: <T>(request: () => Promise<T>, done?: (data: T) => void | string | Promise<void | string>) => Promise<boolean>
  /** Sets a field error without a request, as a 422 would */
  invalid: (field: string, message: string) => void
  reset: () => void
}

/**
 * One page's actions: each calls Impex's v2 route, then the page reloads.
 * A 422 shows its field errors, a 403 the no-access notice, anything else
 * its message.
 */
export function useImpexAction(): ImpexAction {
  const busy = ref(false)
  const errors = ref<Record<string, string[]>>({})
  const notice = ref<string | null>(null)
  const failure = ref<string | null>(null)
  const forbidden = ref(false)

  function reset(): void {
    errors.value = {}
    notice.value = null
    failure.value = null
    forbidden.value = false
  }

  function invalid(field: string, message: string): void {
    reset()
    errors.value = { [field]: [message] }
  }

  async function run<T>(request: () => Promise<T>, done?: (data: T) => void | string | Promise<void | string>): Promise<boolean> {
    reset()
    busy.value = true

    try {
      const data = await request()
      const said = await done?.(data)

      if (typeof said === 'string') {
        notice.value = said
      }

      return true
    } catch (error) {
      const status = atriumStatus(error)
      const body = (error as { body?: { message?: unknown, errors?: unknown } }).body

      if (status === 422 && typeof body?.errors === 'object' && body.errors !== null) {
        errors.value = body.errors as Record<string, string[]>
      } else if (status === 403) {
        forbidden.value = true
      } else {
        failure.value = typeof body?.message === 'string' ? body.message : error instanceof Error ? error.message : String(error)
      }

      return false
    } finally {
      busy.value = false
    }
  }

  return { busy, errors, notice, failure, forbidden, run, invalid, reset }
}

/**
 * `impex.stats.show`, shared by every Impex widget on the dashboard: one
 * request per load however many of them are placed.
 */
export function useImpexStats(): AtriumIntegrationQuery<ImpexStats> {
  return useIntegrationQuery('impex', 'impex.stats.show', async client => integrationData(await client.GET('/stats')).data as ImpexStats)
}
