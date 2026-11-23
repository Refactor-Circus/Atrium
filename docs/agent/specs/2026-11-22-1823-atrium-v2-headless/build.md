# Build log: Atrium v2 headless

## Group 1

Support primitives and config. Criteria 13, 14, 18, 29, 33, 37.

### Files

- `src/Support/JsonData.php`: ported from the spike. `check(array $data, string $owner)` now serializes as it walks (Arrayable through `toArray()`, so a model's `$hidden` applies; JsonSerializable through `jsonSerialize()`) and checks the result, with a cycle guard (object ids on the current path) and `MAX_DEPTH = 64`. New `resolve(string $owner, callable $resolver)`: returns `['data' => ...]`; outside `local`/`testing` a failure is reported and becomes `['data' => null, 'error' => ['message' => '{Kind} failed to load']]`, where `{Kind}` is the owner before ` [` (`Widget [orders]` gives `Widget failed to load`), so the client never sees the key.
- `src/Support/ClientPath.php`: rewritten. The instance (`new ClientPath($appHost, $clientPath)->link($url)`) holds the logic, so it is unit-tested without the framework; `ClientPath::for($url)` builds it from `app.url`'s host and `atrium.client_path` (default `/`). Accepts lower-case `http(s)://` URLs with a host and no userinfo, and root-relative paths. Returns null for everything else: other or mixed-case schemes, `//host`, backslashes, control characters, leading or trailing whitespace, `http:host`, userinfo, bare relative paths, bare `#`/`?`, and any result that would start with `//` once `client_path` is removed. A same-host URL or a path outside `client_path` is returned as given with `external: true`.
- `src/Support/Iconify.php`: `Iconify::PATTERN` (`^i-[a-z0-9]+(-[a-z0-9]+)+$` with the `D` modifier, so a trailing newline fails) and `Iconify::assert($name): string`, which throws `InvalidArgumentException` and truncates a long value (inline SVG) in the message.
- `src/Exceptions/UnserializableDataException.php`: `final`, extends `AtriumException`, status 500, private constructor with readonly `owner` and `path`. `forValue()` gives `Widget [orders] returned unserializable data at [rows.0.cell]: Closure`; `forCycle()` and `forDepth()` name the cycle and the depth limit.
- `config/atrium.php`: new `API Routes` section (`routes.enabled`, `routes.prefix` `atrium/api`, `routes.middleware` `['api', Authorize::class]`, top-level `client_path` `/`), with a banner covering everything AC 18 lists. Removed `path`, `domain`, `middleware`, `alpine` and `logout_route`. `theme` stays. The gate banner now describes the `local` behaviour for authenticated users.
- `src/Atrium.php`: `public const string API_VERSION = '2.0'`.
- `src/AtriumServiceProvider.php`: `boot()` first logs one `warning` per process (a private static flag) naming the removed keys present in `config('atrium')`, in a fixed order, and pointing to `atrium.routes.middleware`.

### Tests

- `tests/Unit/Support/JsonDataTest.php`: every accepted type (scalars, null, arrays, Carbon, CarbonImmutable, DateTimeImmutable, a backed enum, JsonSerializable, Arrayable, Collection, a model with `$hidden`) and rejected type (closure, Htmlable, Htmlable that is also Arrayable, stdClass, a pure enum), the exact message, a bad value inside a collection, final/AtriumException/500, the depth limit at and beyond `MAX_DEPTH`, a by-reference array cycle, a self-containing JsonSerializable, and a shared non-cyclic object.
- `tests/Unit/Support/ClientPathTest.php`: tables for a root and a `/admin` client path, `client_path` normalisation, no app host, 28 rejected forms (every AC 14 bypass), and the `//` left behind after stripping `client_path`.
- `tests/Unit/Support/IconifyTest.php`: valid names, `lucide:home`, inline SVG, `i-home` and other bad forms, and the message.
- `tests/Feature/ConfigTest.php`: the `routes` defaults and `client_path`, the banner grep (prefix, middleware, no-auth note with guard examples, `Authorize` last, `client_path`, CORS/CSRF/`Authorization`, the `local` gate warning), removed keys absent and `theme` kept, `ClientPath::for()` reading `app.url` and `atrium.client_path`, and `Atrium::API_VERSION`.
- `tests/Feature/RemovedConfigKeysTest.php`: `Log::spy()`; one warning naming exactly the present keys after three boots (two of the registered provider, one of a new instance); a key present with a null value counts; no warning without removed keys. The static flag is reset by reflection before and after each test.
- `tests/Feature/JsonDataResolveTest.php` (not in the group's file list): `resolve()` needs the app environment and `report()`, so its AC 33 tests are a feature test: success, a throwing resolver and a failing check isolated and reported in `production`, the kind-only message for `Settings panel [shop]`, and a rethrow with nothing reported in `local` and `testing`.

Pint and PHPStan pass on the changed files. The test suite was not run here, as instructed; the gate runs it.

### Deviations and notes

- Touched `src/Support/ServiceProvider.php` (owned by group 5): with `atrium.middleware` gone from the config, the Blade route group's fallback was `['web']`, which would have dropped `Authorize` from every v1 route until group 5 lands. The fallback is now `['web', Authorize::class]`, so those routes stay fail-closed and the v1 route tests keep passing. Group 5 replaces this method.
- `Iconify::assert()` throws a bare `InvalidArgumentException`, as AC 15 requires, rather than an `AtriumException` subclass (`errors/exceptions`). It is a definition-time programmer error, like the existing `Screen` and `Theme` checks.
- `UnserializableDataException` has `forCycle()` and `forDepth()` beside `forValue()`, since a cycle or a depth overflow has no single bad value to name.
- `UnserializableDataException` renders its message with status 500 (Keystone's `PackageException::render()`), so a lazy widget's failure shows the owner, path and PHP type to the client. That follows the spec; isolation (AC 33) keeps it out of eager payloads in production.

### Retry

- `src/Support/ClientPath.php`: a same-host URL whose path starts with `//` (`https://app.test//evil.test`) now returns null whatever `client_path` is. Before, with a non-root `client_path` it fell outside the client path and came back as an external link, so `ClientPathTest`'s rejected-forms case failed for `/admin`. The root case already returned null.
- The group's test files (`tests/Unit/Support/*`, `ConfigTest`, `RemovedConfigKeysTest`, `JsonDataResolveTest`) pass: 108 tests. Pint and PHPStan pass on the changed file. The full suite was not run here; the gate runs it.

## Group 2

Extension contract and icons on definitions. Criteria 11, 15.

### Files

- `src/Domains/Widgets/Data/WidgetDefinition.php`, `src/Domains/Settings/Data/SettingsPanel.php`, `src/Domains/Screens/Concerns/DefinesExtension.php` (so `TabDefinition` and `SectionDefinition`): `view` (property and setter) removed. `component` is `public private(set) string`, set to the key in the constructor, with a fluent `component(string)` setter that no longer clears anything. Docblocks describe the client component key instead of Blade.
- `src/Domains/Navigation/Data/NavItem.php`, `NavGroup.php`, `WidgetDefinition`, `SettingsPanel`, `src/Domains/Screens/Data/TabDefinition.php`, `src/Domains/Search/Data/SearchResult.php`: `icon()` stores `Iconify::assert($icon)`, so a non-Iconify value (inline SVG included) throws `InvalidArgumentException` at definition time.
- `TabDefinition::DEFAULT_ICON` is now `i-lucide-layout-grid` (lucide's counterpart of `squares-2x2`).
- `src/Domains/Themes/Data/Theme.php`: new `public private(set) ?string $icon` with a validated `icon()` setter, the icon shown with the swatch in the switcher. Theme had no icon before; AC 15 lists theme swatches among the `icon()` setters, so this adds it. `swatch` stays a colour.
- `src/Domains/Screens/Data/SectionDefinition.php`: no change needed; it gets everything through `DefinesExtension`.

### Tests

- `tests/Unit/ExtensionContractTest.php` (63 tests): `component` defaults to the key and is overridden fluently on widgets, panels, tabs and sections; it is public with a private setter, typed `string`, and refuses outside writes; reflection finds no `view` method or property on the four definitions or `DefinesExtension`; every `icon()` setter (nav item, nav group, widget, tab, settings panel, search result, theme swatch) accepts `i-lucide-home` and rejects `lucide:home`, inline SVG, `i-home` and the v1 name `squares-2x2`; the tab's default icon is an Iconify name; the other icons start unset.
- `tests/Unit` passes in the worktree (260 tests). Pint and PHPStan pass on the changed files. The full suite was not run here, as instructed.

### Deviations and notes

- Touched outside the group's file list:
  - `src/Domains/Screens/Services/ScreenExtensions.php` (group 4): removed `assertRenders()`, which read the removed `view` property and is moot now that `component` always has a value.
  - `tests/Unit/Screens/TabDefinitionTest.php`, `SectionDefinitionTest.php`, `ScreenExtensionsTest.php`, `ScreenTest.php` (no group owns them): they pinned `view()`, a nullable `component`, the "needs a view() or a component()" error and v1 icon names. They now pin the new contract.
- The full suite is expected to fail after this group, and 2.3 is left unticked. The Blade UI and the Blade-era tests that groups 3, 4, 5 and 6 rewrite or delete still call `->view()` (about 25 test files and the fixture plugins in `tests/Fixtures`), pass v1 icon names or SVG (`NavigationSectionsTest`, `SearchTest`, `ScreenTabsComponentTest`, the workbench's `Icons::svg()`), and render `$definition->component` as a Blade component (`dashboard/widget-body`, `settings/show`, `components/screen-tab-panel`, `components/screen-sections`), which is now always the definition key. Keeping them green would mean doing group 6's Blade removal now. Returned as a decision.

## Group 4

Shell, navigation, search, settings and screens API. Criteria 4, 11, 14, 33, 36. Built on branch `ring-master/2026-11-22-1823-atrium-v2-headless--g4`, continuing the WIP commit `a2fca62`.

### Files

- `src/Domains/Navigation/routes.php` (new): `GET shell`, named `shell`. `NavigationServiceProvider::boot()` loads it with `loadApiRoutesFrom()`.
- `src/Domains/Navigation/Http/Controllers/ShellController.php`, `Http/Requests/ShowShellRequest.php`, `Http/Resources/ShellResource.php`: `ShellResource` (`final`) sends `app.name`, `user` (`name`, `email`), `locale` (`app()->getLocale()`), `api_version` (`Atrium::API_VERSION`), `navigation` (sections with `key`, `label`, `icon`, `grouped`, `link`, and items with `label`, `icon`, `link`, `badge`, `children`), `themes` (`default`, `switchable`, `all` with `key`, `label`, `layout`, `swatch`, `icon`, `properties` as CSS custom properties, so `atrium.theme` appears as the built-in theme's properties), `settings` (panel summaries through `SettingsPanelResource`) and `search.min_length`. Every link is `ClientPath::for()`, null on rejection.
- `src/Domains/Search/Http/Controllers/SearchController.php` (one-line `index`), `Http/Requests/IndexSearchResultRequest.php` (`q` is `required|string|min:{min_length}`, so a short query is 422 before any source runs; `minLength()` moved here from the old controller), `Http/Resources/SearchResultResource.php` (`title`, `subtitle`, `icon`, `group`, `link`). `SearchServiceProvider` uses `loadApiRoutesFrom()`.
- `src/Domains/Settings/Http/Controllers/SettingsController.php` (one-line `index` and `show`), `Http/Requests/IndexSettingsPanelRequest.php`, `ShowSettingsPanelRequest.php`, `Http/Requests/Concerns/ResolvesSettingsScreen.php`, `Http/Resources/SettingsPanelResource.php`: the list sends summaries (`key`, `label`, `icon`, `component`) plus the `atrium.settings` screen under `screen`, with each panel as a row; `show` sends `{key, label, description, icon, component, data}` (data through `JsonData::resolve()`) plus the `atrium.settings-panel` screen, and 404 for an unknown or hidden panel. `SettingsPanelResource::toResponse()` always wraps under `data`, because Laravel leaves a payload with its own `data` key unwrapped. The route `settings` is renamed `settings.index`. `SettingsServiceProvider` uses `loadApiRoutesFrom()`.
- `src/Domains/Screens/Http/Resources/ResolvedScreenResource.php`: `key`, `kind`, `open_tab`, `tabs` (`key`, `label`, `icon`, `built_in`, `component`, plus `data` for the open registered tab only), `sections` per declared slot (only `header.actions` while a registered tab is open) and `rows` (row-slot sections per row key, set with `withRows()`). Every extension's data goes through `JsonData::resolve()`.
- Deleted: the Blade settings and search controller bodies, and `src/Http/Controllers/Concerns/AuthorizesScreens.php` (nothing used it once the Blade controllers were gone). `Support/ScreenAccess` stays: it is public API with its own test.

### Tests

- `tests/Feature/Api/ShellApiTest.php`: the exact shell JSON (`assertExactJson`), every theme field, panel summary fields only, `locale`, `atrium.theme` reflected in the built-in `atrium` theme's properties, an empty `properties` object, the switcher feature, nav links through `ClientPath` with a non-root `client_path`, `link: null` for `javascript:`, `data:`, `//host`, userinfo and an unregistered route, hidden nav and panels left out, one badge call per request.
- `tests/Feature/Api/SearchApiTest.php`: the exact result structure, `ClientPath` links (inside and outside `client_path`, another host, fragment), `link: null` for rejected forms, 422 for a short, padded, blank or missing `q` with no source run, characters not bytes.
- `tests/Feature/Api/SettingsApiTest.php`: the exact list and show payloads with their screens, an empty data object, 404s, `?tab=` on the panel screen, row sections per panel, and a failing panel resolver (throwing and unserializable) isolated in `production` (data null, error, reported, 200) vs 500 in `testing` and `local`.
- `tests/Feature/Api/ScreenApiTest.php`: on the built-in tab every slot resolves and no tab data does; with `?tab=` only the open tab's resolver and `header.actions` run (counters); an unknown or array `?tab=` falls back to the default tab; 403 for a hidden tab; Gate `permission()`s; failing sections and tabs isolated in `production` vs 500 in `testing` and `local`.
- Rewritten for JSON: `ShellTest`, `NavigationTest`, `NavigationSectionsTest`, `NavigationAccessTest`, `SearchTest`, `SettingsTest`, `ThemesTest`, `ScreenAccessTest`, and `tests/Feature/Screens/*` (now served by the `JsonScreenHost` test fixture). Deleted: `Screens/ScreenSectionsComponentTest`, `ScreenStylesTest`, `ScreenTabsComponentTest` (Blade components only).
- This group's test files pass: 258 tests. PHPStan and Pint pass. `tests/ArchTest.php`, `RequestPersistTest` and `DomainLayoutTest` also pass. The full suite was not run here (D-014).

### Deviations and notes

- Touched outside the group's file list:
  - `tests/Fixtures/Billing/RefundController.php` (group 5's `tests/Fixtures/**`): deleted, since it only exercised the deleted `AuthorizesScreens`.
  - `phpstan.neon.dist`: dropped the `tests/Fixtures/Billing` path, which no longer exists and stopped PHPStan from running.
- `SearchTest`'s malformed-child-rows case used the v1 icon `star`; it now uses `i-lucide-star`, since group 2 made `SearchResult::icon()` validate Iconify names.
- Settings responses carry the resolved screen beside `data` under `screen` (as the spike did), so the layer gets the panel and its tabs and sections in one request.

## Group 3

Dashboard and widget API. Criteria 6, 7, 8, 9, 10, 30, 32, 33. Built on branch `ring-master/2026-11-22-1823-atrium-v2-headless--g3`, continuing the WIP commit `6d1e713`.

### Files

- `database/migrations/2026_11_22_000000_add_uuid_and_version_to_atrium_dashboards.php` (new): adds a nullable `uuid` to `Tables::name('dashboard_widgets')` and `version` (unsigned int, default 1) to `Tables::name('dashboards')`, backfills `Str::uuid7()` with `chunkById(CHUNK = 500)`, then makes `uuid` not null and unique. `down()` drops the index and both columns.
- `src/Domains/Dashboard/Models/DashboardWidgetModel.php`: `HasUuids` with `uniqueIds(): ['uuid']`, so the integer `id` stays the key. `DashboardModel`: `version` attribute default and integer cast.
- `src/Domains/Dashboard/Resources/DashboardResource.php` and `DashboardWidgetResource.php` (`final`, `@mixin`, Keystone `JsonResource`): `slug`, `name`, `is_default`, `version`, `widgets` (when loaded; the index leaves them out). Each placement sends `uuid`, `key`, `component`, `title`, `icon`, `lazy`, `grid`, `settings`, plus `data` (and `error` when isolated) only when its data was resolved, so a lazy placement has no `data` key. An orphan has `component`/`title`/`icon` null and is never lazy. Resolved data is handed in by uuid with `placementData()` / `data()`, so neither resource runs a resolver or reads the request. `DashboardWidgetResource::$forceWrapping = true`, because a placement has its own `data` key and Laravel would otherwise leave it unwrapped.
- `src/Domains/Dashboard/Services/PlacementResolver.php` (new): eager data through `JsonData::resolve("Widget [key]", ...)` (isolated outside `local`/`testing`), null for orphans and unauthorized widgets, lazy placements skipped; `one()` for `widgets.show`, through `JsonData::check()`.
- `src/Domains/Dashboard/Services/DashboardManager.php`: `findVisible($request, $slug)` (own before shared), `current()` (default, else first, else null, never creates), `resource()` (loads placements, adds `meta.abilities` `{update, delete}` from the dashboard policy through Keystone's `Authorizer`), `abilities()`, `owner()`. Removed `isVisible()`, `pick()`, `canModify()`.
- `src/Domains/Dashboard/Actions/SaveDashboardLayoutAction.php`: full-layout semantics in one `DB::transaction()`: claim the version, delete placements left out (except orphans), update those named by uuid in place (keeping their widget), create the rest; sort is payload order. `UpdateDashboardAction`: claims the version, never writes it as a field. `Actions/Concerns/ClaimsDashboardVersion.php` (new): one conditional `increment('version')`; zero rows means a 409 `ValidationException` keyed `version`. Without a version (code that vouches for its state) the increment is unconditional.
- `src/Domains/Dashboard/Data/*`: `SaveDashboardLayoutData` gains `version` (required in `rules()`), `widgets` becomes `present|array`, `widgets.*.uuid` gets `distinct`. `WidgetPlacementData` gains `uuid` (`uuid`, and with the dashboard `Rule::exists(Tables::qualified('dashboard_widgets'), 'uuid')->where('dashboard_id', ...)`). `UpdateDashboardData` gains a required `version`.
- `src/Domains/Dashboard/Http/**`: one-line `DashboardController` (`default`, `index`, `show`, `store`, `update`, `destroy`), `DashboardLayoutController::update`, `DashboardWidgetController::show`; `final` requests `ShowDefaultDashboardRequest` (`{"data": null}` without meta when there is none), `IndexDashboardRequest`, `ShowDashboardRequest`, `StoreDashboardRequest` (201), `UpdateDashboardRequest`, `DeleteDashboardRequest` (204), `SaveDashboardLayoutRequest` (drops widgets the user may not place), `ShowDashboardWidgetRequest` (404 for an orphan or a widget the user may not see), and `Concerns/ResolvesRouteDashboard`. Deleted `DashboardCrudController` and the Blade bodies.
- `src/Domains/Dashboard/routes.php` and `DashboardServiceProvider`: the eight dashboard routes with `{dashboard:slug}` and `{widget:uuid}` (`scopeBindings()`), loaded with Keystone's `loadApiRoutesFrom()`. The provider binds `dashboard` among the dashboards the user may view (slugs are unique per owner, not globally, so a plain implicit slug binding could pick another user's dashboard) and `widget` through `resolveChildRouteBinding()` on that dashboard. Both binders only act on `atrium.*` routes and hand anything else back unchanged, so a host's own `{dashboard}` parameter still binds implicitly.
- `src/Domains/Widgets/routes.php` (new), `WidgetsServiceProvider` (`loadApiRoutesFrom()`), `Http/Controllers/WidgetController.php`, `Http/Requests/IndexWidgetRequest.php`, `Http/Resources/WidgetDefinitionResource.php`: the catalogue (`key`, `label`, `description`, `icon`, `component`, `lazy`, `default_size`, `min_size`) of the widgets the user may place.
- The first-visit auto-create is gone: no read creates a dashboard.

### Tests

- `tests/Feature/Api/DashboardApiTest.php`: the exact default payload (populated, lazy without `data`, orphan with `component: null`, `version`, `meta.abilities`), `{"data": null}` without meta and no row created, first-visible fallback, no write on any GET (every write SQL is recorded, plus row counts), the index without widgets, show by slug with view-only abilities, slug 404s and per-user slug resolution, store 201, update 200 with the new version, destroy 204, 422 datasets for store and update, the update `version` guard (match, stale second write, mismatch), 403 on update and destroy of a shared dashboard, guest 401, eager isolation in `production` (thrown and unserializable, reported) vs 500 in `local` and `testing`.
- `tests/Feature/Api/DashboardLayoutApiTest.php`: the exact layout response with `meta.abilities`, omit-deletes, orphan-kept, the v1 no-uuid payload end state (every non-orphan recreated with new uuids, response and row counts pinned), foreign uuid 422, a 422 dataset (no version, no widgets, not a list, no key, zero width, negative row, bad uuid, duplicate uuid) leaving placements and version intact, unplaceable widgets dropped, the layout `version` guard (match, stale second write 409, mismatch, reloaded version saves), 403 for view-only, 404 for another user's dashboard.
- `tests/Feature/Api/WidgetApiTest.php`: the catalogue, a lazy placement by uuid, the scoped 404 (another of the user's dashboards and another user's), orphan 404, unauthorized-widget 404, unknown uuid 404, shared dashboards, a failing lazy widget kept out of the dashboard payload (500 on its own URL), guest 401.
- `tests/Feature/DashboardLayoutTest.php` (action level): update in place, create without uuid, unknown uuid treated as new, omit-deletes, orphan-kept, version moves on every save, 409 with no change and no finished event, rollback of a save that fails part way (update, delete and create all undone), the update action's version guard.
- `tests/Feature/PlacementUuidMigrationTest.php`: `down()`, the backfill (distinct, uuid-shaped, unique and not-null constraints enforced), more rows than one chunk, down/up/down/up. `tests/Modes/RenamedTables/RenamedTablesTest.php`: the same backfill and constraints on `crm_*` tables, and the create, layout, rename, read, lazy and delete flow.
- Rewritten: `DashboardPersistenceTest` (columns, version 1, uuid on create with an integer key), `RequestPersistTest` (dashboard and widget requests `final` with their own `persist()`, controllers one line), `WidgetRegistryTest`. Deleted: `DashboardRoutesTest`, `LazyWidgetTest` (Blade routes; covered by the API tests).
- This group's test files, `tests/Modes` and `tests/ArchTest.php` pass: 110 tests. PHPStan (whole project) and Pint pass. The full suite was not run here (D-014).

### Deviations and notes

- The retry fixed two bugs in the WIP: the layout action used Eloquent `Collection::except()` with uuids, which takes primary keys, so every kept placement was deleted; and `DashboardResource` took its placement data as a second constructor argument, which `collection()`'s `mapInto()` filled with the item index (500 on the index). Both resources now take their data through a fluent setter.
- `src/Domains/Dashboard/Actions/Concerns/ClaimsDashboardVersion.php` is a trait under the group's `Actions/*`, holding the version claim both actions share. Keystone's `Arch` globs `Actions/*.php` only, so the action checks don't see it.
- The route model binding is explicit (`Route::bind()` in `DashboardServiceProvider`) rather than Laravel's implicit `{dashboard:slug}`, because slugs are only unique per owner. `routes.php` still declares `{dashboard:slug}` and `{widget:uuid}` with `scopeBindings()`, so URL generation uses the slug and uuid.
- `workbench/app/Atrium/DemoPlugin.php` still links a nav item to the removed `atrium.dashboard` route, and the Blade views still reference the old dashboard routes. Groups 7 and 6 own those; the full suite stays red until then (D-014).

### Relaunch check

- The relaunch found every task finished in `86ee62f` on top of the WIP `6d1e713`, and no uncommitted work. It changed no code. It reviewed the migration, the layout action and version claim, the resources, the one-line controllers, the routes and the binders against AC 6-10, 30, 32 and 33, and confirmed every listed test file covers its criterion. PHPStan (`composer analyse`, 0 errors) and Pint (`--test`) pass. The tests were not run here, as instructed; the gate runs them.
