# Release Notes

## [Unreleased](https://github.com/Refactor-Circus/Atrium/compare/v2.0.0...main)

## [v2.0.0](https://github.com/Refactor-Circus/Atrium/compare/v0.1.0...v2.0.0) - Unreleased

Atrium serves the dashboard as a JSON API and renders it with a front end it ships prebuilt: one Blade page, `atrium::app`, at `atrium.client_path` (`/atrium`) loads Atrium's Vue 3 app from the package's committed `dist/`, beside the front-end **modules** packages declare (D-079 to D-087). Hosts need no Node, no build and no publish step. The Blade dashboard is removed, not kept beside it: there is no compatibility shim and no Blade fallback, and the page is the only HTML Atrium renders. Suite packages that require Atrium `^1` (or the `^0.1` releases) keep working against those releases until they move to `^2`.

### Upgrading from v1

Work through these in order.

1. **Require the new release** and refresh caches: `composer require refactor-circus/atrium:^2`, then `php artisan optimize:clear`.
2. **Run the new migration**: `php artisan migrate`. `add_uuid_and_version_to_atrium_dashboards` adds a unique, non-null `uuid` to every widget placement (backfilling existing rows in chunks) and a `version` to every dashboard. It reads the table names from `atrium.tables`, so renamed tables are migrated too, and its `down()` drops both columns. CI runs it on SQLite; it is written for MySQL and Postgres as well.
3. **Replace the removed config keys.** Republish (`php artisan vendor:publish --tag=atrium-config --force`) or edit `config/atrium.php` by hand:

   | Removed key | Replacement |
   | --- | --- |
   | `atrium.path` | `atrium.routes.prefix` (default `atrium/api`) for the API, and `atrium.client_path` (default `/atrium`) for the page. |
   | `atrium.domain` | None: the page and the API are served from the application's domain. |
   | `atrium.middleware` | `atrium.routes.middleware` for the API and `atrium.client.middleware` for the page, both defaulting to `['web', 'auth', Authorize::class]` (the session). Neither inherits the old key. Keep `Authorize::class` last, after your guard; a client on another origin swaps the guard for `auth:sanctum` or `auth:api`. A guest gets 401 JSON from the API and is sent to your login route by the page. |
   | `atrium.alpine` | None: the front end bundles everything it needs. |
   | `atrium.logout_route` | None: signing out belongs to the host. The shell and the page's boot data send the user's name and email. |

   `atrium.routes.enabled` (default `true`) turns every route off. While any removed key is still present, Atrium logs one warning per process naming it.
4. **Clean up published files.** Delete `resources/views/vendor/atrium` (published with the `atrium-views` tag): Laravel would look there first for the page's `atrium::app` view. Delete `public/vendor/atrium` (published with the `atrium-assets` tag): Atrium now serves its files itself from the `/vendor/atrium/{owner}/{version}/...` route (`atrium.assets.path`), and a web server would serve the stale v1 files in that folder before the route is reached. Neither tag exists any more, and nothing needs publishing. The `atrium-config`, `atrium-lang` and `atrium-migrations` tags are unchanged.
5. **Choose your auth.** Atrium ships no authentication. By default the page and its API share the session the page is served in (`web`, `auth`, then `Authorize`), with CSRF headers sent by the front end, so there is nothing to configure. A client on another origin uses `['api', 'auth:sanctum', Authorize::class]` (or `auth:api`) and the host's CORS setup; token auth sends the `Authorization` header from an auth adapter (`useAtrium().auth()`), and the host owns where the token is stored. Define the `viewAtrium` gate, or implement `RefactorCircus\Atrium\Domains\Access\Contracts\AtriumUser` (`canAccessAtrium()`) on the user model (D-086). See the README's "Authentication".
6. **Open the front end.** Nothing to install or build: open `/atrium` (`atrium.client_path`), where Atrium serves `atrium::app`. Every widget, screen extension and settings panel key renders the Vue component a module registers for it with `defineAtriumModule({ key, widgets, extensions, settingsPanels, routes, … })`. A package ships its module prebuilt and declares it in its `composer.json` under `extra.atrium` (`scripts`, `styles`), discovered by `php artisan atrium:discover`; an application loads its own with `Atrium::module(base_path('atrium'))`, `Atrium::script('resources/js/atrium.ts')` and `Atrium::style()` (or `atrium.scripts` and `atrium.styles`). Set `atrium.client.enabled` to `false` to serve a front end of your own against the JSON API instead. See the README's "The front end" and MODULES.md.
7. **Update your plugins and packages** as listed below: icons become Iconify names, `view()` becomes a client component key, and plugin routes return JSON.
8. **Move the suite packages to v2 together.** Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom v2 ship only their JSON API and MCP server; their Atrium UI now lives in their own Atrium module and integration manifest (see "Suite integrations" below). Upgrade them with Atrium, move their old Atrium keys to `atrium.integrations` as the table below lists, then delete the `ui` and `atrium` sections from each published package config. Turn on the Polycart and Roster APIs (`polycart.routes.enabled`, `roster.routes.enabled`, both off by default) behind your auth middleware, or their integrations do not register.

#### Routes

Every route answers JSON under `atrium.routes.prefix` and `atrium.routes.middleware`. Dashboards are bound by slug (`{dashboard:slug}`) and placements by uuid (`{widget:uuid}`, scoped to the dashboard), never by id.

| v1 | v2 |
| --- | --- |
| `atrium.dashboard` (`GET {path}/`, the dashboard page) | Removed. `atrium.dashboards.default` (`GET dashboard`) returns the default dashboard as JSON, or `{"data": null}`, and never creates one: the front end creates the first with `POST dashboards`. |
| `atrium.dashboard.show` (`GET {path}/d/{slug}`) | Removed. `atrium.dashboards.show` (`GET dashboards/{dashboard:slug}`). |
| `atrium.dashboards.store`, `.update`, `.destroy`, `.layout` (`{dashboard}` by id) | Same names, bound by `{dashboard:slug}`. `update` and `layout` require the dashboard's `version` and answer 409 when it is stale. `destroy` answers 204. |
| `atrium.dashboards.widgets.show` (HTML for a lazy widget, `{widget}` by id) | Same name, `GET dashboards/{dashboard:slug}/widgets/{widget:uuid}`, answering the placement as JSON. |
| `atrium.settings` (`GET {path}/settings`) | Renamed `atrium.settings.index` (`GET settings`). |
| `atrium.settings.show` | Same name, JSON. |
| `atrium.search` | Same name, JSON; a `q` shorter than `atrium.search.min_length` now answers 422 instead of an empty list. |
| (none) | New: `atrium.shell` (`GET shell`), `atrium.dashboards.index` (`GET dashboards`), `atrium.widgets.index` (`GET widgets`). |
| Plugin routes, named `atrium.{name}` under `{path}/` | Under `plugins/{key}`, named `atrium.plugins.{key}.{name}`: name a route by its operation only (`->name('index')` serves `atrium.plugins.{key}.index`), and return JSON. Update `route()` calls and nav items that named the old routes. |

#### Removed, with their replacements

- **The Blade UI.** `resources/views` (the shell, every page and the whole `x-atrium::` component library: `x-atrium::layout`, `card`, `table`, `screen-tabs`, `screen-sections`, `screen-tab-panel` and the rest), `resources/css`, `resources/icons` (the Heroicons set) and the compiled `public/atrium.*` files (`atrium.css`, `atrium.js`, `alpine.js`). Replacement: Atrium's prebuilt front end (Vue 3 and Nuxt UI 4), served by the one `atrium::app` page, with the SDK's `Atrium*` components for packages. Package screens become pages of the package's module that read its plugin's JSON routes.
- **The npm CSS build.** `package.json`, `package-lock.json`, `bin/build-css.mjs` and `npm run build:css` (Tailwind and Alpine), and the `build:css` and `test:browser` Composer scripts. Replacement: the pnpm workspace in `ui/` and `composer test:ui`; hosts run no build.
- **`RefactorCircus\Atrium\Support\StyleRegistry`, `Atrium::css()` and `Atrium::stylesheet()`.** Replacement: a module's `styles` in `extra.atrium`, or an application stylesheet with `Atrium::style()` or `atrium.styles`.
- **`RefactorCircus\Atrium\Testing\AtriumStyles`.** Replacement: none; packages ship a front-end module instead of Blade views.
- **`RefactorCircus\Atrium\Support\Icons` (`Support\Icons`, `Icons::svg()`, `Icons::register()`) and inline SVG icons.** Replacement: Iconify names such as `i-lucide-home`, passed to `icon()` on `NavItem`, `NavGroup`, `WidgetDefinition`, `TabDefinition`, `SettingsPanel`, `SearchResult` and `Theme`. Each setter throws `InvalidArgumentException` for anything else (`lucide:home`, `i-home`, SVG markup). Heroicons names map to `i-heroicons-*` once the host installs `@iconify-json/heroicons`, or to the bundled `i-lucide-*` set. `TabDefinition::DEFAULT_ICON` is now `i-lucide-layout-grid`.
- **`view()` on `WidgetDefinition`, `SettingsPanel`, `TabDefinition`, `SectionDefinition` and the `DefinesExtension` trait.** Replacement: `component()`, which now names the client component key the front end looks up in the `widgets`, `extensions` or `settingsPanels` a module registers with `defineAtriumModule()` (it used to name a Blade component). It defaults to the definition's key, so most definitions drop the call. A tab or section no longer needs a view or a component to register.
- **`Atrium::path()` and `Atrium::url()`**, and their facade `@method` lines. Replacement: `route('atrium.…')` for API URLs; the front end's paths sit under `atrium.client_path`. `NavItem::isActive()` no longer reads `atrium.path`.
- **The Blade controllers and requests.** `Domains\Dashboard\Http\Controllers\DashboardCrudController` (its store, update and destroy are now on `DashboardController`), the HTML responses of `DashboardController`, `DashboardWidgetController`, `SettingsController` and `SearchController`, and the first-visit auto-create of a dashboard. Replacement: the JSON controllers on the same routes, each a single `return $request->persist();`, with `{Verb}{Entity}Request` classes (`ShowDashboardRequest`, `IndexDashboardRequest`, `ShowDefaultDashboardRequest`, `ShowDashboardWidgetRequest`, `IndexWidgetRequest`, `ShowShellRequest`, `IndexSearchResultRequest`, `IndexSettingsPanelRequest`, `ShowSettingsPanelRequest`).
- **`SearchController::minLength()`** (public static). Replacement: the `atrium.search.min_length` config key, enforced by `IndexSearchResultRequest` (a shorter `q` answers 422) and sent in the shell as `search.min_length`; code that needs the value reads `config('atrium.search.min_length')` or `SearchRegistry::minLength()`, which applies the floor of 1.
- **`SearchController::__invoke()`.** `SearchController` is now `final` and serves `atrium.search` from `index(IndexSearchResultRequest $request)`. Replacement: route to `[SearchController::class, 'index']`; a subclass of `SearchController` is no longer possible.
- **`DashboardController`'s constructor, `index(Request)`, `show(Request, string $slug)` and `render()`.** `DashboardController` is now `final` with no constructor; it has `showDefault()` (serving `atrium.dashboards.default`), `index()`, `show()`, `store()`, `update()` and `destroy()`, each taking its `{Verb}DashboardRequest`. Replacement: the routes above; a subclass of `DashboardController` is no longer possible.
- **`RefactorCircus\Atrium\Http\Controllers\Concerns\AuthorizesScreens`** (`authorizeScreen()`). Replacement: authorize in your request's `authorize()`, or ask `Support\ScreenAccess::allows()`.
- **`Support\ServiceProvider::loadDashboardRoutesFrom()` and `dashboardRouteAttributes()`.** Replacement: `loadApiRoutesFrom()`, Keystone's API group from `atrium.routes.*`, with JSON rendering forced.
- **`DashboardManager::pick()`, `DashboardManager::isVisible()` and `DashboardManager::canModify()`**, and the `$slug` argument of `DashboardManager::current()`. Replacement: `findVisible($request, $slug)`, `current($request)` (which never creates a dashboard) and `abilities($dashboard, $request)` (`['update' => bool, 'delete' => bool]`, sent as `meta.abilities`).
- **Every view but the page, and the Blade component namespace.** The `atrium` view namespace now holds only `atrium::app`; the `atrium-views` and `atrium-assets` publish tags are gone (see step 4).
- **The browser suite.** `tests/Browser`, `tests/BrowserTestCase.php` (`BrowserTestCase`), the Playwright dependency and the `browser-tests` workflow. Replacement: Vitest component tests in `ui/sdk/test` and `ui/app`, run by `composer test:ui`, and in each suite package's own `atrium/test`.
- **The `slide-over` component and the top bar's account menu**, added after v0.1.0, never reached a release and go with the Blade UI.

#### Changed behavior

- **`DashboardManager`'s constructor takes `PlacementResolver $placements` and Keystone's `PackageRegistry $packages`** (it had none). Resolve it from the container (`app(DashboardManager::class)`) rather than with `new DashboardManager()`; a subclass that declares its own constructor must accept and pass both on.

- **Layout saves are full layouts.** `SaveDashboardLayoutAction` no longer deletes and recreates every placement. A `WidgetPlacementData` with a `uuid` updates that placement in place, one without is created, and a placement the layout leaves out is deleted, except orphans (placements whose widget is no longer registered), which are kept. A `uuid` from another dashboard fails validation (422). A v1-style payload with no uuids therefore replaces every non-orphan placement with new ones, with new uuids.
- **Optimistic locking.** `SaveDashboardLayoutData` and `UpdateDashboardData` take a `version`, required over HTTP; a stale one throws a `ValidationException` with status 409, keyed `version`, and changes nothing. Code that vouches for the dashboard's state may leave it out. Every update and layout save moves the dashboard's `version` on, and `DashboardResource` sends it.
- **Reads never write.** No GET request creates a dashboard; `GET dashboard` answers `{"data": null}` for a user with none.
- **Guests get 401 JSON** from `Authorize` itself, on every route and whatever the `Accept` header, even with no guard configured; a user the gate refuses gets 403. `Authorize` runs before route model binding.
- **Resolver output must be JSON-serializable.** Every widget, tab, section and settings panel resolver's output passes through `Support\JsonData::check()`. A closure, an `Htmlable` or another non-serializable object, a cycle or too deep a structure throws `RefactorCircus\Atrium\Exceptions\UnserializableDataException` (status 500). Outside `local` and `testing`, a failing eager resolver no longer fails the response: that placement, tab, section or panel is sent with `data: null` and an `error`, and the exception is reported.
- **Links are `{path, external}`.** Navigation items and search results are sent with `link`, computed by `Support\ClientPath` against `atrium.client_path` and the host of `app.url`; a `javascript:`, `data:`, `//host` or other unsafe URL is sent as `link: null`. A nav item that links to a page of the front end declares it with `NavItem::path('/billing/invoices')`: it is sent as `{path, external: false}` whatever `client_path` is, while `url()` stays a host URL (a relative `url('/billing/invoices')` is external unless it sits under `client_path`). Every suite integration's nav uses `path()`, and the registry refuses an integration nav item declared with `url()` or `route()`.

### Suite integrations

Atrium hosts the front ends of Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and Showroom. Each of those packages' v2 ships only its JSON API and MCP server, with a committed `openapi.json` and a generated client, and no Atrium plugin, Blade screens or `atrium.{pkg}.*` routes. Atrium shows their pages, widgets, settings panels, search sources and navigation:

- **Manifests declare, modules render (D-090).** Each package declares its nav items, widgets, settings panel, search sources, screens, feature flags and hooks as data in its integration manifest, `integration.json` (source `atrium/src/integration.json`, shipped as `dist/atrium/integration.json` and named by `extra.atrium.integration`), checked against the schema the SDK publishes (`@refactor-circus/atrium/schema/integration.schema.json`); a bad manifest throws `InvalidIntegrationException` with the file and the JSON pointer. Atrium has no PHP of any package and never loads a package class. Each package's front-end module renders them under `/{pkg}/` and calls the package's API through `useAtriumIntegration(key)`, an `openapi-fetch` client typed by the package's schema and signed like every Atrium request. Each package ships its own module (its `atrium/` folder, built into a committed `dist/atrium/` and declared in its `composer.json` under `extra.atrium`; see MODULES.md), loaded only while its integration is active (D-089). An app registers its own integration with `Atrium::integration($pathOrArray)`. Labels are plain English through `__()`: translate them in `lang/{locale}.json`. Values a host configures are read from the package's own config when the integration registers.
- **Config.** `config/atrium.php` lists no package; `atrium.integrations.{pkg}.enabled` (default `true`, boolean-coerced), `atrium.integrations.{pkg}.api_base` (default `null`: the package's own `{pkg}.routes.prefix` while `{pkg}.routes.enabled` is on) and `atrium.integrations.{pkg}.features` override the manifest, as do the cross-package hook settings (their defaults are in the manifests; a map you set replaces the manifest's whole map). An integration registers only when Atrium finds its manifest, it is enabled and it has an API base; otherwise Atrium logs one warning per process naming the keys to set.
- **Feature flags.** An integration is active for a user only while all its `features` are (the suite's manifests name `{pkg}.atrium`); with Laravel Pennant installed each resolves through `Feature::for($user)->active()` (Atrium defines a manifest's own names as on until you define them), and without Pennant every flag is on. The plugin feature gate (`Gatekeeper`, `Atrium::resolveFeaturesUsing()`) is unchanged.
- **Screens.** Every v1 screen keeps its key (`roster.organization`, `showroom.product`, ...), so host tabs and sections still attach. The new route `atrium.screens.show` (`GET screens/{screen}`, with optional `record` and `tab` query strings) serves a declared screen's `{key, kind, path, subject_type, record, tabs, sections}` from `ScreenExtensions`, loading no record; an unknown, undeclared or inactive screen answers 404.
- **A screen names the model its subject is stored as (D-092).** A screen's `subject_type` may be the suite's name for its record (`roster.organization`); such a name (any `subject_type` with a `.`) must come with `subject_model`, the model class, morph alias or a `$config` reading it (Roster's user: `roster.users.model`). Hook data's `$screen` `subject_type` and the `subject_type` `atrium.screens.show` sends are that model's morph type in the host's morph map (else its class), so Cortex's `owner_type` and Keen's `subject_type` name a record the host stores. `$subject_scope` still reads the declared name. The `record` a screen passes is its route parameter, the model's route key (an organization's slug), which the packages' APIs resolve.
- **Shell additions.** The shell gains `integrations` (`{key, label, active, api_base, features}` per registered integration), `search.sources` (the client-side search sources of active integrations), `search.per_source`, and a `live` key on each nav item (`{key, options}` or null, set with `NavItem::live()`) whose badge or children the module's `liveResolvers` compute from a package API. Atrium computes no badge for an integration's nav item.
- **Cross-package hooks** are declared by the package whose API they call and keep their v1 defaults: Cortex's redirect domains on `roster.organization` (the `cortex.mcp` tab) and `roster.user` (an `aside` section), Impex's run link on `showroom.transfers` rows, and Keen's history section, activity tab and History nav item. Each registers only while both its integrations are registered. Hook tabs on one screen follow their packages' key order.

#### Guardian

Guardian v2 is the suite's security package, with a JSON API and MCP and no UI, and it takes over roles and permissions from Roster. The `guardian` integration hosts its screens in one "Security" nav group:

- **Config.** `atrium.integrations.guardian` has `enabled`, `api_base`, `features` (`['guardian.atrium']`), `scope_types` (default `['organization' => null, 'team' => null]`; a `null` value reads `guardian.adopt.scope_types.{key}`, and one that does not resolve is dropped) and `screens` (the hooks below). Guardian ships with `guardian.routes.enabled` off: turn it on behind your auth middleware, or the integration does not register. It registers with or without Roster.
- **Screens.** `/guardian/security` (the user's two-factor, sessions, devices, API tokens and recent activity), `/guardian/roles`, `/guardian/roles/:role`, `/guardian/permissions`, `/guardian/role-assignments`, `/guardian/users/:user`, `/guardian/security-events` (and one event), `/guardian/lockouts`, `/guardian/ip-rules`, `/guardian/two-factor-policies`, `/guardian/password-policy` and `/guardian/sso-connections/:connection`, plus the shell-less `/guardian/two-factor/challenge` and `/guardian/two-factor/setup`.
- **Two-factor.** Put Guardian's `guardian.two-factor` and `guardian.session` middleware on Atrium's and the packages' route groups: a 403 with `code` `two_factor_challenge_required` or `two_factor_enrollment_required` sends the user to the challenge or setup page, and the `Guardian-Two-Factor-Deadline` header shows an app-wide notice (expose it through CORS on split hosts). API tokens need `guardian.tokens.driver` (the section shows "not enabled" on 501); passkeys need `web-auth/webauthn-lib`, HTTPS and a matching `guardian.two_factor.passkeys.rp_id`.
- **Hooks on Roster's screens.** `atrium.integrations.guardian.screens` defaults to `['roster.organization' => ['guardian.access', 'guardian.sso', 'guardian.scim'], 'roster.user' => ['guardian.access', 'guardian.user-security', 'aside' => 'guardian.sso-identities']]`, as Guardian v1's `guardian.atrium.screens` did.
- **SSO and SCIM.** The `guardian.sso` and `guardian.scim` tabs, the `guardian.sso-identities` section and the `guardian.sso-connection` page port Guardian v1's Atrium UI onto Guardian's API.

Roles and permissions leave Roster. These Roster screens and nav items are removed with no alias or redirect (D-046); a host extension registered on an old key no longer attaches:

| Removed from Roster | Guardian replacement |
| --- | --- |
| `roster.roles` (`/roster/roles`, the Roles nav item) | `guardian.roles` (`/guardian/roles`) |
| `roster.role` (`/roster/roles/:role`) | `guardian.role` (`/guardian/roles/:role`) |
| `roster.permissions` (`/roster/permissions`, the Permissions nav item) | `guardian.permissions` (`/guardian/permissions`) |
| The roles card of `roster.user` and the role assignments tab of `roster.organization` | the `guardian.access` tab on both, listing and assigning role assignments in Guardian (and `guardian.role-assignments` for every assignment) |

**Response handlers.** A module's `responseHandlers` (or `useAtrium().responseHandler(key, (response, request) => void)`) registers a handler that every integration client, `useAtriumClient()` and `useAtriumApi()` call with each response, in registration order, before the caller sees it; one that throws is logged and skipped. `useAtrium().notify()` and `<AtriumResponseNotice>` show app-wide notices. Guardian's two-factor redirect is the first handler, in its module's `responseHandlers`.

**New dependency.** Guardian's module bundles `uqr` (0.1.3, exact) to draw the TOTP QR code in the browser, so the secret never leaves it.

#### Replaced package keys

Delete these from the published package configs; nothing reads them in v2. Move any value you changed to its replacement.

| v1 package key | v2 replacement |
| --- | --- |
| `cortex.ui.enabled` | `atrium.integrations.cortex.enabled` |
| `impex.ui.enabled` | `atrium.integrations.impex.enabled` |
| `keen.ui.enabled` | `atrium.integrations.keen.enabled` |
| `polycart.ui.enabled` | `atrium.integrations.polycart.enabled` |
| `showroom.ui.enabled` | `atrium.integrations.showroom.enabled` |
| `cortex.atrium.features` | `atrium.integrations.cortex.features` |
| `impex.atrium.features` | `atrium.integrations.impex.features` |
| `polycart.atrium.features` | `atrium.integrations.polycart.features` |
| `roster.atrium.features` | `atrium.integrations.roster.features` |
| `showroom.atrium.features` | `atrium.integrations.showroom.features` |
| `cortex.atrium.redirect_domains.screens` | `atrium.integrations.cortex.redirect_domains.screens` (same default) |
| `impex.atrium.run_link.screens` | `atrium.integrations.impex.run_link.screens` (same default) |
| `keen.atrium.history` (`screens`, `slot`, `exclude`, `tabs`, `nav`) | `atrium.integrations.keen.history` (same defaults; `nav.groups` values now name Atrium nav groups, `showroom` and `pennantplus`, not translation keys) |
| `impex.atrium.show_all` | None: operator mode has no v2 API (D-032). |
| `polycart.atrium.show_all` | None: operator mode has no v2 API (D-032). |
| `showroom.atrium.widget_cache_seconds` | `showroom.stats.cache_seconds`, in Showroom, which caches `GET /showroom/stats`. |
| `pennantplus.atrium.resolve_features` | None in PennantPlus, which no longer registers Atrium's feature resolver: register one yourself with `Atrium::resolveFeaturesUsing()` for plugin features. Integrations use their own flags. |

Each package's Pennant support feature is replaced by the feature name its integration manifest declares, which Atrium defines as on until you define it yourself. Stored Pennant values under the old names are no longer read and can be purged (`php artisan pennant:purge`):

| v1 feature | v2 replacement |
| --- | --- |
| `CortexSupportFeature` | `cortex.atrium` |
| `ImpexSupportFeature` | `impex.atrium` |
| `PolycartSupportFeature` | `polycart.atrium` |
| `RosterSupportFeature` | `roster.atrium` |
| `ShowroomSupportFeature` | `showroom.atrium` |

Keen and PennantPlus had none; they get `keen.atrium` and `pennantplus.atrium`.

The packages' Blade pages (`atrium.{pkg}.*` routes under `/atrium/{pkg}/...`) are replaced by the modules' pages at `{client_path}/{pkg}/...`: with the default `client_path` (`/atrium`) the URLs stay v1's, and with another one update bookmarks and links.

#### Parity changes (D-031, D-032)

- **Navigation is no longer filtered by permission (D-031).** Integration nav items show to everyone the `viewAtrium` gate admits while the integration is active; v1 asked each package's policies in PHP, which Atrium no longer calls. A screen shows a no-access state on the package's 403, a widget a no-access card, and a search source that answers 403 is dropped from ⌘K. Controls are no longer hidden by ability either (v1's `@rosterCan`, `@showroomCan`, `@polycartCan`): they show, and the package's 403 refuses. Hide a whole integration from someone with its feature flag.
- **Operator mode is not ported (D-032).** `impex.atrium.show_all` and `polycart.atrium.show_all` have no v2 API, so lists, widgets and search show what the package API returns for the signed-in user.
- **Actions without a v2 API route are left out (D-032),** as listed below. Each is also named in a `// Not ported (D-032)` comment at the top of the module's entry (`atrium/src/atrium.ts` in each package; the hooks' in Keen's `atrium/src/components/hooks/hooks.ts`), or of the area's index page for Roster and Showroom.
- **Screen extensions on rows.** `atrium.screens.show` loads no records, so the `row.actions` slot of a list screen gets no per-row sections from other packages; the tabs and the `header.actions`, `before`, `aside` and `after` sections still render.

#### Not ported (D-032)

- **Cortex**
  - Redirect domains: the source filter (`?source=global|owned`); `redirect-domains.index` takes only `owner_type`/`owner_id`.
  - Redirect domains: the read-only list of domains configured in `cortex.redirect_domains` (config); the API lists stored domains only.
  - Redirect domains: paging of the stored domains; `redirect-domains.index` answers every stored domain at once.
  - Redirect domains: the "redirect domains are turned off" warning; no route reports whether they are enabled.
- **Impex**
  - Operator mode (`impex.atrium.show_all`): every list shows what the API returns for the signed-in user.
  - The channel form's list of installed transports: the v2 API lists none, so the form offers http, mail and file.
  - Hiding nav items, widgets and the search source by permission (D-031): a screen shows its no-access state on Impex's 403 instead.
- **Keen**: nothing. Browsing and filtering the log, one entry, recording an event and each package's history all have v2 routes.
- **PennantPlus**
  - The "needs a Pennant store that uses the database driver" notice: no v2 route reports whether the store can list stored values, so on another driver `values.index` answers an empty list.
  - The `row.actions` section slot on each stored value: `atrium.screens.show` loads no records.
- **Polycart**
  - Operator mode (`polycart.atrium.show_all`): Polycart's API lists only the carts the user can access, and has no operator route.
  - Hiding each control the user may not use (v1's `@polycartCan` checks): no v2 route reports a cart's abilities, so every control shows and Polycart's 403 answers with the no-access notice (D-031).
  - The share form's pickers (the configured owner and scope aliases, `polycart.owners` and `polycart.scopes`, and the cart type's roles): no v2 route lists either, so both are text fields, and the form shows for every scoped cart; Polycart's 422 refuses what v1 never offered.
  - Offering only the moves and conversions the policy allows: the screen offers what the type allows, and Polycart's 403 refuses the rest.
  - The cart's full scope path (every ancestor scope): the cart resource carries only its own scope.
  - A line's options: `CartLineResource.options` is typed as an empty object, so the screen shows only the purchasable, or "Custom".
  - The `row.actions` section slot on each cart and type row: `atrium.screens.show` loads no records.
  - The cart type's PHP class on the types screen: `CartTypeResource` does not carry it.
- **Cross-package hooks**: nothing. Cortex's `redirect-domains` index, store and destroy, and Keen's `packages.index` and `entries.index` and Guardian's role assignment, user security, SSO and SCIM routes all have v2 routes; the run link makes no request.
- **Guardian SSO and SCIM** (v1's Atrium UI: the SSO and SCIM tabs, the SSO identities section and the connection page)
  - Hiding the SSO and SCIM forms, the connection's settings and delete, and the unlink buttons from a viewer without `guardian.sso.manage` or `guardian.scim.manage`: v1 asked Roster's `Authorizer`, and no v2 route reports these abilities, so the controls show and a 403 shows the no-access notice (D-031).
  - The connection page's organization name in its header: the v2 connection carries the organization's slug only.
  - `guardian.atrium.organization_route`, the connection page's back link: the module links to `/roster/organizations/:organization?tab=guardian.sso` while the Roster integration is active.
  - The flashed status messages after each action: each form shows its result in place.
- **Roster users and impersonations**
  - The deleted user's page: v2's `roster.users.show` answers 404 for a deleted user. Restore and purge are offered on the Deleted tab, and on the user page right after a delete.
  - The "I understand" checkbox before delete and purge (v1's `confirm` field): the v2 routes take no confirmation field, so a browser confirmation replaces it.
  - Roster's impersonation banner (`roster::impersonation-banner`) on each screen: it is Roster's own view, with no API route.
  - Hiding each card and button by the viewer's permissions (v1's `@rosterCan`): a 403 shows the no-access notice instead (D-031).
  - v1's single status route (`users.status`) maps to `roster.users.suspend`, `roster.users.deactivate` and `roster.users.reactivate`, and is ported as that mapping.
- **Roster organizations, teams and invitations**
  - The deleted organization's page: v2's `roster.organizations.show` answers 404 for one. Restore and purge are offered on the Deleted tab, and on the organization page right after a delete.
  - The "I understand" checkbox before delete and purge: a browser confirmation replaces it.
  - An immediate purge: v2's `roster.organizations.purge` queues it (202), so the page says so and the organization leaves the Deleted tab once the queue runs.
  - Roster's impersonation banner (`roster::impersonation-banner`) on each screen.
  - Hiding each card and button by the viewer's permissions (v1's `@rosterCan`) (D-031).
  - Screen extensions on the public invitation page: it loads neither the shell nor `atrium.screens.show`, which need a signed-in user (D-038).
  - The session-based accept and decline forms of the invitation page (`roster.invitations.page.accept` / `.decline`): they map to the API's `roster.invitations.accept` / `.decline`, which need a signed-in user.
- **Roster transfers**
  - Roster's impersonation banner (`roster::impersonation-banner`) on each screen.
  - Offering only the import and export types the viewer may start, and the transfer page's "may confirm" check: every type is offered and a 403 shows the no-access notice.
  - The "transfers need Impex" notice (v1's `Transfers::available()`): starting a transfer without Impex shows Roster's error message.
  - The transfers page's organization name in its header: the v2 list carries the organization's slug only.
- **Showroom widgets and search**
  - Hiding the nav items, widgets and the search source by policy (D-031): the widgets show their no-access card on Showroom's 403, and the search source is dropped from ⌘K.
  - The recent-changes widget's author names: Showroom's v2 stats name an author by type and id only, so the widget shows the id.
- **Showroom products, product models and families**
  - Hiding buttons, cards and the read-only form by the viewer's abilities (v1's `@showroomCan` and `ScreenAccess::allows()`) (D-031).
  - Showing the own-flags field only to those who may assign flags (`FlagScreen::mayAssign()`): the field always shows, and Showroom answers 403 when an unassignable flag changes.
  - Publishing from draft or in review when `showroom.workflow.require_approval` is off: no route reports the setting, so the page offers the transitions approval allows; Showroom still decides.
  - Version authors' names: `products.versions.index` names an author by type and id only.
  - Uploading and linking an asset in one transaction (v1's `assets.upload`): ported as `assets.store` then `assets.links.store`, so a refused link leaves the uploaded asset unlinked.
  - v1's `associations.add` and `associations.remove` routes: ported as an update of the record (`products.update`, `product-models.update`) that replaces the type's own targets.
  - Links from associations and a model's variant products straight to a product's page: they name products by identifier, so they link to the product list searched for it.
  - The flash messages after each action: the page reloads instead.
- **Showroom attributes, categories, channels and flags**
  - Hiding the create, save and delete controls, and the read-only attribute form, by the viewer's abilities (D-031).
  - Hiding the channels screen's locales card from those who may not list locales: the card shows its own no-access state when `locales.index` answers 403.
  - The flash messages after each action: the page reloads instead.
- **Showroom assets, owners and transfers**
  - Hiding each form and button by policy (`@showroomCan`) (D-031).
  - The transfers list's result column (an export's file asset and record count, an import's counts): `impex.runs.index` sends no step results. A failed run still shows its error message.
  - The owner type beside each code of an owner's chain and children: `owners.show` names them by code only.

#### The packages' own modules (D-089)

Each of the eight packages ships its Atrium module in its own repository, typed by its own generated client (`client/`), so Atrium neither stages the modules nor vendors the packages' clients: `ui/modules/{pkg}`, the vendored `client/` folders, `ui/scripts/sync-clients.mjs`, the `sync:clients` script and `VendoredClientsTest` are gone (D-089 supersedes D-020, which vendored them while the package tags did not exist). The workbench loads the packages' built modules from sibling checkouts when `ATRIUM_SUITE_PATH` is set. Release steps:

1. Pin the SDK in each package's `atrium/package.json` at this release's tag (`github:refactor-circus/atrium#v2.0.0&path:ui/sdk`) before the package's v2 tag, and rebuild its `dist/atrium/`.
2. Widen the `refactor-circus/keystone` constraint to the Keystone release that drops its built-in `atrium` surface prefix (D-037).

The pull request template carries these as release items.

- The JSON API: `ShellResource`, `DashboardResource` and `DashboardWidgetResource` (beside the models, in `Domains\Dashboard\Resources`), `WidgetDefinitionResource`, `ResolvedScreenResource`, `SettingsPanelResource` and `SearchResultResource`, all on Keystone's `JsonResource`.
- The front end (D-079): Atrium's Vue 3 app (Nuxt UI 4, Vue Router, Pinia, vue-i18n, VueUse, built with Vite) committed to `dist/`, with the shell, navigation, ⌘K search, theme switching, the dashboard grid editor and switcher, settings pages and screens, an unregistered-component fallback, an error card for failed placements, `en` strings, locally bundled `lucide` icons (`atrium.icons.remote` to load others from the Iconify API), and a version-mismatch banner. Its sources are the pnpm workspace in `ui/`: `ui/sdk` (`@refactor-circus/atrium` 2.0.0, the SDK), `ui/app` and `ui/workbench`.
- The page (D-079, D-080): the `Frontend` domain serves `atrium::app` at every path under `atrium.client_path` (route `atrium.app`, behind `atrium.client.middleware`), with the import map, every module's styles and scripts, the boot data and a CSP nonce; `atrium.client.enabled` turns it off. The API's default middleware is now the session's, `['web', 'auth', Authorize::class]`, and a guest gets `401` JSON.
- The asset route (D-081): `/vendor/atrium/{owner}/{version}/{path}` (`atrium.assets.path`, route `atrium.assets`) streams Atrium's and every module's built files from the packages, hashed URLs cached for a year; front-end file types only. Nothing is published, so it works the same on Octane and Vapor.
- The module contract (D-082 to D-084): `defineAtriumModule({ key, routes, widgets, extensions, settingsPanels, liveResolvers, searchSources, responseHandlers, screens, messages, setup })` (or `window.Atrium.register()`); modules declared in a package's `composer.json` under `extra.atrium` (`key`, `scripts`, `styles`), discovered and cached by `atrium:discover` (cleared by `atrium:clear-discovered`), hidden by `atrium.disabled`; `Atrium::module()`, `Atrium::script()`, `Atrium::style()`, `atrium.scripts` and `atrium.styles` for the application's own; the shared modules as a versioned API (`ATRIUM_SHARED_API` `1.0`); the Vite preset `@refactor-circus/atrium/vite` (`atriumModule()`), the module stylesheet `@refactor-circus/atrium/module.css` and the test helpers `@refactor-circus/atrium/testing`; typed clients through `AtriumIntegrationPaths`, `useAtriumIntegration(key, createXClient)` and `atriumClientOptions(key)`. MODULES.md is the contract.
- `RefactorCircus\Atrium\Domains\Access\Contracts\AtriumUser` (`canAccessAtrium()`), which decides while no `viewAtrium` gate is defined (D-086).
- `Atrium::API_VERSION` (`2.0`), sent in the shell as `api_version`.
- `Theme::icon()`, and `WidgetDefinition::component()` and `SettingsPanel::component()`.
- `SearchRegistry::minLength()`: `atrium.search.min_length`, at least 1.
- `composer test:ui` and the `ui` CI job: a frozen pnpm install, the generated-client and theme checks, typecheck, Vitest and every build, failing on any difference in the committed builds; `tests/Feature/Frontend/BuildFreshnessTest.php` checks each build's source hash in PHP, with no Node (D-085).
- Contract fixtures in `ui/sdk/test/fixtures`, compared by the PHP suite on every run and rewritten only with `UPDATE_FIXTURES=1`.
- The suite integrations (see "Suite integrations" above): the `Integrations` domain (`IntegrationRegistry`, `IntegrationManifests`, `IntegrationHooks`, the `InstalledPackages` contract, `IntegrationFeatures`, `ScreenDeclaration`), integration manifests (D-090: the schema `@refactor-circus/atrium/schema/integration.schema.json`, `Atrium::integration()`, `extra.atrium.integration`, and in the SDK `validateIntegrationManifest()` and `expectIntegrationManifest()` in `@refactor-circus/atrium/testing`, the preset copying `src/integration.json` into the build), the `atrium.integrations` config section, the `atrium.screens.show` route, the shell's `integrations`, `search.sources` and `search.per_source`, and `NavItem::live()`. In the SDK: `useAtriumIntegration()`, `useIntegrationQuery()`, the modules' `searchSources` and `liveResolvers`, `<AtriumIntegrationUnavailable>`, `<AtriumIntegrationScreen>` and `<AtriumNoAccess>`, and a public layout for pages whose route declares `meta: { atrium: { public: true } }` (`/roster/invitations/:token`). In each package's own module: the integration's pages under `/{pkg}/` and its English strings.
- The Guardian integration (see "Guardian" above): Guardian's manifest (its screens, scope types and hooks), `atrium.integrations.guardian`, the SDK's `responseHandlers`, `useAtrium().notify()` and `<AtriumResponseNotice>`, and Guardian's module (in `refactor-circus/guardian`) with its pages under `/guardian/` and the `uqr` dependency.
- Atrium's own OpenAPI document, `openapi.json` (OpenAPI 3.1, one operation per `atrium.*` route), written by `composer openapi:export` with Scramble (a dev dependency, configured in the workbench); every resource declares `schema()`. The SDK's `ui/sdk/src/client/schema.d.ts` is generated from it by `pnpm -C ui generate:client`, the SDK's response types are aliases of it, and `useAtriumClient()` returns an `openapi-fetch` client for Atrium's API with the auth adapter. `useAtriumApi()` is unchanged.

### Changed

- The front end is no longer a Nuxt 4 layer that hosts extend (`nuxt/layer` and `nuxt/playground`, which never reached a release): it is the prebuilt Vue 3 + Vite app Atrium serves itself, extended by modules (D-079 to D-087). Nuxt's conveniences the code used (`useAsyncData()`, `navigateTo()`, `useHead()`, `useColorMode()`) are provided by the SDK, and the workbench's `SuiteStandIn` (`/_suite/{pkg}`) replaces the playground's stand-in APIs.
- The front end's look and shell (D-077): a compact, dark-first "command deck" design system (13px UI text, 28px controls, 34px table rows, hairline borders, micro-labels, monospaced figures, the theme's primary colour as the one accent and its glow), Geist and Geist Mono bundled from `@fontsource-variable` (`@fontsource-variable/geist` and `@fontsource-variable/geist-mono` 5.3.0), and Nuxt UI defaults in Atrium's Nuxt UI theme config (`ui/sdk/vite/ui-config.mjs`), compiled once into Atrium's build and shared by every module. The sidebar is replaced by a rail of sections beside a panel of the chosen section's pages, collapsible to the rail with flyouts, a drawer below `lg`, and a top bar with the breadcrumb, ⌘K, the API's status, the theme switcher and colour mode. ⌘K lists recent pages, every navigation page and the shell's actions beside the search results (`useAtriumPalette()`). New `useAtriumNavigation()`, `<AtriumTopbar>`, `<AtriumNavList>`, `<AtriumPageHeader>`, `<AtriumStat>` and `<AtriumState>`; `<AtriumErrorCard>` and `<AtriumNoAccess>` are restyled. Every page renders in the same padded, scrolling frame whether or not it is a dashboard panel.
- The deck's second pass (D-078): glass panels with corner brackets and a cursor spotlight over a moving dot-matrix canvas, a luminous rail spine, a section code in the top bar, `<AtriumStatusBar>` (integration dots, shell latency, API version, UTC clock; the shell store's `latency`), coloured badges as glowing status dots, luminous primary and corner-accented ghost buttons, filter forms as command-line query bars (`atrium-querybar`), `<AtriumStat>` `delta` and `series` (sparkline), terminal readouts for `<AtriumErrorCard>` and `<AtriumNoAccess>`, fault-line error alerts, radar empty states, scanning skeletons, a HUD ⌘K overlay, staggered arrival of panels and rows (all motion off under reduced motion), a stacked dashboard grid on phones, and settings modules as lit sockets.
- The theme bridge reads `--atrium-token-*`, which `useAtriumTheme()` sets beside each `--color-*` token. Hosts that styled with the `--color-*` properties keep them.
- Atrium's own components are built from Nuxt UI (D-091): the shell is Nuxt UI's dashboard (`UDashboardGroup`, `UDashboardSidebar`, `UDashboardNavbar`, `UDashboardSearch`, `UDashboardToolbar`), the navigation a `UNavigationMenu`, states, faults and headers `UEmpty`, `UAlert` and `UPageHeader`, and the deck's look lives in the Nuxt UI theme (`ui/sdk/vite/ui-config.mjs`) instead of a class tree in `atrium.css`. Props, slots, events and `data-testid`s are unchanged; the sidebar's collapsed state moves from `localStorage['atrium-nav-collapsed']` to `atrium-sidebar-nav`, and the cursor spotlight is gone. `@refactor-circus/atrium/ui` adds `UDashboardSearch`, `UDashboardSearchButton`, the `UPage*` layout pieces, `UMain`, `UBanner` and the colour-mode controls, and every external Nuxt UI link now carries `rel="noopener noreferrer"`.

### Fixed

- Primary buttons, links and status colours were invisible under the default theme and any theme not sending every token: the bridge read `--color-primary`, which Nuxt UI defines as `var(--ui-primary)`, a cycle.
- On a phone the navigation could not be opened.
- The front end's sidebar groups each navigation section as its own collapsible section (open only while the current page is inside it, with a separator between sections and the sections' icons with their pages in a popover when the sidebar is collapsed) instead of one long list with every group open. Themes now drive Nuxt UI's backgrounds, text, borders and status colours, not only the primary colour and radius, and the sidebar sits on the surface colour against the page's canvas.
- The front end bundles every Lucide icon, so icons render with no icon server and no host config.
- Search sources run in child processes returned no results on Laravel 13.40 and later, whose `invoke-serialized-closure` command frames its result in a signed envelope. `atrium:search-source` now unwraps it, and still reads the bare JSON earlier versions write.

## [v0.1.0](https://github.com/Refactor-Circus/Atrium/commits/v0.1.0) - 2026-10-30

### Breaking

- Moved to the Refactor Circus organisation: the package is now `refactor-circus/atrium` with the PHP namespace `RefactorCircus\Atrium` (it was `jayi/atrium` and `JayI\Atrium`). Update `composer.json` requirements and `use` statements. Old class names are not kept as aliases, so stored values written under them - polymorphic `*_type` columns, audit subjects, Pennant feature names - need updating to the new names.
- Actions take Data objects, not arrays: `CreateDashboardAction` takes a `CreateDashboardData`, `UpdateDashboardAction` an `UpdateDashboardData` (fields left out stay as they are), and `SaveDashboardLayoutAction` a `SaveDashboardLayoutData` whose `widgets` are `WidgetPlacementData` objects (`Domains\Dashboard\Data`). The requests' validation rules live on the Data, and the starting events carry it: `DashboardCreatingActionEvent::$data` and `DashboardUpdatingActionEvent::$data` are Data objects, and `DashboardLayoutSavingActionEvent` carries `$data` (its `widgets`) in place of `$widgets`.
- `Domains\Dashboard\Policies\Policy::allowsOnDashboard()` is gone: policies defer to the parent dashboard with refactor-circus/keystone's `Policy::allowsOn()`, which takes the same arguments.
- **History moved to Keen.** Atrium has no audit concept any more: the history screen, its components and its nav item now live in [refactor-circus/keen](https://github.com/Refactor-Circus/Keen), which adds a History nav item for every package that audits. Install Keen to keep them, and merge Atrium, Keen and the packages that used them together, since the removal breaks anything still calling them. Removed from Atrium:
  - the `atrium.history.show` route (`GET {path}/history/{package}`), which now answers 404;
  - the `History` domain: `RefactorCircus\Atrium\Domains\History\HistoryServiceProvider` (no longer registered by `Domains\DomainServiceProvider`) and `RefactorCircus\Atrium\Domains\History\Http\Controllers\HistoryController`;
  - the `atrium::history.show` view (`resources/views/history/show.blade.php`);
  - the `x-atrium::audit-trail` component, `x-atrium::audit.entries`, `x-atrium::audit.changes` and the rest of `resources/views/components/audit/`, with their `@source` lines in `resources/css/atrium.css`;
  - `RefactorCircus\Atrium\Domains\Plugins\Support\Plugin::historyNavItem()`: stop calling it from a plugin's `navigation()`; Keen adds the links;
  - the 24 `atrium::atrium.audit_*` translation keys (`audit_history`, `audit_empty`, `audit_when`, `audit_action`, `audit_subject`, `audit_actor`, `audit_surface`, `audit_source_app`, `audit_none`, `audit_system`, `audit_no_changes`, `audit_field`, `audit_before`, `audit_after`, `audit_view_all`, `audit_log`, `audit_log_for`, `audit_action_hint`, `audit_subject_type`, `audit_subject_id`, `audit_filter`, `audit_clear`, `audit_newest`, `audit_older`): a view or a published `lang/vendor/atrium` file that still uses them should take Keen's strings instead.

### Added

- **Screen extensions**: any package can add tabs and sections to any screen that declares itself, registered from its `boot()` with `Atrium::screens()` (`Domains\Screens\Services\ScreenExtensions`, a singleton) for one screen (`{package}.{screen}`), every screen of a package (`{package}.*`) or every screen (`*`). Definitions are `Domains\Screens\Data\TabDefinition` and `SectionDefinition`, visible only through a `permission()` the screen's `access` closure grants, an `authorize()` closure or `public()`; their `authorize` and `resolve` closures receive the `Screen` last. Hosts declare a screen per request with `Screen::standard()` (the `header.actions`, `before`, `after` slots, plus `aside` or the row slot `row.actions`), resolve it with `ScreenExtensions::resolve()` into a `ResolvedScreen`, and render it with the new `x-atrium::screen-tabs`, `x-atrium::screen-sections` and `x-atrium::screen-tab-panel` components. Answers and data are memoized per request in the `scoped()` `ScreenVisibility`; a failing section is reported once and renders nothing. A same-key duplicate on one target throws in `local` and `testing` and is reported and skipped elsewhere; across targets the most specific wins. See the README's "Screen extensions".
- `Screen::reserve(string ...$keys)` reserves tab keys a host does not render, such as built-in tabs the viewer may not open: a registered tab with a reserved key is skipped and reported like one using a built-in key, and `?tab=` naming one opens the default tab.
- Atrium's own pages declare themselves as screens: `atrium.dashboard`, `atrium.named-dashboard`, `atrium.dashboard-widget`, `atrium.settings` (with `row.actions` per settings panel, as a `Domains\Settings\Data\SettingsPanelRow`) and `atrium.settings-panel`. With nothing registered they render as before.
- `RefactorCircus\Atrium\Testing\ResetsScreenExtensions`, a test case trait that snapshots the screen extensions after boot and restores them after each test (`ScreenExtensions::snapshot()` and `restore()`).

- **Lazy widgets**: `WidgetDefinition::lazy()` renders a placeholder with the dashboard and fetches the widget's body afterwards from the new `atrium.dashboards.widgets.show` route (`GET {path}/dashboards/{dashboard}/widgets/{widget}`), which answers whoever may see the dashboard. Widgets stay eager unless marked lazy.
- **Configurable table names**: both tables are named under the new `atrium.tables` config key (`dashboards`, `dashboard_widgets`) and read by the migrations and models through `Support\Tables` (on refactor-circus/keystone's `Database\Tables`). Rename them before migrating; keys a published config leaves out keep their default.
- Four more themes - **Sunset**, **Forest**, **Midnight** and **Ledger** - and theme layouts: `Theme::layout('top')` (or `'layout' => 'top'` in config) lays the shell out with sections across a bar under the topbar and the current section's pages as tabs beneath, as Ledger does.
- A two-level sidebar: a rail of sections (the app's own pages, then one icon per group) and a docked panel with the current section's pages. Clicking a section shows its pages without leaving the page, and hovering previews them. `NavGroup` gains `icon()` and `sort()` for its place in the rail. `Atrium::navigationSections()` lists the rail's entries.
- Themes: a second built-in theme, **Harbor**, beside the default **Atrium**; themes from `atrium.themes.available` and `Atrium::theme()`; and a theme switcher beside the light/dark toggle, shown behind the `atrium.themes.switcher_feature` feature (Atrium's own `Domains\Themes\Features\ThemeSwitcherFeature` by default, a Pennant feature that is on until turned off, globally or per user, once a feature resolver such as refactor-circus/pennantplus is registered).
- Shared components so the packages of the suite need no markup or styles of their own: `description-list`, `chip`, `search-input`, `flash`, `banner`, `guest`, `form.combobox`, `form.actions`, a `bare` mode for form controls, and `prefix`/`suffix` slots on `form.input`.
- `Plugin::featuresFromConfig()`, `RefactorCircus\Atrium\Support\ScreenAccess` and the `AuthorizesScreens` controller trait, so a package's plugin and screens stop copying the same feature loading and policy checks.
- A safelist of layout utilities in the compiled stylesheet, and `RefactorCircus\Atrium\Testing\AtriumStyles` for checking a package's views use only Atrium's styles.

### Fixed

- The search box cancels the search in flight when the query changes, so a slow, stale response can no longer replace the results of a newer query.
- A missing record on an Atrium route (`atrium.*`), asked for as JSON, answers a plain `{"message": "Not found."}` 404 instead of Laravel's message naming the model class. Pages keep their usual 404.

- A page beneath a navigation item now counts as that item's: an item on a resource's `*.index` route stays active on its `*.show` and `*.edit` pages, and a URL item on the paths beneath it. The sidebar's panel and Ledger's tabs no longer disappear on a record's own page.
- Ledger's top bar no longer has a hover menu as well as its row of tabs.
- Form controls no longer render an `id` twice when one is passed.
- `form.input` and `form.select` no longer use `null` as an array offset when no `wrapper` is passed, which PHP 8.5 deprecates.

### Changed

- `DashboardWidgetPolicy` asks the dashboard's policy through refactor-circus/keystone's `Policy::allowsOn()`, and its methods take the user as `Model&Authenticatable` (it was `Model`): an application subclass typed `Model $user` still works, but a model that is not `Authenticatable` is refused by the type.
- The architecture tests now fail on a table named as a literal string and on a model without a policy in `atrium.policies`.
- `tests/ArchTest.php` also checks that every action writes inside a transaction and that every model fires an event for every Eloquent lifecycle hook (refactor-circus/keystone's `Arch::writesOutsideTransactions()` and `Arch::modelEventGaps()`).
- Updating a dashboard over HTTP may leave out its `name` and change only `is_default`.
- **Faster global search by default**: `atrium.search.concurrency` now defaults to `sync`, running sources inside the request, instead of null (the application's default, usually `process`, which booted a PHP process per source on every keystroke). Set it to `process` for per-source timeouts and concurrency, or to null for the old behaviour.
- The search box waits for `atrium.search.min_length` characters (new, 2 by default) before asking for results, and the search endpoint runs no source for a shorter query.
- Discovered plugins are cached in `bootstrap/cache/atrium-plugins.php` instead of reading Composer's `installed.json` on every boot. `package:discover` and `optimize` rebuild the cache (new `atrium:discover` command), `optimize:clear` removes it (new `atrium:clear-discovered`), and without it discovery reads the packages live as before.
- A page decides which plugins the request may see once (`PluginRegistry::authorized()` answers per request), builds the sidebar's sections from one pass over the groups and items, works out each navigation item's active state and URL once (`Domains\Navigation\Services\NavigationState`, a scoped service), asks whether the theme switcher shows once, and reads the visible dashboards once (`DashboardManager::pick()`).
- An `audit.enabled` config key: set it to false to keep Atrium's own dashboard changes out of Keen's audit log.
- Guests get 401 rather than 403 from Atrium's requests (refactor-circus/keystone's request base).
- With the `process` search driver, each source's results come back from its child process as JSON through the new hidden `atrium:search-source` command, so `SearchRegistry` no longer calls `unserialize()`. Only a result's `title`, `url`, `subtitle`, `icon` and `group` come back: a `SearchResult` subclass, or extra state on one, is no longer preserved. Failures and timeouts are reported as `SearchSourceFailedException` and `SearchSourceTimedOutException` (both `RuntimeException`s). Rebuild caches on upgrade (`php artisan optimize:clear`), or every source fails with the command not defined.

- Atrium now stands on [refactor-circus/keystone](https://github.com/Refactor-Circus/Keystone), the shared runtime of the suite. The `Action` base, the `ActionStartingEvent`, `ActionFinishedEvent` and `ModelLifecycleEvent` contracts and the `DispatchesModelEvents` trait moved there: import them from `RefactorCircus\Keystone\...` instead of `RefactorCircus\Atrium\...`. Atrium registers itself as the `atrium` package.
- Atrium now requires PHP 8.5. CI runs on PHP 8.5 only, and the development dependencies are raised to their latest releases (Playwright 1.64, Alpine.js 3.17.4).

### Fixed

- Opening a dashboard by its slug (`/atrium/d/{slug}`, which the dashboard switcher links to) no longer returns 404. The route parameter was bound to the dashboard model by id.
- The dashboard switcher opens toward the page instead of off its right edge, and labels shared dashboards "Shared".
- Tooltips are no longer clipped by scrolling or `overflow: hidden` containers, such as tables: the bubble is drawn on `<body>`, fixed beside its trigger, and kept inside the viewport.

### Breaking

- The source is reorganised into domain modules under `src/Domains/{Domain}` (`Access`, `Dashboard`, `Navigation`, `Plugins`, `Search`, `Settings`, `Widgets`), mirroring the `mono` application. Almost every class moved; there are no aliases for the old names, so update `use` statements, `extends`/`implements` clauses, and any class names in a published `config/atrium.php` (`middleware`, `policies`). The models are renamed `DashboardModel` and `DashboardWidgetModel`, value objects moved into `Data\`, registries into `Services\`, and model and action events now sit together in `Domains\Dashboard\Events`. `AtriumServiceProvider`, the `Atrium` class and facade, `Actions\Action`, `Http\Requests\Request`, the event contracts (`Contracts\Action*Event`, `Contracts\ModelLifecycleEvent`), `Support\Icons` and `Console\Commands\InstallCommand` keep their names. Config keys, route names, view and component names, translation keys, publish tags, table names and the `atrium.feature` middleware alias are unchanged. The models keep their old class names (`RefactorCircus\Atrium\Models\Dashboard`, `RefactorCircus\Atrium\Models\DashboardWidget`) as morph aliases, so stored polymorphic values still resolve and new rows store the same strings. The full map:

  | Old | New |
  | --- | --- |
  | `RefactorCircus\Atrium\Access\Concerns\Gated` | `RefactorCircus\Atrium\Domains\Access\Concerns\Gated` |
  | `RefactorCircus\Atrium\Access\Gatekeeper` | `RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper` |
  | `RefactorCircus\Atrium\Actions\CreateDashboardAction` | `RefactorCircus\Atrium\Domains\Dashboard\Actions\CreateDashboardAction` |
  | `RefactorCircus\Atrium\Actions\DeleteDashboardAction` | `RefactorCircus\Atrium\Domains\Dashboard\Actions\DeleteDashboardAction` |
  | `RefactorCircus\Atrium\Actions\SaveDashboardLayoutAction` | `RefactorCircus\Atrium\Domains\Dashboard\Actions\SaveDashboardLayoutAction` |
  | `RefactorCircus\Atrium\Actions\UpdateDashboardAction` | `RefactorCircus\Atrium\Domains\Dashboard\Actions\UpdateDashboardAction` |
  | `RefactorCircus\Atrium\Assets\StyleRegistry` | `RefactorCircus\Atrium\Support\StyleRegistry` |
  | `RefactorCircus\Atrium\Console\Commands\MakePluginCommand` | `RefactorCircus\Atrium\Domains\Plugins\Console\Commands\MakePluginCommand` |
  | `RefactorCircus\Atrium\Console\Commands\PluginListCommand` | `RefactorCircus\Atrium\Domains\Plugins\Console\Commands\PluginListCommand` |
  | `RefactorCircus\Atrium\Contracts\Plugin` | `RefactorCircus\Atrium\Domains\Plugins\Contracts\Plugin` |
  | `RefactorCircus\Atrium\Dashboards\DashboardManager` | `RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager` |
  | `RefactorCircus\Atrium\Events\Action\DashboardCreatedActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatedActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardCreatingActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatingActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardDeletedActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletedActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardDeletingActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletingActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardLayoutSavedActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavedActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardLayoutSavingActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavingActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardUpdatedActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatedActionEvent` |
  | `RefactorCircus\Atrium\Events\Action\DashboardUpdatingActionEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatingActionEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardCreatedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardCreatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardDeletedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardDeletingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardReplicatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardReplicatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardRetrievedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardRetrievedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardSavedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardSavedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardSavingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardSavingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardUpdatedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardUpdatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetCreatedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetCreatedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetCreatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetCreatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetDeletedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetDeletedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetDeletingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetDeletingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetReplicatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetReplicatingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetRetrievedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetRetrievedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetSavedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetSavedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetSavingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetSavingEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetUpdatedEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetUpdatedEvent` |
  | `RefactorCircus\Atrium\Events\Model\DashboardWidgetUpdatingEvent` | `RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetUpdatingEvent` |
  | `RefactorCircus\Atrium\Exceptions\DuplicateWidgetException` | `RefactorCircus\Atrium\Domains\Widgets\Exceptions\DuplicateWidgetException` |
  | `RefactorCircus\Atrium\Exceptions\InvalidPluginException` | `RefactorCircus\Atrium\Domains\Plugins\Exceptions\InvalidPluginException` |
  | `RefactorCircus\Atrium\Http\Controllers\DashboardController` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardController` |
  | `RefactorCircus\Atrium\Http\Controllers\DashboardCrudController` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardCrudController` |
  | `RefactorCircus\Atrium\Http\Controllers\DashboardLayoutController` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Controllers\DashboardLayoutController` |
  | `RefactorCircus\Atrium\Http\Controllers\SearchController` | `RefactorCircus\Atrium\Domains\Search\Http\Controllers\SearchController` |
  | `RefactorCircus\Atrium\Http\Controllers\SettingsController` | `RefactorCircus\Atrium\Domains\Settings\Http\Controllers\SettingsController` |
  | `RefactorCircus\Atrium\Http\Middleware\Authorize` | `RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize` |
  | `RefactorCircus\Atrium\Http\Middleware\EnsureFeaturesAreEnabled` | `RefactorCircus\Atrium\Domains\Access\Http\Middleware\EnsureFeaturesAreEnabled` |
  | `RefactorCircus\Atrium\Http\Requests\DeleteDashboardRequest` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\DeleteDashboardRequest` |
  | `RefactorCircus\Atrium\Http\Requests\SaveDashboardLayoutRequest` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\SaveDashboardLayoutRequest` |
  | `RefactorCircus\Atrium\Http\Requests\StoreDashboardRequest` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\StoreDashboardRequest` |
  | `RefactorCircus\Atrium\Http\Requests\UpdateDashboardRequest` | `RefactorCircus\Atrium\Domains\Dashboard\Http\Requests\UpdateDashboardRequest` |
  | `RefactorCircus\Atrium\Models\Concerns\DispatchesModelEvents` | `RefactorCircus\Atrium\Support\Models\Concerns\DispatchesModelEvents` |
  | `RefactorCircus\Atrium\Models\Dashboard` | `RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel` |
  | `RefactorCircus\Atrium\Models\DashboardWidget` | `RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel` |
  | `RefactorCircus\Atrium\Navigation\NavGroup` | `RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup` |
  | `RefactorCircus\Atrium\Navigation\NavItem` | `RefactorCircus\Atrium\Domains\Navigation\Data\NavItem` |
  | `RefactorCircus\Atrium\Navigation\NavigationRegistry` | `RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry` |
  | `RefactorCircus\Atrium\Plugins\Plugin` | `RefactorCircus\Atrium\Domains\Plugins\Support\Plugin` |
  | `RefactorCircus\Atrium\Plugins\PluginRegistry` | `RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry` |
  | `RefactorCircus\Atrium\Policies\DashboardPolicy` | `RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardPolicy` |
  | `RefactorCircus\Atrium\Policies\DashboardWidgetPolicy` | `RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardWidgetPolicy` |
  | `RefactorCircus\Atrium\Policies\Policy` | `RefactorCircus\Atrium\Domains\Dashboard\Policies\Policy` |
  | `RefactorCircus\Atrium\Search\SearchRegistry` | `RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry` |
  | `RefactorCircus\Atrium\Search\SearchResult` | `RefactorCircus\Atrium\Domains\Search\Data\SearchResult` |
  | `RefactorCircus\Atrium\Search\SearchSource` | `RefactorCircus\Atrium\Domains\Search\Data\SearchSource` |
  | `RefactorCircus\Atrium\Settings\SettingsPanel` | `RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel` |
  | `RefactorCircus\Atrium\Settings\SettingsRegistry` | `RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry` |
  | `RefactorCircus\Atrium\Support\Discovery\ComposerPluginDiscovery` | `RefactorCircus\Atrium\Domains\Plugins\Services\ComposerPluginDiscovery` |
  | `RefactorCircus\Atrium\Widgets\WidgetDefinition` | `RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition` |
  | `RefactorCircus\Atrium\Widgets\WidgetRegistry` | `RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry` |
- The bundled Pennant plugin (the Feature flags page, `FeatureFlagManager`, its requests, actions and `Feature*ActionEvent` events, and the `atrium.pennant` config) moved to `refactor-circus/pennantplus` under `RefactorCircus\PennantPlus\Atrium`. Install that package to keep the page; its settings now live under `pennantplus.atrium`.
- The PHP namespace changed from `Atrium\Atrium` to `RefactorCircus\Atrium`, matching the other `refactor-circus/*` packages. Update `use` statements, the service provider and facade references, and any class names in your config (such as `atrium.php` middleware). The package name `refactor-circus/atrium`, the `atrium::` view namespace, `atrium.*` config keys, route names and `atrium-*` publish tags are unchanged.
- Event classes moved and were renamed. Model events now live in `RefactorCircus\Atrium\Events\Model` (`Events\Dashboard\DashboardCreatedEvent` is now `Events\Model\DashboardCreatedEvent`, and `Events\DashboardWidget\*` moved the same way). Action events moved from `Atrium\Atrium\Events\Actions` to `RefactorCircus\Atrium\Events\Action`. Update the `use` statements of your listeners.
- The `Atrium\Atrium\Events\Event` base class was removed. Events are now final classes implementing `Contracts\ModelLifecycleEvent`, `Contracts\ActionStartingEvent` or `Contracts\ActionFinishedEvent`.
- Model events now fire synchronously as Eloquent fires the hook, rather than after commit, so `creating`, `updating`, `saving` and `deleting` listeners can cancel a write. Action finish events still wait for the commit.
- Dashboard requests are authorized through model policies. Guests can no longer create a dashboard through `POST dashboards`.
- The `Plugin` contract gained `features()` and `navigationGroups()`. Plugins extending `RefactorCircus\Atrium\Plugins\Plugin` inherit empty defaults; classes implementing the contract directly must add both.
- Child navigation items are now filtered by their own rules. A parent without a link of its own is hidden once all of its children are.

### Added

- `Atrium::css()` and `Atrium::stylesheet()` let packages add styles to the dashboard's `<head>`, after Atrium's own stylesheet.
- `icon-button`, `icon` and `status-dot` components and the Heroicons outline set (`RefactorCircus\Atrium\Support\Icons`, extensible with `Icons::register()`), with screen conventions in the README: icon-only actions, status dots with `info` kept for pending, and navigation icons.
- Navigation gating: `NavItem::can()` and `feature()` beside `authorize()`, `NavGroup` rules for whole sidebar groups (from a plugin's `navigationGroups()` or `Atrium::navigationGroup()`), and plugin `features()` that hide a plugin and 404 its routes while a feature is off.
- `Atrium::resolvePermissionsUsing()` and `Atrium::resolveFeaturesUsing()` to plug in any permission or feature-flag system. Permissions default to the Gate; features are on until a resolver is registered.
- `atrium.feature:{features}` route middleware and `Atrium::featureEnabled()`.

- Every action now fires a start event before its work, carrying its input: `DashboardCreatingActionEvent`, `DashboardUpdatingActionEvent`, `DashboardDeletingActionEvent` and `DashboardLayoutSavingActionEvent`.
- `ModelLifecycleEvent`, `ActionStartingEvent` and `ActionFinishedEvent` contracts, to listen to a whole family of events at once. Model events expose `model()` and `hook()`.
- The `DispatchesModelEvents` trait, so an application's subclass of `Dashboard` fires the package's `Dashboard*` events.
- `DashboardPolicy` and `DashboardWidgetPolicy`, registered from the new `atrium.policies` config key. The owner of a dashboard may do anything, everyone may view a shared dashboard, and widget placements defer to their dashboard through the Gate. Every dashboard request, and the dashboard's edit controls, check them on top of the `atrium.gate` gate.

### Changed

- Visual refresh of the shell and every component: a zinc palette, an inset content panel over a new `canvas` token, and quieter buttons, inputs, cards, tables and badges.
- The sidebar collapses to an icon rail with hover labels and child flyouts, folds its groups, and expands child items in place.
- Dark mode is built in, with a light / dark / system switcher in the topbar. Search focuses with ⌘K / Ctrl K.
- Requires `laravel/framework` instead of `illuminate/support`, since the package uses form requests, events, queues and views from the framework.
