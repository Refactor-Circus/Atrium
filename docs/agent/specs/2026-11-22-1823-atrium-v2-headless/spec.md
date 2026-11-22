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
5. Responses by auth state:
   - A guest gets 401 JSON on every route.
   - An authenticated user who fails the `viewAtrium` gate gets 403 when not in `local`.
   - A user who may view but not modify a dashboard gets 403 on update, destroy and layout.

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
10. Store, update, destroy and layout each go through a `{Verb}{Entity}Request` whose `persist()` calls the existing action:
    - store returns 201 with a `DashboardResource`
    - update and layout return 200 with a `DashboardResource`
    - destroy returns 204
    - Each controller method is a single line.

**Extensions**

11. Widgets, screen tabs, screen sections and settings panels serialize as `{key, component, data}`.
    - `component()` defaults to the definition key.
    - `view()` no longer exists on `WidgetDefinition`, `SettingsPanel`, `TabDefinition`, `SectionDefinition` or `DefinesExtension`.
    - `?tab=` selects the open tab. Only the open tab's data is resolved.
12. `Plugin::routes()` registers its routes inside Atrium's API group, named `atrium.plugins.{key}.*`. The plugin's feature-gate middleware still runs: a disabled plugin's route returns 404.
13. Every resolver's output passes through `JsonData::check()`. Data containing an `Htmlable`, a closure or a non-serializable object throws `UnserializableDataException`, which is `final`, extends `AtriumException`, and is built with `::forValue($owner, $path, $value)`. The message names the owner key and dotted path.
14. `search` results carry `link: {path, external}`, computed by `ClientPath` relative to the API's client base (`atrium.client_path`, default `/`).
15. Icons are Iconify name strings, validated by the pattern `^i-[a-z0-9]+(-[a-z0-9]+)+$`. Inline SVG and `Support\Icons` are gone, and any `icon()` setter rejects a value that isn't an Iconify name.

**Removal**

16. None of the following remain:
    - `resources/views`, `resources/css`, `resources/icons`, `public/atrium.*`
    - `StyleRegistry`, `Atrium::css()` / `stylesheet()`, `Testing\AtriumStyles`
    - Blade controllers and requests
    - `tests/Browser`, `BrowserTestCase`
    - the npm CSS build
    - the config keys `path`, `domain`, `middleware`, `alpine` and `logout_route`

    The `Atrium` facade's `@method` docblock matches its methods.
17. `ArchTest` fails if `src/` calls `view(`, references `Illuminate\View`, or uses `Blade::`.

**Config**

18. `config/atrium.php` has a `routes` section whose banner states:
    - the default prefix and middleware
    - that Atrium ships no authentication, so the host must add its guard (examples: `auth:api`, `auth:sanctum`)
    - that `Authorize` should stay last

**Nuxt layer**

19. `nuxt/layer` (`@refactor-circus/atrium-nuxt`) is a Nuxt 4 layer built with `ssr: false`, Nuxt UI 4, Pinia and VueUse. It provides:
    - the shell layout, navigation, ⌘K search and theme switching
    - the dashboard page with grid editor and switcher
    - settings pages, and a screen with tabs and sections
    - an `$atrium` registry: `auth(adapter)`, `widget(key, component)`, `extension(key, component)`, `settingsPanel(key, component)`
    - an unregistered-component fallback

    The auth adapter supplies `headers()`, `credentials` and `onUnauthorized()`. On 401 the layer calls `onUnauthorized`.
20. When the dashboard list is empty, the layer creates one with `POST dashboards`, and lazy placements load through `atrium.dashboards.widgets.show`.
21. `nuxt/playground` runs against the workbench (`composer serve`). It registers the demo widgets and settings panel, and uses a stand-in token guard (`AuthenticateWorkbenchToken`) showing host-chosen auth.
22. `pnpm -C nuxt typecheck` and `pnpm -C nuxt build` pass, and Vitest component tests cover:
    - registry lookup and fallback
    - the 401 adapter hook
    - the empty-list create

    `composer test` runs them, or CI runs them in a separate job.

**Docs and gate**

23. The docs are updated:
    - README: install, auth, layer use
    - CHANGELOG: a v2.0.0 upgrade guide that lists every removed API and its replacement
    - the Boost skill, `CLAUDE.md`'s frontend section
    - the local standards `atrium/components` and `atrium/domains`, which describe the API + layer model
24. `composer test` passes: phpstan, pint, type coverage 100%, Pest.

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

Pinned versions match `~/Herd/spike-seclock-v2/frontend`.

**Departures from standards:** none planned. `testing/test-layers` is followed by keeping API tests to wiring and asserting behavior at the actions.

## Out of scope

- Migrating Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom. Each gets its own spec, waiting on this one.
- Shipping an auth implementation, OAuth server, or login UI.
- SSR, and server-side rendering of plugin components.
- Publishing the layer to a registry. How it is distributed is decided in spec review.
- Any change to dashboard, widget, theme or settings behavior beyond its transport.

## Risks and open questions

- **Layer distribution** (open for spec review). Two options:
  - Nuxt `extends: ['github:refactor-circus/atrium/nuxt/layer#v2.0.0']`. This needs no registry, and private repos need a `GIGET_AUTH` token.
  - Publish `@refactor-circus/atrium-nuxt` to GitHub Packages.

  The recommendation is git `extends`.
- **Placement uuid migration:** existing v1 installs need the backfill. The migration must work on SQLite, MySQL and Postgres.
- **`atrium.client_path`** is a new key. It must match the base URL the host serves the SPA from, or nav and search links break. Default `/`.
- **CI:** adding Node to the package CI raises run time, so a separate job is likely.
- **Big-bang release:** suite packages on `^1` keep working until they move. Nothing on `^2` renders without its Nuxt layer.
