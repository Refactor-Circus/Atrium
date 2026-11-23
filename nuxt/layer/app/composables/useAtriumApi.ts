type AtriumFetch = typeof $fetch

const clients = new WeakMap<object, AtriumFetch>()

/**
 * `$fetch` bound to Atrium's API, carrying the app's auth adapter on every
 * request, and calling its `onUnauthorized()` on a 401:
 *
 *   const { data } = await useAtriumApi()<{ data: AtriumDashboard[] }>('/dashboards')
 *
 * One client per Nuxt app; the adapter is read at request time, so one set
 * after the client was made still applies.
 */
export function useAtriumApi(): AtriumFetch {
  const nuxtApp = useNuxtApp()
  const existing = clients.get(nuxtApp)

  if (existing) {
    return existing
  }

  const config = useRuntimeConfig()
  const atrium = useAtrium()

  const client = $fetch.create({
    baseURL: config.public.atrium.apiBase as string,
    headers: { Accept: 'application/json' },
    async onRequest({ options }) {
      const auth = atrium.auth()
      const headers = new Headers(options.headers as HeadersInit | undefined)

      for (const [name, value] of Object.entries((await auth.headers?.()) ?? {})) {
        headers.set(name, value)
      }

      options.headers = headers

      if (auth.credentials) {
        options.credentials = auth.credentials
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        await atrium.auth().onUnauthorized?.()
      }
    }
  }) as AtriumFetch

  clients.set(nuxtApp, client)

  return client
}
