import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { addTestRoutes, mountSuspended, registerEndpoint, settle, useRouter } from '../src/testing/index'
import { SETTLE_TIMEOUT_MS } from '../src/testing/pending'

/*
 * settle() waits for the work a test starts, not a fixed number of ticks: a
 * push to a lazily imported page changes the route only once its import
 * resolves, which a cold transform cache or a loaded machine can make take
 * longer than five ticks (Impex's flows and channel-create tests).
 */

const Page = defineComponent({ name: 'SettleLazyPage', render: () => h('p', { 'data-testid': 'lazy-page' }, 'lazy') })

/** A route component whose dynamic import takes `ms`. */
const lazy = (ms: number) => () => new Promise<typeof Page>(resolve => setTimeout(() => resolve(Page), ms))

addTestRoutes([
  { path: '/settle/lazy', name: 'settle-lazy', component: lazy(30) },
  { path: '/settle/replaced', name: 'settle-replaced', component: lazy(30) },
  { path: '/settle/never', name: 'settle-never', component: () => new Promise(() => {}) }
])

const Shell = defineComponent({ render: () => h('div') })

describe('settle()', () => {
  afterEach(() => {
    SETTLE_TIMEOUT_MS.value = 4000
  })

  it('waits for a push to a lazily imported route', async () => {
    await mountSuspended(Shell, { route: '/' })
    const router = useRouter()

    void router.push({ name: 'settle-lazy' })
    await settle()

    expect(router.currentRoute.value.path).toBe('/settle/lazy')
  })

  it('waits for a replace to a lazily imported route', async () => {
    await mountSuspended(Shell, { route: '/' })
    const router = useRouter()

    void router.replace('/settle/replaced')
    await settle()

    expect(router.currentRoute.value.path).toBe('/settle/replaced')
  })

  it('waits for a slow registered endpoint, then for the navigation its answer starts', async () => {
    await mountSuspended(Shell, { route: '/' })
    const router = useRouter()

    registerEndpoint('/settle/slow', () => new Promise(resolve => setTimeout(() => resolve({ to: '/settle/lazy' }), 30)))

    let answered: unknown = null
    void fetch('http://localhost/settle/slow').then(r => r.json()).then(async (body: { to: string }) => {
      answered = body
      await router.push(body.to)
    })

    await router.push('/')
    await settle()

    expect(answered).toEqual({ to: '/settle/lazy' })
    expect(router.currentRoute.value.path).toBe('/settle/lazy')
  })

  it('throws naming what is still pending once it times out', async () => {
    await mountSuspended(Shell, { route: '/' })
    SETTLE_TIMEOUT_MS.value = 50

    void useRouter().push('/settle/never')

    await expect(settle()).rejects.toThrow(/settle\(\) timed out after 50 ms; still pending: navigation to \/settle\/never/)
  })
})

describe('the test setup', () => {
  it('measures a comment or text node as an empty box, as an unmounted toast\'s $el is', () => {
    expect((document.createComment('v-if') as unknown as Element).getBoundingClientRect().height).toBe(0)
    expect((document.createTextNode('x') as unknown as Element).getBoundingClientRect().width).toBe(0)
  })
})
