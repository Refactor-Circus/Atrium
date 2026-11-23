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
   - `locale` (the app's current locale, AC 27)
   - `api_version` (AC 28)

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
   - Each widget placement exposes `uuid`, `key`, `component`, `title`, `icon`, `lazy`, `grid` and `settings`, plus `data` when the placement isn't lazy. For a lazy placement `data` is absent, not null.
   - A test asserts the exact shape for the populated case and for the null default (`{"data": null}`, which has no `meta`).
   - Orphaned placements (no definition) have `component: null`.
8. Abilities go in the response's `meta.abilities` (`update`, `delete`), never inside the resource body. `show`, `default`, `store` and `update` include them. `layout` returns the same `DashboardResource` with the same `meta.abilities`; `destroy` returns 204 with no body. A test asserts the exact shape of each.
9. Each placement has a `uuid` column, unique, generated on create, plus a migration. Lazy widget URLs and layout payloads identify placements only by `uuid`:
   - A placement in another dashboard returns 404 (scoped binding).
   - A layout payload with a foreign uuid fails validation (422).
   - An orphaned placement (no definition) renders with `component: null` and is never lazy. A `widgets.show` request for one returns 404, and a test asserts it.
   - The migration uses the configurable `atrium.tables` key (never a literal table name), backfills existing rows, and has a working `down()`.
   - A test seeds v1 placements without uuids, runs the migration, and asserts every row has a distinct non-null uuid and the column is unique and not null. It passes with default and renamed tables (the `RenamedTables` suite). A second test seeds more rows than one backfill chunk and asserts all get uuids. CI covers SQLite. MySQL and Postgres are a checklist item in the PR template, confirmed by the PR author before merge.
   - A v1-style layout payload with no uuids is accepted. Under full-layout semantics (AC 30) its placements are all new: against an existing dashboard it deletes every non-orphan placement and recreates them with new uuids, so their lazy URLs change. A test fixes this end state, pinning the response and the DB row counts.
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
    - Resolver output is walked with a depth limit and a cycle guard. Exceeding the limit or finding a cycle throws `UnserializableDataException`. Models serialize through `toArray()` (so `$hidden` applies), and the docs recommend returning resources. A cyclic-structure test and a depth-limit test cover this.
    - Eager `data` that fails throws loudly, intended in every environment. A lazy widget's failure affects only its own `widgets.show` response: a test shows a failing lazy widget does not break the dashboard payload.
14. `search` results carry `link: {path, external}`, computed by `ClientPath` relative to the API's client base (`atrium.client_path`, default `/`).
    - `ClientPath` allows only http(s) absolute URLs and relative paths. It rejects other schemes (`javascript:`, `data:`) and `//host` forms. A unit test table covers input to `{path, external}`: a root and a non-root `client_path`, a same-host URL outside `client_path`, null, query strings, fragments, and each rejected form. The rejected forms include these bypasses: `/\host`, `\\host`, leading whitespace or control characters (`java\nscript:`), mixed-case schemes, `http:host` and userinfo URLs (`https://client.example@evil.test`). `ClientPath` never throws on a bad value.
    - The layer refuses to render a link whose path doesn't start with `/` or http(s).
    - The search request enforces `search.min_length`: a shorter `q` returns 422, and a test asserts it.
    - The layer sets `rel="noopener noreferrer"` on external links.
15. Icons are Iconify name strings, validated by the pattern `^i-[a-z0-9]+(-[a-z0-9]+)+$`. Inline SVG and `Support\Icons` are gone, and the `icon()` setters on `NavItem`, `NavGroup`, `WidgetDefinition`, `TabDefinition`, `SettingsPanel`, `SearchResult` and theme swatches throw `InvalidArgumentException` at definition time for a value that isn't an Iconify name. Tests: `i-lucide-home` passes; `lucide:home`, inline SVG and `i-home` fail.

**Removal**

16. None of the following remain:
    - `resources/views`, `resources/css`, `resources/icons`, `public/atrium.*`
    - `StyleRegistry`, `Atrium::css()` / `stylesheet()`, `Testing\AtriumStyles`
    - Blade controllers and requests
    - `tests/Browser`, `BrowserTestCase`
    - the npm CSS build: the CSS scripts and CSS-only dependencies are gone from `package.json`
    - the config keys `path`, `domain`, `middleware`, `alpine` and `logout_route`

    The `Atrium` facade's `@method` docblock matches its methods. Tests: a reflection test compares the `@method` tags to the facade's public methods, and a removal test asserts the deleted files, classes, config keys and `package.json` CSS scripts and dependencies are absent. An Arch or file test asserts the workbench token guard class exists only under `workbench/`, and the composer archive rules (`.gitattributes` `export-ignore`) exclude `nuxt/`, `workbench/` and the tests from the dist.
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
    - `rel="noopener noreferrer"` on external links
    - a locale switch driven by the shell `locale` (AC 27)
    - nav rendering with `link` and `badge`
    - the grid editor sending the layout payload (uuids and layout fields)
    - the settings panel and screen section rendering
    - the Iconify icon render
    - the version-mismatch banner (AC 28), with equal, minor-mismatch and major-mismatch cases

    The purely visual parts (layout, grid editing feel) are checked manually. These Node checks run in `composer test:nuxt` (AC 26). `pnpm-lock.yaml` is committed, Node and pnpm are pinned (`packageManager`, `.nvmrc`), and the pinned versions are copied into the repo.
    - Hosts consume `nuxt/layer` through giget from a subdirectory, so the lockfile pins only the monorepo. `nuxt/layer/package.json` has no `workspace:` dependencies, and the layer imports nothing outside `nuxt/layer`.
    - `composer test:nuxt` includes a step that copies `nuxt/layer` into an empty temp directory, installs it and builds a minimal consumer app against it.

**Docs and gate**

23. The docs are updated:
    - README: install, auth, layer use
    - CHANGELOG: a v2.0.0 upgrade guide that lists every removed API and its replacement
    - the Boost skill, `CLAUDE.md`'s frontend section
    - the local standards `atrium/components` and `atrium/domains`, which describe the API + layer model
    - the README states that cookie auth needs CORS and CSRF setup, token auth needs the `Authorization` header, token storage belongs to the host, and the workbench token guard must not be copied into production

    The CHANGELOG upgrade guide also lists the removed config keys, the published-view cleanup (`resources/views/vendor/atrium`), the route-name changes and the new migration step. A Pest test asserts every removed symbol, config key and route from AC 16 appears in the v2.0.0 CHANGELOG section. The other doc updates are a manual checklist. The manual checklist items are named in the PR description, each with its owner (the PR author).
    - Before merging to main, for each of the 7 sibling `composer.json` files and their CI, confirm Atrium is required by tag range (`^1`) and not `dev-main`, and that no CI resolves Atrium from the main checkout. The grep output is recorded in the PR. Don't merge until every sibling is confirmed or the missing tags are cut.
24. `composer test` passes: phpstan, pint, type coverage 100%, Pest. This is the PHP gate. Done means `composer test` and `composer test:nuxt` (AC 26) both pass.

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
- Publishing the layer to a registry. It is distributed by git `extends` (D-001).
- Any change to dashboard, widget, theme or settings behavior beyond its transport, except these intended changes: no write on read (AC 6), client-side first-dashboard create (AC 20), full-layout save semantics with orphans kept (AC 30), and placement uuids (AC 9). Anything else is transport-only.
- Security or bug fixes for the 1.x line. Suite packages left on `^1` keep working, but backports are not part of this spec.
- API pagination, HTTP caching and ETags, and URL-based API versioning beyond `api_version`.
- RTL support and accessibility audits of the layer.
- Any browser or end-to-end suite beyond Vitest. `tests/Browser` is deleted with no replacement.
- CORS, CSRF and host-side auth configuration belong to the host. Atrium documents them only.
- An OpenAPI spec or generated API docs.
- Rate limiting.
- A v1 compatibility shim or Blade fallback.

## Risks and open questions

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
    - The README documents pinning to a commit SHA for production, because a `v*` tag is mutable. The release process protects `v*` tags.
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
    - A Pest test asserts `Atrium::API_VERSION` equals the major.minor in `nuxt/layer/package.json`, so the release version and the constant cannot drift.
29. **Removed config keys (D-005):** at boot, Atrium logs one warning per process (not per request) at the `warning` level when any of `path`, `domain`, `middleware`, `alpine` or `logout_route` is present in `config('atrium')`.
    - The warning names the keys and points to `atrium.routes.middleware`.
    - A test uses `Log::spy()`, asserts one entry whose message names each removed key present, and asserts no second entry after a second provider boot.
    - `routes.middleware` is not inherited from the old `middleware` key. A host that dropped nothing is protected by the default `Authorize` alone (fail-closed 401).
30. **Layout save (D-006):** `PUT dashboards/{dashboard:slug}/layout` treats the payload as the full layout.
    - Placements whose `uuid` is absent from the payload are deleted.
    - Orphaned placements (no registered definition) are never deleted by a layout save, even when omitted.
    - Tests cover omit-deletes, orphan-kept and new-without-uuid.
    - Delete, update and create run inside the action's single `DB::transaction()`. A test asserts a validation or write failure leaves the old placements intact.
31. **Contract fixtures (D-007):** PHP feature tests generate the JSON payloads of `shell`, a dashboard, a resolved screen and settings in memory, using seeded deterministic uuids and frozen time, and compare them with `nuxt/layer/test/fixtures/*.json`.
    - The default run only compares and fails on a diff. Writing is opt-in with `UPDATE_FIXTURES=1` (the regeneration command), never on a plain run.
    - `composer test:nuxt` fails if the fixtures directory is missing.
    - Vitest type-checks each fixture against the layer's TS types (`satisfies`) and renders the components from them.

## Addendum 2026-11-22 (pass 2): spec review decisions

See `decisions.md`, D-008 to D-013. Where these conflict with the criteria above, they win.

32. **Stale layout guard (D-008):** `DashboardResource` exposes `version`, an integer that every layout or meta update increments (a new column, added in the AC 9 migration).
    - `PUT .../layout` and `PUT dashboards/{dashboard:slug}` require `version`.
    - A mismatch returns 409 and changes nothing. The layer then reloads the dashboard and tells the user.
    - Tests cover a match, a mismatch, and two writes in sequence.
33. **Eager widget failure (D-009):** outside `local` and `testing`, when an eager resolver throws or fails `JsonData::check()`, that placement is returned with `data: null` and `error: {message: "Widget failed to load"}`, and the exception is reported.
    - The rest of the response is 200.
    - In `local` and `testing`, the exception propagates (500).
    - Screen tabs, sections and settings panels follow the same rule.
    - The layer renders an error card for a placement that has `error`.
    - Tests cover both environments.
34. **Icon data (D-010):** the layer depends on `@iconify-json/lucide` and configures `icon.serverBundle` for local collections, with remote fetch off by default.
    - Hosts add `@iconify-json/*` packs, or set an opt-in layer option to allow the Iconify API.
    - An unknown icon renders a fallback, not an error.
    - Vitest covers the fallback.
35. **Locales (D-011):** v2.0.0 ships only `en`. A second locale exists only as a Vitest fixture.
36. **Theme key (D-012):** `atrium.theme` stays, and its values are sent in the shell as the built-in `atrium` theme's properties. A test changes the config and asserts the shell payload.
37. **ClientPath (D-013):** a URL counts as same-host when its host matches `parse_url(config('app.url'), PHP_URL_HOST)`. A rejected form (`javascript:`, `data:`, `//host` and the other forms in AC 14) returns `null`, and the nav item or search result is then sent with `link: null`.

## Addendum 2026-11-23: build gating (D-014)

Groups 2 to 5 are gated on their own test files plus PHPStan and Pint, and the full suite may be red between them. From group 6 on, and at the factory gate, AC 24 applies in full.

## Addendum 2026-11-23: archive rules and path helpers (D-015, D-016)

- AC 16 is amended: `.gitattributes` export-ignores `/nuxt/playground`, `/nuxt/package.json`, `/nuxt/pnpm-workspace.yaml`, `/nuxt/pnpm-lock.yaml` and `/nuxt/layer/test`, and keeps `/nuxt/layer` in the archive. `RemovalTest` asserts both.
- `Atrium::path()` and `Atrium::url()` are removed, with their facade `@method` lines. `NavItem::isActive()` no longer reads `atrium.path`. The v2.0.0 CHANGELOG lists both removals.

## Addendum 2026-11-23: layer dependencies (D-017)

`nuxt/layer/package.json` lists, as direct pinned dependencies, every Nuxt module that `@nuxt/ui` installs by name (at least `@nuxt/icon`). The AC 22 consumer build passes on a strict pnpm install with no `.npmrc` hoisting.

D-017 as applied also pins `tailwindcss` (imported by name from `atrium.css`) beside `@nuxt/icon`, `@nuxt/fonts` and `@nuxtjs/color-mode`.

## Addendum 2026-11-23: suite integrations

Reopened scope (shape.md, "Reopened 2026-11-23: suite integrations"). Atrium v2 hosts the front ends of Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom. Each of those packages ships only its JSON API and MCP in v2 (specs `{Package}/docs/agent/specs/2026-11-23-0943-{package}-v2-api-and-mcp-only`), with a committed `openapi.json` and a generated `client/`. Decisions D-019 to D-039 in `decisions.md` settle the open questions. Where they conflict with criteria 1 to 37, these criteria win. In particular, AC 1's route list gains `atrium.screens.show` (AC 44), AC 4's shell gains `integrations`, `search.sources` and the nav item `live` key (AC 42, 43), and the shape's "Out of scope: migrating suite packages" and "An OpenAPI spec" no longer apply.

"Package" below means one of the seven. `{pkg}` is its Composer short name in lower case (`cortex`, `impex`, `keen`, `pennantplus`, `polycart`, `roster`, `showroom`) and `{Pkg}` its studly name.

### Acceptance criteria

**Integration framework (PHP)**

38. **Config.** `config/atrium.php` has an `integrations` section with exactly the seven package keys. Each has `enabled` (default `true`, boolean-coerced), `api_base` (default `null`) and `features` (default `[RefactorCircus\Atrium\Integrations\{Pkg}\{Pkg}Feature::class]`). The cross-package hooks keep their v1 defaults:
    - `cortex.redirect_domains.screens`: `['roster.organization' => 'tab', 'roster.user' => 'aside']`
    - `impex.run_link.screens`: `['showroom.transfers' => 'row.actions']`
    - `keen.history`: `screens` `['*']`, `slot` `'after'`, `exclude` `['keen.*', 'atrium.*']`, `tabs` `['roster.organization' => ['scope' => true]]`, `nav` `['enabled' => true, 'sort' => 90, 'exclude' => [], 'groups' => ['showroom' => 'showroom', 'pennantplus' => 'pennantplus']]` (group values name Atrium nav groups, D-033)
    - `showroom.transfers.flow_prefix`: `'showroom:'` (D-035)

    The section banner states the detection rule (installed and `enabled`), the API-base rule (AC 40), that flags resolve through Laravel Pennant when it is installed and are on otherwise, and that Polycart and Roster ship with their API off (`polycart.routes.enabled`, `roster.routes.enabled`), so the host must turn it on behind its auth middleware. `tests/Feature/Integrations/IntegrationConfigTest.php` asserts the exact default array and greps the banner for each point.
39. **Registration gating.** An integration registers only when both hold: the `InstalledPackages` seam reports `refactor-circus/{pkg}` installed (the default binding wraps `Composer\InstalledVersions::isInstalled()`), and `atrium.integrations.{pkg}.enabled` is true. Tests bind a fake `InstalledPackages` and re-run registration. For each of the seven packages, `tests/Feature/Integrations/RegistrationTest.php` asserts:
    - installed and enabled: its nav items, widgets, settings panel, search sources and screen declarations are registered
    - not installed: nothing is registered (the navigation, widget, settings, search and screen registries equal the baseline)
    - installed but `enabled` false, including the string `"false"`: nothing is registered
40. **API base.** A registered integration's API base is `atrium.integrations.{pkg}.api_base` when it is a non-empty string. Otherwise it is `'/'.trim(config('{pkg}.routes.prefix'), '/')`, provided `{pkg}.routes.enabled` is true and the prefix is a string. When neither applies, the integration does not register, and Atrium logs one `warning` per process naming `{pkg}.routes.enabled` and `atrium.integrations.{pkg}.api_base`. Tests cover: the prefix read from the package's config, the `api_base` override winning, package routes disabled (not registered, one warning, none on a second boot) and no package config at all.
41. **Feature flags (Pennant).** A registered integration is active for a request only when every name in its `features` list is active. When Laravel Pennant is available, each name resolves through `Feature::for($request->user())->active($name)`; when it is not, every flag is on. Availability goes through a seam the tests replace. Each default `{Pkg}Feature` class lives in `src/Integrations/{Pkg}/`, has `resolve(mixed $scope): bool` returning `true`, and imports nothing from Pennant. Tests, with Pennant's array driver:
    - a flag deactivated for the user makes the integration inactive: the shell lists it with `active: false` and none of its nav items, widgets, settings panels or search sources; `atrium.widgets.index` omits its widgets; `atrium.screens.show` answers 404 for its screens
    - the same flag active makes the integration active
    - with Pennant reported unavailable, the integration is active
    - Atrium's plugin feature gate (`Gatekeeper`) is unchanged (D-027)
42. **Shell.** `ShellResource` adds `integrations`: one entry per registered integration, ordered by key, shaped `{key, label, active, api_base, features: {<name>: bool}}`. It adds `search.sources`: one `{key, integration, label, icon}` per client-side search source of an active integration, and `search.per_source` (from `atrium.search.results.per_source`). With no integration registered, `integrations` and `search.sources` are `[]`. The AC 4 exact-structure test is updated. `nuxt/layer/test/fixtures/shell.json` is regenerated, and a second fixture `shell-integrations.json` is generated from a fake test integration (AC 31 rules apply to both).
43. **Live nav keys.** `NavItem` gains `live(string $key, array $options = [])`, serialized as `live: {key, options}` (`null` when unset; `options` passes `JsonData::check()`), for items whose badge or children the layer computes from a package API: `impex.active-runs` (AC 63) and `keen.history` (AC 64). Atrium computes no badge for an integration's nav item: `badge` is `null`. A unit test covers the setter and its key pattern (`^[a-z0-9-]+\.[a-z0-9.-]+$`), and the shell test covers the payload.
44. **Screen route.** A new route `atrium.screens.show` (GET `screens/{screen}`, in the same API group and middleware, with optional `record` and `tab` query strings) answers, for a screen an active integration declares:
    `{"data": {"key", "kind", "path", "subject_type", "record", "tabs": [...], "sections": {<slot>: [...]}}}`
    The tabs and sections come from `ScreenExtensions` as in AC 11: only the open tab resolves, and an unknown `tab` falls back to the default. `record` is echoed as a string, and no model is loaded: resolvers receive `null` and read the record key from the resolved screen. Extension data passes through `JsonData::check()` and follows AC 33. An unknown, undeclared or inactive screen key answers 404. AC 1's route-name test lists the new route, and the AC 5 gate test covers it.
45. **No package code.** Atrium's PHP never loads a package's classes, models or actions:
    - `tests/ArchTest.php` asserts `RefactorCircus\Atrium` uses nothing from `RefactorCircus\Cortex`, `\Impex`, `\Keen`, `\PennantPlus`, `\Polycart`, `\Roster` or `\Showroom`
    - a test greps `src/` for those namespaces, including as strings
    - `composer.json` `require` still names only PHP, Laravel and `refactor-circus/keystone`
    - every integration widget, settings panel, tab and section sends only static declared data (`{}` or its hook configuration), asserted per package
46. **Surface.** `AtriumServiceProvider` calls `app(Surface::class)->route('atrium.', 'atrium')`. A test resolves the surface of a request to the route named `atrium.shell` as `atrium`. A second test, against a `Surface` spy, asserts that the provider registers the prefix itself, so the test does not rely on Keystone's built-in prefix (removed by `Keystone/2026-11-23-0943-drop-the-atrium-plugin-hook`).

**Layer framework**

47. **Integration clients.** `useAtriumIntegration(key)` returns `{ active, apiBase, client }`, where `client` is an `openapi-fetch` `Client<paths>` typed by that integration's vendored `schema.d.ts` (AC 50). It is cached per key per Nuxt app. The base URL is resolved in this order:
    - `runtimeConfig.public.atrium.integrations.{key}.apiBase`, when the host sets it
    - otherwise the shell's `api_base`. A path is resolved against the origin of `runtimeConfig.public.atrium.apiBase` when that is absolute, and against `window.location.origin` otherwise.

    Vitest covers each case. For an inactive or absent integration, `active` is `false` and `client` is `null`.
48. **One auth adapter.** Every integration client uses the adapter registered with `$atrium.auth()`, through `openapi-fetch` middleware:
    - it sends the adapter's `headers()` and `credentials`, plus `Accept: application/json`
    - a 401 from any client calls `onUnauthorized()` once

    Vitest covers two integrations at once, together with Atrium's own API (AC 19).
49. **Routing.**
    - Integration pages live under `nuxt/layer/app/pages/{pkg}/`, so their paths start with `/{pkg}/`.
    - A layer route middleware renders `<AtriumIntegrationUnavailable>` (a distinct message for not installed, disabled or flagged off) on any `/{pkg}/…` path whose integration is not active in the shell. In that case it makes no request to the package API.
    - Each integration exports its `screens` map (screen key to route name). Each package's PHP integration test writes its declarations (nav, widgets, panel, search sources, screens with paths) to `nuxt/layer/test/fixtures/integrations/{pkg}.json` under the AC 31 rules. Vitest asserts that every screen key in that fixture has a page whose path matches the declared one, and that every page's screen calls `atrium.screens.show` with its key, `record` and `tab`.
    - Hosts can still override any page by defining the same path in their app.
50. **Vendored clients (D-020).**
    - For each package, `nuxt/layer/app/integrations/{pkg}/client/` holds:
      - `openapi.json`, copied from the package
      - `schema.d.ts`, the package's generated `client/src/schema.d.ts`, verbatim
      - `openapi.sha256`, the SHA-256 of `openapi.json` with LF line endings
    - `pnpm -C nuxt sync:clients` (`nuxt/scripts/sync-clients.mjs`) copies them from the sibling checkout. The path is `$ATRIUM_SUITE_PATH/{Pkg}`, and `ATRIUM_SUITE_PATH` defaults to the repository's parent directory. The script fails with a message naming the package and the path when a source is missing.
    - `tests/Feature/Integrations/VendoredClientsTest.php` needs no Node:
      - It always asserts that each stamp matches its vendored `openapi.json`.
      - When the sibling checkout exists, it asserts that the vendored `openapi.json` equals the sibling's (as decoded JSON) and that `schema.d.ts` equals the sibling's `client/src/schema.d.ts`. Otherwise it is skipped with a message naming `pnpm -C nuxt sync:clients`.
    - The layer depends on a pinned `openapi-fetch`.
    - Until the release step (D-020), nothing in `nuxt/` imports `@refactor-circus/*-client`. A test greps for it.
51. **Build without packages.**
    - `pnpm -C nuxt typecheck`, `build` and Vitest pass with no sibling checkout present.
    - The AC 22 consumer build compiles every integration.
    - With a shell whose `integrations` is `[]`, Vitest shows that no integration nav item, widget, panel or search source renders, and that no package API is called.
52. **Registry additions.** `$atrium` gains two methods:
    - `searchSource(key, (q) => Promise<AtriumSearchResult[]>)`
    - `live(key, () => Promise<{badge?: number|null, children?: AtriumNavItem[]}>)`

    ⌘K search calls `atrium.search` and, in parallel, every shell `search.sources` entry that has a registered source. A source that rejects, or answers 401, 403 or 5xx, is dropped without failing the others. Its results pass the AC 14 link guard. Navigation calls the `live` resolver of each item whose `live` key is registered. Vitest covers both.
53. **Strings.** An integration's server-side labels (nav, widgets, panels, tabs, sections, search sources) come from Atrium's `lang/en/integrations/{pkg}.php`. Its layer strings come from `nuxt/layer/i18n/locales/integrations/{pkg}.en.json`, merged into the `en` locale. Roster and Showroom also have one file per screen area (`roster-users`, `roster-organizations`, `roster-access`, `showroom-catalog`, `showroom-structure`, `showroom-assets`), and the hooks have `hooks.en.json`. Only English ships (D-011). A Pest test asserts every label key an integration uses exists. A Vitest test asserts every `t()` key used under `app/integrations/{pkg}` and `app/pages/{pkg}` exists in those files.

**Screen parity, by package**

54. **Common screen contract.** These rules hold for every ported screen:
    - **Calls.** It calls only its own package's API, through `useAtriumIntegration()`, plus `atrium.screens.show`. The one exception is a cross-package hook (AC 65–67).
    - **Lists.** List screens page the way the package endpoint does (cursor or page), and send the old screen's filters and search as that endpoint's query parameters.
    - **Mutations.** Every action the old Blade screen offered calls the matching v2 route with the old screen's fields, then reloads. Destructive actions keep their confirmation.
    - **Errors.** A 422 shows the field errors, a 403 shows a no-access state, and a 404 shows a not-found state.
    - **Extensions.** The screen renders the tabs and sections from AC 44, and switching tab sends `?tab=`.
    - **Missing routes.** An old action with no v2 API route is left out. It is listed in a `// Not ported (D-032)` comment at the top of the integration's `index.ts` (or, for the split Roster and Showroom screen groups, of the area's index page), and then in the CHANGELOG.
    - **Tests.** Each screen has a Vitest file under `nuxt/layer/test/integrations/{pkg}/`. It mocks `fetch`, types each mocked payload with `satisfies` against the vendored `components`/`paths`, and asserts the load request, every mutation (method, path and body) and the 403 state.
55. **Cortex** (11 screens; old keys kept):
    | Screen | Route |
    | --- | --- |
    | `cortex.virtual-agents` | `/cortex/virtual-agents` |
    | `cortex.virtual-agent-create` | `/cortex/virtual-agents/create` |
    | `cortex.virtual-agent` | `/cortex/virtual-agents/:slug` |
    | `cortex.concrete-agents` | `/cortex/concrete-agents` |
    | `cortex.concrete-agent` | `/cortex/concrete-agents/:agent` |
    | `cortex.tools` | `/cortex/tools` |
    | `cortex.tool-description` | `/cortex/tools/:tool/description` |
    | `cortex.servers` | `/cortex/servers` |
    | `cortex.server-instructions` | `/cortex/servers/:server/instructions` |
    | `cortex.redirect-domains` | `/cortex/redirect-domains` |
    | `cortex.run` | `/cortex/run` |

    - Versioned texts (virtual agents, concrete-agent overrides, tool descriptions, server instructions) list their versions and save a new version. The old "publish a version" action maps to the v2 versions routes; where v2 has no publish route, D-032 applies.
    - Tool pickers save through `concrete-agents.tools.update` and `servers.tools.update`.
    - The run form lists agents from `cortex.runnable-agents.index` and runs through `virtual-agents.run` or `concrete-agents.run`.
    - Nav: the six v1 items.
    - Settings panel `cortex` (AC 61).
    - Search source `cortex` (AC 62).
56. **Impex** (10 screens):
    | Screen | Route |
    | --- | --- |
    | `impex.runs` | `/impex/runs` |
    | `impex.run` | `/impex/runs/:run` |
    | `impex.flows` | `/impex/flows` |
    | `impex.messages` | `/impex/messages` |
    | `impex.message` | `/impex/messages/:message` |
    | `impex.channels` | `/impex/channels` |
    | `impex.channel-create` | `/impex/channels/create` |
    | `impex.channel` | `/impex/channels/:name` |
    | `impex.subscriptions` | `/impex/subscriptions` |
    | `impex.subscription` | `/impex/subscriptions/:subscription` |

    - The run detail shows its steps (`runs.steps.index`) and offers cancel, retry and signal.
    - Flows offer "run".
    - Channels offer create, update, delete and rotate secret.
    - Subscriptions keep pause, resume, ping and replay where v2 has the route.
    - The status filter on runs and messages is kept.
    - Nav: the five v1 items, with `runs` carrying `live('impex.active-runs')`.
    - Widgets, settings panel and search as in AC 60 to 62.
    - Operator mode (`impex.atrium.show_all`) is not ported (D-032).
57. **Keen** (3 screens):
    | Screen | Route | Behavior |
    | --- | --- | --- |
    | `keen.entries` | `/keen/entries` | filters `source`, `action`, `subject_type`/`subject_id`, `actor_type`/`actor_id`, `since`/`until`, cursor paging |
    | `keen.entry` | `/keen/entries/:entry` | the entry with its changes rendered as the old `x-keen::audit.changes` did |
    | `keen.history` | `/keen/history/:package` | `keen.entries.index` with `source` = the package |

    The "record an entry" form posts to `keen.entries.store`. Nav: the audit-log item, plus the per-package History items of AC 64.
58. **PennantPlus** (1 screen): `pennantplus.features` at `/pennantplus/features`.
    - It lists features, their scopes and values: `pennantplus.features.index`, `scopes.index`, `scopes.models` and `values.index`.
    - It sets a value (`values.update`), deletes a value (`values.destroy`) and purges a feature (`features.destroy`), with the old confirmations.
    - The old "manages feature flags" check becomes the API's 403, which hides the controls.
    - Nav: the one v1 item.
59. **Polycart** (3 screens):
    | Screen | Route | Behavior |
    | --- | --- | --- |
    | `polycart.carts` | `/polycart/carts` | type and status filters |
    | `polycart.cart` | `/polycart/carts/:cart` | update, delete, clear, convert, status transition, visibility; lines update and remove; members share and unshare |
    | `polycart.types` | `/polycart/types` | `types.index` |

    Widgets and search as in AC 60 and 62. Operator mode (`polycart.atrium.show_all`) is not ported (D-032).
60. **Widgets.** Eleven widgets keep their v1 keys, so v1 placements still resolve. Each is declared without a PHP resolver and sends `data: {}`.

    | Widget | Data from |
    | --- | --- |
    | `impex.run-status` | `impex.stats.show` `runs.by_status` and `active` |
    | `impex.recent-failures` | `runs.recent_failures`, linking to `/impex/runs/:id` |
    | `impex.message-volume` | `messages`; hidden when `messages` is null |
    | `polycart.carts-by-type` | `polycart.stats.show` `by_type` |
    | `polycart.recent-carts` | `recent` |
    | `roster.user-status` | `roster.stats.users` |
    | `roster.organizations` | `roster.stats.organizations` |
    | `showroom.product-status` | `showroom.stats.show` `status` |
    | `showroom.completeness` | `completeness` |
    | `showroom.review-queue` | `review_queue` |
    | `showroom.recent-changes` | `recent_versions` |

    - The widgets of one integration on one dashboard share a single stats request per load. Vitest asserts one `fetch` for three Impex widgets.
    - A widget whose request answers 403 renders the no-access card. Any other failure renders the AC 33 error card.
61. **Settings panels.** The panels `cortex`, `impex` and `showroom` keep their keys and send `data: {}`. Each Vue panel renders its package's `settings-summary` endpoint as the v1 panel rows did. Vitest covers each one.
62. **Search sources.** Six client-side sources keep their v1 keys:

    | Source | Endpoint | Results link to |
    | --- | --- | --- |
    | `cortex` | `cortex.search.index` | `/cortex/virtual-agents/:key` or `/cortex/concrete-agents/:key`, by `type` |
    | `impex` | `impex.search.index` | `/impex/runs/:id` |
    | `polycart` | `polycart.search.index` | `/polycart/carts/:id` |
    | `roster-users` | `roster.search.users` | `/roster/users/:id` |
    | `roster-organizations` | `roster.search.organizations` | `/roster/organizations/:slug` |
    | `showroom` | `showroom.search.index` | the type's detail route |

    Each source caps its results at `atrium.search.results.per_source`, which the shell sends as `search.per_source`. Vitest covers the request and the links of each source.
63. **Impex active-runs badge.** The `impex.active-runs` live resolver sets the runs nav badge to `impex.stats.show` `runs.active`, or to no badge when that is 0 or the request fails. Vitest covers this.
64. **Keen History nav.** The `keen.history` live resolver lists `keen.packages.index` as children linking to `/keen/history/:key`:
    - it leaves out keys in `atrium.integrations.keen.history.nav.exclude`
    - it groups packages under `nav.groups`
    - it sorts by `nav.sort`

    The shell carries those three settings in the nav item's static `live` options. With `nav.enabled` false, the item is not declared. Vitest covers the exclusion and the grouping.

**Cross-package hooks**

65. **Cortex redirect domains.** When both Cortex and Roster are registered, Atrium registers the extensions for each entry of `atrium.integrations.cortex.redirect_domains.screens`:
    - `tab`: the tab `cortex.mcp`
    - a slot name (`aside`): the section `cortex.redirect-domains` in that slot

    Their data is `{owner_type}`, the Roster morph alias of the screen's record. The Vue components list `cortex.redirect-domains.index?owner_type=&owner_id=` (with the record key), add a domain (`store`) and remove one (`destroy`). When either integration is off, nothing is registered.
66. **Impex run link.** When both Impex and Showroom are registered, Atrium registers the section `impex.run-link` in the configured row slot (`row.actions`) of `showroom.transfers`. It renders a link to `/impex/runs/:id` for the row's run id.
67. **Keen history.** When Keen is registered, Atrium registers two kinds of extension:
    - **The section `keen.history`,** in `history.slot`, on every integration screen matched by `history.screens` and not matched by `history.exclude`. Detail screens pass `{source: <package key>, subject_type}`, and the Vue section adds `subject_id` from the record. List screens pass `{source}` only.
    - **The tab `keen.activity`,** for each `history.tabs` entry. With `scope: true` it filters by `scope_type`/`scope_id` (the record), and otherwise by subject.

    Both list `keen.entries.index`. A section whose package is missing from `keen.packages.index`, or that answers 403, renders nothing.
68. **Hook targets and gating.** Each hook target is validated as in v1:
    - Allowed forms are `*`, `{package}.*` or a screen key. A slot name must match `Screen::NAME_PATTERN`.
    - An invalid target throws `InvalidArgumentException` in `local` and `testing`. Elsewhere it is reported and skipped.

    Tests cover:
    - each default
    - a changed config
    - an invalid target in both environments
    - every hook absent when its other integration is not registered
    - the `atrium.screens.show` payload of `roster.organization`, `roster.user` and `showroom.transfers` with every hook on

    Vitest renders each hook component against mocked Cortex, Impex and Keen clients.

**Roster** (14 screens and the public page)

69. **Roster screens:**

    | Screen | Route | Notes |
    | --- | --- | --- |
    | `roster.users` | `/roster/users` | tabs for active and deleted users, status filter |
    | `roster.user-create` | `/roster/users/create` | |
    | `roster.user` | `/roster/users/:user` | profile, status, roles and actions (see below) |
    | `roster.organizations` | `/roster/organizations` | tabs for active and deleted organizations |
    | `roster.organization-create` | `/roster/organizations/create` | |
    | `roster.organization` | `/roster/organizations/:organization` | members, teams, invitations, links, role assignments, and actions (see below) |
    | `roster.team` | `/roster/organizations/:organization/teams/:team` | |
    | `roster.roles` | `/roster/roles` | |
    | `roster.role` | `/roster/roles/:role` | |
    | `roster.permissions` | `/roster/permissions` | |
    | `roster.impersonations` | `/roster/impersonations` | |
    | `roster.transfers` | `/roster/transfers` | |
    | `roster.transfer` | `/roster/transfers/:transfer` | |
    | `roster.invitation` | the public page of AC 70 | |

    - **User actions:** approve, reject, suspend, deactivate, reactivate, delete, restore, purge, impersonate, switch context and domain join. The old status form maps per Roster AC 6.
    - **Organization data:** role assignments come from `roster.organizations.role-assignments.index`.
    - **Organization actions:** update, delete, restore, purge, transfer, link and unlink, add and remove members, invite and revoke.

    Nav: the six v1 items. Widgets and search as in AC 60 and 62. Every action follows AC 54.
70. **Public invitation page.** `/roster/invitations/:token` is a layer page declared public (`definePageMeta({ atrium: { public: true } })`):
    - It does not load the shell, and a 401 on it never calls `onUnauthorized()`.
    - It calls `roster.invitations.lookup` and renders the email, organization name, teams and expiry.
    - It shows one generic "invitation not available" state for any 404, and a "too many attempts" state for 429.
    - Accept and decline call `roster.invitations.accept` and `.decline`. When the visitor is not signed in, they call `onUnauthorized()` first.
    - The token is never written to logs, storage or the title. Vitest covers each state and asserts the token is absent from `document.title` and from `localStorage`/`sessionStorage`.
    - The page works whether or not the Roster integration is active in a signed-in shell, because its active check is the lookup itself.

**Showroom** (27 screen keys; the inventory's "about 25" did not count flags)

71. **Showroom screens.** Each keeps its v1 key, at `/showroom/…`.

    | Area | Screens |
    | --- | --- |
    | Products | `products` (list with status filter), `product-create`, `product` (values, assets, categories, associations, flags, external ids, workflow transitions, versions with revert) |
    | Product models | `product-models`, `product-model` |
    | Families | `families`, `family`, `family-variant` |
    | Attributes | `attributes`, `attribute-create`, `attribute` (with options) |
    | Attribute groups | `attribute-groups`, `attribute-group` |
    | Association types | `association-types` |
    | Categories | `categories` (tree), `category` |
    | Channels | `channels`, `channel` (with locales) |
    | Owners | `owners`, `owner`, `owner-types`, `owner-type` (with rules) |
    | Flags | `flags`, `flag` |
    | Assets | `assets` (grid and list, upload), `asset` (links) |
    | Transfers | `transfers` |

    - `/showroom/transfers` lists transfer runs through Impex, as in Showroom's D-001: it takes the `impex.flows.index` flows whose name starts with `flow_prefix`, calls `impex.runs.index?flow=` for each, merges the results and keeps the 20 newest by `created_at`.
    - The transfers screen starts imports and exports with `showroom.imports.store` and `showroom.exports.store`.
    - Without an active Impex integration, the transfers list shows a "requires Impex" notice, and import and export stay available.

    Nav: the eleven v1 items. Widgets, the `showroom` panel and search are as in AC 60 to 62.

**Atrium's own OpenAPI and client**

72. **Export.**
    - `dedoc/scramble` is in `require-dev` only, configured in the workbench, and nothing in `src/` or `config/` references `Dedoc\`.
    - `composer openapi:export` writes `openapi.json` at the root: OpenAPI 3.1, `info.title` "Atrium API", `info.version` "2.0.0".
    - The document has one operation per route named `atrium.*`, `atrium.plugins.*` excluded, with `operationId` equal to the route name. A test compares the route list to the operations.
73. **Schemas.**
    - Every Atrium resource declares `schema()`. These are `DashboardResource`, `DashboardWidgetResource`, `ShellResource`, `WidgetDefinitionResource`, `ResolvedScreenResource`, `SettingsPanelResource` and `SearchResultResource`.
    - A workbench-only Scramble extension writes each `schema()` as the operation's success response.
    - A test asserts that each operation's 2xx schema has the resource's required properties.
74. **Client and staleness.**
    - `nuxt/layer/app/client/schema.d.ts` is generated from `openapi.json` by `openapi-typescript`, a pinned dev dependency of the layer, through `pnpm -C nuxt generate:client`.
    - Its first line is `// openapi.json sha256: <hex>`.
    - `tests/Feature/OpenApiTest.php` (no Node) fails when a fresh export differs from `openapi.json` (as decoded JSON), or when the header hash differs from the committed file's. Each failure message names `composer openapi:export` and `pnpm -C nuxt generate:client`.
    - `composer test:nuxt` fails when `generate:client` changes the file.
75. **Generated types.**
    - The response types in `nuxt/layer/app/types/atrium.ts` become aliases of `components['schemas']` from the generated client. The public names (`Shell`, `ScreenData` and the `Atrium*` interfaces) are kept.
    - `useAtriumClient()` returns an `openapi-fetch` client for Atrium's API with the same auth adapter.
    - `useAtriumApi()` keeps working unchanged.
    - The D-007 fixtures still type-check with `satisfies` against the aliased types.

**Docs and gate**

76. **Docs.**
    - **README:** a "Suite integrations" section covering:
      - detection and `enabled`
      - the API base and turning on Polycart's and Roster's APIs behind auth
      - Pennant flags, and how to turn an integration off per user
      - the hook keys with their defaults
      - the Nuxt routes
      - vendored clients and `sync:clients`
      - Atrium's `openapi.json` and client
      - the parity departures (D-031, D-032)
    - **CHANGELOG (v2.0.0):**
      - the integrations, `atrium.screens.show`, the shell additions and the old package keys they replace (`{pkg}.ui.*`, `{pkg}.atrium.*`, `{Pkg}SupportFeature`, `pennantplus.atrium.resolve_features`)
      - every old action left out (D-032)
      - the release step of D-020
    - **Elsewhere:** the Boost skill, `CLAUDE.md`, and a new local standard `atrium/integrations` (with `atrium/components` and `atrium/domains` updated).
    - **PR template:** release items for switching the vendored clients to git dependencies and for the Polycart `client/` export-ignore risk (D-020).
    - `DocsTest` and `ChangelogUpgradeTest` assert the README keys and every replaced package key.
77. `composer test` and `composer test:nuxt` pass, with `vendor/bin/pest` included.

### Design notes

**PHP layout (D-024).** The framework lives in `src/Domains/Integrations/`:
- the `Integration` contract and its abstract base
- `IntegrationRegistry` and the `InstalledPackages` seam
- `IntegrationFeatures` for Pennant
- `ScreenDeclaration` data
- the `atrium.screens.show` controller, request and route
- the hook registrars

Each package's definitions live in `src/Integrations/{Pkg}/`: `{Pkg}Integration` and `{Pkg}Feature`. An integration returns data only: nav items, widget definitions, a settings panel, search source descriptors and screen declarations (key, kind, Nuxt path, subject morph alias).

The registry finds integration classes by convention from the config keys, so each package group adds only its own folder. `IntegrationsServiceProvider` joins `DomainServiceProvider::$providers`. Registration runs at boot. Activation runs per request in the shell, widget, settings and screen requests.

**Layer layout (D-022, D-023).** These files are new or changed in the layer:
- `app/composables/useAtriumIntegration.ts` and `useAtriumClient.ts`
- `app/middleware/atrium-integration.global.ts`
- `app/plugins/atrium-integrations.ts`, which registers every `app/integrations/*/index.ts` through `import.meta.glob`
- `app/components/Atrium/IntegrationUnavailable.vue`

Each package has its own folders:
- `app/integrations/{pkg}/`: `index.ts` with its widget, extension, panel, search and live registrations and its `screens` map; `components/`; and the vendored `client/`
- `app/pages/{pkg}/`
- `i18n/locales/integrations/{pkg}.en.json`
- `test/integrations/{pkg}/`

**Shared helpers.** `test/integrations/support.ts` provides `mockPackageApi(pkg, routes)`, which types its routes by the vendored `paths`.

**Data flow.**
- PHP sends `{key, component, data}` with static data only.
- Vue components read route params, call the package through `useAtriumIntegration(pkg).client`, and call `atrium.screens.show` for extensions.
- Integration widgets share one request per integration through a small per-dashboard-load cache, `useIntegrationQuery(pkg, operation)`.

**Departures from standards.**
- `architecture/dependencies` ("no cross-package knowledge"): Atrium names the seven packages, by the user's decision in shape.md. A row goes in `docs/agent/standards-feedback.md`.
- `architecture/domain-modules`: per-package definitions sit in top-level `src/Integrations/`, which needs a second row.

### Out of scope

- Foundry and Guardian integrations.
- Operator modes (`impex.atrium.show_all`, `polycart.atrium.show_all`): no v2 API exists (D-032).
- Permission-filtered navigation (D-031).
- Package API changes: anything missing is the package's spec.
- Publishing clients to a registry, and tagging any release.
- Switching the vendored clients to git dependencies. This is a recorded release step (D-020).
- Locales other than `en`.

### Risks

- **Vendored clients diverge from the package tags.** This is mitigated by the staleness test (AC 50) and the release step. It departs from the user's choice of git dependencies and is pending review (D-020).
- **Git dependencies at release.** npm cannot install a git subfolder, so the switch needs pnpm `#v2.0.0&path:/client`. Polycart export-ignores `/client` (Polycart AC 20). A codeload tarball honors that, so the Polycart client would be missing from a git install. Polycart's `.gitattributes` must change first, and the release step checks it.
- **Weak package schemas.** Scramble may type some package responses loosely, which weakens the Vitest payload typing. Screens type their mocks against whatever the vendored schema says, and gaps go to each package's follow-up.
- **Parity regressions.** Nav items no longer hide by permission, operator modes are gone, and old actions without a v2 route are dropped. All three are listed in the CHANGELOG.
- **Morph aliases** used by the hooks (`subject_type`, `owner_type`) are constants in Atrium. If a package renames its alias, the hook breaks silently. Each package's integration test asserts the constant against the alias its `openapi.json` examples or README name, when present.
- **Packages not yet built.** The integration groups need each package's v2 `openapi.json`. If a sibling checkout lacks one, group 12 stops with a decision rather than inventing schemas (D-039).

## Addendum 2026-11-23: Guardian integration

The user decided (2026-11-23) that Guardian becomes the suite's security package and takes over roles and permissions from Roster. Guardian v2 ships a JSON API and MCP only, with no UI (`Guardian/docs/agent/specs/2026-11-23-1718-guardian-v2-security-platform`), and Roster v2 drops its Role and Permission domains (Roster spec, addendum criteria 28 to 46). Atrium therefore gains an eighth integration, `guardian`, which hosts the role and permission screens that were Roster's, the current user's security settings, the security admin screens, SSO connections and SCIM tokens (ported from Guardian v1's Atrium UI), and the two-factor challenge page that Guardian's `guardian.two-factor` middleware points to. Decisions D-044 to D-061 settle the open questions. D-045 to D-061 are conservative defaults, chosen without the user (D-044). Where they conflict with criteria 38 to 77, these criteria win. In particular:

- AC 38 now lists eight integration keys, and AC 45 forbids `RefactorCircus\Guardian` too.
- AC 50's vendored clients include `guardian`.
- AC 69 and AC 53 lose Roster's roles and permissions (AC 99).
- The suite-integrations "Out of scope: Foundry and Guardian integrations" no longer covers Guardian.

Guardian's `openapi.json` does not exist yet. Every route below is named as Guardian's spec names it (its criteria 17, 25, 27 to 34, 38, 43, 48, 50, 52 and its existing SSO/SCIM routes). Builders check each call against the vendored `openapi.json` once group 29 has synced it, and D-032 applies to anything missing.

"Guardian" below means the `guardian` integration, `{pkg}` = `guardian`, `{Pkg}` = `Guardian`.

### Acceptance criteria

**Clients and order**

78. **Vendored clients.**
    - `nuxt/scripts/sync-clients.mjs` and `VendoredClientsTest` list `guardian` => `Guardian`.
    - `nuxt/layer/app/integrations/guardian/client/` holds Guardian's `openapi.json`, `schema.d.ts` and `openapi.sha256` under AC 50's rules.
    - Roster's vendored client is synced again from Roster's addendum build. `VendoredClientsTest` asserts that Roster's vendored `openapi.json` has no operation named `roster.roles.*`, `roster.permissions.*`, `roster.users.roles.*`, `roster.users.permissions` or `roster.organizations.role-assignments.index`.
    - While either build is missing from `$ATRIUM_SUITE_PATH`, the sync fails as D-039 says, and no group writes a schema by hand (D-045).

**Guardian integration (PHP)**

79. **Config.** `atrium.integrations.guardian` has:
    - `enabled` (`true`), `api_base` (`null`) and `features` (`[GuardianFeature::class]`), as AC 38
    - `scope_types`, default `['organization' => null, 'team' => null]`. A null value resolves to `config('guardian.adopt.scope_types.{key}')`. A value that does not resolve to a non-empty string is dropped (D-048).
    - `screens`, the hook placements of AC 97

    The banner says:
    - Guardian's API ships off (`guardian.routes.enabled`), so the host turns it on behind its auth middleware.
    - Guardian's `guardian.two-factor` and `guardian.session` middleware can go on Atrium's route group and on the packages' API groups. The layer then sends a pending user to the pages of AC 85 and 86.
    - How `scope_types` resolves.

    `IntegrationConfigTest` asserts the default array, now with eight keys, and greps the banner for each point.
80. **Gating.** AC 39 to 41 hold for Guardian:
    - It registers only when `refactor-circus/guardian` is installed and enabled.
    - Its API base is `/guardian` from `guardian.routes.prefix`. It is not registered, and one warning is logged, while `guardian.routes.enabled` is false, which is Guardian's default.
    - Its Pennant flags apply.
    - It registers whether or not Roster is installed. Only its hooks (AC 97) need Roster.

    `RegistrationTest` and a `GuardianIntegrationTest` cover each case.
81. **No package code.** AC 45 also covers `RefactorCircus\Guardian`:
    - ArchTest and the `src/` grep include it.
    - `composer.json` `require` is unchanged.
    - Every Guardian declaration sends static data only.

    Reading `guardian.*` config is allowed, as Atrium already reads `{pkg}.routes.*`.
82. **Declarations.** `GuardianIntegration` declares:
    - **Nav:** nine items in one nav group labelled "Security", in this order:
      - My security: `/guardian/security`
      - Roles: `/guardian/roles`
      - Permissions: `/guardian/permissions`
      - Role assignments: `/guardian/role-assignments`
      - Security events: `/guardian/security-events`
      - Lockouts: `/guardian/lockouts`
      - IP rules: `/guardian/ip-rules`
      - Two-factor policies: `/guardian/two-factor-policies`
      - Password policy: `/guardian/password-policy`

      Each item has an Iconify icon. Every user the `viewAtrium` gate admits sees them (D-031).
    - **No** widgets, settings panel or search sources (D-057).
    - **Screens:**

    | Screen | Kind | Route | Static options |
    | --- | --- | --- | --- |
    | `guardian.security` | detail | `/guardian/security` | `token_abilities` (`guardian.tokens.abilities`, default `['*']`), `token_max_lifetime_days` (`guardian.tokens.max_lifetime_days`, default 365) |
    | `guardian.two-factor-challenge` | detail | `/guardian/two-factor/challenge` | |
    | `guardian.two-factor-setup` | detail | `/guardian/two-factor/setup` | |
    | `guardian.roles` | list | `/guardian/roles` | `scope_types` (the resolved list) |
    | `guardian.role` | detail | `/guardian/roles/:role` | `scope_types` |
    | `guardian.permissions` | list | `/guardian/permissions` | |
    | `guardian.role-assignments` | list | `/guardian/role-assignments` | `scope_types` |
    | `guardian.user` | detail | `/guardian/users/:user` | `scope_types`, `token_abilities` |
    | `guardian.security-events` | list | `/guardian/security-events` | |
    | `guardian.security-event` | detail | `/guardian/security-events/:event` | |
    | `guardian.lockouts` | list | `/guardian/lockouts` | |
    | `guardian.ip-rules` | list | `/guardian/ip-rules` | `mode` (`guardian.ip_rules.mode`, default `denylist`) |
    | `guardian.two-factor-policies` | list | `/guardian/two-factor-policies` | `scope_types` |
    | `guardian.password-policy` | detail | `/guardian/password-policy` | |
    | `guardian.sso-connection` | detail | `/guardian/sso-connections/:connection` | |

    Labels come from `lang/en/integrations/guardian.php`. The test writes `nuxt/layer/test/fixtures/integrations/guardian.json` (AC 49). The layer's `guardian/index.ts` exports a `screens` entry for every fixture key.

**Layer: two-factor responses and the challenge**

83. **Response handlers.**
    - `$atrium` gains `responseHandler(key, (response, request) => void | Promise<void>)`.
    - Every integration client, `useAtriumClient()` and `useAtriumApi()` call each registered handler with each response, in registration order. They do this before the caller sees the result.
    - A handler that throws is logged and skipped.
    - The integrations plugin registers handlers at plugin time, so they run even when the shell request itself fails.

    Vitest covers all three clients, the order and a throwing handler (D-049).
84. **Guardian's handler** (`guardian.two-factor`, registered in `guardian/index.ts` whether or not the shell lists Guardian as active):
    - A 403 whose JSON `code` is `two_factor_challenge_required` navigates to `/guardian/two-factor/challenge?redirect=<current fullPath>`.
    - A 403 whose JSON `code` is `two_factor_enrollment_required` navigates to `/guardian/two-factor/setup?redirect=…`.
    - Concurrent 403s navigate once, and the handler does nothing while one of those two pages is open.
    - A response that carries `Guardian-Two-Factor-Deadline` shows a dismissible app-wide notice with the deadline, linking to `/guardian/security`.
    - Any other response is left alone.

    Vitest covers each case.
85. **Challenge page** `/guardian/two-factor/challenge` (D-050):
    - **Layout.** It is declared `atrium: { public: true }` with the public layout, so it loads no shell.
    - **Client.** It reaches Guardian through a client of its own, whose base comes, in order, from the host override, a loaded shell's Guardian `api_base`, or `/guardian` (as D-038's page does).
    - **Methods.** It reads `GET two-factor` (`guardian.two-factor.show`) and offers each method the user has: TOTP code, email or SMS code with a "send code" button (`POST two-factor/challenge/send`), passkey (`POST two-factor/challenge/passkey-options`, then `navigator.credentials.get()`), and recovery code.
    - **Submit.** It posts `POST two-factor/challenge` with `method` and `code` or `assertion`.
    - **Results.**
      - On 204 it reloads the shell and navigates to `redirect` when that passes the AC 14 link guard, otherwise to `/`.
      - A 422 shows the error.
      - A 429 shows a "too many attempts" state.
      - A 401 calls `onUnauthorized()`.
    - **Secrets.** Codes go in `autocomplete="one-time-code"` inputs. They are never put in the URL, the title, logs or storage.

    Vitest covers each method, each state, the redirect guard and the absence of the code from URL and storage.
86. **Setup page** `/guardian/two-factor/setup` uses the same layout and client rules as AC 85:
    - It shows `allowed_methods` and `enrolment_deadline` from the status.
    - It offers only the allowed methods, through AC 87's components.
    - After the first confirmed method it shows the recovery codes once (AC 87), then continues to the guarded `redirect`.

    Vitest covers enrolment with TOTP and the redirect.

**The current user's security settings**

87. **Two-factor components** (shared by AC 86, 88 and 90):
    - **TOTP.**
      - `POST two-factor/totp` returns an `otpauth_uri`. The page renders it as an inline SVG QR code in the browser, with the pinned `uqr`, and shows the `secret` for manual entry (D-051).
      - It confirms with `POST two-factor/totp/confirm`.
      - The URI and the secret are never sent anywhere else, stored, logged or kept after the component unmounts.
    - **Recovery codes.**
      - Codes returned on the first confirmation, or by `POST two-factor/recovery-codes` (regenerate, after a confirmation), show once, with copy and an in-browser `.txt` download.
      - The status shows only `recovery_codes_remaining`.
    - **Passkeys.**
      - The page registers a passkey with `POST two-factor/passkeys/options`, then `navigator.credentials.create()`, then `POST two-factor/passkeys` (with a label). A layer helper converts the JSON to and from base64url, with no new library (D-052).
      - It lists passkeys and removes one.
      - The passkey controls are hidden with a note when `passkeys_available` is false, when a passkey endpoint answers 501, or when `window.PublicKeyCredential` is missing.
    - **Email and SMS.**
      - `POST two-factor/one-time-codes` takes `{type, destination}`, then `.../confirm`.
      - A 422 `method_unavailable` shows "not available on this site" and hides that type (D-053).
      - A 429 on resend shows the wait.
    - **Removal.**
      - `DELETE two-factor/methods/{method}` and passkey removal ask for a code from another confirmed factor, or a recovery code.
      - A 422 `two_factor_required` shows why removal is refused.
    - **Policy.** When `required` is true, only `allowed_methods` are offered.

    Vitest covers each request's method, path and body, the QR rendered without any `fetch`, and each error state.
88. **`/guardian/security`** (`guardian.security`) has five sections. Each one handles its own 403 without failing the others.
    - **Two-factor:** the status of `GET two-factor` and AC 87's components.
    - **Sessions:**
      - `guardian.sessions.index`, with the current session flagged
      - revoke one (`guardian.sessions.destroy`)
      - "Sign out everywhere else" (`guardian.sessions.others.destroy`), with an "also revoke my API tokens" option that sends `tokens: true`
      - each revocation asks for confirmation
    - **Devices:** `guardian.devices.index`, and forgetting a device (`guardian.devices.destroy`) with a confirmation.
    - **API tokens:**
      - lists `guardian.tokens.index`
      - issues a token through `guardian.tokens.store`, with `name`, `abilities` chosen from the `token_abilities` option and an optional `expires_at` no later than `token_max_lifetime_days`; the plain token shows once, with copy, and is never stored
      - revokes one through `guardian.tokens.destroy`, with a confirmation
      - when the index answers 501, the section shows "API tokens are not enabled" and no form (D-054)
    - **Recent activity:** `guardian.me.security-events.index`, cursor-paged.

    Vitest covers each request and state.

**Roles, permissions and assignments (moved from Roster)**

89. **Access screens** call Guardian routes only. Their roles and permissions behavior follows Roster's group 21 screens.
    - **`guardian.roles`:**
      - lists `guardian.roles.index`
      - creates a role with `guardian.roles.store`, sending name, slug, scope, description and permissions; scope is chosen from `global`, `any` and the `scope_types` option
    - **`guardian.role`:**
      - shows the role with `guardian.roles.show`
      - updates it with `guardian.roles.update`, including its permissions through a picker over `guardian.permissions.index`
      - deletes it with `guardian.roles.destroy`, after a confirmation
    - **`guardian.permissions`:**
      - lists, creates, updates and deletes permissions
      - rows with `system: true` have rename and delete disabled
    - **`guardian.role-assignments`:**
      - lists `guardian.role-assignments.index`, filtered by `user`, `role`, `scope_type` and `scope_id`, paged as the endpoint pages
      - assigns with `guardian.role-assignments.store` (user, role, scope type from the option, scope id)
      - revokes with `guardian.role-assignments.destroy`, after a confirmation
    - **Errors:** a 422 from the escalation guard (Guardian AC 15) shows the permissions it names.

    AC 54's contract applies throughout.
90. **`guardian.user`** (`/guardian/users/:user`) is the admin view of one user. Each block handles its own 403.
    - **Role assignments:** `guardian.role-assignments.index?user=`, with assign and revoke as in AC 89.
    - **Abilities:** `guardian.users.abilities.index`, with optional `scope_type` and `scope_id`.
    - **Sessions:** `guardian.users.sessions.index`, and "revoke all" through `guardian.users.sessions.destroy`.
    - **API tokens:** `guardian.users.tokens.index`, and "revoke all" through `guardian.users.tokens.destroy`. The block is hidden on 501.
    - **Recent events:** `guardian.security-events.index?user=`.
    - **Reset two-factor:** `DELETE users/{user}/two-factor`, after a confirmation that names the user.

    Guardian has no route for another user's two-factor status, so none is shown (D-055). The components are the ones AC 98 reuses. Links to a user from AC 89 and 91 go to this page.

**Security administration**

91. **Security events.**
    - `guardian.security-events` lists `guardian.security-events.index`, cursor-paged, with these filters:
      - `type`, a select of Guardian's `SecurityEventType` values, taken from the vendored schema's enum when it has one and otherwise from a layer constant matching Guardian AC 23
      - `user`
      - `from` and `to`
    - `guardian.security-event` shows `guardian.security-events.show`, with its context as key-value rows.
92. **Lockouts.** `guardian.lockouts` has:
    - a form that clears an identifier's lockout (`DELETE lockouts`, `guardian.lockouts.destroy`, `{identifier}`), after a confirmation, showing a 422
    - below it, recent `login.locked_out` events (`guardian.security-events.index?type=login.locked_out`)

    Guardian has no route that lists lockouts (D-056).
93. **IP rules.** `guardian.ip-rules`:
    - lists `guardian.ip-rules.index`
    - creates a rule with `cidr`, `action` (`allow` or `deny`), `description` and an optional `expires_at`; an invalid CIDR shows its 422
    - deletes a rule, after a confirmation
    - shows the `mode` option. In `allowlist` mode it shows a warning that a request matching no allow rule is refused, and deleting an allow rule asks for confirmation naming that risk.
94. **Password policy.** `guardian.password-policy` renders `guardian.password-policy.show` read-only: length bounds, composition rules, breach check, history and maximum age.
95. **Two-factor policies.** `guardian.two-factor-policies` lists, creates, updates and deletes policies through Guardian's `two-factor-policies` routes. The fields are:
    - `scope_type`, from the `scope_types` option or none
    - `scope_id`
    - `role`
    - `required`
    - `methods`, any of `totp`, `email`, `sms` and `passkey`, or none
    - `grace_days`

**SSO and SCIM (ported from Guardian v1's Atrium UI)**

96. **SSO and SCIM components**, ported from Guardian's `src/Atrium` and `resources/views/atrium`. The v1 Blade forms posted to Atrium-side controllers. These components call Guardian's API.
    - **The `guardian.sso` tab:**
      - lists `guardian.organizations.sso-connections.index` for the record
      - creates a connection (`.store`, with `name` and `protocol`)
      - links each connection to `/guardian/sso-connections/:connection`
    - **The `guardian.sso-connection` page:**
      - shows `guardian.sso-connections.show`
      - updates it through `.update`, with `name`, `enabled`, `enforced`, `jit` and the protocol fields the vendored schema accepts
      - deletes it through `.destroy`, after a confirmation
      - links back to `/roster/organizations/:organization?tab=guardian.sso` when the Roster integration is active and the connection names its organization
    - **The `guardian.scim` tab:**
      - lists `guardian.organizations.scim-tokens.index`
      - issues a token (`.store`, with `name`, `expires_in_days` and an optional `sso_connection`), showing the plain token once
      - revokes one (`guardian.scim-tokens.destroy`), after a confirmation
      - shows the SCIM base URL: the origin of Guardian's API base, then the tab's `scim_path`, then `/`, then the organization record (D-058)
    - **The `guardian.sso-identities` section:**
      - lists `guardian.users.sso-identities.index` for the record, and renders nothing when the list is empty
      - unlinks an identity (`guardian.sso-identities.destroy`), after a confirmation

**Cross-package hooks**

97. **Guardian on Roster's screens.**
    - **Config.** `atrium.integrations.guardian.screens` defaults to `['roster.organization' => ['guardian.access', 'guardian.sso', 'guardian.scim'], 'roster.user' => ['guardian.access', 'guardian.user-security', 'aside' => 'guardian.sso-identities']]`. As in Guardian v1's `guardian.atrium.screens`, a plain value is a tab and a `slot => key` entry is a section (D-047).
    - **Registration.** A `GuardianScreens` hook registers each entry while Guardian and the target screen's integration are both registered. It registers only on detail screens that declare a subject type.
    - **Validation.** Targets and slots are validated as in AC 68. An unknown extension key is invalid too.
    - **Data:**
      - `guardian.access` on `roster.organization`: `{scope_type}`, from the resolved `scope_types.organization`. While that does not resolve, the tab is skipped and one warning per process names `atrium.integrations.guardian.scope_types` (D-048).
      - `guardian.access` on `roster.user`: `{scope_type: null}`.
      - `guardian.user-security` and `guardian.sso-identities`: `{}`.
      - `guardian.sso` and `guardian.scim`: `{scim_path}`, which is `'/'.trim(config('guardian.scim.prefix', 'scim/v2'), '/')`.

    `HooksTest` covers:
    - the defaults and a changed config
    - invalid entries, in both environments
    - every Guardian hook absent without Roster
    - the unresolved scope type
    - the `atrium.screens.show` payloads of `roster.organization` and `roster.user` with every hook on (Cortex, Keen and Guardian)
98. **Hook components.**
    - **`guardian.access` on an organization** lists `guardian.role-assignments.index?scope_type=&scope_id=<record>`, assigns a role (user and role) in that scope, revokes, and links each role to `/guardian/roles/:role`.
    - **`guardian.access` on a user** lists `?user=<record>` and assigns a role globally or in a chosen scope, as AC 90's block does.
    - **`guardian.user-security`** renders AC 90's sessions, tokens, events and two-factor reset blocks for the record.
    - **SSO and SCIM** tabs and sections are AC 96's components.

    Each renders the no-access state on 403. Vitest covers each one against a mocked Guardian client.

**Roster integration**

99. **Roles and permissions leave Roster.**
    - **Declarations.** `RosterIntegration` no longer declares the Roles and Permissions nav items (four items remain: users, organizations, impersonations and transfers). It no longer declares the `roster.roles`, `roster.role` or `roster.permissions` screens (11 screen keys remain).
    - **Deleted files:**
      - `pages/roster/roles/**` and `pages/roster/permissions/**`
      - `RolePermissions.vue`, `RosterUserRoles.vue` and `OrganizationRoles.vue`
      - the role and permission helpers in `access.ts`, `users.ts` and `organizations.ts`
      - their Vitest files and test-support entries
      - their locale and `lang` keys
    - **Fixtures.** `roster.json` is regenerated.
    - **Screens.** `roster.user` no longer shows roles or calls `roster.users.roles.*`. `roster.organization` no longer calls `roster.organizations.role-assignments.index`. Guardian's hooks (AC 97) take their place.
    - **D-032 comment.** The `// Not ported (D-032)` comment moves to the top of `pages/roster/transfers/index.vue`, without its role and permission items.
    - **Tests.**
      - A Vitest grep asserts that nothing under `app/` or `test/` calls a removed Roster operation or links to `/roster/roles` or `/roster/permissions`.
      - `RosterIntegrationTest` asserts the reduced nav and screens.
    - **No aliases.** The old screen keys get no alias or redirect (D-046).

**Docs and gate**

100. **Docs.**
     - **README, "Suite integrations":** a Guardian part covering:
       - turning on `guardian.routes.enabled` behind auth
       - `scope_types`
       - putting `guardian.two-factor` and `guardian.session` on Atrium's and the packages' route groups, and the challenge and setup pages
       - exposing `Guardian-Two-Factor-Deadline` through CORS on split hosts
       - token drivers, and the 501 state when none is set
       - passkeys, which need `web-auth/webauthn-lib`, HTTPS and a `guardian.two_factor.passkeys.rp_id` that matches the SPA's host
       - the hook keys with their defaults
       - `$atrium.responseHandler()`
     - **CHANGELOG (v2.0.0):**
       - the Guardian integration
       - the removed Roster screens and nav items, with their Guardian replacements (`roster.roles` to `guardian.roles`, `roster.role` to `guardian.role`, `roster.permissions` to `guardian.permissions`, and role assignments to `guardian.access`)
       - `responseHandler()`
       - the `uqr` dependency
       - Guardian's `// Not ported (D-032)` items
     - **Elsewhere:**
       - the Boost skill and `CLAUDE.md`
       - the local standard `atrium/integrations`: response handlers, shell-less pages, and roles living in Guardian
       - the PR template: Guardian joins the D-020 release step for git dependencies
     - **Tests.** `DocsTest` and `ChangelogUpgradeTest` assert the new keys.
101. `composer test` and `composer test:nuxt` pass, with `vendor/bin/pest` included.

### Design notes

- **PHP:**
  - `src/Integrations/Guardian/` holds `GuardianIntegration`, `GuardianFeature` and `GuardianScopeTypes`. `GuardianScopeTypes` resolves `scope_types` once per process and is shared by the screen options and the hook.
  - `src/Integrations/Hooks/GuardianScreens.php` is added to `Hooks::HOOKS`.
  - The registry already finds `GuardianIntegration` from the config key.
- **Layer:**
  - `app/integrations/guardian/` holds `index.ts` (the `screens` map and the response handler), the vendored `client/` and these `components/` folders:
    - `two-factor/`, with the shared AC 87 components, the WebAuthn helper and the QR component
    - `security/`
    - `access/`
    - `users/`
    - `admin/`
    - `sso/`
  - The pages live in `app/pages/guardian/`.
  - The locale files are `guardian`, `guardian-two-factor`, `guardian-security`, `guardian-access`, `guardian-admin` and `guardian-sso`, and the hook strings go in `hooks.en.json`.
  - The hook components in `app/integrations/hooks/components/` wrap Guardian's own components.
- **Shell-less pages.** The challenge and setup pages follow D-038: public page meta, a client of their own, and no `atrium.screens.show` call. AC 49's "every page calls `atrium.screens.show`" check exempts public pages, as it does for `roster.invitation`.
- **Departures.** The `architecture/dependencies` row in `standards-feedback.md` gains Guardian. There is no new departure.

### Out of scope

- Rotating expired passwords (`guardian.password-fresh` answers `password_expired`). Password change is the host's flow, so the layer shows a no-access state (D-060).
- Role assignments on `roster.team`, and a per-user two-factor status for admins (Guardian has no route for it).
- Aliases or redirects for the removed `roster.roles`, `roster.role` and `roster.permissions` keys.
- Lockout listing, Guardian widgets and settings panels, and Guardian search sources.
- Any change to Guardian or Roster. Anything missing from their APIs belongs to their own specs.

### Risks

- **Order.** This build needs both Guardian's build and Roster's addendum build in `$ATRIUM_SUITE_PATH`. Until then, group 29 stops as D-039 says.
- **Scope types.** If a host gives Roster's models a morph map but leaves `guardian.adopt.scope_types` unset, the organization access tab is skipped with a warning. Guardian's own README carries the same requirement.
- **Passkeys on split hosts.** WebAuthn binds to `rp_id`. A SPA whose host does not match Guardian's `rp_id` cannot register passkeys, and the README says so.
- **The response handler navigates on every matching 403.** A host whose own API answers `two_factor_challenge_required` for another reason would be redirected too. The codes are Guardian's own.
- **Breaking for hosts** that extended `roster.roles`, `roster.role` or `roster.permissions`. These are listed in the CHANGELOG.
