import { describe, expectTypeOf, it } from 'vitest'
import type { components, operations } from '../src/client/schema'
import type {
  AtriumDashboard,
  AtriumDashboardResponse,
  AtriumIntegration,
  AtriumNavLive,
  AtriumPlacement,
  AtriumSearchResult,
  AtriumSearchSource,
  AtriumSettingsIndexResponse,
  AtriumSettingsPanelResponse,
  AtriumShellResponse,
  AtriumWidgetDefinition,
  ScreenData,
  Shell
} from '../src/types/atrium'
import dashboard from './fixtures/dashboard.json'
import screen from './fixtures/screen.json'
import screenTab from './fixtures/screen-tab.json'
import settings from './fixtures/settings.json'
import shell from './fixtures/shell.json'
import shellIntegrations from './fixtures/shell-integrations.json'

/*
 * The PHP suite writes these payloads from the API itself
 * (tests/Feature/Api/ContractFixturesTest.php). Each must satisfy the type
 * the layer reads it as, so a contract change fails here until the types
 * follow it.
 */

/*
 * TypeScript reads a JSON array of objects with different keys as one union
 * that gives each object every other object's keys as `?: undefined` (the
 * built-in theme's empty `properties` beside the others' token maps). The API
 * never sends those keys, so `Sent` drops them and keeps the keys an object
 * may leave out optional, which `exactOptionalPropertyTypes` (test/tsconfig)
 * then reads as absent rather than undefined.
 */
type Sent<T> = T extends readonly (infer Item)[]
  ? Sent<Item>[]
  : T extends object
    ? { [K in keyof T as [Exclude<T[K], undefined>] extends [never] ? never : K]: Sent<Exclude<T[K], undefined>> }
    : T

type Schemas = components['schemas']

describe('the API contract fixtures', () => {
  it('shell.json is a shell response', () => {
    expectTypeOf<Sent<typeof shell>>().toExtend<AtriumShellResponse>()
  })

  it('shell-integrations.json is a shell response with integrations, search sources and live nav keys', () => {
    expectTypeOf<Sent<typeof shellIntegrations>>().toExtend<AtriumShellResponse>()
    expectTypeOf<Sent<typeof shellIntegrations.data.integrations[number]>>().toExtend<AtriumIntegration>()
    expectTypeOf<Sent<typeof shellIntegrations.data.search.sources[number]>>().toExtend<AtriumSearchSource>()
    expectTypeOf<Sent<NonNullable<typeof shellIntegrations.data.navigation[3]['items'][0]['live']>>>().toExtend<AtriumNavLive>()
  })

  it('a shell response requires the integration keys', () => {
    expectTypeOf<{ min_length: number }>().not.toExtend<AtriumShellResponse['data']['search']>()
    expectTypeOf<AtriumShellResponse['data']>().toHaveProperty('integrations')
  })

  it('dashboard.json is a dashboard response', () => {
    expectTypeOf<Sent<typeof dashboard>>().toExtend<AtriumDashboardResponse>()
  })

  it('screen.json and screen-tab.json are settings panel responses with their screen', () => {
    expectTypeOf<Sent<typeof screen>>().toExtend<AtriumSettingsPanelResponse>()
    expectTypeOf<Sent<typeof screenTab>>().toExtend<AtriumSettingsPanelResponse>()
  })

  it('settings.json is the settings list response with its screen', () => {
    expectTypeOf<Sent<typeof settings>>().toExtend<AtriumSettingsIndexResponse>()
  })
})

/*
 * The public types are aliases of the client generated from openapi.json
 * (AC 75), so the fixtures also satisfy the generated responses themselves:
 * a resource whose `schema()` drifts from what it sends fails here.
 */
type Json<Operation extends keyof operations, Status extends keyof operations[Operation]['responses']> =
  operations[Operation]['responses'][Status] extends { content: { 'application/json': infer Body } } ? Body : never

describe('the API contract fixtures against the generated client', () => {
  it('shell.json and shell-integrations.json are atrium.shell answers', () => {
    expectTypeOf<Sent<typeof shell>>().toExtend<Json<'atrium.shell', 200>>()
    expectTypeOf<Sent<typeof shellIntegrations>>().toExtend<Json<'atrium.shell', 200>>()
    expectTypeOf<Sent<typeof shell>['data']>().toExtend<Schemas['ShellResource']>()
  })

  it('dashboard.json is an atrium.dashboards.show answer', () => {
    expectTypeOf<Sent<typeof dashboard>>().toExtend<Json<'atrium.dashboards.show', 200>>()
  })

  it('screen.json and screen-tab.json are atrium.settings.show answers', () => {
    expectTypeOf<Sent<typeof screen>>().toExtend<Json<'atrium.settings.show', 200>>()
    expectTypeOf<Sent<typeof screenTab>>().toExtend<Json<'atrium.settings.show', 200>>()
  })

  it('settings.json is an atrium.settings.index answer', () => {
    expectTypeOf<Sent<typeof settings>>().toExtend<Json<'atrium.settings.index', 200>>()
  })

  it('keeps the public names as aliases of the generated schemas', () => {
    expectTypeOf<AtriumDashboard>().toEqualTypeOf<Schemas['DashboardResource']>()
    expectTypeOf<AtriumPlacement>().toEqualTypeOf<Schemas['DashboardWidgetResource']>()
    expectTypeOf<AtriumWidgetDefinition>().toEqualTypeOf<Schemas['WidgetDefinitionResource']>()
    expectTypeOf<AtriumSearchResult>().toEqualTypeOf<Schemas['SearchResultResource']>()
    // A nav item's `live` is optional on the items a live resolver returns.
    expectTypeOf<Omit<Shell, 'navigation'>>().toExtend<Omit<Schemas['ShellResource'], 'navigation'>>()
    expectTypeOf<ScreenData>().toExtend<Omit<Schemas['ResolvedScreenResource'], 'path' | 'subject_type' | 'record'>>()
  })
})
