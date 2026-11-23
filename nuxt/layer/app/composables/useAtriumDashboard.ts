import type {
  AtriumAbilities,
  AtriumDashboard,
  AtriumDashboardListResponse,
  AtriumDashboardResponse,
  AtriumLayoutWidget
} from '../types/atrium'

const NO_ABILITIES: AtriumAbilities = { update: false, delete: false }

/**
 * One dashboard by slug (or the user's default), and the list for the
 * switcher.
 *
 * Reading never creates a dashboard; a user with none gets their first one
 * here, with an explicit `POST dashboards`. Writes send the `version` the
 * dashboard was loaded at: when someone changed it since (409), the
 * dashboard is reloaded and the user told, instead of overwriting their
 * change.
 */
export function useAtriumDashboard(slug: MaybeRefOrGetter<string | undefined>) {
  const api = useAtriumApi()
  const toast = useToast()
  const { t } = useI18n()

  const path = (s: string) => `/dashboards/${encodeURIComponent(s)}`

  const page = useAsyncData(
    () => `atrium-dashboard:${toValue(slug) ?? ''}`,
    async () => {
      const current = toValue(slug)
      const url = current ? path(current) : '/dashboard'
      const response = await api<AtriumDashboardResponse>(url)

      if (response.data || current) {
        return response
      }

      await api('/dashboards', { method: 'POST', body: { name: t('atrium.dashboard.default_name') } })

      return await api<AtriumDashboardResponse>(url)
    },
    { server: false }
  )

  const list = useAsyncData(
    'atrium-dashboards',
    async () => (await api<AtriumDashboardListResponse>('/dashboards')).data,
    { server: false }
  )

  const dashboard = computed<AtriumDashboard | null>(() => page.data.value?.data ?? null)
  const abilities = computed<AtriumAbilities>(() => page.data.value?.meta?.abilities ?? NO_ABILITIES)

  /** On a 409, reload and tell the user; true when it was one. */
  async function reloadIfStale(error: unknown): Promise<boolean> {
    if (atriumStatus(error) !== 409) {
      return false
    }

    await page.refresh()
    toast.add({ title: t('atrium.dashboard.stale'), color: 'warning', icon: 'i-lucide-refresh-cw' })

    return true
  }

  async function create(name: string): Promise<AtriumDashboard> {
    const created = (await api<{ data: AtriumDashboard }>('/dashboards', { method: 'POST', body: { name } })).data
    await list.refresh()

    return created
  }

  async function rename(name: string): Promise<void> {
    const current = dashboard.value

    if (!current) {
      return
    }

    try {
      page.data.value = await api<AtriumDashboardResponse>(path(current.slug), { method: 'PUT', body: { name, version: current.version } })
      await list.refresh()
    } catch (error) {
      if (!await reloadIfStale(error)) {
        throw error
      }
    }
  }

  async function remove(): Promise<void> {
    const current = dashboard.value

    if (!current) {
      return
    }

    await api(path(current.slug), { method: 'DELETE' })
    await list.refresh()
  }

  /**
   * Saves the full layout. Resolves once saved, or once a stale dashboard
   * was reloaded; rejects on any other failure.
   */
  async function saveLayout(widgets: AtriumLayoutWidget[]): Promise<void> {
    const current = dashboard.value

    if (!current) {
      return
    }

    try {
      page.data.value = await api<AtriumDashboardResponse>(`${path(current.slug)}/layout`, {
        method: 'PUT',
        body: { version: current.version, widgets }
      })
      toast.add({ title: t('atrium.dashboard.saved'), color: 'success' })
    } catch (error) {
      if (!await reloadIfStale(error)) {
        throw error
      }
    }
  }

  return { page, list, dashboard, abilities, create, rename, remove, saveLayout }
}
