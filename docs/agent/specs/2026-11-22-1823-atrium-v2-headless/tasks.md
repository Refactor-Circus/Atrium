# Tasks: Atrium v2 headless

The spike is the starting point. Its code is on branch `spike/v2-headless` at commit `2607d9a`, in worktree `../Atrium--v2-headless`. Port from it with `git show 2607d9a:<path>`, then apply the spec's corrections (route files, slug binding, resource placement, exception hierarchy, uuids, versioning). Never edit the spike worktree.

## Group 1: Support primitives and config
depends on: none
files: src/Support/JsonData.php, src/Support/ClientPath.php, src/Support/Iconify.php, src/Exceptions/UnserializableDataException.php, src/Atrium.php, src/AtriumServiceProvider.php, config/atrium.php, tests/Unit/Support/JsonDataTest.php, tests/Unit/Support/ClientPathTest.php, tests/Unit/Support/IconifyTest.php, tests/Feature/ConfigTest.php, tests/Feature/RemovedConfigKeysTest.php
criteria: 13, 14, 18, 29, 33, 37

- [x] 1.1 Write tests for: `JsonData::check()`: every accepted and rejected type, Carbon, Enum, model `toArray()` with `$hidden`, Collection, the depth limit, the cycle guard, and the exact message format; a `JsonData::resolve(owner, callable)` guard: it isolates failures to `data: null` + `error` outside `local`/`testing` and reports them, and it rethrows in `local`/`testing` (AC 33); the `ClientPath` table (AC 14 bypass forms, the `app.url` host, `client_path` root and non-root, null on rejection); `Iconify::assert()` (the pattern; `lucide:home`, SVG and `i-home` fail); the config banner grep; the removed-key warning: once per process, `Log::spy()`
- [x] 1.2 Port `JsonData` and `ClientPath` from the spike and harden them as in the spec. Add `Iconify`. Make `UnserializableDataException` `final`, extending `AtriumException`, with `::forValue()` and status 500.
- [x] 1.3 Config: add the `routes` section with the full banner (AC 18) and `client_path`; remove `path`, `domain`, `middleware`, `alpine` and `logout_route`; keep `theme`
- [x] 1.4 Add `Atrium::API_VERSION = '2.0'`. Add the boot-time removed-key warning in `AtriumServiceProvider`.
- [x] 1.5 Run vendor/bin/pest; all green

## Group 2: Extension contract and icons on definitions
depends on: 1
files: src/Domains/Navigation/Data/NavItem.php, src/Domains/Navigation/Data/NavGroup.php, src/Domains/Widgets/Data/WidgetDefinition.php, src/Domains/Screens/Data/TabDefinition.php, src/Domains/Screens/Data/SectionDefinition.php, src/Domains/Screens/Concerns/DefinesExtension.php, src/Domains/Settings/Data/SettingsPanel.php, src/Domains/Search/Data/SearchResult.php, src/Domains/Themes/Data/Theme.php, tests/Unit/ExtensionContractTest.php
criteria: 11, 15

- [x] 2.1 Write tests: `component()` defaults to the key and can be overridden; `view()` is absent (reflection) on every listed definition; each `icon()` setter throws `InvalidArgumentException` for a non-Iconify value, and the theme swatch icons do the same
- [x] 2.2 Remove `view()`, and add `component` as `public private(set)` with a fluent setter. `icon()` setters validate through `Iconify::assert()`. Drop inline-SVG support.
- [x] 2.3 Run this group's own test files, PHPStan and Pint; all green (D-014: the full suite may stay red until group 6)

## Group 3: Dashboard and widget API
depends on: 2
files: database/migrations/2026_11_22_000000_add_uuid_and_version_to_atrium_dashboards.php, src/Domains/Dashboard/Models/*, src/Domains/Dashboard/Resources/DashboardResource.php, src/Domains/Dashboard/Resources/DashboardWidgetResource.php, src/Domains/Dashboard/Actions/*, src/Domains/Dashboard/Data/*, src/Domains/Dashboard/Http/**, src/Domains/Dashboard/routes.php, src/Domains/Dashboard/DashboardServiceProvider.php, src/Domains/Dashboard/Services/*, src/Domains/Widgets/Http/**, src/Domains/Widgets/routes.php, src/Domains/Widgets/WidgetsServiceProvider.php, src/Domains/Widgets/Services/*, tests/Feature/Api/DashboardApiTest.php, tests/Feature/Api/DashboardLayoutApiTest.php, tests/Feature/Api/WidgetApiTest.php, tests/Feature/PlacementUuidMigrationTest.php, tests/Feature/DashboardLayoutTest.php, tests/Feature/DashboardPersistenceTest.php, tests/Feature/DashboardRoutesTest.php, tests/Feature/LazyWidgetTest.php, tests/Feature/WidgetRegistryTest.php, tests/Feature/RequestPersistTest.php, tests/Modes/**
criteria: 6, 7, 8, 9, 10, 30, 32, 33

- [x] 3.1 Write tests: reads never write (row counts), and the `{"data": null}` default; the exact `DashboardResource` shape: no `id`; lazy `data` absent; orphan `component: null`; `version`; `meta.abilities` on show, default, store, update and layout; destroy returns 204; scoped `{widget:uuid}` 404, orphan lazy 404, foreign uuid 422; the migration backfill (chunked, distinct, unique, not null, `down()`), under the default and RenamedTables modes; the v1 no-uuid payload end state; full-layout semantics: omit deletes, orphans are kept, rollback on failure; the `version` 409 on layout and update (match, mismatch, two sequential writes); eager widget isolation in production vs 500 in testing; the widget catalogue; 422 on invalid store, update and layout; Rewrite or delete the listed Blade-era Dashboard and Widget tests.
- [x] 3.2 Write the migration: add `uuid` and `version` to the dashboard widgets and dashboards tables via `Tables::name()`, with a chunked backfill. Use `HasUuids` on `uuid` only.
- [x] 3.3 Resources sit beside the models (`final`, `@mixin`, Keystone `JsonResource`). Each `{Verb}DashboardRequest::persist()` calls the action and returns a resource or 204. Controllers are one line. Bind by `{dashboard:slug}` in `routes.php`, with scoped bindings.
- [x] 3.4 The layout action applies full-layout semantics and the version check inside one `DB::transaction()`. Eager widget data goes through `JsonData::resolve()`.
- [x] 3.5 Delete the Blade dashboard controllers and requests, and the first-visit auto-create.
- [x] 3.6 Run this group's own test files, PHPStan and Pint; all green (D-014: the full suite may stay red until group 6)

## Group 4: Shell, navigation, search, settings and screens API
depends on: 2
files: src/Domains/Navigation/Http/**, src/Domains/Navigation/Resources/**, src/Domains/Navigation/routes.php, src/Domains/Navigation/NavigationServiceProvider.php, src/Domains/Navigation/Services/*, src/Domains/Search/Http/**, src/Domains/Search/routes.php, src/Domains/Search/SearchServiceProvider.php, src/Domains/Settings/Http/**, src/Domains/Settings/routes.php, src/Domains/Settings/SettingsServiceProvider.php, src/Domains/Screens/Http/**, src/Domains/Screens/Services/*, src/Domains/Screens/ScreensServiceProvider.php, src/Domains/Themes/Services/*, src/Domains/Access/**, src/Support/ScreenAccess.php, tests/Feature/Api/ShellApiTest.php, tests/Feature/Api/SearchApiTest.php, tests/Feature/Api/SettingsApiTest.php, tests/Feature/Api/ScreenApiTest.php, tests/Feature/ShellTest.php, tests/Feature/NavigationTest.php, tests/Feature/NavigationSectionsTest.php, tests/Feature/NavigationAccessTest.php, tests/Feature/SearchTest.php, tests/Feature/SettingsTest.php, tests/Feature/ThemesTest.php, tests/Feature/ScreenAccessTest.php, tests/Feature/Screens/**
criteria: 4, 11, 14, 33, 36

- [x] 4.1 Write tests: the exact `ShellResource` structure: `locale`, `api_version`, every theme field, panel summaries, and `atrium.theme` reflected as the built-in theme's properties; nav and search `link` via `ClientPath`, with `link: null` on rejection; search `min_length` 422; `?tab=`: open-tab-only resolution (counter), unknown-tab fallback; screen and settings eager failure isolation vs 500; Rewrite or delete the listed Blade-era tests.
- [x] 4.2 Write `ShellResource`, `SettingsPanelResource`, `SearchResultResource`, `ResolvedScreenResource` (`final`, under `Http/Resources`) and the one-line controllers, with each domain's `routes.php` (the Navigation domain gains one).
- [x] 4.3 Delete the Blade controllers for shell, search, settings and screens. Delete `AuthorizesScreens` if unused.
- [x] 4.4 Run this group's own test files, PHPStan and Pint; all green (D-014: the full suite may stay red until group 6)

## Group 5: Route group, auth and plugins
depends on: 3, 4
files: src/Support/ServiceProvider.php, src/Domains/Access/Http/Middleware/Authorize.php, src/Domains/Plugins/**, src/Domains/Domains/DomainServiceProvider.php, tests/Feature/Api/RoutesApiTest.php, tests/Feature/Api/AuthApiTest.php, tests/Feature/PluginRoutesTest.php, tests/Feature/PluginFeatureRoutesTest.php, tests/Feature/PluginRegistryTest.php, tests/Feature/PluginDiscoveryTest.php, tests/Feature/ConfiguredPathTest.php, tests/Feature/PolicyTest.php, tests/Fixtures/**
criteria: 1, 2, 3, 5, 12

- [ ] 5.1 Write tests: the exact route-name list; `enabled: false` registers nothing; no `api.php` and no `loadDashboardRoutesFrom`; a guest gets 401 JSON with any `Accept` header and with no guard configured; the gate gives 403 outside `local` and passes in `local`, with a test guard; 403 for view-only users on mutations; every `atrium.*` route carries the group middleware, with `Authorize` last; plugin routes are named `atrium.plugins.{key}.*`, and a disabled plugin's route returns 404
- [ ] 5.2 Move route loading onto Keystone's `loadApiRoutesFrom()` and remove `loadDashboardRoutesFrom()`. `Authorize` returns 401 JSON for a null user. Force JSON rendering in the group.
- [ ] 5.3 `Plugin::routes()` registers inside the API group, under the `plugins/{key}` prefix and the `plugins.{key}.` name, keeping the feature middleware.
- [ ] 5.4 Run this group's own test files, PHPStan and Pint; all green (D-014: the full suite may stay red until group 6)

## Group 6: Remove the Blade UI
depends on: 5
files: resources/**, public/**, bin/build-css.mjs, package.json, package-lock.json, src/Support/Icons.php, src/Support/StyleRegistry.php, src/Testing/AtriumStyles.php, src/Facades/Atrium.php, src/Atrium.php, src/AtriumServiceProvider.php, src/Http/**, src/Domains/*/ *ServiceProvider.php (view loading only), .gitattributes, .github/workflows/browser-tests.yml, tests/Browser/**, tests/BrowserTestCase.php, tests/ArchTest.php, tests/Feature/RemovalTest.php, tests/Feature/FacadeDocblockTest.php, tests/Feature/AtriumStylesTest.php, tests/Feature/ComponentLibraryTest.php, tests/Feature/IconsTest.php, tests/Feature/PaginationComponentTest.php, tests/Feature/SharedComponentsTest.php, tests/Feature/UserMenuTest.php, tests/Feature/HistoryRemovedTest.php, tests/Feature/DomainLayoutTest.php, composer.json
criteria: 10, 16, 17

- [ ] 6.1 Write tests: the removal test (files, classes, config keys, `package.json` CSS scripts and deps); the facade `@method` reflection test; `.gitattributes` `export-ignore` for `nuxt/`, `workbench/` and the tests; the token guard exists only under `workbench/`; ArchTest: no `view(`, `Illuminate\View` or `Blade::` in `src/`; controllers are single-line `persist()` returns
- [ ] 6.2 Delete the views, CSS, icons, the public build, `StyleRegistry`, `Icons`, `AtriumStyles`, `css()`/`stylesheet()`, the view and component registration, the browser suite and workflow, and the CSS npm build. Update the facade docblock, the `composer.json` scripts (drop `test:browser` and `build:css`) and `.gitattributes`.
- [ ] 6.3 Run vendor/bin/pest and composer test; all green

## Group 7: Workbench, contract fixtures and API version
depends on: 6
files: workbench/**, tests/Feature/Api/ContractFixturesTest.php, tests/Feature/ApiVersionTest.php, nuxt/layer/test/fixtures/*.json
criteria: 21, 28, 31

- [ ] 7.1 Write tests: the fixture comparison for shell, dashboard, resolved screen and settings: seeded uuids, frozen time, writes only with `UPDATE_FIXTURES=1`; `Atrium::API_VERSION` equals the major.minor in `nuxt/layer/package.json`, and the test is skipped with a clear message until group 8 creates the file
- [ ] 7.2 Workbench: demo plugins register API routes and their widgets/panel keys; port `AuthenticateWorkbenchToken` (marked workbench-only) and the CORS setup from the spike; remove the Blade demo views
- [ ] 7.3 Generate the fixtures with `UPDATE_FIXTURES=1` and commit them.
- [ ] 7.4 Run vendor/bin/pest; all green

## Group 8: Nuxt layer and playground
depends on: 7
files: nuxt/**, composer.json (test:nuxt script), .nvmrc, .github/workflows/nuxt.yml
criteria: 19, 20, 22, 25, 26, 27, 28, 34, 35

- [ ] 8.1 Write the Vitest suites (`nuxt/layer/test/**`) for every AC 22 case: registry and fallback, the 401 hook, empty-list create, lazy fetch by uuid, the tab switch, theme switching; ⌘K search links and `noopener`, nav `link`/`badge`, the grid layout payload with `version`, and a 409 reload; settings and screen render, the per-placement `error` card; the Iconify render and unknown-icon fallback; a locale switch with a test-only second locale; the version banner: equal, minor and major mismatch; fixtures checked with `satisfies` against the TS types
- [ ] 8.2 Port `nuxt/layer` and `nuxt/playground` from the spike, with pinned versions, `packageManager`, `.nvmrc` and the lockfile; no `workspace:` dependencies in the layer. Then: add `@nuxtjs/i18n` with `en` only, and switch to the shell `locale`; add `@iconify-json/lucide` with a local `serverBundle`, the remote API as an opt-in, and a fallback icon; add the version banner, the error card, and 409 handling with a reload and a notice; send `version` and the uuids in the layout payload
- [ ] 8.3 Add the `composer test:nuxt` script: frozen install, typecheck, build, Vitest, fail when the fixtures are missing, and a temp-directory consumer build of `nuxt/layer`. Add the CI job `.github/workflows/nuxt.yml`.
- [ ] 8.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 9: Docs, upgrade guide and release checks
depends on: 8
files: README.md, CHANGELOG.md, CLAUDE.md, resources/boost/**, docs/agent/standards/atrium/components.md, docs/agent/standards/atrium/domains.md, .github/pull_request_template.md, tests/Feature/DocsTest.php, tests/Feature/ChangelogUpgradeTest.php
criteria: 23, 24, 25

- [ ] 9.1 Write tests: the v2.0.0 CHANGELOG section names every removed symbol, config key and route from AC 16, the published-view cleanup and the migration step; update `DocsTest` for the new README sections
- [ ] 9.2 README: install, host auth (cookie with CORS/CSRF, token with the `Authorization` header, token storage owned by the host, the workbench guard not for production), the `local` gate warning, layer `extends` with `GIGET_AUTH`, SHA pinning, `client_path`, adding icon packs.
- [ ] 9.3 CHANGELOG v2.0.0 upgrade guide. Rewrite the Boost skill, the `CLAUDE.md` frontend section, and the local standards `atrium/components` and `atrium/domains`. Add PR template checklist items: the MySQL/Postgres migration check, the sibling `^1` constraint grep, the protected `v*` tags, and the manual doc items with their owner.
- [ ] 9.4 Run composer test and composer test:nuxt; all green
