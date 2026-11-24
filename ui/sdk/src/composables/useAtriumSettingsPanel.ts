import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '../runtime/asyncData'
import type { AtriumSettingsIndexResponse, AtriumSettingsPanelResponse } from '../types/atrium'
import { useAtriumApi } from './useAtriumApi'

/**
 * One settings panel with its screen (`atrium.settings.show`). The open tab
 * is the route's `?tab=`, sent to the API, which resolves that tab only; the
 * panel refetches when the query changes.
 */
export function useAtriumSettingsPanel(key: MaybeRefOrGetter<string>) {
  const api = useAtriumApi()
  const route = useRoute()

  const tab = computed(() => typeof route.query.tab === 'string' ? route.query.tab : undefined)

  return useAsyncData(
    () => `atrium-settings:${toValue(key)}`,
    () => api<AtriumSettingsPanelResponse>(`/settings/${encodeURIComponent(toValue(key))}`, { query: { tab: tab.value } }),
    { watch: [tab] }
  )
}

/** Every settings panel the user may open, with the settings screen (`atrium.settings.index`). */
export function useAtriumSettings() {
  const api = useAtriumApi()

  return useAsyncData('atrium-settings', () => api<AtriumSettingsIndexResponse>('/settings'))
}
