import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAtrium, useAtriumApi } from '../src/index'
import { registerEndpoint, withSetup } from '../src/testing/index'

const seen: { authorization: string | null }[] = []

registerEndpoint('/atrium/api/shell', (event) => {
  seen.push({ authorization: event.headers.get('authorization') })

  return { data: { app: { name: 'Acme' } } }
})

registerEndpoint('/atrium/api/dashboards', () =>
  new Response(JSON.stringify({ message: 'Unauthenticated.' }), { status: 401, headers: { 'content-type': 'application/json' } }))

registerEndpoint('/atrium/api/widgets', () =>
  new Response(JSON.stringify({ message: 'Server Error' }), { status: 500, headers: { 'content-type': 'application/json' } }))

describe('useAtriumApi()', () => {
  afterEach(async () => {
    seen.length = 0
    const atrium = await withSetup(() => useAtrium())
    atrium.auth({})
  })

  it('calls Atrium API routes under runtimeConfig.public.atrium.apiBase', async () => {
    const api = await withSetup(() => useAtriumApi())

    const response = await api<{ data: { app: { name: string } } }>('/shell')

    expect(response.data.app.name).toBe('Acme')
  })

  it('sends the headers the auth adapter supplies on every request', async () => {
    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ headers: async () => ({ Authorization: 'Bearer secret' }) })

    const api = await withSetup(() => useAtriumApi())
    await api('/shell')

    expect(seen).toEqual([{ authorization: 'Bearer secret' }])
  })

  it('calls the adapter onUnauthorized() on a 401, and still rejects', async () => {
    const onUnauthorized = vi.fn()
    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ onUnauthorized })

    const api = await withSetup(() => useAtriumApi())

    await expect(api('/dashboards')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not call onUnauthorized() on other errors', async () => {
    const onUnauthorized = vi.fn()
    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ onUnauthorized })

    const api = await withSetup(() => useAtriumApi())

    await expect(api('/widgets')).rejects.toMatchObject({ status: 500 })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
