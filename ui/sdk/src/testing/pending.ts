/*
 * The work `settle()` waits for: the test router's navigations (a lazily
 * imported route component resolves only after its dynamic import, which
 * can take any number of ticks on a cold transform cache or a loaded
 * machine) and the requests `registerEndpoint()` handlers are answering.
 * Internal: not exported from `@refactor-circus/atrium/testing`.
 */

const pending = new Map<Promise<unknown>, string>()

/** How long `settle()` waits for pending work before it throws. */
export const SETTLE_TIMEOUT_MS = { value: 4000 }

/** Tracks `promise` until it settles; `label` names it in `settle()`'s timeout error. */
export function trackPending<T>(promise: Promise<T>, label: string): Promise<T> {
  pending.set(promise, label)

  const forget = () => {
    pending.delete(promise)
  }

  promise.then(forget, forget)

  return promise
}

/** The labels and promises of the work still in flight. */
export function pendingWork(): { labels: string[], promises: Promise<unknown>[] } {
  return { labels: [...pending.values()], promises: [...pending.keys()] }
}
