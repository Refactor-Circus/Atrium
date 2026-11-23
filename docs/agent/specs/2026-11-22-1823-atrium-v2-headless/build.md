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

## Group 12 (salvaged)

### What I found

The build agent ended without a result. There was no index lock and no merge or rebase in progress. All of the group's work was in the tree, uncommitted: 12 modified files and every new file the group lists. I compared it with tasks 12.1 to 12.7, and it covers each of them:

- Tests (12.1): `integration-client`, `-routing`, `-search`, `-live`, `-absent` and `-i18n` Vitest files, the new shell types in `fixtures.test-d.ts`, and Pest `VendoredClientsTest` (stamps, the sibling comparison or a skip naming `pnpm -C nuxt sync:clients`, and the no-`@refactor-circus/*-client` grep).
- `nuxt/scripts/sync-clients.mjs` and the `sync:clients` script (12.2). It checks every source first and fails naming the package and path (D-039). I re-ran it with `ATRIUM_SUITE_PATH` set as D-040 says. All seven packages synced and the vendored `client/` folders did not change.
- `openapi-fetch` pinned at `0.17.0` in the layer, with the lockfile updated (12.3).
- `useAtriumIntegration()` with the auth middleware, and `useIntegrationQuery()` (12.4).
- The registry's `searchSource()` and `live()`, the `atrium-integrations` plugin (`import.meta.glob`), the global middleware with the `atrium.public` page meta, the public layout, `<AtriumIntegrationScreen>`, `<AtriumNoAccess>`, `<AtriumIntegrationUnavailable>`, `useAtriumScreen()`, Navigation `live` support, the ⌘K fan-out in `useAtriumSearch()`, and the extended shell types and store (12.5). `Search.vue` needed no change, because the fan-out lives in the composable.
- The 14 integration locale files, each `{}`, registered in `nuxt.config.ts`, and the new strings in `en.json` (12.6).
- `test/integrations/support.ts` with `mockPackageApi()` (typed by the vendored `paths`), `mountIntegration()` and the i18n key helpers (12.7).

### What I committed

Only the group's paths. `nuxt/layer/.nuxtrc`, an untracked file written by `@nuxt/test-utils` setup, is not in the group's file list, so I left it alone and did not commit it.

### What is left

- 12.8 is unticked. I did not run `composer test:nuxt` or `vendor/bin/pest`, as the salvage instructions said, and `pnpm` was not on this session's PATH for a typecheck. The gate runs both.

## Group 12

### Files

- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/tasks.md`: 12.8 ticked.
- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/build.md`: this section.

This retry had only 12.8 left. Tasks 12.1 to 12.7 were already committed in the salvaged section above, and I kept that work as it was. No source, test, fixture or vendored client files changed. `nuxt/layer/.nuxtrc` is still untracked and not in the group's file list, so it stays out of the commit.

### Tests

I did not run either suite. The instructions say the gate runs `composer test:nuxt` and `vendor/bin/pest` after the build, so 12.8 is ticked on that basis.

### Deviations

None.

## Group 15 (salvaged)

### What I found

There was no index lock and no merge or rebase in progress in the `--g15` worktree. The previous agent left this work uncommitted:

- The PHP side was complete: `KeenIntegration` (the audit-log nav item; the History item with `live('keen.history', {exclude, groups, sort})`, left out when `history.nav.enabled` is false; the 3 screen declarations), `lang/en/integrations/keen.php`, `KeenIntegrationTest` (gating, the API base from `keen.routes.prefix` and the `api_base` override, both nav items, a malformed config, the shell payload, the screens, the label keys and the fixture) and the generated `fixtures/integrations/keen.json`.
- The layer side was complete except for its tests: `index.ts` (with its `// Not ported (D-032)` note, which says nothing was left out), the 3 pages, `KeenEntriesBrowser`, `KeenEntriesTable`, `KeenChanges`, `KeenRecordForm`, `entries.ts`, the `keen.history` live resolver in `history.ts`, and `keen.en.json`.
- There was nothing under `nuxt/layer/test/integrations/keen/`.

### What I committed

Everything above, plus the missing Vitest suites in `nuxt/layer/test/integrations/keen/`:

- `keen.ts`: payload helpers, typed with `satisfies` against the vendored Keen schema, and the `atrium.screens.show` answers.
- `entries.test.ts`: `keen.entries` loads, the filters come from the route query and from the form, Clear works, cursor paging goes older, newer and back to newest, a 422 shows field errors, a 403 shows no access, and other failures show an error. The record form posts to `keen.entries.store` (method, path and body) and reloads, a 422 shows field errors, and a 403 shows no access.
- `entry.test.ts`: `formatChange()`, `changeRows()` and `<KeenChanges>` (rendered as v1's `audit.changes`), and the `keen.entry` page: its load request, details, the IP address and user agent only when Keen sends them, and the 404, 403 and failure states.
- `history.test.ts`: `keen.history` lists `keen.entries.index` with `source` fixed to the package, keeps it when other filters change, ignores `?source=`, shows not-found for an unlisted package, and shows no access on a 403.
- `live.test.ts`: the `keen.history` resolver is registered, and it handles exclusion, grouping under the nav group's label, sorting by label, link encoding, malformed options, and rejection on 500 and 403.
- `pages.test.ts`: every fixture screen has a route at its declared path, each page calls `atrium.screens.show` with its key, record and tab, and every `t()` key exists.

Commit `b52c048` on `ring-master/2026-11-22-1823-atrium-v2-headless--g15`, touching only the group's paths.

### What is left

- 15.4 is unticked. As instructed, I did not run `composer test:nuxt` or `vendor/bin/pest`. The new Vitest suites have never been run, so the gate is their first run. The likeliest weak spots are the page-level interactions in happy-dom: driving the Nuxt UI inputs and buttons through `data-testid`, and route-query reactivity after `router.replace`.

## Group 15

### Files

- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/tasks.md`: 15.4 ticked. 15.1 to 15.3 are ticked on the group branch too, because the salvage marked them done only in the job worktree.
- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/build.md`: the salvaged section above and this one.

This retry had only 15.4 left. Tasks 15.1 to 15.3 were already committed in `b52c048` (see "Group 15 (salvaged)" above), and I kept that work as it was. No source, test, fixture or locale files changed. `nuxt/layer/.nuxtrc` is untracked and not in the group's file list, so it stays out of the commit.

### Tests

I did not run either suite. The instructions say the gate runs `composer test:nuxt` and `vendor/bin/pest` after the build, so 15.4 is ticked on that basis. The Keen Vitest suites have never been run, so the gate is their first run. The weak spots noted in the salvaged section still apply.

### Deviations

None.

## Group 18 (salvaged)

### What I found

The build agent stopped without returning a result. In the group worktree there was no index lock and no merge or rebase in progress. Every file in the group's list was present but uncommitted: 12 new files, plus `roster.en.json`, which still held only the `{}` placeholder at HEAD. I read each file against tasks 18.1 to 18.3, AC 69 and 70, and the group 11 and 12 framework (`IntegrationRegistry`, `IntegrationFixture`, `useIntegrationQuery`, `integrationData`, `AtriumRegistry`, `test/integrations/support.ts`, the vendored Roster schema). The work looked complete and consistent:

- `RosterIntegration` declares:
  - the six v1 nav items, all in the Roster group;
  - the widgets `roster.user-status` and `roster.organizations`, with no resolver;
  - the search sources `roster-users` and `roster-organizations`;
  - the 14 screens at the AC 69 paths, with the subject aliases `roster.user` and `roster.organization`, and `roster.invitation` at `/roster/invitations/:token`.

  Its labels are in `lang/en/integrations/roster.php`. The `roster.routes.enabled` gate and its one warning come from the framework's `IntegrationRegistry`.
- `RosterIntegrationTest` covers:
  - registration: gating, the API base, disabled, not installed, `roster.routes.enabled` false with one warning, then turned on;
  - the declarations, Iconify icons, the fixture, the labels and the no-package-code check.
- `index.ts` has the full `screens` map (route names for the 14 keys) and registers both widgets and both search sources.
- The two widgets read `roster.stats.users` and `roster.stats.organizations` through `useIntegrationQuery`. A 403 shows `AtriumNoAccess`, and any other failure shows `AtriumErrorCard`.
- The sources in `components/search/sources.ts` call `/search/users` and `/search/organizations` with `q` and `limit`. Results link to `/roster/users/:id` and `/roster/organizations/:slug`.
- The Vitest files are `integration.test.ts`, `widgets.test.ts` and `search.test.ts`. They cover the screens map against the fixture, the registrations, both widgets with 403 and error states and one shared request, and both sources with their links, a 403 drop and the inactive case.

`vendor/bin/pint --test` passes on the three PHP files.

### What I committed

Commit `05ff2f8` on `ring-master/2026-11-22-1823-atrium-v2-headless--g18` contains only the group's 13 paths. Tasks 18.1, 18.2 and 18.3 are ticked. The untracked `nuxt/layer/.nuxtrc` and `nuxt/layer/test/zz-probe.test.ts` are outside the group's list, so I did not commit them or touch them.

### What is left

- 18.4 is unticked. As instructed, I ran neither `composer test:nuxt` nor `vendor/bin/pest`, so the gate will be the first run of these Pest and Vitest files.
- `nuxt/layer/test/zz-probe.test.ts` looks like a leftover probe from the stopped agent. If it is still untracked in the worktree when the gate runs, Vitest will pick it up.

## Group 18

### Files

- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/tasks.md`: 18.4 is ticked. 18.1 to 18.3 are also ticked on the group branch, because the salvage ticked them only in the job worktree.
- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/build.md`: the salvaged section above and this one.

This retry had only 18.4 left. Tasks 18.1 to 18.3 were already committed in `05ff2f8` (see "Group 18 (salvaged)" above), and I left that work unchanged. No source, test, fixture or locale file changed.

I deleted the untracked `nuxt/layer/test/zz-probe.test.ts` from the group worktree. It was a debug probe the stopped agent left behind. Its only test throws on purpose, so Vitest would have failed the gate with it in place. It was never committed. `nuxt/layer/.nuxtrc` is also untracked and is not in the group's file list, so I left it out of the commit.

### Tests

I did not run either suite. The instructions say the gate runs `composer test:nuxt` and `vendor/bin/pest` after the build, so 18.4 is ticked on that basis. The gate will be the first run of the Roster Pest and Vitest files.

### Deviations

None.

## Group 17 (salvaged)

### What I found

The build agent stopped without returning a result. The group worktree had no index lock and no merge or rebase in progress. All the group's work was present but uncommitted: 24 new files, plus `polycart.en.json`, which still held the `{}` placeholder at HEAD. The last writes (07:53) were to `PolycartCart.vue` and `cart.test.ts`, which suggests the agent was in the run-and-fix loop of 17.4 when it stopped.

I read each file against tasks 17.1 to 17.3, AC 54, 59, 60 and 62, and the group 11 and 12 framework: `Integration`, `IntegrationRegistry`, `IntegrationFixture`, `useAtriumIntegration`, `useIntegrationQuery`, `AtriumRegistry`, `AtriumIntegrationScreen`, `AtriumNoAccess` and `test/integrations/support.ts`. Every helper, component and type the files use exists. The work is complete and consistent:

- **`PolycartIntegration`** declares:
  - the two v1 nav items, Carts and Cart types, in the Polycart group at sort 30 and 31;
  - the widgets `polycart.carts-by-type` and `polycart.recent-carts`, with no resolver;
  - the search source `polycart`;
  - the three AC 59 screens, with no `subject_type`, since Polycart sets no morph alias and Atrium may not name its classes.

  It has no settings panel. Its labels are in `lang/en/integrations/polycart.php`.
- **`PolycartIntegrationTest`** covers:
  - gating: `polycart.routes.enabled` false gives no registration and exactly one warning across two boots, and true gives a registration;
  - not installed, and disabled (`false` and `"false"`);
  - the API base: the prefix, the trimmed prefix, the `api_base` override, and no config;
  - the declarations, the labels and the no-Polycart-class grep;
  - the `polycart.json` fixture.
- **`index.ts`** starts with `// Not ported (D-032)`, which names `polycart.atrium.show_all` and the other v1 departures. It has the `screens` map and registers both widgets and the search source.
- **Pages and components:**
  - `/polycart/carts` has the type, status, source and search filters, kept in the query, with cursor paging.
  - `/polycart/carts/:cart` has update, delete and clear (each confirmed), status transition, convert, visibility, line update and remove, and member share and unshare. Each change reloads. A 422 shows field errors or the type's refusal, a 403 shows the no-access state, and a 404 shows not found.
  - `/polycart/types` lists the types.
  - Each page renders inside `AtriumIntegrationScreen`.
  - The two widgets share one `stats.show` through `usePolycartStats`.
- **Vitest** has six files: `integration`, `carts`, `cart`, `types`, `widgets` and `search`. Their payloads in `data.ts` are typed with `satisfies` against the vendored schema. Together they cover the fixture's pages and the `screens` map, every AC 59 action (method, path and body), 403 and 422, one shared stats request, the search request and its links, and the i18n keys.

`php -l` and `vendor/bin/pint --test` pass on the three PHP files.

### What I committed

Commit `8451a5a` on `ring-master/2026-11-22-1823-atrium-v2-headless--g17` contains only the group's 25 paths. Tasks 17.1, 17.2 and 17.3 are ticked.

### What is left

- 17.4 is unticked. As instructed, I ran neither `composer test:nuxt` nor `vendor/bin/pest`, so the gate will be the first full run of these Pest and Vitest files.

## Group 17

### Files

- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/tasks.md`: 17.4 ticked.
- `docs/agent/specs/2026-11-22-1823-atrium-v2-headless/build.md`: this section.

This retry had only 17.4 left. Tasks 17.1 to 17.3 were already in commit `8451a5a` on `ring-master/2026-11-22-1823-atrium-v2-headless--g17`, as the salvaged section above describes, and I kept that work as it was. No source, test, fixture, lang or locale files changed. The group worktree was clean, so the group commit is empty and only records the retry.

### Tests

I did not run either suite. The instructions say the gate runs `composer test:nuxt` and `vendor/bin/pest` after the build, so 17.4 is ticked on that basis. The salvaged notes say the original agent was last editing `PolycartCart.vue` and `cart.test.ts` while it was running and fixing tests. If the gate fails, look at those two files first.

### Deviations

None.

## Group 22 (salvaged)

### What I found

The g22 worktree had no `index.lock` and no merge or rebase in progress. All 17 of the group's files were uncommitted: 16 new files, plus `showroom.en.json`, which was still `{}` at HEAD and had been filled in. No path outside the group's file list had changes.

- **PHP.** `ShowroomIntegration` ports the v1 `ShowroomPlugin`. I checked the eleven Catalog nav items (labels, sorts and paths) against `Showroom/src/Atrium/ShowroomPlugin.php`. Their icons are Iconify equivalents of the old heroicons. The four widgets, the `showroom` panel and the `showroom` search source all send `data: {}`. The integration also declares the 27 screens, with `subject_type` set for `showroom_product`, `showroom_product_model` and `showroom_owner`. The lang file has every label key the class uses.
- **Pest.** `ShowroomIntegrationTest` covers:
  - discovery by convention, and gating: installed, not installed, and `enabled` set to `false` or `"false"`
  - the API base from `showroom.routes.prefix` and from the `api_base` override
  - routes off, with exactly one warning, and no Showroom config at all
  - the eleven nav items with no badge and no `live`, the four widgets, the panel and the search source
  - the 27 screen declarations and the `forScreen()` lookup
  - the lang keys, no `RefactorCircus\Showroom` reference, and the fixture
- **Fixture.** `fixtures/integrations/showroom.json` matches what the PHP declares.
- **Layer.**
  - `index.ts` holds the 27-entry `screens` map and registers the four widgets, the panel and the search source. Its `// Not ported (D-032)` note lists policy hiding and the recent-changes author names.
  - The widgets share `useShowroomStats()`, which makes one `showroom.stats.show` call through `useIntegrationQuery`.
  - The panel renders `showroom.settings-summary.show`.
  - The source calls `GET /search` with `limit` and links each result by `type`.
  - I checked every field these components read against the vendored `schema.d.ts`.
- **Vitest.** There are four files:
  - `integration`: the `screens` map against the fixture, the registrations and the i18n keys
  - `widgets`: one shared request, 403 and 500, and each widget's content and links
  - `settings`: the rows, off values, 403 and 500
  - `search`: the request with `per_source`, a link per type checked against the declared paths, 403 drops the source, and no call while inactive

`vendor/bin/pint --test` passes on the three PHP files. As instructed, I did not run either suite.

### What I committed

Commit `3be10ab` on `ring-master/2026-11-22-1823-atrium-v2-headless--g22` contains only the group's paths, all 17 files. Tasks 22.2 and 22.3 are ticked.

### What is left

- **22.1 is unticked.** The Pest test for "the `transfers.flow_prefix` config read" is missing, and nothing in the group reads `atrium.integrations.showroom.transfers.flow_prefix`. The spec and D-035 say the transfers screen filters flows by that prefix. They do not say how the PHP config reaches the layer. Integration declarations have no free-form data channel: AC 61 fixes the panel at `data: {}`, `ScreenDeclaration` and `atrium.screens.show` have no options field, and AC 43 names only `impex.active-runs` and `keen.history` as live keys. That makes it an architectural choice, so I returned it as a decision and did not pick one.
- **22.4 is unticked.** Neither `composer test:nuxt` nor `vendor/bin/pest` has been run on this group, so the gate's run will be the first.

## Group 27 (salvaged)

### What I found

The worktree `Atrium--2026-11-22-1823-atrium-v2-headless--g27` had no index lock and no merge or rebase in progress. The previous agent left the PHP half done but uncommitted:

- `dedoc/scramble` `^0.13.55` in `require-dev`; it installs on Laravel 13 and PHP 8.5, so no decision was needed.
- `composer openapi:export`.
- `workbench/app/OpenApi/AtriumOpenApi.php`, which holds the Scramble config, the `atrium.*` route filter that leaves out `atrium.plugins.*`, `operationId` set to the route name, and the resource-schema extension.
- `ExportOpenApiCommand` (`workbench:openapi`), which exports from a fresh in-memory SQLite database.
- `schema()` on all seven resources.
- The committed `openapi.json`.
- `tests/Feature/OpenApiTest.php`.
- The `Dedoc` ArchTest rules.
- The pinned `openapi-typescript` `7.13.0` and its lockfile entries.
- The `generate:client` script, `nuxt/scripts/generate-client.mjs`, which writes the sha header and has a `--check` mode.

Missing were:

- the generated `schema.d.ts`
- `useAtriumClient()`
- the `types/atrium.ts` aliases
- the Vitest files
- the `test:nuxt` staleness step

### What I did

- **Checked the export.** I re-ran `composer openapi:export`. The fresh document equals the committed `openapi.json` as decoded JSON: OpenAPI 3.1.2, "Atrium API" 2.0.0, 14 operations.
- **Generated the client.** I generated `nuxt/layer/app/client/schema.d.ts` with `node nuxt/scripts/generate-client.mjs`; pnpm is not on this machine's PATH, and it is the script `generate:client` runs. Its header is `sha256: cdb5e15f…`.
- **Staleness step.** `composer test:nuxt` now runs `pnpm -C nuxt generate:client --check` right after the frozen install.
- **Types.** `types/atrium.ts` now aliases `components['schemas']` and keeps every public name. Where JSON Schema cannot express a shape, the alias narrows the generated one:
  - the recursive nav `children`
  - the keyed maps: theme `properties`, integration `features`, and screen `sections` and `rows`
  - the opened panel's `description` and `data`
  - the integration screen's `path`, `subject_type` and `record`

  `AtriumNavItem.live` stays optional. `search.per_source` is now `number | null`, matching `ShellResource`. `useAtriumSearch` already falls back with `?? 5`.
- **`useAtriumClient()`.** It returns an `openapi-fetch` `Client<paths>`, one per Nuxt app, based at `runtimeConfig.public.atrium.apiBase` (resolved against the page origin), and signed by the same auth adapter. A 401 calls `onUnauthorized()` except on a public page. The adapter middleware repeats the one in `useAtriumIntegration.ts`, which is outside this group's files and keeps it private.
- **Vitest.** `test/client.test.ts` covers the adapter's headers, credentials and `Accept`, the adapter read at request time, 401 against 403, and the per-app cache. `fixtures.test-d.ts` checks each fixture against the generated `operations[...]` 200 bodies and the public names against the schemas.
- **Static checks.** `nuxt typecheck`, `vue-tsc -p test/tsconfig.json` and `pint --test` on the group's PHP files all pass. As instructed, I did not run either suite.

### What I committed

Commit `dc50217` on `ring-master/2026-11-22-1823-atrium-v2-headless--g27` contains only the group's paths, 23 files. `composer.lock` is gitignored, and `testbench.yaml` was unchanged. Tasks 27.1, 27.2 and 27.3 are ticked.

### What is left

- **27.4 is unticked.** Neither `composer test:nuxt` nor `vendor/bin/pest` has been run on this group.

## Group 19 (salvaged)

### What I found

There was no index lock and no merge or rebase in progress. The stopped agent had written everything in the group's paths, but none of it was committed:

- the four pages (`users/index.vue`, `users/create.vue`, `users/[user].vue` and `impersonations/index.vue`), with the `// Not ported (D-032)` comment at the top of `users/index.vue`;
- seven components and `users.ts` under `integrations/roster/components/users/`;
- the filled `roster-users.en.json`;
- five Vitest files plus `support.ts`.

The tests cover what 19.1 asks for: tabs, the status filter and paging; the 422 on create; the profile update and every AC 69 user action by method, path and body; role assign and revoke; listing and stopping impersonations; 403 and 404; and a page for each screen key.

**Every integration suite in the layer fails to load, not only group 19's.** The shared `test/integrations/support.ts` (group 12) has `fileURLToPath(new URL('../../', import.meta.url))` on line 277. In the Nuxt Vitest environment, Vite rewrites `new URL('<literal>', import.meta.url)` into a served asset URL (`http://localhost:3000/test/integrations`), and `fileURLToPath()` throws "The URL must be of scheme file". The committed `roster/widgets.test.ts`, `cortex/integration.test.ts` and `test/integration-i18n.test.ts` fail the same way. That file is outside this group's paths, so I left it alone. The fix is to read the URL through a variable (`const here = import.meta.url`, then `new URL('../../', here)`); `cortex`, `polycart` and `pennantplus` `integration.test.ts` use the same pattern and need the same fix.

### What I did

- **Checked the group's suites.** I put a throwaway Vitest config and a patched copy of the shared support in the group's test folder. A `resolveId` plugin pointed `../../support` at the copy. I deleted both afterwards. The first run gave 49 passed and 6 failed, all from test-harness bugs, which I fixed:
  - `pages.test.ts` used the same `new URL(…, import.meta.url)` pattern. It now reads through a variable.
  - Pages from earlier tests stayed mounted. Their route watchers reloaded against the next test's mocks, which inflated the GET counts. A new `resetRosterPages()` in the group's `support.ts` unmounts them, and each suite's `afterEach` calls it.
  - happy-dom has no `window.confirm`, so `vi.spyOn` threw. `confirmWith()` now stubs it with `vi.stubGlobal`, and `resetRosterPages()` drops the stub.
  - Two route assertions after a `router.push` were timing-dependent. They now use `vi.waitFor`.
- **Result.** With the patched support, all 5 files and 55 tests pass, three runs in a row.
- **Typecheck.** `nuxt typecheck` reports no errors in group 19's files. It reports 8 errors in Cortex and Impex files from other groups (`CortexToolPicker.vue`, `CortexVersions.vue`, `ImpexChannelFields.vue`, `cortex/redirect-domains.vue`, `impex/channels/[name].vue`, `impex/runs/[run].vue`).
- **Pest.** `composer test:unit` gives 1191 passed, 3 failed and 14 errors, all in `OpenApiTest` and `ContractFixturesTest`: `Dedoc\Scramble\Scramble` is not in this worktree's `vendor/` (group 27 added `dedoc/scramble` to `require-dev`; `composer install` has not been rerun here), plus one `'204'` against `204` OpenAPI mismatch. Group 19 changes no PHP.

### What I committed

Only the group's paths (the 19 files above, with the test fixes), plus this note and the ticks for 19.1 and 19.2. `nuxt/layer/.nuxtrc` is still untracked and not committed.

### What is left

- **19.3 is unticked.** `composer test:nuxt` cannot pass until the shared `test/integrations/support.ts` line 277 is fixed (group 12's file) and the Cortex and Impex type errors are fixed. `vendor/bin/pest` needs `composer install` for `dedoc/scramble` and the OpenAPI 204 fix. None of these are in group 19's paths.

## Group 19

This was a retry for 19.3 only. 19.1 and 19.2 were already committed (salvaged). This run changed no code.

### Files

- None in the group's paths. Only this note changed.

### Tests

- **Setup.** `composer install` brought `dedoc/scramble` into `vendor/`. pnpm is not on this machine's PATH, so every Node step ran through `npx pnpm@10.18.0`, the version `nuxt/package.json` pins.
- **`composer test:unit`.** 1215 tests: 1207 passed, 7 skipped and 1 failed. The failure is `OpenApiTest` "answers a deleted dashboard with 204 and no body". It compares `'204'` against `204`, which is group 27's OpenAPI export. With scramble installed, the 14 errors from the salvaged run are gone.
- **`pnpm -C nuxt install --frozen-lockfile`.** Passed.
- **Vitest, group 19 as committed.** All 5 files fail on import. The cause is the shared `test/integrations/support.ts:277` (group 12): `fileURLToPath(new URL('../../', import.meta.url))` throws "The URL must be of scheme file", because Vite rewrites the literal `new URL(…, import.meta.url)`.
- **Vitest, group 19 with that line patched.** I read the URL through a variable (`const here = import.meta.url`), ran the suites, then reverted the patch, so nothing outside the group changed. Result: 5 files and 55 tests passed, with no type errors.
- **Full layer Vitest, with the same temporary patch.** 597 tests: 549 passed and 48 failed. None of the failures are in `test/integrations/roster/**`. They are in `integration-absent`, `integration-client`, `integration-i18n`, `integration-routing`, `integration-search`, the `cortex/*` suites, `impex/i18n`, `pennantplus/features`, `pennantplus/integration`, and `polycart/cart`, `carts`, `integration` and `widgets`. Three of them (`integration-i18n`, `pennantplus/integration` and `polycart/integration`) use the same `new URL(…, import.meta.url)` pattern. Most of the others fail on confirm dialogs (`window.confirm`) or on screen-frame calls.
- **`pnpm -C nuxt typecheck`.** 8 errors, none in group 19's files: `CortexToolPicker.vue` (2), `CortexVersions.vue`, `ImpexChannelFields.vue`, `pages/cortex/redirect-domains.vue`, `pages/impex/channels/[name].vue` (2) and `pages/impex/runs/[run].vue`.
- **Not reached:** `build` and `test:consumer`. The `composer test:nuxt` chain stops at the typecheck.

### Deviations

- None. `nuxt/layer/.nuxtrc` is still untracked and not committed. `nuxt prepare` writes it.

### What is left

- **19.3 stays unticked.** Group 19's own suites pass. The gate stays red because of files outside the group's paths:
  - `test/integrations/support.ts:277` (group 12), the one-line fix above;
  - the 8 Cortex and Impex type errors;
  - the 48 Vitest failures in other groups' suites;
  - the `OpenApiTest` 204 mismatch (group 27).

## Stabilization (after wave 3 merge)

Groups 11-18, 27 and part of 22 were built in parallel worktrees and merged by hand. This pass made both gates green without deleting or skipping a test.

### PHP gate (`composer test`)

- `tests/Feature/OpenApiTest.php`: the 204 test expected the key `'204'`. PHP casts a numeric-string array key to an int, so `array_keys()` can only return `204`. The test was wrong, so it now expects `[204]`.
- `src/Domains/Navigation/Services/NavigationState.php`: PHPStan rejected the `??=` assignment of two untyped `new WeakMap`s into the typed per-request map. `for()` now builds both maps with their generic types before storing them. The behaviour is unchanged.

- `tests/Pest.php`, `SearchTest`, `OpenApiTest`: one `composer test` run failed intermittently (1 in 8). `SearchTest` "runs sources in separate processes" got "no commands defined in the atrium namespace". Under `--parallel`, group 27's `OpenApiTest` runs `vendor/bin/testbench`, which rewrites Testbench's skeleton app. At the same time, the search process driver runs `php artisan` in that same skeleton. Both now hold one file lock (`lockTestbenchSkeleton()`, keyed on the skeleton path) while they use the skeleton. Five runs in a row then passed.

### Nuxt gate (`composer test:nuxt`), Vitest

- `new URL('…', import.meta.url)` in `test/integrations/support.ts`, `integration-absent`, `integration-i18n`, `cortex/integration`, `pennantplus/integration` and `polycart/integration`: Vite rewrites that literal into a served asset URL, which `fileURLToPath()` and `readFileSync()` refuse. These files now read `import.meta.url` through a variable, as the Roster page tests already did.
- `test/setup.ts` (new, set as `setupFiles`): happy-dom has no `window.confirm`, so `vi.spyOn(window, 'confirm')` failed in the Cortex, Polycart and Pennantplus suites. Every test file now starts with a `confirm` that declines, which the tests can spy on.
- `hasI18nKey()` in `test/integrations/support.ts`: in the Nuxt environment, imported locale files and loaded locale messages hold precompiled message ASTs (`{type: 0, body}`), not strings. The helper now counts either as a message.
- `integration-client`: a `useIntegrationQuery` widget left mounted keeps its shared request alive (D-029), so one test's request answered the next test. These tests now unmount their widgets with `enableAutoUnmount(afterEach)`.
- `cortex/support.ts`: Cortex pages left mounted kept watching the route, and reloaded when the next test navigated (an extra `virtual-agents.index`). The Cortex suites now auto-unmount their pages too.
- `mountSuspended()` navigates to its own `route`, `/` by default, which dropped the route a test had pushed first:
  - `integration-routing` and the Polycart `cart` and `carts` tests now pass the route to the mount.
  - The public-page 401 test now takes its client before it navigates, because `withSetup()` mounts at `/` and so left the public page.
- `integration-search`: the link-guard test returned three results from one source while the shell capped each source at `per_source: 2`. It now spreads them over two sources.
- `polycart/widgets`: the badge and the count are separate elements with no text between them, so the test now expects `order4`/`quote0`.
- `CortexAgentForm.vue` (implementation bug): a number input's `v-model` hands back a number once it is edited, so `form.settings[key].trim()` threw on submit. Each setting is now read as a string first. This fixed the create, 422 and 403 tests.

### Nuxt gate, typecheck

- `CortexToolPicker.vue`, `CortexVersions.vue` and `pages/impex/channels/[name].vue`: Nuxt UI types `onClick` as returning void. Inline handlers that assign are now written as arrow functions.
- `pages/cortex/redirect-domains.vue`: vue-tsc rejected `action.busy.value` on the add button, though the same expression type-checks on other pages. The page now binds a top-level `busy` ref instead.
- `impex/components/shared.ts`: `CHANNEL_TRANSPORTS` is now `readonly string[]`, since a channel's transport is a string in the API and in the form.
- `pages/impex/runs/[run].vue`: by its schema, `runs.signals.store` answers a finished run with `{message}` only. The page now tells a sent signal from an ignored one by whether the answer has `data`.

### Result

- `composer test`: phpstan, pint and type coverage pass. Pest ran 1215 tests: 1208 passed and 7 skipped.
- `composer test:nuxt`, run with `ATRIUM_SUITE_PATH` set to the scratch suite (D-040): the frozen install, client check, typecheck, build, Vitest and consumer build all pass. Vitest ran 75 files and 628 tests, all passing, with no type errors.

## Group 20 (salvaged)

The build agent ended without a result. There was no index lock and no merge or rebase in progress.

### What was found

- All the pages and components were on disk, untracked: `pages/roster/organizations/{index,create}.vue`, `[organization]/index.vue`, `[organization]/teams/[team].vue`, `pages/roster/invitations/[token].vue`, and `integrations/roster/components/organizations/*` (`organizations.ts` and the `Organization{State,Members,Teams,Invitations,Roles,Settings}.vue` tabs). `components/invitation/invitation.ts` was there too. The `// Not ported (D-032)` comment was at the top of the organizations index page.
- `i18n/locales/integrations/roster-organizations.en.json` was still the `{}` stub from group 18. Because the pages were on disk, group 19's `t()` key test (`missingI18nKeys('roster')`) failed on them.
- There were no tests under `test/integrations/roster/organizations/`.

### What was done

- Wrote `roster-organizations.en.json` with every key the area uses, including the dynamic ones: the tabs, the organization and team statuses, the invitation statuses and the role scopes.
- `pages/roster/organizations/[organization]/teams/[team].vue`: deleting a team now asks for confirmation first, as AC 54 requires for destructive actions (key `teams.confirm_delete`).
- Wrote the Vitest files under `test/integrations/roster/organizations/`, with payloads in `support.ts` typed with `satisfies`. Where Scramble types a payload loosely (a member's `user`, an invitation's `teams`), it is typed as the page reads it and cast at the mock.
  - `organizations.test.ts`: the active and deleted tabs, the filters as the endpoint's query, restore, purge after a confirmation (202 queued notice), and 403 on the load and on an action.
  - `organization-create.test.ts`: the body, the redirect to the new page, a 422 and a 403.
  - `organization.test.ts`, one test per action with its method, path and body, and the reload after it:
    - members: add (with a 422), approve, transfer and remove;
    - teams: the list and create;
    - invitations: invite and revoke;
    - roles: the role assignments from `role-assignments.index` and the roles list;
    - settings: update (including a slug change and a 422), link, unlink, delete after a confirmation, then restore, or purge after a confirmation;
    - the load: 403 and 404.
  - `team.test.ts`: the load, adding a member (picked from the organization's members not yet in the team), removing one, update (with a 422), delete after a confirmation, a 403 on an action, and 403 and 404 on the load.
  - `invitation.test.ts`, the public page:
    - its route is public and uses the public layout;
    - it makes no `useAtriumApi` call (no shell, no screens), and the shell store stays empty;
    - the details render;
    - a 401 on the lookup does not call `onUnauthorized()`;
    - every 404 shows one generic state, with nothing from the server's message, and a 429 shows the "too many attempts" state;
    - accept and decline send their method, path and body;
    - a 401 on accept or decline calls `onUnauthorized()` and answers nothing;
    - the token never appears in `document.title`, `localStorage`, `sessionStorage` or the console.
  - `pages.test.ts`: each of the five screen keys has a page at its declared path, named in the screens map. The four signed-in pages are framed with their screen key. The invitation page is public and has no screen frame. It also checks the D-032 comment at the top of the index page and every `t()` key.

### Results

- Vitest (the layer's own binary): 81 files and 693 tests pass, with no type errors. The Roster suites alone are 14 files and 143 tests.
- `nuxt typecheck` on the layer: clean.
- `composer test:unit`: 1215 tests, 1208 passed and 7 skipped.

### What is left

- 20.3 is not ticked. `pnpm` is not on this session's PATH, so the full `composer test:nuxt` gate was not run: the frozen install, `generate:client --check`, the playground typecheck, the build and the consumer build. The layer's Vitest and typecheck were run directly instead.
- "`onUnauthorized()` first" (AC 70, D-038) is read as follows. The page cannot tell whether the visitor is signed in without loading the shell, which D-038 rules out. So it sends accept or decline, and on a 401 calls `onUnauthorized()` before anything is answered. It does not retry the call afterwards.

## Group 20

This was a retry for 20.3 only. 20.1 and 20.2 were already committed (salvaged). This run changed no code.

### Files

- None in the group's paths. Only `tasks.md` (20.3 ticked) and this note changed.

### Tests

- **`composer test:unit`.** 1215 tests: 1208 passed and 7 skipped.
- **`composer test:nuxt`.** Run with the `pnpm` shim on PATH (D-041) and `ATRIUM_SUITE_PATH` set to the scratch suite (D-040). Every step passed:
  - the fixtures check;
  - the frozen install;
  - `generate:client --check` (the schema is current);
  - the layer and playground typechecks;
  - the playground build;
  - Vitest, with 81 files and 693 tests passing and no type errors;
  - the consumer build ("a fresh app extending nuxt/layer builds").

### Deviations

- None. `nuxt/layer/.nuxtrc` is still untracked and not committed. `nuxt prepare` writes it.

## Group 21 (salvaged)

The build agent ended without a result. There was no index lock and no merge or rebase in progress.

### What was found

- Every file was on disk, untracked:
  - the pages `pages/roster/roles/{index,[role]}.vue`, `pages/roster/permissions/index.vue` and `pages/roster/transfers/{index,[transfer]}.vue`;
  - `integrations/roster/components/access/` (`access.ts`, `AccessState.vue`, `RolePermissions.vue`);
  - `integrations/roster/components/transfers/` (`transfers.ts`, `TransferStatusBadge.vue`);
  - the filled `i18n/locales/integrations/roster-access.en.json`;
  - the six Vitest files under `test/integrations/roster/access/` (`roles`, `role`, `permissions`, `transfers`, `transfer`, `pages`), plus `support.ts`.
- The `// Not ported (D-032)` comment was at the top of `pages/roster/roles/index.vue`.
- One bug: `pages/roster/transfers/[transfer].vue` called `outcomeLabel()` in its template but never defined it, so the page failed to render once a transfer loaded. 9 of the 11 tests in `transfer.test.ts` failed on it.

### What was done

- Defined `outcomeLabel()` in `[transfer].vue`. It returns `roster.transfers.outcomes.{outcome}` when the locale has that key. Otherwise it returns the outcome as Roster sent it, for example an export's `exported` result.
- Nothing else changed. v1's role, permission and transfer views had no confirmation prompt on delete or cancel, so AC 54's "keep their confirmation" adds none here.

### Results

- **Vitest (the layer's own binary).** All 87 files and 757 tests pass, with no type errors. The group's own suites are 6 files and 64 tests.
- **`nuxt typecheck`.** Clean on the layer and on the playground.
- **Playground `nuxt build`.** Passes.
- **`composer test:unit`.** 1215 tests: 1208 passed and 7 skipped.

### What is left

- 21.3 is not ticked. `pnpm` is not on this session's PATH, so the full `composer test:nuxt` gate was not run. The frozen install, `generate:client --check` and the consumer build (which runs `pnpm install` itself) did not run. The retry can run them with the `pnpm` shim (D-041).

## Group 21

This was a retry for 21.3 only. 21.1 and 21.2 were already committed (salvaged). This run changed no code.

### Files

- None in the group's paths. Only `tasks.md` (21.3 ticked) and this note changed.

### Tests

- **`composer test:nuxt`.** Run with the `pnpm` shim on PATH (D-041) and `ATRIUM_SUITE_PATH` set to the scratch suite (D-040). Every step passed:
  - the fixtures check;
  - the frozen install;
  - `generate:client --check` (the schema is current);
  - the layer and playground typechecks;
  - the playground build;
  - Vitest, with 87 files and 757 tests passing and no type errors;
  - the consumer build ("a fresh app extending nuxt/layer builds").
- **`composer test:unit`** (`vendor/bin/pest`), with `ATRIUM_SUITE_PATH` set: 1215 tests, all passed.

### Deviations

- None. `nuxt/layer/.nuxtrc` is still untracked and not committed. `nuxt prepare` writes it.

## Group 22

This was a retry for 22.1 and 22.4. 22.2 and 22.3 were already committed (salvaged). The salvaged run left one item open: how `atrium.integrations.showroom.transfers.flow_prefix` reaches the layer. D-042 settles it, and this run applies it.

### Files

- **D-042, the screen options channel:**
  - `src/Domains/Integrations/Data/ScreenDeclaration.php`: a `public private(set) array $options` (default `[]`) and a fluent `options()`. The setter checks its input with `JsonData::check()`, as `NavItem::live()` does.
  - `src/Domains/Screens/Http/Resources/ResolvedScreenResource.php`: `declaredAt()` takes the options. A declared screen always sends `options` as an object (`{}` when there are none). `schema()` declares it, optional, like `path`.
  - `src/Domains/Integrations/Http/Requests/ShowIntegrationScreenRequest.php`: passes the declaration's options to `declaredAt()`.
  - `nuxt/layer/app/types/atrium.ts`: `AtriumScreen` omits `options` with the other declared-screen fields. `AtriumIntegrationScreen` carries it, optional, so the hand-built screen payloads in other groups' tests still type-check.
  - `openapi.json` (`composer openapi:export`) and `nuxt/layer/app/client/schema.d.ts` (`generate:client`) were regenerated. Each adds only `options`.
- **Showroom:** `src/Integrations/Showroom/ShowroomIntegration.php` declares `showroom.transfers` with `['flow_prefix' => …]`. The value is read from `atrium.integrations.showroom.transfers.flow_prefix`, and an absent or non-string value falls back to `FLOW_PREFIX` (`'showroom:'`, v1's), per `architecture/configuration`.
- **Fixtures:** `tests/Fixtures/Integrations/IntegrationFixture.php` writes `options` on each screen. All seven `nuxt/layer/test/fixtures/integrations/*.json` files were regenerated with `UPDATE_FIXTURES=1`. Six only gain `"options": {}` per screen, and `showroom.json` also gains `showroom.transfers`' `flow_prefix`.
- **Tests:**
  - `tests/Feature/Integrations/ShowroomIntegrationTest.php`: the config read covers the default, a changed prefix, an absent key and a non-string, with no options on any other screen. A second case checks the `atrium.screens.show` payload: `showroom.transfers` carries `options.flow_prefix`, and `showroom.products` sends `"options":{}`.
  - `tests/Unit/ScreenDeclarationOptionsTest.php` (new): the default, the setter, and the `UnserializableDataException` message for a closure.
  - `tests/Feature/Integrations/ScreenRouteTest.php` and `tests/Feature/Api/ContractFixturesTest.php`: the exact-shape expectations gain `options`.
  - `nuxt/layer/test/integrations/showroom/integration.test.ts`: the fixture's transfers screen carries `flow_prefix: 'showroom:'`, and every other screen carries `{}`.

### Tests

- **`composer test:unit`**, with `ATRIUM_SUITE_PATH` set (D-040): 1223 tests, all passed.
- **`composer analyse`, `composer lint:check` and `composer test:types`:** all passed, with type coverage at 100%.
- **`composer test:nuxt`**, with the `pnpm` shim (D-041) and `ATRIUM_SUITE_PATH` set. Every step passed:
  - the fixtures check;
  - the frozen install;
  - `generate:client --check`;
  - the typechecks;
  - the build;
  - Vitest, with 87 files and 758 tests passing and no type errors;
  - the consumer build.

### Deviations

- None from the standards.
- Files outside the group's list changed, as D-042 allows:
  - `ScreenDeclaration`, `ResolvedScreenResource`, `ShowIntegrationScreenRequest`, `types/atrium.ts`, `openapi.json` and `schema.d.ts`;
  - the fixture helper and the six other integration fixtures;
  - `ScreenRouteTest`, `ContractFixturesTest` and the new `tests/Unit/ScreenDeclarationOptionsTest.php`.
- Group 25's transfers page should read `options.flow_prefix` from its `atrium.screens.show` response.

## Group 22 (re-verified)

This was a second retry for 22.1 and 22.4. Commit `f649540` already did both (D-042 applied, all four tasks ticked), so this run changed no code and only reran the gates in the job worktree.

### Files

- This section only. No code, test or fixture changed.

### Tests

- **`composer test:unit`**, with `ATRIUM_SUITE_PATH` set (D-040): 1223 tests, all passed.
- **`composer test:nuxt`**, with the `pnpm` shim (D-041) and `ATRIUM_SUITE_PATH` set. Every step passed:
  - the fixtures check;
  - the frozen install;
  - `generate:client --check`;
  - the typechecks;
  - the build;
  - Vitest, with 87 files and 758 tests passing and no type errors;
  - the consumer build.

### Deviations

- None.
- The worktree has an untracked `nuxt/layer/.nuxtrc`. It is outside this group and wasn't created by this run, so it is not committed.

## Group 23 (salvaged)

The build agent ended without a result. There was no index lock and no merge or rebase in progress.

### What was found

- The code was on disk, uncommitted:
  - the eight pages: `pages/showroom/products/{index,create,[product]}.vue`, `pages/showroom/product-models/{index,[productModel]}.vue`, `pages/showroom/families/{index,[family]}.vue` and `pages/showroom/family-variants/[familyVariant].vue`;
  - `integrations/showroom/components/catalog/`: `catalog.ts` (payload types, loader, action runner, paths) and `values.ts` (the value form, the editing slot and the attribute catalog), plus `ValueEditor`, `InheritedValues`, `AxesFields`, `SlotPicker`, `ProductWorkflow`, `CatalogAssets`, `CatalogAssociations`, `ExternalIds`, `CatalogPager`, `CatalogState` and `CatalogActionError`;
  - the filled `i18n/locales/integrations/showroom-catalog.en.json`.
- The `// Not ported (D-032)` comment was at the top of `pages/showroom/products/index.vue`.
- There were no tests: `test/integrations/showroom/catalog/` did not exist.
- One typecheck error: `pages/showroom/families/index.vue` sent `families.store` a `labels` map. The vendored schema types it as an array.

### What was done

- `families/index.vue` sends its body through `untyped()`, as the family page already did. Nothing else in the code changed.
- Wrote the tests under `test/integrations/showroom/catalog/`: `support.ts` and nine Vitest files, 109 tests in all.
  - `support.ts` holds the payloads, the lookups, the `atrium.screens.show` stand-in, the page mounter, the call filter and the confirmation stub. Scramble types Showroom's resources loosely, so the payloads use `satisfies` against the shapes the pages read (`catalog.ts`). They are answered through `reply(200, …)`, as roster's transfers suite does.
  - `products.test.ts`: the load, the status and search filters, the URL filters and page, paging, clear, empty and 403.
  - `product-create.test.ts`: the families, the create body with and without a family, the redirect, 422 and 403.
  - `product.test.ts`:
    - load, 403 and 404;
    - values: the full update body, edited values, family, owner and enabled, the slot from the URL, switching the slot, an added attribute, 422 under its field, and 403;
    - categories, flags (own and effective), and external ids (emptied as null, a new source, 422 under its source);
    - workflow: the open transitions, the body with and without a comment, unpublish only when published, a 409 message and 403;
    - versions: revert once confirmed, revert declined, and 403;
    - assets: the links, upload then link with the role, and 422;
    - associations: remove, add plain, add quantified, and 422;
    - delete: confirmed, declined, and 403;
    - a variant product: its model and family variant load, it shows what it inherits, and a save sends only what it owns.
  - `product-models.test.ts`: the load, the filters, cursor paging, create, 422 and 403.
  - `product-model.test.ts`:
    - load, then save (owner, categories and values) and its 422;
    - a new variant product, a new sub-model, and a 422 under the axis;
    - asset link, association add;
    - delete confirmed and declined;
    - an action's 403, the load's 403, and 404.
  - `families.test.ts`: the load, search and cursor paging, create with and without a label, 422 and 403.
  - `family.test.ts`: the load, the full-membership save, add and remove, 422, a variant created with an empty second level left out, its 422, delete confirmed and declined, an action's 403, the load's 403, and 404.
  - `family-variant.test.ts`: the levels and models load, delete back to the family, delete declined, a 409 message, an action's 403, the load's 403, and 404.
  - `pages.test.ts`: each of the eight screen keys has its page at its declared path and is named in the screens map; each page is framed with its own key; the D-032 comment is at the top; and every `t()` key of these pages and the catalog components exists. The i18n check covers only this group's files, so the other Showroom groups' work in progress cannot break it.

### Results

- **`composer test:nuxt`.** It ran with the pinned Node 26.13.1 and the pnpm from Herd's Node 22.22.2 on PATH. Every step passed:
  - the fixtures check;
  - the frozen install;
  - `generate:client --check`;
  - the typechecks;
  - the build;
  - Vitest, with 96 files and 867 tests passing and no type errors;
  - the consumer build.
- **`composer test:unit`.** 1223 tests: 1216 passed and 7 skipped. `ATRIUM_SUITE_PATH` was not set, so the sibling-client checks skip.

### What is left

- Nothing in this group.
- `nuxt/layer/.nuxtrc` is still untracked and not committed. It is outside the group.

## Group 24 (salvaged)

The build agent ended without a result. There was no index lock and no merge or rebase in progress.

### What was found

- The tests were on disk, uncommitted and complete. `test/integrations/showroom/structure/` held:
  - `support.ts`, with the payloads;
  - one Vitest file per screen: `attributes`, `attribute-create`, `attribute`, `attribute-groups`, `attribute-group`, `association-types`, `categories`, `category`, `channels`, `channel`, `flags` and `flag`;
  - `pages.test.ts`. It checks that each of the 12 screen keys has its page at its declared path, framed with its own key. It also checks the D-032 comment and the `t()` keys.
- The shared code was on disk: `components/structure/structure.ts`, `AttributeFlags`, `CategoryBranch`, `ChannelFields` and `FlagFields`.
- Eight pages were on disk: `attributes/{index,create,[attribute]}.vue`, `attribute-groups/{index,[group]}.vue`, `association-types/index.vue` and `categories/{index,[category]}.vue`. The `// Not ported (D-032)` comment was at the top of `attributes/index.vue`.
- Missing:
  - the four channels and flags pages;
  - every string: `i18n/locales/integrations/showroom-structure.en.json` was still the `{}` from group 12.
- One typecheck error: in `attributes/index.vue`, the type predicate of the query builder did not fit the narrowed key type.

### What was done

- Wrote the four missing pages, porting v1's `channels/{index,show}` and `flags/{index,show}`:
  - `channels/index.vue`. The locales card lists, adds and deletes locales, and has its own load state, so a 403 on `locales.index` affects only that card. It also has the new-channel form (`ChannelFields`, with the trees from `categories.index?roots=1`) and the cursor-paged table.
  - `channels/[channel].vue`: the label, locales, currencies and tree. It saves through `channels.update` and deletes once confirmed.
  - `flags/index.vue`. The new-flag form ticks both subjects by default and leaves a blank sort order to Showroom. It also has the cursor-paged table with a badge per subject.
  - `flags/[flag].vue`: the code shown but not editable, the label, subjects and sort order. It saves through `flags.update`, and a delete is confirmed, with Showroom's 409 message shown when it refuses.
- Filled `showroom-structure.en.json` with every key the group's pages and components use. The wording comes from Showroom's `lang/en/showroom.php`.
- Fixed the typecheck error in `attributes/index.vue` by widening the key type before the predicate.

### Results

- **`composer test:nuxt`.** It ran with the pinned Node 26.13.1 and the pnpm from Herd's Node 22.22.2 on PATH. Every step passed:
  - the fixtures check;
  - the frozen install;
  - `generate:client --check`;
  - the typechecks;
  - the build;
  - Vitest, with 109 files and 1005 tests passing and no type errors. The structure suite alone has 13 files and 138 tests.
  - the consumer build.
- **`composer test:unit`.** 1223 tests: 1216 passed and 7 skipped.

### What is left

- Nothing in this group.
- `nuxt/layer/.nuxtrc` is still untracked and not committed. It is outside the group.

## Group 24

This was a retry. The salvaged commit (`562d755`) already held all of group 24, with 24.1 to 24.3 ticked, so no code changed in this run. This run checked that work and reran the gates.

### Files

- No changes to the group's files. The work is the salvaged commit: the 12 pages under `pages/showroom/{attributes,attribute-groups,association-types,categories,channels,flags}/`, `integrations/showroom/components/structure/`, `showroom-structure.en.json`, and `test/integrations/showroom/structure/` (`support.ts`, 12 screen files and `pages.test.ts`).

### Checks

- The `// Not ported (D-032)` comment is at the top of `pages/showroom/attributes/index.vue`.
- Every screen file under `test/integrations/showroom/structure/` covers the 403 state. Every screen with a mutation also covers 422. The `attributes` list has no mutation of its own, because create is its own screen.
- `pages.test.ts` checks that each of the 12 screen keys has its page (AC 71).

### Tests

- **`composer test:unit`.** 1223 tests: 1216 passed and 7 skipped.
- **`composer test:nuxt`.** It ran with Herd's Node 26.13.1 and the pnpm from Herd's Node 22.22.2 on PATH, because pnpm is not on the default PATH. Every step passed:
  - the fixtures check;
  - the frozen install;
  - `generate:client --check`;
  - the typechecks;
  - the build;
  - Vitest: 109 files and 1005 tests passed, with no type errors;
  - the consumer build.

### Deviations

- None.

## Group 25 (salvaged)

The build agent ended without a result. There was no index lock and no merge or rebase in progress.

### What was found

- The tests were on disk, uncommitted and complete. `test/integrations/showroom/assets/` held:
  - `support.ts`, with the payloads, the transfers screen answer (with `options.flow_prefix` and an optional `row.actions` section) and an area mounter that puts Showroom and Impex in the shell;
  - one Vitest file per screen: `assets`, `asset`, `owners`, `owner`, `owner-types`, `owner-type` and `transfers`;
  - `pages.test.ts`. It checks that each of the 7 screen keys has its page at its declared path, framed with its own key. It also checks the D-032 comment, `useAtriumIntegration('impex')` on the transfers screen (D-035) and the `t()` keys.
- On disk: both asset pages (`assets/{index,[asset]}.vue`, with the `// Not ported (D-032)` comment at the top of `index.vue`), `components/assets/{assets.ts,AssetThumbnail.vue}` and `components/owners/owners.ts`.
- Missing:
  - the four owners and owner-types pages, the transfers page and `components/transfers/`;
  - the owner asset card and the chain rules fields;
  - every string: `showroom-assets.en.json` was still the `{}` from group 12.

### What was done

- `components/transfers/transfers.ts`: the flow and run types from Impex's vendored schema, the prefix read from the screen's options (with `showroom:` as the fallback), the flow filter, the merge into the 20 newest by `created_at`, and the export body. `TransferRunsTable.vue` renders the runs and the screen's `row.actions` sections, with the run id as their record.
- `pages/showroom/transfers/index.vue`: it reads the prefix from `atrium.screens.show` (the same request `<AtriumIntegrationScreen>` makes, which shares its key), and then calls `impex.flows.index` and one `impex.runs.index?flow=&per_page=20` per matching flow. It renders the "requires Impex" notice when Impex is inactive or absent, and no-access in the runs card on a 403. Import sends the file and mode as multipart (`showroom.imports.store`). Export sends the format, the family, category tree and channel, and the published switch (`showroom.exports.store`). Both reload the runs.
- `owners/{index,[owner]}.vue`:
  - The list has the search and type filters (`?type=` from the owner type page), a cursor pager, and a create form that appears once an owner type exists.
  - The detail page shows the chain (each ancestor links to the list searched for it), the children and the counts. It has the save form (labels, parent, enabled, external ids through `ExternalIds`, and the flags that apply to owners), an add-child form, and the asset card. Delete is confirmed, and a 409 shows Showroom's message.
- `owner-types/{index,[ownerType].vue}`: the list with its parents column (Any for `null`), and create and save with the chain rules (`OwnerTypeRules.vue`: any parent sends `parent_types: null`, otherwise the ticked codes in Showroom's order). Delete is confirmed.
- `OwnerAssets.vue` uploads a file and links it with `type: owner`. `CatalogAssets` takes only product link types and belongs to group 23. `AssetThumbnail` now takes only the file fields it reads, so the owner card can reuse it.
- Filled `showroom-assets.en.json` with every key the group's pages and components use.

### Results

- **`composer test:nuxt`.** It ran with Herd's Node 26.13.1 and the pnpm shim (D-041) on PATH. These steps passed: the fixtures check, the frozen install, `generate:client --check`, the typechecks and the build. In the Vitest step, 116 of 117 files passed. The one failure was `test/integrations/polycart/cart.test.ts` › "deletes the cart after a confirmation, then returns to the list" (`expected '/' to be '/polycart/carts'`). It is a timing flake in group 17's test, which reads the route right after the click and does not use `vi.waitFor`. It passed when rerun alone (27/27) and in a full Vitest run just before (117 files, 1103 tests). The consumer build was then run alone and passed. The group's own suite has 8 files and 98 tests, all passing.
- **`composer test:unit`.** 1223 tests: 1216 passed and 7 skipped.

### What is left

- Nothing in this group's tasks.
- `<AtriumScreen>` renders every slot it does not place, `row.actions` included, after the page content with a null record. So a `row.actions` section also shows once below the transfers page, outside any row. Fixing that is in `components/Atrium/Screen.vue`, which is outside this group.
- The Polycart flake above belongs to group 17's test file.
- `nuxt/layer/.nuxtrc` is still untracked and not committed. It is outside the group.

## Group 26 (salvaged)

The build agent ended without a result. There was no index lock and no merge or rebase in progress.

### What was found

Every file of the group was on disk, uncommitted, and complete:

- PHP: `src/Integrations/Hooks/` holds the abstract `Hook` (target and slot validation, which throws in `local`/`testing` and reports and skips elsewhere; screen matching against the screens registered integrations declare; a per-request gate that requires both integrations to be active), the `Hooks` registrar (runs each hook and adds each extension once per screen, so registering again is safe), `CortexRedirectDomains`, `ImpexRunLink` and `KeenHistory`. `IntegrationsServiceProvider` binds `Hooks` as a singleton and runs it in the `booted` callback, after `IntegrationRegistry::register()`. The labels are in `lang/en/integrations/hooks.php`.
- `tests/Feature/Integrations/HooksTest.php` (40 tests): the defaults, a changed config, invalid targets and slots in `testing`, `local` and `production`, each hook absent while its other integration is not registered, Keen history on every screen except Keen's own, the `atrium.screens.show` payloads of `roster.organization`, `roster.user` and `showroom.transfers`, Pennant flags hiding the hooks, boot order, and label keys.
- Layer: `app/integrations/hooks/index.ts` registers `cortex.mcp` and `cortex.redirect-domains` (`CortexRedirectDomains.vue`), `impex.run-link` (`ImpexRunLink.vue`), `keen.history` (`KeenHistorySection.vue`) and `keen.activity` (`KeenActivityTab.vue`). Both Keen components use `KeenHookEntries.vue`, which checks `keen.packages.index`, renders Keen's `KeenEntriesTable` from group 15, and renders nothing on a 403. The query builders are in `components/hooks.ts`. The strings are in `hooks.en.json`.
- Vitest: `test/integrations/hooks/` has `redirect-domains`, `run-link`, `keen` and `registration` (26 tests).

### What was done

Nothing needed changing. I ran the gates and committed the group's paths.

### Results

- **`composer test:unit`.** 1263 tests: 1256 passed and 7 skipped. `HooksTest.php` alone: 40 of 40 passed.
- **`composer test:nuxt`.** It ran with the pnpm shim (D-041) on PATH. Every step passed: the fixtures check, the frozen install, `generate:client --check`, the typechecks, the build, Vitest (121 files, 1129 tests) and the consumer build.
- **`composer analyse`** and **Pint** on the group's PHP files passed.

### What is left

- Nothing in this group's tasks.
- `nuxt/layer/.nuxtrc` is still untracked and not committed. It is outside the group.

## Group 28

Integration docs, changelog and release checks (AC 76, 77).

### Files

- `README.md`: a new "Suite integrations" section in place of the stale "Managing Pennant feature flags" one. It covers detection and `enabled`, the API base (with `polycart.routes.enabled` and `roster.routes.enabled` behind auth), the Pennant flags (with per-user `deactivate()`), the hook keys and their defaults, the `/{pkg}/` Nuxt routes, the vendored clients and `sync:clients`, Atrium's `openapi.json` and client, and the parity departures (D-031, D-032). Also `atrium.screens.show` in the API table, the shell additions, `integrations` in the config table, the `Integrations` domain in the layout table, and the PennantPlus resolver lines (PennantPlus v2 no longer registers `Atrium::resolveFeaturesUsing()`).
- `CHANGELOG.md` (v2.0.0): upgrade step 8; a "Suite integrations" section with the replaced package keys (every `{pkg}.ui.*` and `{pkg}.atrium.*` key and `pennantplus.atrium.resolve_features`, each mapped to its replacement), the five `{Pkg}SupportFeature` classes and their `{Pkg}Feature` replacements, the parity changes, every `// Not ported (D-032)` item from the seven `index.ts` files and the six Roster and Showroom area index pages, and the D-020 release step. Plus two "Added" entries: the integrations, and the OpenAPI document and client.
- `.github/pull_request_template.md`: the D-020 and D-037 release items (Polycart's `/client` export-ignore, the pnpm git dependencies, the Keystone constraint), each with an owner, plus manual checks for the new README and CHANGELOG sections and the new standard.
- `docs/agent/standards/atrium/integrations.md` (new). `docs/agent/standards/atrium/components.md` and `domains.md` updated.
- `resources/boost/skills/atrium-development/SKILL.md`: a new step, "5. Suite integrations" (the later steps are renumbered), and the PennantPlus resolver line.
- `AGENTS.md`, the target of the `CLAUDE.md` symlink: the `Integrations` domain, the integrations conventions, the layer's integration folders, and two quick commands.
- `tests/Feature/DocsTest.php`, `tests/Feature/ChangelogUpgradeTest.php`.
- `docs/agent/specs/.../tasks.md`: tasks 28.1 to 28.5 ticked.

### Tests

- New `DocsTest` cases check the README "Suite integrations" section (detection, API base, Pennant, every hook key with its default, each `/{pkg}/` route, the screen route and the unavailable page, `sync:clients`, the OpenAPI commands, the parity departures), the API table, the agent docs and the new standard. They also check the index entry, which is skipped when the index is absent, and that every PR-template release item names an owner.
- New `ChangelogUpgradeTest` cases check the integrations, `atrium.screens.show`, the shell additions, all 17 replaced package keys with their replacements, the 5 support features, and the parity changes. They also check a "Not ported (D-032)" heading per source file, whose comment the test reads from the layer, and 16 named left-out items. The D-020 release step and the OpenAPI entries are checked too.
- Before the docs were written, 93 of these tests failed. After: `DocsTest` and `ChangelogUpgradeTest` pass (169 tests).
- `composer test` passed: PHPStan, Pint, type coverage at 100%, and Pest with 1357 tests (1350 passed, 7 skipped). A serial `vendor/bin/pest` gave the same counts.
- `composer test:nuxt` passed with the pnpm shim (D-041): the fixtures check, the frozen install, `generate:client --check`, the typechecks, the build, Vitest (121 files, 1129 tests) and the consumer build.
- `vendor/bin/ringside check` passed after `ringside sync`.

### Deviations

- `CLAUDE.md` is a symlink to `AGENTS.md`, so the `CLAUDE.md` changes are committed in `AGENTS.md`, which is outside the listed files.
- `docs/agent/standards.index.yml` is git-ignored and generated. `vendor/bin/ringside sync` lists `atrium/integrations` in it locally, but no tracked file changes. For that reason the index test in `DocsTest` skips when the file is missing in a fresh checkout. The standard's front matter, which the index is built from, is asserted unconditionally.
- `nuxt/layer/.nuxtrc` is still untracked and not committed. It is outside the group.

### Retry

- Re-checked tasks 28.1 to 28.5 against AC 76 and 77. The README "Suite integrations" section, the CHANGELOG v2.0.0 integrations entries, the Boost skill, `AGENTS.md` (`CLAUDE.md`), the `atrium/integrations` standard and its index entry, the updated `atrium/components` and `atrium/domains`, the PR template release items with owners, `DocsTest` and `ChangelogUpgradeTest` were all already in commit `befdfd6`. No file changes were needed.
- `composer test:unit`: 1357 tests (1350 passed, 7 skipped). `composer test`: PHPStan 0 errors, Pint passed, type coverage 100%, Pest the same counts. Nothing under `nuxt/` changed since the `composer test:nuxt` run recorded above.

## Spec review rework, round 1

### Fixes

- Security (minor): the impersonation start on `roster.user` called `navigateTo(url, { external: true })` on whatever URL Roster returned. `nuxt/layer/app/utils/atriumLink.ts` now exports `isExternalUrl()`, the absolute http(s) check `atriumLink` already used. `atriumLink`'s own `isFollowable()` now calls it too. `nuxt/layer/app/pages/roster/users/[user].vue` follows the link only when `isExternalUrl()` accepts it. Any other link (`javascript:`, `data:`, `//host`, a relative path, or an empty one) fails the action, and the impersonate card shows the new `roster.users.impersonate.unsafe_link` message (`nuxt/layer/i18n/locales/integrations/roster-users.en.json`).

### Tests

- `test/integrations/roster/users/user.test.ts`: a new case, run for `javascript:`, `data:`, `//evil.test/…`, `/roster/…` and empty links. In each, the POST is made, `navigateTo` is never called, and the error is shown. These cases would fail against the old code, which navigated to any non-empty URL.
- `test/navigation.test.ts`: `isExternalUrl()` accepts http(s) URLs and refuses `javascript:`, `data:`, scheme-relative, backslash, relative, padded, host-less, `ftp:` and empty URLs.
- Both Vitest files pass (36 tests, no type errors), and `nuxt typecheck` passes. `composer test:unit`: 1357 tests (1350 passed, 7 skipped).

## Group 29

Client sync and Roster role removal (AC 78, 99).

### Files

- `nuxt/scripts/sync-clients.mjs`: `guardian: 'Guardian'`. `pnpm -C nuxt sync:clients guardian roster` ran against the D-040 suite folder (Guardian at `42b1e17`, Roster's addendum build at `de2d7ab`); both builds were present, so D-039 did not apply.
- `nuxt/layer/app/integrations/guardian/client/` (new) and `roster/client/` (re-synced, no role or permission operations).
- PHP: `RosterIntegration` drops the Roles and Permissions nav items and the `roster.roles`, `roster.role` and `roster.permissions` screens; `lang/en/integrations/roster.php` drops `roles` and `permissions`; `roster.json` regenerated.
- Layer: deleted `pages/roster/roles/**`, `pages/roster/permissions/**`, `RolePermissions.vue`, `RosterUserRoles.vue`, `OrganizationRoles.vue` and `access/access.ts` (all of it was role and permission helpers; `AccessState.vue`, which transfers use, stays). Dropped `RosterRole`, `RosterRoleAssignment`, `RosterEffectivePermissions` (`users.ts`), `RosterOrganizationAssignment` and the `roles` tab (`organizations.ts`). `[user].vue` and `[organization]/index.vue` no longer load roles. The screens map, the role and permission locale keys and the three role Vitest files are gone. The `// Not ported (D-032)` comment moved to the top of `pages/roster/transfers/index.vue`, without its role and permission items.
- Tests: `VendoredClientsTest` (guardian, and no removed Roster operation in the vendored `openapi.json`), `RosterIntegrationTest` (four nav items, 11 screens, no role labels), `roster/integration.test.ts` (11 keys), the new `roster/removed-access.test.ts` (greps `app/` and `test/`), and the user, organization, pages and support files.

### Deviations

- `CHANGELOG.md`, `README.md` and `tests/Feature/ChangelogUpgradeTest.php` (group 37's files) changed here: the D-032 heading follows the comment to `pages/roster/transfers/index.vue` ("Roster transfers"), and the README route table drops `/roster/roles` and `/roster/permissions`. Without this, `ChangelogUpgradeTest` fails on the deleted page. Group 37 adds the Guardian entries.
- `test/integrations/support.ts` now exports `filesUnder()` and `layerRoot`, for the grep test.

### Tests

- `composer test:unit` (with `ATRIUM_SUITE_PATH`): 1362 tests, all passed.
- `composer test:nuxt` (pnpm shim, D-041): every step passed; Vitest 119 files, 1099 tests, no type errors.
