import type { AtriumIntegrationScreenResponse } from '../types/atrium'

/**
 * A suite integration's screen from `atrium.screens.show`: its declaration
 * and the tabs and sections other packages registered for it. `record` is the
 * key of the record a detail screen shows (sent as `?record=`), and the open
 * tab is the route's `?tab=`, which the API resolves alone; the screen
 * refetches when either changes.
 */
export function useAtriumScreen(
  key: MaybeRefOrGetter<string>,
  record: MaybeRefOrGetter<string | number | null | undefined> = undefined
) {
  const api = useAtriumApi()
  const route = useRoute()

  const tab = computed(() => typeof route.query.tab === 'string' ? route.query.tab : undefined)
  const recordKey = computed(() => {
    const value = toValue(record)

    return value === null || value === undefined || value === '' ? undefined : String(value)
  })

  return useAsyncData(
    () => `atrium-screen:${toValue(key)}:${recordKey.value ?? ''}`,
    () => api<AtriumIntegrationScreenResponse>(`/screens/${encodeURIComponent(toValue(key))}`, {
      query: { record: recordKey.value, tab: tab.value }
    }),
    { server: false, watch: [tab] }
  )
}
