import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import FeaturesPage from '../src/pages/features.vue'
import type { components } from '../client/schema'
import type { AtriumIntegrationScreenData } from '@refactor-circus/atrium'
import { settle } from '@refactor-circus/atrium/testing'
import { mockPackageApi, mountIntegration, reply, resetPackageApis, type PackageCall, type PackageRoutes } from '@refactor-circus/atrium/testing'
import { clearAtriumData, mockAtriumApi, useRouter } from '@refactor-circus/atrium/testing'

/*
 * The `pennantplus.features` screen (AC 54, 58): it lists PennantPlus's
 * features, scope types, scope models and stored values through the
 * `pennantplus` client; it sets a value (`values.update`), forgets one
 * (`values.destroy`) and purges a feature (`features.destroy`), each
 * destructive change behind a confirmation; the API's 403, v1's "manages
 * feature flags" check, hides every control.
 */

const { api } = vi.hoisted(() => ({
  api: vi.fn<(path: string, options?: { query?: Record<string, unknown> }) => Promise<unknown>>()
}))

mockAtriumApi(api)

type Schemas = components['schemas']

/**
 * PennantPlus's schema types these answers loosely (`data: string[]`, `data:
 * string`); each entry is typed by its resource or action, and the envelope
 * is handed to the mock as is.
 */
function loose(body: unknown): never {
  return body as never
}

const USER = 'Workbench\\App\\Models\\User'

const features = ['new-dashboard', 'App\\Features\\Beta'].map(name => ({ name }) satisfies Pick<Schemas['FeatureResource'], 'name'>)

const scopeTypes = [
  { type: 'global', label: 'Global', searchable: false },
  { type: USER, label: 'Users', searchable: true },
  { type: 'other', label: 'Other scopes', searchable: false }
]

const globalValue = {
  feature: 'new-dashboard',
  scope: '__laravel_null',
  scope_type: null,
  scope_id: null,
  scope_label: 'Global',
  title: null,
  global: true,
  value: true,
  active: true,
  updated_at: '2026-11-20T10:00:00+00:00'
} satisfies Schemas['FeatureValueResource']

const userValue = {
  feature: 'new-dashboard',
  scope: `${USER}|7`,
  scope_type: USER,
  scope_id: '7',
  scope_label: 'User #7',
  title: 'Ada Lovelace',
  global: false,
  value: false,
  active: false,
  updated_at: '2026-11-21T10:00:00+00:00'
} satisfies Schemas['FeatureValueResource']

const richValue = {
  feature: 'App\\Features\\Beta',
  scope: 'team-red',
  scope_type: 'other',
  scope_id: 'team-red',
  scope_label: 'team-red',
  title: null,
  global: false,
  value: { variant: 'b' },
  active: true,
  updated_at: null
} satisfies Schemas['FeatureValueResource']

const screen: AtriumIntegrationScreenData = {
  key: 'pennantplus.features',
  kind: 'list',
  path: '/pennantplus/features',
  subject_type: null,
  record: null,
  open_tab: 'overview',
  tabs: [],
  sections: {},
  rows: {}
}

/** PennantPlus's API with the stored values above, on two pages. */
function pennantplus(routes: PackageRoutes<'pennantplus'> = {}): PackageCall[] {
  return mockPackageApi('pennantplus', {
    'GET /features': loose({ data: features }),
    'GET /scopes': loose({ data: scopeTypes }),
    'GET /values': call => loose({
      data: call.query.page === '2' ? [richValue] : [globalValue, userValue],
      meta: { current_page: Number(call.query.page ?? 1), last_page: 2, total: 3 }
    }),
    'GET /scopes/{type}/models': loose({ data: [{ id: '7', title: 'Ada Lovelace', scope: `${USER}|7` }] }),
    'PUT /values': { data: userValue },
    'DELETE /values': reply(204),
    'DELETE /features/{feature}': reply(204),
    ...routes
  })
}

async function mountPage(): Promise<VueWrapper> {
  const wrapper = await mountIntegration(FeaturesPage, 'pennantplus')
  await settle()

  return wrapper as unknown as VueWrapper
}

/** The form control under a test id: the element itself, or the input Nuxt UI wraps. */
function control(wrapper: VueWrapper, testid: string): DOMWrapper<HTMLInputElement> {
  const found = wrapper.find<HTMLInputElement>(`[data-testid="${testid}"]`)

  return found.element.matches('input, select, textarea') ? found : found.find<HTMLInputElement>('input, select, textarea')
}

function requests(calls: PackageCall[], method: string, route: string): PackageCall[] {
  return calls.filter(call => call.method === method && call.route === route)
}

async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
  await settle()
}

beforeEach(() => {
  clearAtriumData()
  api.mockReset()
  api.mockResolvedValue({ data: screen })
})

afterEach(() => {
  resetPackageApis()
  vi.restoreAllMocks()
})

describe('loading', () => {
  it('loads the features, scope types and stored values through the pennantplus client', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    expect(requests(calls, 'GET', '/features')).toHaveLength(1)
    expect(requests(calls, 'GET', '/scopes')).toHaveLength(1)
    expect(requests(calls, 'GET', '/values')).toHaveLength(1)
    expect(calls.every(call => call.pkg === 'pennantplus')).toBe(true)

    const rows = wrapper.findAll('[data-testid="pennantplus-value"]')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('new-dashboard')
    expect(rows[0]!.text()).toContain('Global')
    expect(rows[0]!.find('[data-testid="pennantplus-value-status"]').attributes('data-status')).toBe('active')
    expect(rows[1]!.text()).toContain('User #7')
    expect(rows[1]!.text()).toContain('Ada Lovelace')
    expect(rows[1]!.find('[data-testid="pennantplus-value-status"]').attributes('data-status')).toBe('inactive')
  })

  it('asks atrium.screens.show for its extensions', async () => {
    pennantplus()
    await mountPage()

    expect(api).toHaveBeenCalledWith('/screens/pennantplus.features', { query: { record: undefined, tab: undefined } })
  })

  it('sends the open tab to atrium.screens.show', async () => {
    pennantplus()
    await useRouter().replace({ query: { tab: 'keen.activity' } })

    try {
      await mountPage()

      expect(api).toHaveBeenCalledWith('/screens/pennantplus.features', { query: { record: undefined, tab: 'keen.activity' } })
    } finally {
      await useRouter().replace({ query: {} })
    }
  })

  it('offers the features to pick from, and every scope type to filter by', async () => {
    pennantplus()
    const wrapper = await mountPage()

    const offered = wrapper.findAll<HTMLOptionElement>('[data-testid="pennantplus-feature-options"] option').map(option => option.element.value)
    expect(offered).toEqual(['new-dashboard', 'App\\Features\\Beta'])

    const filterScopes = control(wrapper, 'pennantplus-filter-scope').findAll('option').map(option => option.text())
    expect(filterScopes).toEqual(['All scopes', 'Global', 'Users', 'Other scopes'])
  })

  it('offers only global, the configured models and other scopes when setting a value', async () => {
    pennantplus({
      'GET /scopes': loose({ data: [...scopeTypes.slice(0, 2), { type: 'App\\Models\\Legacy', label: 'Legacy', searchable: false }, scopeTypes[2]] })
    })
    const wrapper = await mountPage()

    const formScopes = control(wrapper, 'pennantplus-scope-type').findAll<HTMLOptionElement>('option').map(option => option.element.value)
    expect(formScopes).toEqual(['global', USER, 'other'])
  })

  it('shows a value that is not a boolean as JSON', async () => {
    pennantplus()
    const wrapper = await mountPage()

    await wrapper.find('[data-testid="pennantplus-next"]').trigger('click')
    await settle()

    const row = wrapper.find('[data-testid="pennantplus-value"]')
    expect(row.text()).toContain('{"variant":"b"}')
    expect(row.find('[data-testid="pennantplus-value-status"]').attributes('data-status')).toBe('active')
  })

  it('says so when no stored value matches', async () => {
    pennantplus({ 'GET /values': loose({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }) })
    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="pennantplus-no-values"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pennantplus-values"]').exists()).toBe(false)
  })

  it('shows an error, with no controls, when the values cannot be loaded', async () => {
    pennantplus({ 'GET /values': reply(500) })
    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="pennantplus-load-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pennantplus-values"]').exists()).toBe(false)
  })
})

describe('filters and pages', () => {
  it('sends the feature, scope and scope id filters as values.index query parameters', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    await control(wrapper, 'pennantplus-filter-feature').setValue('new-dashboard')
    await control(wrapper, 'pennantplus-filter-scope').setValue(USER)
    await control(wrapper, 'pennantplus-filter-scope-id').setValue('7')
    await wrapper.find('[data-testid="pennantplus-filters"]').trigger('submit')
    await settle()

    expect(requests(calls, 'GET', '/values').at(-1)!.query).toEqual({ feature: 'new-dashboard', scope: USER, scope_id: '7' })
  })

  it('resets the filters', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    await control(wrapper, 'pennantplus-filter-feature').setValue('new-dashboard')
    await wrapper.find('[data-testid="pennantplus-filters"]').trigger('submit')
    await settle()
    await wrapper.find('[data-testid="pennantplus-reset"]').trigger('click')
    await settle()

    expect(requests(calls, 'GET', '/values').at(-1)!.query).toEqual({})
    expect(control(wrapper, 'pennantplus-filter-feature').element.value).toBe('')
  })

  it('pages the way values.index does, by page number', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="pennantplus-page"]').text()).toContain('1')
    expect(wrapper.find('[data-testid="pennantplus-prev"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[data-testid="pennantplus-next"]').trigger('click')
    await settle()

    expect(requests(calls, 'GET', '/values').at(-1)!.query).toEqual({ page: '2' })
    expect(wrapper.find('[data-testid="pennantplus-next"]').attributes('disabled')).toBeDefined()
  })
})

describe('setting a value (values.update)', () => {
  it('stores a value for the global scope, then reloads', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    await control(wrapper, 'pennantplus-feature').setValue('new-dashboard')
    await control(wrapper, 'pennantplus-value-input').setValue('false')
    await wrapper.find('[data-testid="pennantplus-set-value"]').trigger('submit')
    await settle()

    const put = requests(calls, 'PUT', '/values')
    expect(put).toHaveLength(1)
    expect(put[0]!.body).toEqual({ feature: 'new-dashboard', scope_type: 'global', value: false })
    expect(requests(calls, 'GET', '/values')).toHaveLength(2)
    expect(wrapper.find('[data-testid="pennantplus-status"]').text()).toBe('Feature flag value saved.')
  })

  it('stores a value for a model found through scopes.models', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    await control(wrapper, 'pennantplus-feature').setValue('App\\Features\\Beta')
    await control(wrapper, 'pennantplus-scope-type').setValue(USER)
    await control(wrapper, 'pennantplus-scope-search').setValue('Ada')
    await wait(300)

    const search = requests(calls, 'GET', '/scopes/{type}/models')
    expect(search).toHaveLength(1)
    expect(search[0]!.path).toBe(`/scopes/${encodeURIComponent(USER)}/models`)
    expect(search[0]!.query.q).toBe('Ada')

    await wrapper.find('[data-testid="pennantplus-scope-result"]').trigger('click')
    expect(wrapper.find('[data-testid="pennantplus-scope-picked"]').text()).toContain('Ada Lovelace (#7)')

    await control(wrapper, 'pennantplus-value-input').setValue('{"variant":"b"}')
    await wrapper.find('[data-testid="pennantplus-set-value"]').trigger('submit')
    await settle()

    expect(requests(calls, 'PUT', '/values')[0]!.body).toEqual({
      feature: 'App\\Features\\Beta',
      scope_type: USER,
      scope_id: '7',
      value: { variant: 'b' }
    })
  })

  it('stores a value for any other string scope', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    await control(wrapper, 'pennantplus-feature').setValue('new-dashboard')
    await control(wrapper, 'pennantplus-scope-type').setValue('other')
    await control(wrapper, 'pennantplus-scope-string').setValue('team-red')
    await wrapper.find('[data-testid="pennantplus-set-value"]').trigger('submit')
    await settle()

    expect(requests(calls, 'PUT', '/values')[0]!.body).toEqual({ feature: 'new-dashboard', scope_type: 'other', scope_id: 'team-red', value: true })
  })

  it('refuses a value that is not JSON, without a request', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    await control(wrapper, 'pennantplus-feature').setValue('new-dashboard')
    await control(wrapper, 'pennantplus-value-input').setValue('yes please')
    await wrapper.find('[data-testid="pennantplus-set-value"]').trigger('submit')
    await settle()

    expect(requests(calls, 'PUT', '/values')).toHaveLength(0)
    expect(wrapper.find('[data-testid="pennantplus-set-value"]').text()).toContain('Enter a JSON value: true, false, or any richer value.')
  })

  it('shows the field errors of a 422', async () => {
    pennantplus({
      'PUT /values': reply(422, { message: 'Invalid.', errors: { feature: ['The feature field is required.'], scope_id: ['No model with that ID was found for the chosen scope.'] } })
    })
    const wrapper = await mountPage()

    await wrapper.find('[data-testid="pennantplus-set-value"]').trigger('submit')
    await settle()

    const form = wrapper.find('[data-testid="pennantplus-set-value"]')
    expect(form.text()).toContain('The feature field is required.')
    expect(form.text()).toContain('No model with that ID was found for the chosen scope.')
    expect(wrapper.find('[data-testid="pennantplus-status"]').exists()).toBe(false)
  })

  it('switches a stored value on or off from its row', async () => {
    const calls = pennantplus()
    const wrapper = await mountPage()

    const [active, inactive] = wrapper.findAll('[data-testid="pennantplus-toggle"]')
    expect(active!.text()).toContain('Deactivate')
    expect(inactive!.text()).toContain('Activate')

    await active!.trigger('click')
    await settle()

    expect(requests(calls, 'PUT', '/values')[0]!.body).toEqual({ feature: 'new-dashboard', scope: '__laravel_null', value: false })
    expect(requests(calls, 'GET', '/values')).toHaveLength(2)
  })
})

describe('forgetting a value (values.destroy)', () => {
  it('asks first, and sends nothing when the user declines', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const calls = pennantplus()
    const wrapper = await mountPage()

    await wrapper.findAll('[data-testid="pennantplus-forget"]')[1]!.trigger('click')
    await settle()

    expect(confirm).toHaveBeenCalledWith('Forget this stored value? Pennant resolves it again the next time it is checked.')
    expect(requests(calls, 'DELETE', '/values')).toHaveLength(0)
  })

  it('forgets the value of its feature and scope once confirmed, then reloads', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const calls = pennantplus()
    const wrapper = await mountPage()

    await wrapper.findAll('[data-testid="pennantplus-forget"]')[1]!.trigger('click')
    await settle()

    const deleted = requests(calls, 'DELETE', '/values')
    expect(deleted).toHaveLength(1)
    expect(deleted[0]!.query).toEqual({ feature: 'new-dashboard', scope: `${USER}|7` })
    expect(requests(calls, 'GET', '/values')).toHaveLength(2)
    expect(wrapper.find('[data-testid="pennantplus-status"]').text()).toBe('Feature flag value forgotten.')
  })
})

describe('purging a feature (features.destroy)', () => {
  async function filterByFeature(wrapper: VueWrapper, feature: string): Promise<void> {
    await control(wrapper, 'pennantplus-filter-feature').setValue(feature)
    await wrapper.find('[data-testid="pennantplus-filters"]').trigger('submit')
    await settle()
  }

  it('is offered only while the list is filtered to one feature', async () => {
    pennantplus()
    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="pennantplus-purge"]').exists()).toBe(false)

    await filterByFeature(wrapper, 'App\\Features\\Beta')

    expect(wrapper.find('[data-testid="pennantplus-purge"]').text()).toContain('App\\Features\\Beta')
  })

  it('asks with v1\'s confirmation, and sends nothing when the user declines', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const calls = pennantplus()
    const wrapper = await mountPage()

    await filterByFeature(wrapper, 'App\\Features\\Beta')
    await wrapper.find('[data-testid="pennantplus-purge"]').trigger('click')
    await settle()

    expect(confirm).toHaveBeenCalledWith('Forget every stored value of this feature, for every scope?')
    expect(requests(calls, 'DELETE', '/features/{feature}')).toHaveLength(0)
  })

  it('purges the feature once confirmed, then clears the filter and reloads', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const calls = pennantplus()
    const wrapper = await mountPage()

    await filterByFeature(wrapper, 'App\\Features\\Beta')
    await wrapper.find('[data-testid="pennantplus-purge"]').trigger('click')
    await settle()

    const purged = requests(calls, 'DELETE', '/features/{feature}')
    expect(purged).toHaveLength(1)
    expect(purged[0]!.path).toBe(`/features/${encodeURIComponent('App\\Features\\Beta')}`)
    expect(requests(calls, 'GET', '/values').at(-1)!.query).toEqual({})
    expect(requests(calls, 'GET', '/features')).toHaveLength(2)
    expect(wrapper.find('[data-testid="pennantplus-status"]').text()).toBe('Feature flag purged.')
    expect(wrapper.find('[data-testid="pennantplus-purge"]').exists()).toBe(false)
  })
})

describe('no access (403)', () => {
  function expectNoControls(wrapper: VueWrapper): void {
    expect(wrapper.find('[data-testid="atrium-no-access"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pennantplus-set-value"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pennantplus-filters"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pennantplus-values"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pennantplus-toggle"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pennantplus-forget"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pennantplus-purge"]').exists()).toBe(false)
  }

  it('hides every control when the API refuses the user', async () => {
    pennantplus({
      'GET /features': reply(403),
      'GET /scopes': reply(403),
      'GET /values': reply(403)
    })

    expectNoControls(await mountPage())
  })

  it('hides every control when any of the lists answers 403', async () => {
    pennantplus({ 'GET /values': reply(403) })

    expectNoControls(await mountPage())
  })

  it('hides every control when a change answers 403', async () => {
    pennantplus({ 'PUT /values': reply(403) })
    const wrapper = await mountPage()

    await wrapper.find('[data-testid="pennantplus-toggle"]').trigger('click')
    await settle()

    expectNoControls(wrapper)
  })
})
