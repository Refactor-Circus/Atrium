import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter, type Ref, type ShallowRef, type WatchSource, type WritableComputedRef } from 'vue'

export type AsyncDataStatus = 'idle' | 'pending' | 'success' | 'error'

export interface AsyncData<T> {
  /** The handler's last answer; undefined until it answers. Writable, for an optimistic update */
  data: WritableComputedRef<T | undefined>
  error: ComputedRef<unknown>
  status: ComputedRef<AsyncDataStatus>
  pending: ComputedRef<boolean>
  /** Asks again; every caller sharing the key sees the answer */
  refresh: () => Promise<void>
  /** Same as refresh (for an `immediate: false` caller) */
  execute: () => Promise<void>
  /** Forgets the data */
  clear: () => void
}

export interface AsyncDataOptions {
  /** Ask at once (the default) or wait for `execute()` */
  immediate?: boolean
  /** Ask again when any of these change */
  watch?: WatchSource[]
  /** Accepted for Nuxt compatibility and ignored: Atrium renders in the browser only */
  server?: boolean
}

interface Entry {
  key: string
  data: ShallowRef<unknown>
  error: ShallowRef<unknown>
  status: Ref<AsyncDataStatus>
  promise: Promise<void> | null
  run: number
  users: number
}

const entries = new Map<string, Entry>()

/**
 * Data from `handler`, keyed: every caller with the same key, while one of
 * them is mounted, shares one request and one copy of the answer (the
 * subset of Nuxt's `useAsyncData()` Atrium's pages use). A getter key, or a
 * `watch` source, asks again when it changes; an older answer that lands
 * after a newer request is dropped. Once the last caller is gone the data
 * is forgotten, so the next page asks again.
 */
export function useAsyncData<T>(key: MaybeRefOrGetter<string>, handler: () => Promise<T>, options: AsyncDataOptions = {}): AsyncData<T> {
  const scoped = getCurrentScope() !== undefined
  const current = shallowRef<Entry | null>(null)

  function attach(name: string): Entry {
    let found = scoped ? entries.get(name) : undefined

    if (!found) {
      found = { key: name, data: shallowRef(undefined), error: shallowRef(undefined), status: ref('idle'), promise: null, run: 0, users: 0 }

      if (scoped) {
        entries.set(name, found)
      }
    }

    if (found !== current.value) {
      detach()
      found.users++
      current.value = found
    }

    return found
  }

  function detach(): void {
    const entry = current.value

    if (entry && --entry.users <= 0 && entries.get(entry.key) === entry) {
      entries.delete(entry.key)
    }

    current.value = null
  }

  async function fetchInto(target: Entry): Promise<void> {
    const run = ++target.run

    target.status.value = 'pending'
    target.error.value = undefined

    try {
      const answer = await handler()

      if (run === target.run) {
        target.data.value = answer
        target.status.value = 'success'
      }
    } catch (e) {
      if (run === target.run) {
        target.error.value = e
        target.status.value = 'error'
      }
    }
  }

  async function load(fresh: boolean): Promise<void> {
    const target = attach(toValue(key))

    if (!fresh && target.promise) {
      return target.promise
    }

    target.promise = fetchInto(target)

    return target.promise
  }

  if (scoped) {
    onScopeDispose(detach)
  }

  const sources: WatchSource[] = [...(options.watch ?? [])]

  if (typeof key === 'function' || (typeof key === 'object' && key !== null)) {
    sources.push(() => toValue(key))
  }

  if (sources.length > 0) {
    watch(sources, () => { void load(true) })
  }

  if (options.immediate !== false) {
    void load(false)
  } else {
    attach(toValue(key))
  }

  const status = computed<AsyncDataStatus>(() => current.value?.status.value ?? 'idle')

  return {
    data: computed<T | undefined>({
      get: () => current.value?.data.value as T | undefined,
      set: (value) => {
        if (current.value) {
          current.value.data.value = value
        }
      }
    }),
    error: computed(() => current.value?.error.value),
    status,
    pending: computed(() => status.value === 'pending'),
    refresh: () => load(true),
    execute: () => load(true),
    clear: () => {
      if (current.value) {
        current.value.data.value = undefined
      }
    }
  }
}

/** Forgets every keyed answer: for tests (Nuxt's `clearNuxtData()`). */
export function clearAsyncData(): void {
  entries.clear()
}
