import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { AtriumIntegrationScreen, AtriumIntegrationUnavailable, AtriumNoAccess } from '#components'
import { clearNuxtData, useAtrium, useAtriumIntegration, useAtriumShellStore, useRouter } from '#imports'
import type { RouteLocationNormalized } from 'vue-router'
import DefaultLayout from '../app/layouts/default.vue'
import PublicLayout from '../app/layouts/public.vue'
import integrationMiddleware from '../app/middleware/atrium-integration.global'
import type { AtriumIntegrationScreen as IntegrationScreenData } from '../app/types/atrium'
import { httpError, settle, withSetup } from './support'
import { integrationEntry, integrationShell, mockPackageApi, reply, resetPackageApis, useShell, watchPackageApis } from './integrations/support'

/*
 * Integration routing (AC 49): `/{pkg}/…` pages render only while their
 * integration is active in the shell; otherwise <AtriumIntegrationUnavailable>
 * renders in their place and the package's API is never called. Public pages
 * (D-038) skip the shell. <AtriumIntegrationScreen> brings each page its
 * extensions from `atrium.screens.show`.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: { query?: Record<string, unknown> }) => Promise<unknown>>()
}))

mockNuxtImport('useAtriumApi', () => () => api)

const PACKAGES = ['cortex', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom'] as const

/** A page that calls its package's API as soon as it is set up, as a real one would. */
const CortexPage = defineComponent({
  setup() {
    const { client } = useAtriumIntegration('cortex')
    void client?.GET('/virtual-agents')

    return () => h('div', { 'data-testid': 'cortex-page' }, 'Virtual agents')
  }
})

function location(path: string, meta: Record<string, unknown> = {}): RouteLocationNormalized {
  return { path, fullPath: path, meta, params: {}, query: {}, hash: '', name: undefined, matched: [], redirectedFrom: undefined } as RouteLocationNormalized
}

async function runMiddleware(to: RouteLocationNormalized): Promise<unknown> {
  return withSetup(() => integrationMiddleware(to, location('/')))
}

const shellWithIntegrations = () => integrationShell([
  integrationEntry('cortex'),
  integrationEntry('polycart', { active: false, label: 'Polycart' })
])

describe('the integration route middleware', () => {
  beforeEach(async () => {
    api.mockReset()
    await useShell(shellWithIntegrations())
  })

  afterEach(async () => {
    resetPackageApis()
    await useRouter().replace('/')
  })

  it('lets a page of an active integration through', async () => {
    const to = location('/cortex/virtual-agents')
    await runMiddleware(to)

    expect(to.meta.atriumUnavailable).toBeUndefined()
  })

  it('marks a page of an integration missing from the shell (not installed, or disabled) as absent', async () => {
    const to = location('/keen/entries')
    await runMiddleware(to)

    expect(to.meta.atriumUnavailable).toEqual({ integration: 'keen', reason: 'absent' })
  })

  it('marks a page of a registered integration flagged off for the user as inactive', async () => {
    const to = location('/polycart/carts')
    await runMiddleware(to)

    expect(to.meta.atriumUnavailable).toEqual({ integration: 'polycart', reason: 'inactive' })
  })

  it('applies to every package path, and to no other path', async () => {
    await useShell(integrationShell([]))

    for (const pkg of PACKAGES) {
      const to = location(`/${pkg}/anything`)
      await runMiddleware(to)
      expect(to.meta.atriumUnavailable, pkg).toEqual({ integration: pkg, reason: 'absent' })
    }

    for (const path of ['/', '/d/overview', '/settings', '/demo/orders', '/cortexx/records', '/atrium/cortex']) {
      const to = location(path)
      await runMiddleware(to)
      expect(to.meta.atriumUnavailable, path).toBeUndefined()
    }
  })

  it('loads the shell first when it is not loaded yet', async () => {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = null
    api.mockResolvedValue({ data: shellWithIntegrations() })

    const to = location('/polycart/carts')
    await runMiddleware(to)

    expect(api).toHaveBeenCalledWith('/shell')
    expect(to.meta.atriumUnavailable).toEqual({ integration: 'polycart', reason: 'inactive' })
  })

  it('skips the shell on a public page, and puts it in the public layout', async () => {
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = null

    const to = location('/roster/invitations/secret-token', { atrium: { public: true } })
    await runMiddleware(to)

    expect(api).not.toHaveBeenCalledWith('/shell')
    expect(store.shell).toBeNull()
    expect(to.meta.atriumUnavailable).toBeUndefined()
    expect(to.meta.layout).toBe('public')
  })

  it('renders <AtriumIntegrationUnavailable> in place of the page, with no package request', async () => {
    await useShell(integrationShell([integrationEntry('cortex', { active: false })]))
    const calls = watchPackageApis(PACKAGES)

    await useRouter().push('/cortex/virtual-agents')
    await settle()

    const wrapper = await mountSuspended(DefaultLayout, { slots: { default: () => h(CortexPage) } })
    await settle()

    expect(wrapper.find('[data-testid="atrium-integration-unavailable"]').attributes('data-reason')).toBe('inactive')
    expect(wrapper.find('[data-testid="cortex-page"]').exists()).toBe(false)
    expect(calls).toEqual([])
  })

  it('renders the page of an active integration', async () => {
    mockPackageApi('cortex', { 'GET /virtual-agents': { data: [] } as never })

    await useRouter().push('/cortex/virtual-agents')
    await settle()

    const wrapper = await mountSuspended(DefaultLayout, { slots: { default: () => h(CortexPage) } })

    expect(wrapper.find('[data-testid="cortex-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="atrium-integration-unavailable"]').exists()).toBe(false)
  })
})

describe('<AtriumIntegrationUnavailable>', () => {
  it('says something different for an absent and a flagged-off integration', async () => {
    const absent = await mountSuspended(AtriumIntegrationUnavailable, { props: { integration: 'keen', reason: 'absent' } })
    const inactive = await mountSuspended(AtriumIntegrationUnavailable, { props: { integration: 'polycart', reason: 'inactive', label: 'Polycart' } })

    expect(absent.text()).toContain('keen')
    expect(inactive.text()).toContain('Polycart')
    expect(absent.text()).not.toBe(inactive.text().replace('Polycart', 'keen'))
  })
})

describe('the public layout', () => {
  it('renders the page alone, without loading the shell', async () => {
    api.mockReset()
    const store = await withSetup(() => useAtriumShellStore())
    store.shell = null

    const wrapper = await mountSuspended(PublicLayout, { slots: { default: () => h('p', { 'data-testid': 'invitation' }, 'You are invited') } })

    expect(wrapper.find('[data-testid="invitation"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="atrium-nav"]').exists()).toBe(false)
    expect(api).not.toHaveBeenCalledWith('/shell')
  })

  it('never calls onUnauthorized() for a 401 from an integration client on a public page', async () => {
    const onUnauthorized = vi.fn()
    const atrium = await withSetup(() => useAtrium())
    atrium.auth({ onUnauthorized })

    await useShell(integrationShell([integrationEntry('roster')]))
    mockPackageApi('roster', { 'GET /invitations/{token}': reply(401) } as never)

    const router = useRouter()
    router.addRoute({ path: '/test-public-page', component: CortexPage, meta: { atrium: { public: true } } })
    await router.push('/test-public-page')

    const roster = (await withSetup(() => useAtriumIntegration('roster'))).client!
    await (roster as unknown as { GET: (path: string, init: unknown) => Promise<unknown> }).GET('/invitations/{token}', { params: { path: { token: 'x' } } })

    expect(onUnauthorized).not.toHaveBeenCalled()

    atrium.auth({})
    resetPackageApis()
    await router.replace('/')
  })
})

const screenPayload: IntegrationScreenData = {
  key: 'cortex.virtual-agent',
  kind: 'detail',
  path: '/cortex/virtual-agents/:slug',
  subject_type: 'cortex.virtual-agent',
  record: 'triage',
  open_tab: 'overview',
  tabs: [
    { key: 'overview', label: 'Overview', icon: 'i-lucide-layout-grid', built_in: true, component: null },
    { key: 'acme.audit', label: 'Audit', icon: null, built_in: false, component: 'acme.audit' }
  ],
  sections: {
    'header.actions': [],
    'before': [{ key: 'acme.note', label: 'Note', component: 'acme.note', data: { text: 'Hello' } }],
    'after': [],
    'aside': [{ key: 'acme.aside', label: 'Aside', component: 'acme.aside', data: {} }]
  },
  rows: {}
}

describe('<AtriumIntegrationScreen>', () => {
  const show = (testid: string) => defineComponent({
    props: { data: { type: Object, default: null }, record: { type: null, default: null } },
    setup: props => () => h('div', { 'data-testid': testid }, `${JSON.stringify(props.data)} record=${String(props.record)}`)
  })

  beforeEach(async () => {
    clearNuxtData()
    api.mockReset()

    const atrium = await withSetup(() => useAtrium())
    atrium.extension('acme.note', show('note')).extension('acme.aside', show('aside')).extension('acme.audit', show('audit'))
  })

  afterEach(async () => {
    await useRouter().replace({ query: {} })
  })

  it('fetches atrium.screens.show with its key, record and the open tab', async () => {
    api.mockResolvedValue({ data: screenPayload })
    await useRouter().replace({ query: { tab: 'acme.audit' } })

    await mountSuspended(AtriumIntegrationScreen, { props: { screenKey: 'cortex.virtual-agent', record: 'triage' } })
    await settle()

    expect(api).toHaveBeenCalledWith('/screens/cortex.virtual-agent', { query: { record: 'triage', tab: 'acme.audit' } })
  })

  it('sends no record for a list screen', async () => {
    api.mockResolvedValue({ data: { ...screenPayload, key: 'cortex.virtual-agents', kind: 'list', record: null } })

    await mountSuspended(AtriumIntegrationScreen, { props: { screenKey: 'cortex.virtual-agents' } })
    await settle()

    expect(api).toHaveBeenCalledWith('/screens/cortex.virtual-agents', { query: { record: undefined, tab: undefined } })
  })

  it('renders its tabs and sections around the page, passing the record to each extension', async () => {
    api.mockResolvedValue({ data: screenPayload })

    const wrapper = await mountSuspended(AtriumIntegrationScreen, {
      props: { screenKey: 'cortex.virtual-agent', record: 'triage' },
      slots: { default: () => h('p', { 'data-testid': 'page-body' }, 'Agent') }
    })
    await settle()

    expect(wrapper.find('[data-testid="atrium-screen-tabs"]').text()).toContain('Audit')
    expect(wrapper.find('[data-testid="atrium-slot-before"] [data-testid="note"]').text()).toContain('"text":"Hello"')
    expect(wrapper.find('[data-testid="note"]').text()).toContain('record=triage')
    expect(wrapper.find('[data-testid="atrium-slot-aside"] [data-testid="aside"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="page-body"]').exists()).toBe(true)
  })

  it('renders <AtriumNoAccess> on a 403', async () => {
    api.mockRejectedValue(httpError(403))

    const wrapper = await mountSuspended(AtriumIntegrationScreen, {
      props: { screenKey: 'cortex.virtual-agent', record: 'triage' },
      slots: { default: () => h('p', { 'data-testid': 'page-body' }, 'Agent') }
    })
    await settle()

    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="page-body"]').exists()).toBe(false)
  })

  it('still renders the page, without extensions, when the screen request fails otherwise', async () => {
    api.mockRejectedValue(httpError(500))

    const wrapper = await mountSuspended(AtriumIntegrationScreen, {
      props: { screenKey: 'cortex.virtual-agent' },
      slots: { default: () => h('p', { 'data-testid': 'page-body' }, 'Agent') }
    })
    await settle()

    expect(wrapper.find('[data-testid="page-body"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(false)
  })
})

describe('<AtriumNoAccess>', () => {
  it('renders a no-access notice, or the message it is given', async () => {
    const plain = await mountSuspended(AtriumNoAccess)
    const custom = await mountSuspended(AtriumNoAccess, { props: { description: 'Ask an admin.' } })

    expect(plain.find('[data-testid="atrium-no-access"]').text()).toContain('access')
    expect(custom.text()).toContain('Ask an admin.')
  })
})
