import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, type ComputedRef, type Ref, type ShallowRef } from 'vue'
import { runInAtrium } from '../runtime/context'
import { atriumStatus } from '../utils/atriumStatus'
import { useAtriumIntegration, type AtriumClientOptions, type AtriumIntegrationClient } from './useAtriumIntegration'

export type AtriumQueryStatus = 'idle' | 'pending' | 'success' | 'error'

export interface AtriumIntegrationQuery<T> {
  data: ShallowRef<T | null>
  error: ShallowRef<unknown>
  /** `idle` while the integration is not active: no request is made */
  status: Ref<AtriumQueryStatus>
  /** The request answered 403: render <AtriumNoAccess> */
  forbidden: ComputedRef<boolean>
  /** Asks again, for this component and any that mount after it */
  refresh: () => Promise<void>
}

interface SharedRequest {
  promise: Promise<unknown>
  users: number
}

let requests = new Map<string, SharedRequest>()

/** Forgets every shared request, for tests. */
export function resetIntegrationQueries(): void {
  requests = new Map()
}

/**
 * One request per integration operation per dashboard load (D-029): the
 * widgets of one integration on a dashboard each call
 *
 *   const stats = useIntegrationQuery('impex', 'impex.stats.show',
 *     async client => integrationData(await client.GET('/stats')), createImpexClient)
 *
 * and share a single request while any of them is mounted. Once the last one
 * is gone (the user left the dashboard), the next load asks again. `request`
 * runs inside the app's context, and should reject on an HTTP error
 * (`integrationData()` does), so a 403 shows as `forbidden`.
 *
 * `create` is the module's own client factory, which types `client`;
 * without it the client is untyped. Nothing is requested while the
 * integration is not active.
 */
export function useIntegrationQuery<K extends string, T>(key: K, operation: string, request: (client: AtriumIntegrationClient<K>) => Promise<T>): AtriumIntegrationQuery<T>
export function useIntegrationQuery<C, T>(key: string, operation: string, request: (client: C) => Promise<T>, create: (options: AtriumClientOptions) => C): AtriumIntegrationQuery<T>
export function useIntegrationQuery<C, T>(
  key: string,
  operation: string,
  request: (client: C) => Promise<T>,
  create?: (options: AtriumClientOptions) => C
): AtriumIntegrationQuery<T> {
  const { client } = (create ? useAtriumIntegration(key, create) : useAtriumIntegration(key)) as { client: C | null }
  const id = `${key}:${operation}`

  const data = shallowRef<T | null>(null)
  const error = shallowRef<unknown>(null)
  const status = ref<AtriumQueryStatus>('idle')
  const forbidden = computed(() => atriumStatus(error.value) === 403)

  // Outside a component (or another effect scope) nothing would ever leave
  // the shared request, so such a caller asks on its own.
  const scoped = getCurrentScope() !== undefined
  let joined: SharedRequest | null = null

  function leave(): void {
    if (joined && --joined.users <= 0 && requests.get(id) === joined) {
      requests.delete(id)
    }

    joined = null
  }

  function join(fresh: boolean): SharedRequest | null {
    if (!client) {
      return null
    }

    let entry = fresh || !scoped ? undefined : requests.get(id)

    if (!entry) {
      entry = { promise: runInAtrium(() => request(client)), users: 0 }
      entry.promise.catch(() => {})

      if (scoped) {
        requests.set(id, entry)
      }
    }

    if (entry !== joined) {
      leave()
      entry.users++
      joined = entry
    }

    return entry
  }

  async function load(fresh: boolean): Promise<void> {
    const entry = join(fresh)

    if (!entry) {
      status.value = 'idle'
      return
    }

    status.value = 'pending'
    error.value = null

    try {
      data.value = await entry.promise as T
      status.value = 'success'
    } catch (e) {
      error.value = e
      status.value = 'error'
    }
  }

  if (scoped) {
    onScopeDispose(leave)
  }

  void load(false)

  return { data, error, status, forbidden, refresh: () => load(true) }
}
