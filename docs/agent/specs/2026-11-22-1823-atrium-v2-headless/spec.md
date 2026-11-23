# Atrium v2 headless

## Goal

Atrium v2.0.0 stops rendering HTML. It serves its dashboard as a JSON API, and a Nuxt 4 layer in this repo (`nuxt/layer`) renders that API. Host apps choose their own auth, and suite packages plug in Vue components by key. The Blade dashboard is removed, not kept beside it.

## Acceptance criteria

**API surface**

1. With `atrium.routes.enabled` true, Atrium registers exactly these routes, under `atrium.routes.prefix` (default `atrium/api`) and `atrium.routes.middleware` (default `['api', Authorize::class]`), named `atrium.*`:
   - `atrium.shell` (GET `shell`)
   - `atrium.dashboards.default` (GET `dashboard`)
   - `atrium.dashboards.index` (GET `dashboards`)
   - `atrium.dashboards.show` (GET `dashboards/{dashboard:slug}`)
   - `atrium.dashboards.store` (POST `dashboards`)
   - `atrium.dashboards.update` (PUT `dashboards/{dashboard:slug}`)
   - `atrium.dashboards.destroy` (DELETE `dashboards/{dashboard:slug}`)
   - `atrium.dashboards.layout` (PUT `dashboards/{dashboard:slug}/layout`)
   - `atrium.dashboards.widgets.show` (GET `dashboards/{dashboard:slug}/widgets/{widget:uuid}`, scoped)
   - `atrium.widgets.index` (GET `widgets`)
   - `atrium.search` (GET `search`)
   - `atrium.settings.index` (GET `settings`)
   - `atrium.settings.show` (GET `settings/{panel}`)

   Plus plugin routes (AC 12). No other Atrium route exists. A test lists the route names.
2. With `atrium.routes.enabled` false, none of those routes is registered.
3. Each domain registers its routes from its own `routes.php` through Keystone's `loadApiRoutesFrom()`. No `api.php` files and no `loadDashboardRoutesFrom()` remain.
4. `shell` returns:
   - the app name and the user's name and email (from the host's authenticated user)
   - navigation sections with items, where each item has `label`, `icon`, `link: {path, external}` and `badge`
   - themes: default, switchable, and each theme's properties
   - settings panel summaries
   - `search.min_length`

   A test asserts the exact JSON structure against `ShellResource`, including every theme field (as exposed by the theme definition) and every settings panel summary field (`key`, `label`, `icon`, `component`), not only key presence.
5. Responses by auth state:
   - A guest gets 401 JSON on every route, whatever the `Accept` header. `Authorize` returns 401 JSON itself when `$request->user()` is null, and Atrium's API group forces JSON rendering, so a missing guard yields 401, never a redirect or a 500. A test with no guard configured asserts 401.
   - An authenticated user who fails the `viewAtrium` gate gets 403 when not in `local`. Tests install a test guard in the middleware stack and set the app environment explicitly: one case for `local`, one for non-local. The config banner and README warn that `APP_ENV=local` lets any authenticated user through on a shared dev or staging server.
   - A user who may view but not modify a dashboard gets 403 on update, destroy and layout.
   - A test asserts the gate runs on every route, plugin routes included.

**Dashboards**

6. Reads never write.
   - `dashboard` returns the user's default dashboard, or `{"data": null}` when the user has none.
   - No GET request creates a row (asserted by row counts).
7. A dashboard is serialized by a `final` `DashboardResource` beside the model, in `Domains/Dashboard/Resources/`, extending Keystone's `JsonResource`.
   - It exposes `slug`, `name`, `is_default` and `widgets`.
   - It does not expose the internal `id`.
   - Each widget placement exposes `uuid`, `key`, `component`, `title`, `icon`, `lazy`, `grid` and `settings`, plus `data` when the placement isn't lazy.
   - Orphaned placements (no definition) have `component: null`.
8. Abilities go in the response's `meta.abilities` (`update`, `delete`), never inside the resource body. `show`, `default`, `store` and `update` include them.
9. Each placement has a `uuid` column, unique, generated on create, plus a migration. Lazy widget URLs and layout payloads identify placements only by `uuid`:
   - A placement in another dashboard returns 404 (scoped binding).
   - A layout payload with a foreign uuid fails validation (422).
   - The migration uses the configurable `atrium.tables` key (never a literal table name), backfills existing rows in chunks, and has a working `down()`.
   - A test seeds v1 placements without uuids, runs the migration, and asserts every row has a distinct non-null uuid and the column is unique and not null. It passes with default and renamed tables (the `RenamedTables` suite). CI covers SQLite. MySQL and Postgres are covered by a documented manual check in the PR.
   - A v1-style layout payload with no uuids still creates placements.
10. Store, update, destroy and layout each go through a `{Verb}{Entity}Request` whose `persist()` calls the existing action:
    - store returns 201 with a `DashboardResource`
    - update and layout return 200 with a `DashboardResource`
    - destroy returns 204
    - Each controller method is a single `return $request->persist();`, enforced by an Arch test.
    - Invalid store, update and layout payloads return 422.

**Extensions**

11. Widgets, screen tabs, screen sections and settings panels serialize as `{key, component, data}`.
    - `component()` defaults to the definition key.
    - `view()` no longer exists on `WidgetDefinition`, `SettingsPanel`, `TabDefinition`, `SectionDefinition` or `DefinesExtension`.
    - `?tab=` selects the open tab. Only the open tab's data is resolved: a counter assertion shows the other tabs' resolvers are not invoked. An unknown `?tab=` value falls back to the default (first) tab.
12. `Plugin::routes()` registers its routes inside Atrium's API group, named `atrium.plugins.{key}.*`. The plugin's feature-gate middleware still runs: a disabled plugin's route returns 404. A test asserts every route named `atrium.*` carries the group's middleware, with `Authorize` last.
13. Every resolver's output passes through `JsonData::check()`. Data containing an `Htmlable`, a closure or a non-serializable object throws `UnserializableDataException`, which is `final`, extends `AtriumException`, and is built with `::forValue($owner, $path, $value)`. The message has the format `Widget [orders] returned unserializable data at [rows.0.cell]: Closure`, and the exception's status is 500.
    - Accepted types: scalars, arrays, `JsonSerializable`, `Arrayable`, `BackedEnum` and `DateTimeInterface`. Everything else (`Htmlable`, closures, other objects) is rejected. A test covers each rejected type and each accepted type, including a Carbon, an Enum, an Eloquent model and a Collection.
    - Eager `data` that fails throws loudly, intended in every environment. A lazy widget's failure affects only its own `widgets.show` response: a test shows a failing lazy widget does not break the dashboard payload.
14. `search` results carry `link: {path, external}`, computed by `ClientPath` relative to the API's client base (`atrium.client_path`, default `/`).
    - `ClientPath` allows only http(s) absolute URLs and relative paths. It rejects other schemes (`javascript:`, `data:`) and `//host` forms. A unit test table covers input to `{path, external}`: a root and a non-root `client_path`, a same-host URL outside `client_path`, null, query strings, fragments, and each rejected form.
    - The layer sets `rel="noopener noreferrer"` on external links.
15. Icons are Iconify name strings, validated by the pattern `^i-[a-z0-9]+(-[a-z0-9]+)+$`. Inline SVG and `Support\Icons` are gone, and the `icon()` setters on `NavItem`, `NavGroup`, `WidgetDefinition`, `TabDefinition`, `SettingsPanel`, `SearchResult` and theme swatches throw `InvalidArgumentException` at definition time for a value that isn't an Iconify name. Tests: `i-lucide-home` passes; `lucide:home`, inline SVG and `i-home` fail.

**Removal**

16. None of the following remain:
    - `resources/views`, `resources/css`, `resources/icons`, `public/atrium.*`
    - `StyleRegistry`, `Atrium::css()` / `stylesheet()`, `Testing\AtriumStyles`
    - Blade controllers and requests
    - `tests/Browser`, `BrowserTestCase`
    - the npm CSS build
    - the config keys `path`, `domain`, `middleware`, `alpine` and `logout_route`

    The `Atrium` facade's `@method` docblock matches its methods. Tests: a reflection test compares the `@method` tags to the facade's public methods, and a removal test asserts the deleted files, classes and config keys are absent.
17. `ArchTest` fails if `src/` calls `view(`, references `Illuminate\View`, or uses `Blade::`.

**Config**

18. `config/atrium.php` has a `routes` section whose banner states:
    - the default prefix and middleware
    - that Atrium ships no authentication, so the host must add its guard (examples: `auth:api`, `auth:sanctum`)
    - that `Authorize` should stay last
    - `client_path`: default `/`, must match the base URL the host serves the SPA from
    - the CORS (`paths`, `supports_credentials`) and CSRF (cookie auth, Sanctum flow) setup that cross-origin SPA hosts need, and the `Authorization` header for token auth
    - the `viewAtrium` gate's `local` behavior

    A test greps `config/atrium.php` for the prefix, middleware, no-auth note, `client_path` and `Authorize` last.

**Nuxt layer**

19. `nuxt/layer` (`@refactor-circus/atrium-nuxt`) is a Nuxt 4 layer built with `ssr: false`, Nuxt UI 4, Pinia and VueUse. It provides:
    - the shell layout, navigation, ⌘K search and theme switching
    - the dashboard page with grid editor and switcher
    - settings pages, and a screen with tabs and sections
    - an `$atrium` registry: `auth(adapter)`, `widget(key, component)`, `extension(key, component)`, `settingsPanel(key, component)`
    - an unregistered-component fallback

    The auth adapter supplies `headers()`, `credentials` and `onUnauthorized()`. On 401 the layer calls `onUnauthorized`.
20. When the dashboard list is empty, the layer creates one with `POST dashboards`, and lazy placements load through `atrium.dashboards.widgets.show`.
21. `nuxt/playground` runs against the workbench (`composer serve`). It registers the demo widgets and settings panel, and demonstrates host-chosen auth against the workbench. Its stand-in token guard lives in the workbench only, never in `src/` or the distributed files, and is marked workbench-only. The workbench demo plugins use API routes.
22. `pnpm -C nuxt typecheck` and `pnpm -C nuxt build` pass, and Vitest component tests cover:
    - registry lookup and fallback
    - the 401 adapter hook
    - the empty-list create
    - lazy placement fetch by uuid through `atrium.dashboards.widgets.show`
    - a tab switch sending `?tab=`
    - theme switching
    - ⌘K search calling `atrium.search` and rendering `link.path` and `external`

    The purely visual parts (layout, grid editing feel) are checked manually. The gate that runs these Node checks is the one chosen in the open question on where the Nuxt checks run, and the spec is not final until it is named. `pnpm-lock.yaml` is committed, Node and pnpm are pinned (`packageManager`, `.nvmrc`), and the pinned versions are copied into the repo.

**Docs and gate**

23. The docs are updated:
    - README: install, auth, layer use
    - CHANGELOG: a v2.0.0 upgrade guide that lists every removed API and its replacement
    - the Boost skill, `CLAUDE.md`'s frontend section
    - the local standards `atrium/components` and `atrium/domains`, which describe the API + layer model
    - the README states that cookie auth needs CORS and CSRF setup, token auth needs the `Authorization` header, token storage belongs to the host, and the workbench token guard must not be copied into production

    The CHANGELOG upgrade guide also lists the removed config keys, the published-view cleanup (`resources/views/vendor/atrium`), the route-name changes and the new migration step. A Pest test asserts every removed symbol, config key and route from AC 16 appears in the v2.0.0 CHANGELOG section. The other doc updates are a manual checklist. The sibling packages' Atrium constraints are confirmed to be `^1`, so none auto-upgrades.
24. `composer test` passes: phpstan, pint, type coverage 100%, Pest. This is the PHP gate. The Node checks of AC 22 must also pass in the gate named for them (open question), and done means both pass.

## Design

**Routes.** Each domain provider calls `$this->loadApiRoutesFrom(__DIR__.'/routes.php')`, using Keystone's group from `atrium.routes.*`. The Navigation domain gains a `routes.php` for `shell`.

- Plugin routes are loaded inside the same group, with prefix `plugins/{key}`, name `plugins.{key}.`, and the plugin's existing feature middleware.
- `Http\Controllers\Concerns\AuthorizesScreens` goes if nothing uses it after the deletion.

**Resources.** `DashboardResource` and `DashboardWidgetResource` sit beside their models in `Domains/Dashboard/Resources/`. Payloads with no model behind them go in `Domains/{Domain}/Http/Resources/`, all `final`:

- `ShellResource`
- `WidgetDefinitionResource`
- `ResolvedScreenResource`
- `SettingsPanelResource`
- `SearchResultResource`

Abilities are added by the controller or request with `->additional(['meta' => ['abilities' => ...]])`, so the resource itself never reads the request.

**Placements.** Migration `add_uuid_to_atrium_dashboard_widgets_table`:

- adds a nullable `uuid`
- backfills existing rows
- makes it unique and not null

`DashboardWidgetModel` uses `HasUuids` on `uuid` only (the primary key stays `id`). `SaveDashboardLayoutRequest` validates `widgets.*.uuid` with `Rule::exists()` scoped to the dashboard. A placement without a uuid is new.

**Extension contract.** `component` and `icon` are `public private(set)` on definitions, with fluent setters. `DefinesExtension::view()` is removed.

`JsonData` stays at `src/Support/JsonData.php`: package-wide, because Widgets, Screens and Settings all use it. `UnserializableDataException` moves to `src/Exceptions/` beside `AtriumException`. It is package-wide for the same reason and returns status 500, a programmer error.

**Links.** `ClientPath::for(?string $url)` turns a host URL into `{path, external}`. An absolute URL on another host is `external: true`. A path under `atrium.client_path` is made relative to the SPA.

**Nuxt.** A pnpm workspace in `nuxt/` holds `layer` and `playground`. The layer's public surface is:

- the `$atrium` registry plugin
- the `useAtrium*` composables (`Api`, `Dashboard`, `Theme`, `Icon`)
- the `Atrium*` components
- the `ScreenData` / `Shell` types

Pinned versions are copied from the spike into the repo (lockfile and `packageManager`), with no reference to a local path.

**Departures from standards:** none planned. `testing/test-layers` is followed by keeping API tests to wiring and asserting behavior at the actions.

## Out of scope

- Migrating Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom. Each gets its own spec, waiting on this one.
- Shipping an auth implementation, OAuth server, or login UI.
- SSR, and server-side rendering of plugin components.
- Publishing the layer to a registry. How it is distributed is decided in spec review.
- Any change to dashboard, widget, theme or settings behavior beyond its transport.
- Any browser or end-to-end suite beyond Vitest. `tests/Browser` is deleted with no replacement.
- CORS, CSRF and host-side auth configuration belong to the host. Atrium documents them only.
- An OpenAPI spec or generated API docs.
- Rate limiting.
- A v1 compatibility shim or Blade fallback.

## Risks and open questions

- **Layer distribution** (open for spec review). Two options:
  - Nuxt `extends: ['github:refactor-circus/atrium/nuxt/layer#v2.0.0']`. This needs no registry, and private repos need a `GIGET_AUTH` token.
  - Publish `@refactor-circus/atrium-nuxt` to GitHub Packages.

  The recommendation is git `extends`.
- **Placement uuid migration:** existing v1 installs need the backfill. The migration must work on SQLite, MySQL and Postgres.
- **`atrium.client_path`** is a new key. It must match the base URL the host serves the SPA from, or nav and search links break. Default `/`.
- **CI:** adding Node to the package CI raises run time, so a separate job is likely.
- **Big-bang release:** suite packages on `^1` keep working until they move. Nothing on `^2` renders without its Nuxt layer.

## Addendum 2026-11-22: spec review decisions

See `decisions.md`, D-001 to D-007. Where these conflict with the acceptance criteria above, they win.

25. **Distribution (D-001):** host apps use `extends: ['github:refactor-circus/atrium/nuxt/layer#v2.0.0']`.
    - The README documents this, including `GIGET_AUTH` for private repos.
    - The playground extends the local `../layer` path.
    - Nothing is published to a registry.
26. **Node gate (D-002):** `composer test:nuxt` runs `pnpm -C nuxt install --frozen-lockfile`, typecheck, build and Vitest.
    - CI runs it as its own job.
    - `composer test` stays PHP-only.
    - Both must pass for the spec to be done.
27. **Layer i18n (D-003):** the layer's own strings come from locale files, with English as the default. This is in scope.
    - The layer uses `@nuxtjs/i18n`.
    - Hosts can add or override locales.
    - The shell sends `locale` from `app()->getLocale()`, and the layer switches to it.
    - Server-side labels (nav, widgets, panels, tabs) stay translated by Laravel.
    - Vitest proves a string renders in a second test locale.
28. **Version skew (D-004):** the shell includes `api_version`, a constant on `Atrium` that matches the release major.minor.
    - The layer compares it with its own package version and shows a non-blocking warning (console plus a dismissible banner) on a major or minor mismatch.
    - Vitest covers the warning.
29. **Removed config keys (D-005):** at boot, Atrium logs one warning per request lifecycle when any of `path`, `domain`, `middleware`, `alpine` or `logout_route` is present in `config('atrium')`.
    - The warning names the keys and points to `atrium.routes.middleware`.
    - A test asserts the log entry.
30. **Layout save (D-006):** `PUT dashboards/{dashboard:slug}/layout` treats the payload as the full layout.
    - Placements whose `uuid` is absent from the payload are deleted.
    - Orphaned placements (no registered definition) are never deleted by a layout save, even when omitted.
    - Tests cover omit-deletes, orphan-kept and new-without-uuid.
31. **Contract fixtures (D-007):** PHP feature tests write the JSON payloads of `shell`, a dashboard, a resolved screen and settings to `nuxt/layer/test/fixtures/*.json`.
    - A Pest test fails when a committed fixture is stale.
    - Vitest type-checks each fixture against the layer's TS types (`satisfies`) and renders the components from them.
