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

## Group 5 (salvaged)

Route group, auth and plugins. Criteria 1, 2, 3, 5, 12. The build agent ended without a result, leaving its work uncommitted. There was no index lock and no merge or rebase in progress.

### What the salvage found

The work was complete except for one failing test. All of it was uncommitted:

- `src/Support/ServiceProvider.php`: `loadDashboardRoutesFrom()` and `dashboardRouteAttributes()` are gone. `loadApiRoutesFrom()` overrides Keystone's: it wraps the parent group in `Route::middleware(ForceJsonResponse::class)`, so JSON rendering is forced ahead of `atrium.routes.middleware`.
- `src/Domains/Access/Http/Middleware/Authorize.php`: returns `401 {"message": "Unauthenticated."}` as a `JsonResponse` when `$request->user()` is null, and 403 `This action is unauthorized.` when the gate refuses.
- `src/Domains/Plugins/PluginsServiceProvider.php` and `routes.php`: plugin routes load through `loadApiRoutesFrom()` after boot, each one under `Route::prefix('plugins/{key}')->name('plugins.{key}.')`, with `EnsureFeaturesAreEnabled:{features}` kept when the plugin declares features. `Contracts/Plugin::routes()` docblock updated.
- Fixtures: `->view()` dropped from `AlphaPlugin`, `BrowserPlugin` and `FullPlugin`, and their Blade views deleted (`views/alpha-stats`, `views/full-settings`). `RoutedPlugin` and `FeaturedPlugin` serve JSON at `/` named `index`. New `Middleware/MarksAtriumResponse` (a host middleware for the configured stack).
- Tests: new `Api/RoutesApiTest` (the exact route-name list with method, URI and slug/uuid binding fields, scoped bindings, no other `atrium*` URI, `enabled: false` registers nothing, no `api.php`, no `loadDashboardRoutesFrom`, every domain `routes.php` loaded through `loadApiRoutesFrom`, every `atrium.*` route's middleware is exactly `[ForceJsonResponse, 'api', Authorize]` with only a plugin feature gate after it, and `Authorize` sorted before `SubstituteBindings`) and `Api/AuthApiTest` (a guest gets 401 JSON on all 14 routes for four `Accept` values, both with no guard and with a test token guard, so never a redirect; with a test guard the gate gives 403 outside `local`, lets the user through in `local`, and a defined gate decides in every environment, plugin routes included; a view-only user gets 403 on update, layout and destroy with nothing changed). `PluginRoutesTest`, `PluginFeatureRoutesTest` (a feature that is off gives 404 JSON even for `Accept: text/html`, the gate answers before the feature check, and a disabled plugin registers no route), `ConfiguredPathTest` (`routes.prefix` and `routes.middleware`), `PluginRegistryTest` and `PolicyTest` (JSON calls, `version` in update and layout payloads) are rewritten for the API.

### Outside the group's file list (committed with it)

- `src/Domains/Access/Http/Middleware/ForceJsonResponse.php` (new, `final`, `@internal`): sets `Accept: application/json`, so a host guard's `AuthenticationException`, a 404 or a 422 renders as JSON. `src/Support/ServiceProvider.php` depends on it.
- `src/Domains/Access/AccessServiceProvider.php`: once the HTTP kernel resolves, calls `addToMiddlewarePriorityBefore(SubstituteBindings::class, Authorize::class)`. `Authorize` stays last in the configured list but runs before route model binding, so a guest gets 401 and a refused user 403 instead of a 404 from the slug binder.
- `stubs/plugin.stub`: the `routes()` docblock describes the API group, and the example widget uses `->component()` instead of the removed `->view()`.

### What the salvage changed

- `tests/Feature/Api/RoutesApiTest.php`: `test_authorize_runs_before_route_model_binding` failed because the `api` group and the middleware priority only reach the router when the HTTP kernel is built, and the test sends no request. It now resolves `Illuminate\Contracts\Http\Kernel` first.

### Checks

- This group's test files plus `CommandsTest` (which uses `AlphaPlugin`): 65 tests pass. `tests/Feature/Api`, `tests/ArchTest.php` and `tests/Modes` also pass (144 tests), so the forced JSON and the priority change don't break groups 3 and 4.
- PHPStan (`composer analyse`, 0 errors) and Pint (`--test` on `src` and `tests`) pass. The full suite was not run (D-014); the gate runs it.

### What is left

Nothing in group 5. `PluginDiscoveryTest` and `src/Domains/Domains/DomainServiceProvider.php` needed no change.

## Group 6

Remove the Blade UI. Criteria 10, 16, 17.

### Files

- Deleted: `resources/views`, `resources/css`, `resources/icons` (heroicons and their licence), `public/` (`atrium.css`, `atrium.js`, `alpine.js`), `bin/build-css.mjs`, `package.json` and `package-lock.json` (every script and dependency was the CSS/Alpine build or Playwright, so nothing was left to keep), `src/Support/Icons.php`, `src/Support/StyleRegistry.php`, `src/Testing/AtriumStyles.php`, `.github/workflows/browser-tests.yml`, `tests/Browser`, `tests/BrowserTestCase.php`, and the Blade-only feature tests `AtriumStylesTest`, `ComponentLibraryTest`, `IconsTest`, `PaginationComponentTest`, `SharedComponentsTest`, `UserMenuTest`. `resources/boost` stays (group 9).
- `src/Atrium.php`: `css()`, `stylesheet()` and the `StyleRegistry` dependency removed. `src/Facades/Atrium.php`: their `@method` lines removed.
- `src/AtriumServiceProvider.php`: no `StyleRegistry` singleton, no `loadViewsFrom()`, no `Blade::anonymousComponentNamespace()`, no `atrium-views` or `atrium-assets` publish tags. No domain provider loaded views, so none changed.
- `composer.json`: `test:browser` dropped, `test:unit` no longer excludes the Browser suite, `pestphp/pest-plugin-browser` dropped from `require-dev` with the `amphp/dns` and `amphp/socket` floors that only pinned its transitive dependencies. There was no `build:css` composer script (it was the npm script, now gone with `package.json`).
- `.gitattributes`: `/nuxt` and `/.nvmrc` are `export-ignore`; `/tests` and `/workbench` already were. The `package.json` and `package-lock.json` lines went with the files.

### Tests

- `tests/Feature/RemovalTest.php`: each removed path, no `public/atrium.*`, the removed classes and the `AuthorizesScreens` trait, no `Atrium::css()`/`stylesheet()`, no `atrium` view namespace, anonymous component namespace or `atrium-views`/`atrium-assets` publish tag, the five removed config keys absent from the merged and the shipped config, `package.json` (if any) without the CSS/Alpine/Playwright scripts and dependencies, `composer.json` without `test:browser`, `build:css` or the browser plugin, `.gitattributes` export-ignoring `/nuxt`, `/workbench` and `/tests`, and every class declaration matching `*WorkbenchToken*` in the repo (vendor, node_modules and build output pruned) living under `workbench/`. That last check passes vacuously until group 7 adds `AuthenticateWorkbenchToken`.
- `tests/Feature/FacadeDocblockTest.php`: the facade's `@method static` tags, by name and parameter names, equal Atrium's public instance methods; no `css`/`stylesheet` tag; `@see` points at Atrium.
- `tests/ArchTest.php`: `RefactorCircus\Atrium` does not use `view`, `Illuminate\View`, the `Blade` or `View` facades (Pest `toUse`); a token scan of every file in `src/` finds no global `view(` call (method declarations and `->view(` are allowed), no `Illuminate\View` name or string, and no `Blade::`; every public method of every `src/Domains/*/Http/Controllers/*` controller is exactly `return $request->persist();`, and the glob is not empty.
- `tests/Feature/HistoryRemovedTest.php`: dropped the case that read `resources/css/atrium.css`.
- PHPStan (`composer analyse`, 0 errors) and Pint (`--test` on `src`, `tests`, `config`) pass. The new and changed test files plus `CommandsTest` pass (70 tests). The full suite was not run here, as instructed; the gate runs it.

### Deviations and notes

- Touched outside the group's file list, all consequences of the removal:
  - `tests/Fixtures/BrowserPlugin.php` and `tests/Fixtures/views/**` (group 5's fixtures): only the deleted browser suite used them.
  - `tests/Pest.php`: the pest-plugin-browser directory workaround and the `BrowserTestCase` binding removed. `tests/TestCase.php`: the `Fixtures/views` view path removed.
  - `phpunit.xml.dist`: the `Browser` test suite removed. `.github/workflows/tests.yml`: the Windows step runs plain `vendor/bin/pest`. `.gitignore`: the `tests/Browser` screenshot and trace lines removed. `ring-master.yml`: `browser_test: 'composer test:browser'` removed, since the script no longer exists. `testbench.yaml`: `atrium-assets` no longer republished on build.
  - `src/Console/Commands/InstallCommand.php`: no longer publishes the removed `atrium-assets` tag; its closing line names the API prefix (`atrium.routes.prefix`) instead of the removed `atrium.path`.
  - `config/atrium.php` comments and the `Theme` docblock pointed at `resources/css/atrium.css`; they now refer to the Nuxt layer's stylesheet.
- `Atrium::path()` and `Atrium::url()` stay: AC 16 does not list them, though they read the removed `atrium.path` key and now always answer the v1 default `atrium`. `NavItem::isActive()` reads the same key. Returned as a decision.
- `/nuxt export-ignore` follows AC 16, but GitHub builds the tarballs giget downloads with `git archive`, which honours `export-ignore`, so D-001's `github:refactor-circus/atrium/nuxt/layer#v2.0.0` would fetch nothing. Returned as a decision.
- The workbench (`DemoPlugin`, `ScreenHostPlugin`) still calls `Icons::svg()` and `->view()`. Group 7 owns it; no test or PHPStan path loads it.

## Group 10

Archive rules and path helpers (D-015, D-016). Criterion 16. Built on branch `ring-master/2026-11-22-1823-atrium-v2-headless--g10`.

### Files

- `.gitattributes`: `/nuxt export-ignore` replaced by `/nuxt/playground`, `/nuxt/package.json`, `/nuxt/pnpm-workspace.yaml`, `/nuxt/pnpm-lock.yaml` and `/nuxt/layer/test`, so `/nuxt/layer` stays in the archive that giget and Composer dists download (D-015).
- `src/Atrium.php`: `path()` and `url()` removed. `src/Facades/Atrium.php`: their `@method` lines removed (D-016).
- `src/Domains/Navigation/Data/NavItem.php`: `isActive()` no longer reads `atrium.path`. A URL item still stays active on the paths beneath it, and only the site root (`/`) is never treated as the parent of every page. The docblock says "site root" instead of "dashboard root".

### Tests

- `tests/Feature/RemovalTest.php`: the `.gitattributes` patterns are read once by `exportIgnoredPatterns()`. Each nuxt dev part, `/workbench` and `/tests` is export-ignored. No export-ignored pattern matches `/nuxt`, `/nuxt/layer` or `/nuxt/layer/nuxt.config.ts` (checked with `fnmatch`, so a glob like `/nuxt/*` is caught too). `Atrium::path()` and `url()` are added to the removed public-API dataset.
- `tests/Feature/FacadeDocblockTest.php`: `path` and `url` are added to the "documents no removed method" dataset. The reflection test already compares the tags with the public methods.
- `tests/Unit/NavItemActiveTest.php` (new): with a container whose config still sets `atrium.path => 'atrium'`, an item at `/atrium` is active on `/atrium` and `/atrium/settings` and not on `/atriumx`. A root item (`/`, `http://localhost/`) is active on `/` but not on `/settings`. The `NavItem` source does not contain `atrium.path`.
- Pint `--test` passes on the changed files. The suite was not run here, as instructed; the gate runs it.

### Deviations and notes

- Touched outside the group's file list: `tests/Feature/NavigationTest.php`. I removed the case "never treats the dashboard root as the parent of every page", which asserted that `/atrium` is not active on `/atrium/settings`. That was the `atrium.path` behavior D-016 removes. `NavItemActiveTest` now covers the replacement behavior.
- The v2.0.0 CHANGELOG entry for `Atrium::path()`/`url()` belongs to group 9 (task 9.1 already lists it).

## Group 7 (salvaged)

Workbench, contract fixtures and API version. Criteria 21, 28 and 31. The build agent ended without returning a result. Salvaged on branch `ring-master/2026-11-22-1823-atrium-v2-headless--g7` as commit `0550037`.

### What I found

There was no index lock and no merge or rebase in progress. The worktree held the whole group as uncommitted work, all inside the group's paths:

- The Blade demo views, `ScreenHost` and `SignInWorkbenchUser` were already deleted and staged.
- `DemoPlugin`, `DemoData`, `WorkbenchServiceProvider` and `routes/web.php` were modified.
- `DemoScreens`, `AuthenticateWorkbenchToken`, both test files and the five fixtures were untracked.

Everything looked finished. Pint `--test` passed on `workbench/` and both test files, and PHPStan passed with 0 errors.

### What I committed

- **Workbench (AC 21):**
  - `DemoPlugin` uses Iconify icons and SPA paths for nav and search. Its routes return JSON and load in Atrium's API group as `atrium.plugins.demo.*` (`orders`, `users`, `reports.show`, `billing`).
  - The settings panel and every widget have component keys. `demo.services` is lazy.
  - `DemoScreens` adds a `demo.storefront` tab, a `header.actions` section and an `aside` section to `atrium.settings-panel`.
  - `AuthenticateWorkbenchToken` is marked WORKBENCH ONLY and is ported from the spike. It accepts `Bearer workbench` in `local` only and signs in testbench.yaml's `workbench.user`.
  - The CORS setup is ported from the spike: playground origins, `atrium/api/*`, and `supports_credentials` off. It sits in `WorkbenchServiceProvider::register()`, with `atrium.routes.middleware` set to `['api', AuthenticateWorkbenchToken::class, Authorize::class]`.
  - `/atrium` returns a JSON pointer to the playground. The Blade demo views are removed.
- **`tests/Feature/Api/ContractFixturesTest.php` (AC 31):**
  - Fixture comparisons for the shell, the default dashboard, the settings screen (built-in tab and registered tab) and the settings list. They use the workbench app and seeder, uuids from a sequence (`Str::createUuidsUsing`), and time frozen at 2026-11-23 10:00 UTC.
  - Fixtures are written only with `UPDATE_FIXTURES=1`. Meta-tests check that a plain run fails on a diff or a missing fixture and writes nothing, and that the update writes pretty-printed JSON.
  - The file also tests the demo plugin's API routes and the token guard, in `local` and outside it.
- **`tests/Feature/ApiVersionTest.php` (AC 28):** checks that `Atrium::API_VERSION` is major.minor and equals the major.minor of `nuxt/layer/package.json`. Until group 8 adds that file, the test is skipped with a message naming group 8.
- **`nuxt/layer/test/fixtures/`:** `shell.json`, `dashboard.json`, `screen.json`, `screen-tab.json` and `settings.json`.

### What is left

- 7.4 is not ticked: I did not run the suite, as instructed, so the gate has to confirm it is green. If the committed fixtures differ from the current payloads, regenerate them with `UPDATE_FIXTURES=1 vendor/bin/pest tests/Feature/Api/ContractFixturesTest.php`.
- `testbench.yaml` is outside this group's paths and still has stale comments: `/_workbench` sign-in, and `views`/`components` discovery. Group 9 or a follow-up should tidy them.

## Group 7 (retry)

Workbench, contract fixtures and API version. Criteria 21, 28, 31. Tasks 7.1-7.3 were done in the salvaged commit `0550037`. The retry checked that work against the tasks and criteria, changed no code, and ticked 7.1-7.4. 7.4 (the full suite) is left to the gate, as instructed.

### Files

- `workbench/app/Atrium/DemoPlugin.php`: `routes()` serves the demo pages as JSON (`orders`, `users`, `reports/{report}`, `billing`) inside the API group, so they are named `atrium.plugins.demo.*`. Widgets (`demo.revenue`, `demo.orders`, `demo.conversion`, `demo.users`, `demo.recent-orders`, `demo.services`, `demo.goals`, `demo.welcome`) and the `demo` settings panel are registered by key with Iconify icons. There are no `->view()` or `Icons::svg()` calls left.
- `workbench/app/Atrium/DemoScreens.php` (new): a registered tab `demo.storefront`, a `header.actions` section and an `aside` section on `atrium.settings-panel`, limited to the `demo` panel.
- `workbench/app/Atrium/DemoData.php`: the storefront data the tab resolves.
- `workbench/app/Http/Middleware/AuthenticateWorkbenchToken.php` (new, `final`, its docblock opens with "WORKBENCH ONLY"): in `local` only, `Authorization: Bearer workbench` signs the request in as testbench.yaml's `workbench.user`. It implements `AuthenticatesRequests`, so the middleware priority runs it ahead of `Authorize`.
- `workbench/app/Providers/WorkbenchServiceProvider.php`: `atrium.routes.middleware` is `['api', AuthenticateWorkbenchToken, Authorize]`. CORS covers `atrium/api/*` for the playground origins (`localhost:3000`, `127.0.0.1:3000`), with `supports_credentials` off because token auth sends no cookies. It registers the demo plugin, the screen extensions and the workbench gates.
- `workbench/routes/web.php`: `/` redirects to `/atrium`, which returns JSON pointing at the playground, the API prefix and the workbench token.
- Deleted: `workbench/app/Http/Middleware/SignInWorkbenchUser.php`, `workbench/app/Atrium/ScreenHost/*` and every Blade view under `workbench/resources/views` (the demo pages, the widgets and `screen-host`).
- `nuxt/layer/test/fixtures/{shell,dashboard,screen,screen-tab,settings}.json`: generated with `UPDATE_FIXTURES=1`.

### Tests

- `tests/Feature/Api/ContractFixturesTest.php` (AC 31, AC 21): runs the workbench app with its provider and `DatabaseSeeder`, sequential seeded uuids (`019ab000-0000-7000-8000-…`) and time frozen at `2026-11-23 10:00:00`. It compares the shell, the default dashboard, the settings screen on its built-in tab and on the registered `demo.storefront` tab, and the settings list with their fixtures, pretty-printed with `{}` and `[]` kept apart. It also checks: payloads are deterministic; a plain run fails on a difference or a missing fixture (the message names `UPDATE_FIXTURES=1`) and writes nothing; `UPDATE_FIXTURES=1` writes the file. Finally, it covers AC 21: the demo plugin's API routes and names, 401 for a guest, and the token guard (signs in the `workbench.user` in `local`, rejects a wrong token, does nothing outside `local`).
- `tests/Feature/ApiVersionTest.php` (AC 28): `Atrium::API_VERSION` is major.minor and equals the major.minor of `nuxt/layer/package.json`. The test is skipped, with a message naming group 8, until that file exists.
- The suite was not run in this retry, as instructed; the gate runs `vendor/bin/pest` (7.4).

### Deviations

- None. Every changed file is in the group's list. `RemovalTest`'s check that the `*WorkbenchToken*` class lives only under `workbench/` (group 6) now runs against a real class.

## Group 8 (salvaged)

Nuxt layer and playground. Criteria 19, 20, 22, 25, 26, 27, 28, 34, 35. The build agent ended without returning a result.

### What I found

There was no index lock and no merge or rebase in progress. Nothing was committed. The worktree held the group's start, all untracked and inside its paths:

- **Done:**
  - The pnpm workspace (`nuxt/package.json` with `packageManager: pnpm@10.18.0`, `pnpm-workspace.yaml`, a lockfile in sync with the manifests) and `.nvmrc` (`26.13.1`).
  - The layer's `package.json` with exact versions and no `workspace:` dependencies, and its `nuxt.config.ts`: i18n with `en` only, the lucide `serverBundle` with `fallbackToApi: false`, and the layer version in `runtimeConfig.public.atrium.version`.
  - The types, the `$atrium` registry plugin, the composables (`useAtrium`, `Api`, `Dashboard` with the empty-list create and the 409 reload, `Theme`, `Icon`), the shell store with the locale switch, the utils (`atriumLayout`, `atriumLink`, `atriumVersion`, `atriumStatus`), `app.config.ts` with the fallback icon, `i18n/`, and the playground's `package.json` and `nuxt.config.ts`.
  - Every Vitest suite for AC 22, plus the test-only `fr` locale and the fixture `satisfies` check.
- **Missing:**
  - Every Vue component, page and layout, `app.vue` and the CSS.
  - The `useAtriumSearch` and `useAtriumSettingsPanel` composables the tests import.
  - The playground's plugin and demo components.
  - The consumer build script that `nuxt/package.json` already pointed at, the `test:nuxt` composer script and the CI workflow.

### What I committed

- **Layer components** (`nuxt/layer/app/components/Atrium/`):
  - `Widget`: lazy fetch by uuid from `atrium.dashboards.widgets.show`; orphan notice; error card for a server `error` or a failed request.
  - `DashboardGrid`: full layout payload through `atriumLayout`, with `version` sent by `useAtriumDashboard.saveLayout`. Orphans are never sent, because the server keeps them. Sortable loads lazily, and a failed setup leaves editing usable. A failed save stays in edit mode and shows a toast.
  - `DashboardPage`: switcher, new dashboard, delete.
  - `WidgetPicker`: loads the catalogue when first opened.
  - `Screen`: tabs write `?tab=`; renders the `header.actions`, `before`, `after` and `aside` slots and any other declared slot; a registered open tab replaces the built-in content.
  - `Sections`, `Extension`: error card for an extension `error`.
  - `SettingsPanel`: error card for a panel `error`.
  - `Navigation`: `atriumLink` and `badge`; an unsafe link renders as a plain label.
  - `Search`: ⌘K.
  - `Icon`: renders `data-icon`, plus `data-fallback` for an unknown icon.
  - `ErrorCard`, `Unregistered`.
  - `VersionBanner`: console warning plus a dismissible banner on a minor or major mismatch.
- **Composables:**
  - `useAtriumSearch`: respects `min_length`, groups results, builds links with `noopener noreferrer`.
  - `useAtriumSettingsPanel`, `useAtriumSettings`: send `?tab=` and refetch when it changes.
- **Pages, layout and app:** `pages/` (dashboard, `d/[slug]`, settings index and panel, catch-all), `layouts/default.vue` (shell, theme switcher, version banner), `app.vue`, `assets/css/atrium.css`.
- **Playground:** `app/plugins/atrium.ts` registers token auth against the workbench guard, every demo widget, the `demo` settings panel, and the `demo.storefront`, `demo.visit-store` and `demo.help` extensions, with their components.
- **Gate:**
  - `composer test:nuxt` runs, in order: `node nuxt/layer/test/fixtures-present.mjs` (fails, naming the regeneration command, when a fixture is missing), `pnpm -C nuxt install --frozen-lockfile`, `typecheck`, `build`, `test` (Vitest), and `test:consumer`.
  - `nuxt/layer/test/consumer/build.mjs` copies `nuxt/layer` into a temp directory (without `node_modules`, build output or `test/`). It fails on any `workspace:` dependency, installs the layer, and builds a fresh app that extends `../layer` and registers through `useAtrium()`.
  - `.github/workflows/nuxt.yml` is its own CI job. Actions are pinned by SHA, pnpm comes from `nuxt/package.json`, and Node from `.nvmrc`.

### Checks

- `pnpm -C nuxt install --frozen-lockfile --offline`: the lockfile is up to date (pnpm 10.18.0).
- `pnpm -C nuxt typecheck`: green for the layer and the playground.
- `pnpm -C nuxt build`: green.
- `node nuxt/layer/test/fixtures-present.mjs`: green.
- Not run, as instructed: Vitest, the consumer build and `vendor/bin/pest`. `ApiVersionTest` stops skipping now that `nuxt/layer/package.json` exists (version `2.0.0`, `API_VERSION` `2.0`).

### What is left

- 8.4 is not ticked. The gate runs `composer test:nuxt` (Vitest and the consumer build need the network for the temp install) and `vendor/bin/pest`.
- On this machine `pnpm` is not on the PATH. I ran it through Node 22's `pnpm.cjs` with Node 26, and it switched to the pinned 10.18.0.

### Deviations

- The layer's composables go beyond the design's list (`Api`, `Dashboard`, `Theme`, `Icon`): the tests written for this group need `useAtriumSearch` and `useAtriumSettingsPanel`, and I added `useAtriumSettings` beside the latter. They are thin `useAsyncData` and `$fetch` wrappers. Group 9's docs should list them, or they could move to `utils/` if the public surface should stay at four.

## Group 8

Nuxt layer and playground, retry. Criteria 19, 20, 22, 25, 26, 27, 28, 34 and 35. Tasks 8.1 to 8.3 were done in the salvaged commit `0856e0e`. This retry had only 8.4 left, which runs the suites.

### Files

- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/tasks.md`: 8.4 ticked.
- No code changed. I checked that the salvaged commit contains everything the group lists:
  - the layer, with its components, composables, pages, layout, i18n and Vitest suites;
  - the playground and its plugin;
  - `nuxt/package.json`, `pnpm-workspace.yaml` and `pnpm-lock.yaml`;
  - `.nvmrc`;
  - the `test:nuxt` composer script (fixtures present, frozen install, typecheck, build, Vitest, consumer build);
  - `.github/workflows/nuxt.yml`.

### Tests

- I did not run them, as instructed. The gate runs `composer test:nuxt` and `vendor/bin/pest` for 8.4. `ApiVersionTest` now runs instead of skipping, because `nuxt/layer/package.json` exists.

### Deviations

- None in this retry. The salvaged section above records the extra composables (`useAtriumSearch`, `useAtriumSettingsPanel`, `useAtriumSettings`).

## Group 9

Docs, upgrade guide and release checks. Criteria 23, 24 and 25.

### Files

- `tests/Feature/ChangelogUpgradeTest.php` (new): reads the CHANGELOG's `## [v2.0.0]` section and asserts it names every removed file, class, method, trait and config key from AC 16, `Atrium::path()` and `Atrium::url()` (D-016), every removed, renamed and new route, the plugin route prefix and names, the published-file cleanup (`resources/views/vendor/atrium`, `public/vendor/atrium`, the `atrium-views` and `atrium-assets` tags), the migration step, and the pointers to the layer and the host's auth.
- `tests/Feature/DocsTest.php`: rewritten for v2. It covers the README's Installation, Authentication (cookie auth with CORS and CSRF, token auth with the `Authorization` header, host-owned token storage, the workbench guard, the `APP_ENV=local` warning) and The Nuxt layer (`extends`, `GIGET_AUTH`, SHA pinning, `client_path`, the registry, icon packs, locales, `api_version`) sections. The screen-extension checks now look for the client component model (`->component(`, `$atrium.extension(`, `ResolvedScreenResource`). A new check keeps Blade-era strings out of the README, the Boost skill, `CLAUDE.md` and both local standards. Other checks cover the API + layer phrases in the agent docs and the PR template's release checks. The history and Keen checks are unchanged.
- `README.md`: rewritten for the headless model. It adds Installation, Authentication, The Nuxt layer, Data sent to the client and The API sections, and updates every plugin, navigation, search, theming, authorization and package-layout example to Iconify icons, SPA links and JSON routes.
- `CHANGELOG.md`: a `## [v2.0.0]` section with an "Upgrading from v1" guide. The guide covers the steps, the config-key table, the route table, the removed APIs with their replacements, and the changed behavior. The section also has Added and Fixed. The pre-v2 Unreleased entries were folded in: the search fix moved to v2.0.0's Fixed; the slide-over and account menu are listed as never released and removed.
- `resources/boost/skills/atrium-development/SKILL.md`: rewritten for the API, host auth, the layer and its registry, and client-rendered screen extensions.
- `AGENTS.md` (the target of the `CLAUDE.md` symlink): the architecture section gains a "JSON API" bullet, and the screens bullet now describes the screen as JSON. The Frontend Conventions and Quick Commands sections are rewritten for the Nuxt layer, and the Ring Master done-line names `composer test:nuxt`.
- `docs/agent/standards/atrium/components.md` and `docs/agent/standards/atrium/domains.md`: rewritten for the API + layer model.
- `.github/pull_request_template.md` (new): checklist items for the MySQL and Postgres migration run, the sibling `^1` constraint grep across the 7 siblings (with a block for its output), the protected `v*` tags, a check that the Update Changelog workflow does not duplicate a version heading, and the manual doc items. Each item is owned by the PR author.
- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/tasks.md`: 9.1 to 9.4 ticked.

### Tests

- I ran `vendor/bin/pest tests/Feature/DocsTest.php tests/Feature/ChangelogUpgradeTest.php`: 75 passed, 262 assertions. Pint passes on both files.
- As instructed, I did not run the full suite, `composer test` or `composer test:nuxt`. The gate runs them for 9.4. No PHP source or Nuxt file changed in this group.

### Deviations

- `CLAUDE.md` is a symlink to `AGENTS.md`, so I edited `AGENTS.md`, which is not in the group's file list. The edits also go beyond the frontend section: the architecture bullets about screens and routes, Quick Commands (which named the removed browser and CSS builds) and the Ring Master done-line were stale as well.
- `docs/agent/standards.index.yml` and `standards.summary.md` are generated by `vendor/bin/ringside sync` from the standards' frontmatter. The index still carries the old descriptions of `atrium/components` and `atrium/domains`. I did not run the sync, because it rewrites generated files outside this group. The PR template lists it as a manual item.

### Observations for review

- `CREDITS.md` still credits Penguin UI and Alpine.js for the Blade components and bundled Alpine, which are both gone. It is outside this group's files.
- The shell sends each theme's `layout` (`sidebar` or `top`), but the bundled layer renders the sidebar layout for every theme, Ledger included. The README says so rather than promising the `top` layout.
- The spec names `^1` as the siblings' tag range, but Atrium's only release so far is v0.1.0. The PR template accepts `^1` or the pre-2 range a sibling actually uses (such as `^0.1`), and the CHANGELOG intro mentions both.
- The changelog-updater action in `update-changelog.yml` may add a second v2.0.0 heading when the release is published, because the section is already written. The PR template has a post-release check for this.

### Retry

- The retry found 9.1 to 9.4 finished and committed in `874f845`, with no uncommitted work, and changed no code or docs. I reviewed that commit against the tasks and AC 23, 24 and 25:
  - The CHANGELOG `## [v2.0.0]` section names every AC 16 path, class, config key and route, plus `Atrium::path()`/`url()` (D-016), the `resources/views/vendor/atrium` and `public/vendor/atrium` cleanup, and the `add_uuid_and_version_to_atrium_dashboards` migration step.
  - The README covers Installation, Authentication (cookie auth with CORS and CSRF, the `Authorization` header, host-owned token storage, the workbench guard, the `APP_ENV=local` warning) and The Nuxt layer (`extends`, `GIGET_AUTH`, SHA pinning, `client_path`, icon packs).
  - The README's layer examples match the layer code: `runtimeConfig.public.atrium.apiBase`, the chainable `$atrium` registry and the `icon.serverBundle`/`fallbackToApi` options.
  - The PR template has the MySQL/Postgres, sibling `^1` grep, protected `v*` tag and manual doc items, each with its owner.
- Pint `--test` passes on `DocsTest.php` and `ChangelogUpgradeTest.php`. PHPStan does not analyse `tests/`. The suite was not run, as instructed: the gate runs `composer test` and `composer test:nuxt` for 9.4.

## Rework round 1

### Fixes

- Blocker (gate): `composer exec ringside check` reported stale generated files. I ran `composer exec ringside sync` in the worktree (3 files written), and `ringside check` now passes.
  - The only tracked file it changed is `AGENTS.md` (the target of `CLAUDE.md`). Group 9 had edited the managed block between the `ring-master:start`/`ring-master:end` markers by hand, adding "and `composer test:nuxt` too when anything under `nuxt/` or the API's payloads changed" to the done-line. Sync restores that block to the generated text.
  - So the rule is not lost, I moved it outside the managed block, onto the "Nuxt layer gate" line in Quick Commands. `DocsTest` still finds `composer test:nuxt` in `CLAUDE.md`.
  - The other generated files (`docs/agent/standards.index.yml`, `docs/agent/standards.summary.md`, `.agents/`) are gitignored or excluded, so nothing more is committed for them.

### Tests

- `composer test:unit`: 893 passed, 3160 assertions.
- `composer exec ringside check`: passed.

### Observations for review

- My first `ringside sync`/`check` ran in the main `Atrium` checkout by mistake, because the shell's `cd` did not persist. It only rewrote gitignored generated files there: no tracked file changed and nothing was committed in that checkout.

## Rework round 2

### Fixes

- Minor (gate): `composer test:nuxt` was not in the gate's command list. CI already runs it: `.github/workflows/nuxt.yml` runs `composer test:nuxt` as its own job on every push and pull request (AC 26), so the workflow is unchanged.
- No earlier group had run the Node gate, so I ran each step locally. pnpm is not on this machine's PATH, so each step ran through the pinned `pnpm@10.18.0` via `npx`. The fixtures check, frozen install, typecheck and build passed. Vitest and the consumer build failed. Fixes:
  - Vitest, `test/fixtures.test-d.ts`: `shell.json` did not satisfy `AtriumShellResponse`. TypeScript reads the JSON themes array as one union, giving the built-in theme's empty `properties: {}` every other theme's token keys as `?: undefined`, and those clash with `Record<string, string>`. The API never sends those keys, so the test now checks `Sent<typeof fixture>`, which drops always-undefined keys. `exactOptionalPropertyTypes` (added to `test/tsconfig.json` only) reads the keys some themes leave out as absent, not undefined. The layer's `AtriumTheme` type is unchanged. I checked the test still catches a real mismatch: with `properties` set to `Record<string, number>` it fails.
  - Vitest, `vitest.config.ts`: the `i18n:registerModule` hook function in `environmentOptions.nuxt.overrides` could not be cloned to Vitest 5's fork workers, so 12 test files never started. The hook now lives in a test-only Nuxt module, `test/locale-module.ts`, which the overrides name by path. It still adds the test-only `fr` locale (D-011).
- Not fixed, returned as a decision: `test:consumer` fails with `[NUXT_B8017] The module @nuxt/icon could not be loaded`. `@nuxt/ui` installs `@nuxt/icon` by name, and a strict pnpm install of the layer keeps that package nested under `@nuxt/ui`, where neither the app nor the layer can resolve it. A `shamefully-hoist=true` `.npmrc` in the layer makes the consumer build pass (probed, then removed). Choosing how the layer's dependencies reach a host is a dependency/config choice D-001 does not settle.

### Tests

- `composer test:unit`: 893 passed, 3160 assertions.
- `pnpm -C nuxt install --frozen-lockfile`, `typecheck`, `build`: passed.
- `pnpm -C nuxt test` (Vitest): 13 files, 69 tests passed, no type errors.
- `pnpm -C nuxt test:consumer`: fails on `@nuxt/icon`, as above, until the decision is made.

### Observations for review

- `nuxt/layer/.nuxtrc` (`setups.@nuxt/test-utils="4.4.0"`) is written by `@nuxt/test-utils` when Vitest runs. It was already untracked before this round, and I did not commit it. It probably belongs in `nuxt/.gitignore`.

## Review fixes, round 1

### Fixes

- Major (`architecture/dependencies`): Navigation no longer reaches into other domains' Http classes.
  - The minimum query length moved from `IndexSearchResultRequest::minLength()` (static, on a request) to `SearchRegistry::minLength()`. The search request's `q` rule and `ShowShellRequest` both read it there, and the floor of 1 is unchanged.
  - `ShellResource` builds each settings panel summary (`key`, `label`, `icon`, `component`) in a private `panel()`, the same way it builds sections and themes, so it no longer imports Settings' `SettingsPanelResource`. The shell payload is unchanged: the `shell.json` contract fixture still matches.
  - New arch tests: Navigation uses no other domain's `Http` namespace, and no domain uses another domain's `Http\Requests`.
- Minor (`http/request-persist`): `DashboardController::default()` is now `showDefault()`, matching `ShowDefaultDashboardRequest`. The route keeps its name, `atrium.dashboards.default`. An arch test lists the controller's allowed method names.
- Minor (compat, CHANGELOG v2.0.0):
  - Removed: `SearchController::minLength()`, replaced by `config('atrium.search.min_length')`, which `IndexSearchResultRequest` enforces (or by `SearchRegistry::minLength()`).
  - Removed: `SearchController::__invoke()`. The controller is now `final` with `index()`.
  - Removed: `DashboardController`'s constructor, `index(Request)`, `show(Request, string)` and `render()`. The controller is now `final`, with the new methods listed.
  - Changed behavior: `DashboardManager`'s new constructor dependencies (`PlacementResolver`, `PackageRegistry`).
  - Added: `SearchRegistry::minLength()`.

### Tests

- `composer test:unit`: 901 passed, 3183 assertions.
- `composer analyse` and `composer lint:check`: passed.

### Observations for review

- The open question about registry-only requests inheriting `authorize() => true` is unchanged, as instructed.
- Navigation still reads Settings', Themes' and Search's registries from `Services/`. The dependencies standard lists `Contracts/`, `Data/` and models as the seams. The finding proposed `SearchRegistry` as the seam, and the shell already used the other registries, so I followed that.

## Review fixes, round 2

### Fixes

- Minor (input validation): `IndexSearchResultRequest` now trims `q` in `prepareForValidation()`, so the `min` rule counts the trimmed query even when a host drops the `TrimStrings` middleware. It also adds `max:` `IndexSearchResultRequest::MAX_LENGTH` (255), so no search source is handed an unbounded string. `persist()` passes the already-trimmed value. No config key was added: the limit is a class constant.
  - New tests in `tests/Feature/Api/SearchApiTest.php`: a padded one-character query is refused, and every source gets the trimmed query, both with `TrimStrings` disabled. A query one character over the maximum is refused with 422 and runs no source, and one at the maximum is accepted.
- Minor (`http/authorization`, D-018): `docs/agent/standards-feedback.md` has a row for `ShowShellRequest`, `IndexSearchResultRequest`, `IndexSettingsPanelRequest` and `ShowSettingsPanelRequest`. They inherit `authorize() => true` because they read registries only, so the route group's `viewAtrium` gate decides.

### Tests

- `composer test:unit`: 904 passed, 3194 assertions.
- `composer analyse` and `composer lint:check`: passed.

## Group 11 (salvaged)

### What I found

The build agent stopped before committing. There was no index lock and no merge or rebase in progress. Most of the group was already in the tree, uncommitted:

- The `Domains\Integrations` framework: the `Integration` contract and its abstract base, `InstalledPackages` and `ComposerInstalledPackages`, `IntegrationRegistry`, `IntegrationFeatures` with its Pennant seam, `RegisteredIntegration`, `ScreenDeclaration`, `SearchSourceDeclaration`, `InvalidIntegrationException`, and `atrium.screens.show` (route, controller and `ShowIntegrationScreenRequest`). `IntegrationsServiceProvider` was already in `DomainServiceProvider::$providers`.
- The seven `{Pkg}Feature` classes, and the `integrations` config section with its banner.
- `NavItem::live()`, the shell's `integrations`, `search.sources` and `search.per_source`, and `ResolvedScreenResource::declaredAt()`.
- The test fixtures (`FakeInstalledPackages`, `FixtureIntegration`, `IntegrationFixture` with `assertMatchesFixture()`), every group test file, and the route list, gate, shell, contract-fixture and Arch test updates.

Four things were missing:

- the `Surface::route()` call
- the regenerated `shell.json`
- the new `shell-integrations.json`
- the standards-feedback rows

Three of the salvaged tests also failed.

### What I did

- `AtriumServiceProvider` now calls `route('atrium.', 'atrium')` on Keystone's `Surface` (AC 46). The surface is scoped, so this is done in an `afterResolving` callback, and also on an instance that is already resolved.
- I regenerated `nuxt/layer/test/fixtures/shell.json` and wrote `shell-integrations.json` with `UPDATE_FIXTURES=1`.
- I added rows to `docs/agent/standards-feedback.md`:
  - `architecture/dependencies`
  - `architecture/domain-modules`
  - `http/authorization`: `ShowIntegrationScreenRequest` reads registries only, as D-018 accepted for the shell, search and settings requests.
- I fixed the three failing tests:
  - The config banner broke "authentication middleware" across two lines, so the grep missed it. I rewrapped it.
  - `NavItemLiveTest`'s closure case wraps the closure, because Pest calls a closure it finds in a dataset.
  - `ApiBaseTest` now calls `withArgs()` before `once()`. Mockery checks `once()` against every call if it comes first.

### Tests

These were run in this session:

- All the group's test files: Integrations, Surface, NavItemLive, the Routes, Auth, Shell and ContractFixtures API tests, and Arch. All passed after the fixes.
- PHPStan, Pint (on the changed paths) and type coverage (100%): passed.

The full suite was not run, as the salvage instructions said.

### What is left

- 11.6 (full `vendor/bin/pest` and `composer test`) is unticked. The gate runs it.
- The layer's TS shell types gain `live`, `integrations` and `search.sources` in group 12.

## Group 11

This was a retry for task 11.6 only. Tasks 11.1 to 11.5 were already committed in `962737b` (see "Group 11 (salvaged)" above), and I kept that work unchanged.

### Files

- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/tasks.md`: 11.6 ticked.
- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/build.md`: this section.

No source, test or fixture files changed.

### Tests

I did not run the full suite: the instructions say the gate runs `vendor/bin/pest` and `composer test` after the build, so 11.6 is ticked on that basis. In the salvage session, the group's own test files, PHPStan, Pint and type coverage all passed.

### Deviations

None beyond the standards-feedback rows recorded in the salvaged section (`architecture/dependencies`, `architecture/domain-modules`, `http/authorization`).
