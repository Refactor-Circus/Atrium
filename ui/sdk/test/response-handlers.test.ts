import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { useAtrium, useAtriumApi, useAtriumClient, useAtriumIntegration, useAtriumShellStore } from '#imports'
import { AtriumRegistry } from '../app/plugins/atrium'
import type { AtriumResponseHandler } from '../app/types/atrium'
import { withSetup } from './support'
import { integrationEntry, integrationShell, mockPackageApi, reply, resetPackageApis, useShell } from './integrations/support'

/*
 * Response handlers (AC 83, D-049): `$atrium.responseHandler(key, handler)`
 * runs on every response of every Atrium client (an integration client,
 * `useAtriumClient()` and `useAtriumApi()`), in registration order, before
 * the caller sees the result; a handler that throws is logged and skipped.
 * The integrations plugin registers Guardian's at plugin time, so handlers
 * run even when the shell request itself fails.
 */

registerEndpoint('/atrium/api/handled', () =>
  new Response(JSON.stringify({ data: 'ok' }), { status: 200, headers: { 'content-type': 'application/json', 'x-seen': 'yes' } }))

registerEndpoint('/atrium/api/handled-denied', () =>
  new Response(JSON.stringify({ message: 'No.', code: 'nope' }), { status: 403, headers: { 'content-type': 'application/json' } }))

registerEndpoint('/atrium/api/shell', () =>
  new Response(JSON.stringify({ message: 'Two-factor needed.', code: 'not_a_guardian_code' }), { status: 403, headers: { 'content-type': 'application/json' } }))

interface Seen {
  key: string
  status: number
  url: string
  method: string
  body: unknown
}

let atrium: AtriumRegistry
let saved: [string, AtriumResponseHandler][] = []
const seen: Seen[] = []

/** A handler that records what it saw, under `key`. */
function recording(key: string): AtriumResponseHandler {
  return async (response, request) => {
    const text = await response.text()

    seen.push({ key, status: response.status, url: request.url, method: request.method, body: text === '' ? undefined : JSON.parse(text) })
  }
}

describe('$atrium.responseHandler()', () => {
  beforeEach(async () => {
    seen.length = 0
    atrium = await withSetup(() => useAtrium())
    saved = [...atrium.responseHandlers]
    atrium.responseHandlers.clear()
  })

  afterEach(() => {
    atrium.responseHandlers.clear()

    for (const [key, handler] of saved) {
      atrium.responseHandler(key, handler)
    }

    resetPackageApis()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('is registered by the integrations plugin at plugin time, Guardian\'s included', () => {
    expect(saved.map(([key]) => key)).toContain('guardian.two-factor')
  })

  it('keeps handlers in registration order, a key registered again replacing its handler', async () => {
    const registry = new AtriumRegistry()
    const calls: string[] = []

    registry
      .responseHandler('first', () => void calls.push('first'))
      .responseHandler('second', () => void calls.push('second'))
      .responseHandler('first', () => void calls.push('first again'))

    await registry.handleResponse(new Response(null, { status: 204 }), new Request('https://app.test/x'))

    expect([...registry.responseHandlers.keys()]).toEqual(['first', 'second'])
    expect(calls).toEqual(['first again', 'second'])
  })

  it('logs a handler that throws and skips it, still running the next', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const registry = new AtriumRegistry()
    const after = vi.fn()

    registry
      .responseHandler('broken', () => {
        throw new Error('boom')
      })
      .responseHandler('rejecting', async () => {
        throw new Error('later boom')
      })
      .responseHandler('after', after)

    await expect(registry.handleResponse(new Response('{}', { status: 200 }), new Request('https://app.test/x'))).resolves.toBeUndefined()

    expect(after).toHaveBeenCalledOnce()
    expect(error).toHaveBeenCalledTimes(2)
    expect(String(error.mock.calls[0]![0])).toContain('broken')
    expect(String(error.mock.calls[1]![0])).toContain('rejecting')
  })

  it('gives each handler its own copy of the body', async () => {
    const registry = new AtriumRegistry()
    const bodies: string[] = []

    registry
      .responseHandler('one', async response => void bodies.push(await response.text()))
      .responseHandler('two', async response => void bodies.push(await response.text()))

    const response = new Response('{"code":"x"}', { status: 403 })
    await registry.handleResponse(response, new Request('https://app.test/x'))

    expect(bodies).toEqual(['{"code":"x"}', '{"code":"x"}'])
    expect(await response.text()).toBe('{"code":"x"}')
  })

  it('runs on every response of an integration client, in order, before the caller', async () => {
    const order: string[] = []
    atrium.responseHandler('a', recording('a')).responseHandler('b', async (response) => {
      order.push(`b ${response.status}`)
    })

    await useShell(integrationShell([integrationEntry('cortex')]))
    mockPackageApi('cortex', { 'GET /virtual-agents': reply(403, { message: 'No.', code: 'nope' }) } as never)

    const client = (await withSetup(() => useAtriumIntegration('cortex'))).client!
    const { response, error } = await (client as unknown as { GET: (path: string) => Promise<{ response: Response, error: unknown }> }).GET('/virtual-agents')
    order.push('caller')

    expect(response.status).toBe(403)
    expect(seen).toEqual([{ key: 'a', status: 403, url: expect.stringMatching(/\/cortex\/api\/virtual-agents$/), method: 'GET', body: { message: 'No.', code: 'nope' } }])
    expect(order).toEqual(['b 403', 'caller'])
    // The caller still reads the body the handlers read.
    expect(error).toEqual({ message: 'No.', code: 'nope' })
  })

  it('runs on every response of useAtriumClient()', async () => {
    atrium.responseHandler('a', recording('a'))
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: { app: { name: 'Acme' } } }), { status: 200, headers: { 'content-type': 'application/json' } })))

    const client = await withSetup(() => useAtriumClient())
    const { data } = await client.GET('/shell')

    expect(data).toEqual({ data: { app: { name: 'Acme' } } })
    expect(seen).toEqual([{ key: 'a', status: 200, url: expect.stringMatching(/\/atrium\/api\/shell$/), method: 'GET', body: { data: { app: { name: 'Acme' } } } }])
  })

  it('runs on every response of useAtriumApi(), with the body $fetch already read', async () => {
    const headers: (string | null)[] = []
    atrium.responseHandler('a', recording('a')).responseHandler('headers', response => void headers.push(response.headers.get('x-seen')))

    const api = await withSetup(() => useAtriumApi())

    await expect(api('/handled')).resolves.toEqual({ data: 'ok' })
    await expect(api('/handled-denied', { method: 'POST' })).rejects.toMatchObject({ status: 403 })

    expect(seen).toEqual([
      { key: 'a', status: 200, url: expect.stringMatching(/\/atrium\/api\/handled$/), method: 'GET', body: { data: 'ok' } },
      { key: 'a', status: 403, url: expect.stringMatching(/\/atrium\/api\/handled-denied$/), method: 'POST', body: { message: 'No.', code: 'nope' } }
    ])
    expect(headers).toEqual(['yes', null])
  })

  it('runs when the shell request itself fails', async () => {
    atrium.responseHandler('a', recording('a'))

    const store = await withSetup(() => useAtriumShellStore())
    store.shell = null
    await store.load(true)

    expect(store.error).not.toBeNull()
    expect(seen).toEqual([{ key: 'a', status: 403, url: expect.stringMatching(/\/atrium\/api\/shell$/), method: 'GET', body: { message: 'Two-factor needed.', code: 'not_a_guardian_code' } }])
  })
})

describe('$atrium.notify()', () => {
  it('shows a notice until it is dismissed, and not again for the same id', () => {
    const registry = new AtriumRegistry()

    registry.notify('deadline', { message: 'Soon', id: '2026-12-01' })
    expect([...registry.notices.keys()]).toEqual(['deadline'])

    registry.dismiss('deadline')
    expect(registry.notices.size).toBe(0)

    registry.notify('deadline', { message: 'Soon', id: '2026-12-01' })
    expect(registry.notices.size).toBe(0)

    registry.notify('deadline', { message: 'Sooner', id: '2026-11-30' })
    expect(registry.notices.get('deadline')?.message).toBe('Sooner')
  })
})
