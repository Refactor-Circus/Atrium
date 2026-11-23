/**
 * Shapes of Atrium's JSON API (`atrium.*` routes). The PHP suite writes the
 * contract fixtures in `test/fixtures` from the API, and Vitest checks each
 * against these types, so a change on either side shows up as a failure.
 */

/** Where a nav item or search result leads (ClientPath on the PHP side). */
export interface AtriumLink {
  /** A path inside the SPA (`/demo/orders`), or an absolute http(s) URL when external */
  path: string
  external: boolean
}

/** Why a resolver's data is missing: it failed and the server isolated it. */
export interface AtriumDataError {
  message: string
}

/**
 * A nav item whose badge or children the layer computes from a package API
 * (`NavItem::live()`): the resolver registered with `$atrium.live(key, …)`
 * runs with these static `options`.
 */
export interface AtriumNavLive {
  /** `{package}.{name}`, e.g. `impex.active-runs` */
  key: string
  options: Record<string, unknown>
}

export interface AtriumNavItem {
  label: string
  /** An Iconify name (`i-lucide-house`) */
  icon: string | null
  link: AtriumLink | null
  badge: string | number | null
  /** Sent by the API on every item (null when unset); optional on items a live resolver returns */
  live?: AtriumNavLive | null
  children: AtriumNavItem[]
}

export interface AtriumNavSection {
  key: string
  label: string
  icon: string | null
  grouped: boolean
  link: AtriumLink | null
  items: AtriumNavItem[]
}

export interface AtriumTheme {
  key: string
  label: string
  layout: string
  swatch: string
  icon: string | null
  /** CSS custom properties (`--color-primary`) the theme sets on :root */
  properties: Record<string, string>
}

export interface AtriumSettingsSummary {
  key: string
  label: string
  icon: string | null
  component: string
}

/**
 * A suite integration Atrium registered (the package is installed, enabled
 * and serves its API). `active` is false when one of its feature flags is
 * off for the user.
 */
export interface AtriumIntegration {
  /** The package key (`impex`), also the first segment of its pages' paths */
  key: string
  label: string
  active: boolean
  /** Where its API is: a path on Atrium's host (`/impex/api`) or an absolute URL */
  api_base: string
  /** Each feature flag the integration needs, and whether it is on for the user */
  features: Record<string, boolean>
}

/** A client-side search source, run with the resolver `$atrium.searchSource(key, …)` registers. */
export interface AtriumSearchSource {
  key: string
  /** The integration whose API it searches */
  integration: string
  label: string
  icon: string | null
}

export interface AtriumShell {
  app: { name: string }
  user: { name: string | null, email: string | null } | null
  /** The app's current locale (`app()->getLocale()`), which the layer switches to */
  locale: string
  /** Atrium's API major.minor (`Atrium::API_VERSION`) */
  api_version: string
  navigation: AtriumNavSection[]
  themes: { default: string | null, switchable: boolean, all: AtriumTheme[] }
  settings: AtriumSettingsSummary[]
  search: {
    min_length: number
    /** The client-side sources of active integrations */
    sources: AtriumSearchSource[]
    /** How many results each source may add */
    per_source: number
  }
  /** Every registered integration, by key */
  integrations: AtriumIntegration[]
}

export interface AtriumShellResponse {
  data: AtriumShell
}

export interface AtriumGrid {
  row: number | null
  column: number | null
  width: number | null
  height: number | null
}

/**
 * A widget placed on a dashboard. `data` is absent on a lazy placement, which
 * fetches it from `atrium.dashboards.widgets.show` by `uuid`. An orphaned
 * placement (its widget is no longer registered) has a null `component`.
 */
export interface AtriumPlacement {
  uuid: string
  key: string
  component: string | null
  title: string | null
  icon: string | null
  lazy: boolean
  grid: AtriumGrid
  settings: Record<string, unknown>
  data?: Record<string, unknown> | null
  error?: AtriumDataError
}

export interface AtriumDashboard {
  slug: string
  name: string
  is_default: boolean
  /** Bumped by every change; sent back with a layout or update (409 when stale) */
  version: number
  /** Absent in the dashboard list */
  widgets?: AtriumPlacement[]
}

export interface AtriumAbilities {
  update: boolean
  delete: boolean
}

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

export interface AtriumWidgetDefinition {
  key: string
  label: string
  description: string | null
  icon: string | null
  component: string
  lazy: boolean
  default_size: { width: number, height: number }
  min_size: { width: number, height: number }
}

/** A screen section, or a registered tab, rendered by its `component`. */
export interface AtriumExtension {
  key: string
  label: string
  component: string | null
  /** Absent on a tab that is not open */
  data?: Record<string, unknown> | null
  error?: AtriumDataError
}

export interface AtriumTab extends AtriumExtension {
  icon: string | null
  /** A tab the page renders itself (no component) */
  built_in: boolean
}

export interface AtriumScreen {
  key: string
  kind: string
  open_tab: string
  tabs: AtriumTab[]
  /** Each slot's sections, by slot name (`header.actions`, `before`, `after`, `aside`, ...) */
  sections: Record<string, AtriumExtension[]>
  /** Row-slot sections of a list screen, by row key, then slot */
  rows: Record<string, Record<string, AtriumExtension[]>>
}

/**
 * A screen a suite integration declares (`atrium.screens.show`): its
 * declaration and the extensions other packages registered for it. The page
 * loads the record itself, from the package's API.
 */
export interface AtriumIntegrationScreen extends AtriumScreen {
  /** The layer route it lives at (`/impex/runs/:run`) */
  path: string
  /** The package's morph alias of the screen's record, on a detail screen */
  subject_type: string | null
  /** The record key the screen was asked for (`?record=`), as a string */
  record: string | null
}

export interface AtriumIntegrationScreenResponse {
  data: AtriumIntegrationScreen
}

/** The layer's public names for a screen payload and the shell. */
export type ScreenData = AtriumScreen
export type Shell = AtriumShell

export interface AtriumSettingsPanel extends AtriumSettingsSummary {
  description: string | null
  data: Record<string, unknown> | null
  error?: AtriumDataError
}

export interface AtriumSettingsIndexResponse {
  data: AtriumSettingsSummary[]
  screen: AtriumScreen
}

export interface AtriumSettingsPanelResponse {
  data: AtriumSettingsPanel
  screen: AtriumScreen
}

export interface AtriumSearchResult {
  title: string
  subtitle: string | null
  icon: string | null
  group: string | null
  link: AtriumLink | null
}

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
export interface AtriumAuthAdapter {
  /** Headers for every API request, e.g. `{ Authorization: 'Bearer …' }` */
  headers?: () => Record<string, string> | Promise<Record<string, string>>
  /** `include` for cookie-based auth across origins */
  credentials?: RequestCredentials
  /** Called on a 401 (except on a public page): refresh, or send the user to sign in */
  onUnauthorized?: () => void | Promise<void>
}
