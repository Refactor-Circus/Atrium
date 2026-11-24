/**
 * Shapes of Atrium's JSON API (`atrium.*` routes). The response types are
 * aliases of `components['schemas']` in the client generated from
 * openapi.json (`app/client/schema.d.ts`, AC 75), so they follow each
 * resource's `schema()`. Where JSON Schema cannot say what the payload holds
 * (a nav item's recursive `children`, the JSON objects keyed by name), the
 * alias narrows the generated shape, and only there.
 *
 * The PHP suite writes the contract fixtures in `test/fixtures` from the API,
 * and Vitest checks each against these types, so a change on either side
 * shows up as a failure.
 */

import type { components, operations } from '../client/schema'

type Schemas = components['schemas']
type ShellSchema = Schemas['ShellResource']
type NavItemSchema = ShellSchema['navigation'][number]['items'][number]
type ScreenSchema = Schemas['ResolvedScreenResource']
type PanelSchema = Schemas['SettingsPanelResource']

/** Where a nav item or search result leads (ClientPath on the PHP side): a SPA path, or an absolute http(s) URL when external. */
export type AtriumLink = NonNullable<Schemas['SearchResultResource']['link']>

/** Why a resolver's data is missing: it failed and the server isolated it. */
export type AtriumDataError = NonNullable<Schemas['DashboardWidgetResource']['error']>

/**
 * A nav item whose badge or children the layer computes from a package API
 * (`NavItem::live()`): the resolver registered with `$atrium.live(key, …)`
 * runs with these static `options`.
 */
export type AtriumNavLive = NonNullable<NavItemSchema['live']>

/**
 * A nav item. The API sends `live` on every item (null when unset); it is
 * optional on the items a live resolver returns.
 */
export type AtriumNavItem = Omit<NavItemSchema, 'live' | 'children'> & {
  live?: AtriumNavLive | null
  children: AtriumNavItem[]
}

export type AtriumNavSection = Omit<ShellSchema['navigation'][number], 'items'> & {
  items: AtriumNavItem[]
}

export type AtriumTheme = Omit<ShellSchema['themes']['all'][number], 'properties'> & {
  /** CSS custom properties (`--color-primary`) the theme sets on :root */
  properties: Record<string, string>
}

export type AtriumSettingsSummary = ShellSchema['settings'][number]

/**
 * A suite integration Atrium registered (the package is installed, enabled
 * and serves its API). `active` is false when one of its feature flags is
 * off for the user; `api_base` is a path on Atrium's host (`/impex/api`) or
 * an absolute URL.
 */
export type AtriumIntegration = Omit<ShellSchema['integrations'][number], 'features'> & {
  /** Each feature flag the integration needs, and whether it is on for the user */
  features: Record<string, boolean>
}

/** A client-side search source, run with the resolver `$atrium.searchSource(key, …)` registers. */
export type AtriumSearchSource = ShellSchema['search']['sources'][number]

/** The shell; `search.per_source` is null when the host sets no cap. */
export type AtriumShell = Omit<ShellSchema, 'navigation' | 'themes' | 'integrations'> & {
  navigation: AtriumNavSection[]
  themes: Omit<ShellSchema['themes'], 'all'> & { all: AtriumTheme[] }
  /** Every registered integration, by key */
  integrations: AtriumIntegration[]
}

export interface AtriumShellResponse {
  data: AtriumShell
}

export type AtriumGrid = Schemas['DashboardWidgetResource']['grid']

/**
 * A widget placed on a dashboard. `data` is absent on a lazy placement, which
 * fetches it from `atrium.dashboards.widgets.show` by `uuid`. An orphaned
 * placement (its widget is no longer registered) has a null `component`.
 */
export type AtriumPlacement = Schemas['DashboardWidgetResource']

/** A dashboard; `widgets` is absent in the dashboard list, and `version` goes back with a layout or update (409 when stale). */
export type AtriumDashboard = Schemas['DashboardResource']

export type AtriumAbilities = NonNullable<operations['atrium.dashboards.show']['responses'][200]['content']['application/json']['meta']>['abilities']

export interface AtriumDashboardResponse {
  data: AtriumDashboard | null
  meta?: { abilities: AtriumAbilities }
}

export interface AtriumDashboardListResponse {
  data: AtriumDashboard[]
}

/** One placement of a layout payload (`PUT dashboards/{slug}/layout`). */
export interface AtriumLayoutWidget {
  /** A placement the dashboard has; left out for a new one */
  uuid?: string
  widget_key: string
  grid_row: number
  grid_column: number
  grid_width: number
  grid_height: number
  settings: Record<string, unknown>
}

export type AtriumWidgetDefinition = Schemas['WidgetDefinitionResource']

/** A registered tab: a built-in one (no component) the page renders itself. `data` is absent on a tab that is not open. */
export type AtriumTab = ScreenSchema['tabs'][number]

/** A screen section, or a registered tab, rendered by its `component`. */
export type AtriumExtensionData = Omit<AtriumTab, 'icon' | 'built_in'>

export type AtriumScreenData = Omit<ScreenSchema, 'path' | 'subject_type' | 'record' | 'options' | 'sections' | 'rows'> & {
  /** Each slot's sections, by slot name (`header.actions`, `before`, `after`, `aside`, ...) */
  sections: Record<string, AtriumExtensionData[]>
  /** Row-slot sections of a list screen, by row key, then slot */
  rows: Record<string, Record<string, AtriumExtensionData[]>>
}

/**
 * A screen a suite integration declares (`atrium.screens.show`): its
 * declaration and the extensions other packages registered for it. The page
 * loads the record itself, from the package's API. `path` is the layer route
 * it lives at (`/impex/runs/:run`), `subject_type` the morph type the host
 * stores its record as (D-092), and `record` the record's route key it was
 * asked for (`?record=`).
 * `options` is the static configuration the page reads, such as
 * `showroom.transfers`' `flow_prefix` (D-042); the API always sends it,
 * `{}` when there is none.
 */
export type AtriumIntegrationScreenData = AtriumScreenData & Required<Pick<ScreenSchema, 'path' | 'subject_type' | 'record'>> & Pick<ScreenSchema, 'options'>

export interface AtriumIntegrationScreenResponse {
  data: AtriumIntegrationScreenData
}

/** The layer's public names for a screen payload and the shell. */
export type ScreenData = AtriumScreenData
export type Shell = AtriumShell

/** An opened settings panel: its `description` and `data` always come with it. */
export type AtriumSettingsPanelData = Omit<PanelSchema, 'description' | 'data'> & Required<Pick<PanelSchema, 'description' | 'data'>>

export interface AtriumSettingsIndexResponse {
  data: AtriumSettingsSummary[]
  screen: AtriumScreenData
}

export interface AtriumSettingsPanelResponse {
  data: AtriumSettingsPanelData
  screen: AtriumScreenData
}

export type AtriumSearchResult = Schemas['SearchResultResource']

/**
 * A client-side search source (`$atrium.searchSource(key, resolver)`): it
 * searches its package's API for `q` and returns at most `limit` results. A
 * rejection (an HTTP error included) drops the source from that search only.
 */
export type AtriumSearchSourceResolver = (q: string, options: { limit: number }) => Promise<AtriumSearchResult[]>

/** What a live resolver sets on its nav item; a key left out keeps the item's own. */
export interface AtriumLiveResult {
  /** The badge to show; null (or 0, by the resolver's choice) shows none */
  badge?: number | null
  children?: AtriumNavItem[]
}

/** A live nav resolver (`$atrium.live(key, resolver)`), given the item's static `live.options`. */
export type AtriumLiveResolver = (options: Record<string, unknown>) => Promise<AtriumLiveResult>

/** Why an integration's page cannot render: missing from the shell, or flagged off. */
export type AtriumIntegrationUnavailableReason = 'absent' | 'inactive'

/**
 * How the app authenticates against Atrium's API. Atrium has no opinion:
 * the host app's guard (Passport, Sanctum, anything) decides, and this adapter
 * is the client half of it. It signs every integration client too
 * (`useAtriumIntegration()`), so a host configures auth once.
 */
/**
 * Sees every response of every Atrium client (the integration clients,
 * `useAtriumClient()` and `useAtriumApi()`) before the caller does, with the
 * request that got it (D-049). It gets its own copy of the response, so it
 * may read the body. One that throws is logged and skipped.
 */
export type AtriumResponseHandler = (response: Response, request: Request) => void | Promise<void>

/**
 * An app-wide notice above every shell page, raised with `atrium.notify()`
 * (by a response handler, say) and dismissed by the user.
 */
export interface AtriumNotice {
  /** An i18n key, or the text itself when no message has that key */
  message: string
  /** The message's parameters */
  params?: Record<string, string | number>
  /** Where the notice links, inside the SPA */
  link?: { to: string, label: string }
  color?: 'info' | 'warning' | 'error'
  /**
   * What the notice is about: once dismissed, the same key and `id` is not
   * shown again in this app's life (a new deadline is)
   */
  id?: string
}

export interface AtriumAuthAdapter {
  /** Headers for every API request, e.g. `{ Authorization: 'Bearer …' }` */
  headers?: () => Record<string, string> | Promise<Record<string, string>>
  /** `include` for cookie-based auth across origins */
  credentials?: RequestCredentials
  /** Called on a 401 (except on a public page): refresh, or send the user to sign in */
  onUnauthorized?: () => void | Promise<void>
}
