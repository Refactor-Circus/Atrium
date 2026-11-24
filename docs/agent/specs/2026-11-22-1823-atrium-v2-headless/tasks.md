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

- [x] 5.1 Write tests: the exact route-name list; `enabled: false` registers nothing; no `api.php` and no `loadDashboardRoutesFrom`; a guest gets 401 JSON with any `Accept` header and with no guard configured; the gate gives 403 outside `local` and passes in `local`, with a test guard; 403 for view-only users on mutations; every `atrium.*` route carries the group middleware, with `Authorize` last; plugin routes are named `atrium.plugins.{key}.*`, and a disabled plugin's route returns 404
- [x] 5.2 Move route loading onto Keystone's `loadApiRoutesFrom()` and remove `loadDashboardRoutesFrom()`. `Authorize` returns 401 JSON for a null user. Force JSON rendering in the group.
- [x] 5.3 `Plugin::routes()` registers inside the API group, under the `plugins/{key}` prefix and the `plugins.{key}.` name, keeping the feature middleware.
- [x] 5.4 Run this group's own test files, PHPStan and Pint; all green (D-014: the full suite may stay red until group 6)

## Group 6: Remove the Blade UI
depends on: 5
files: resources/**, public/**, bin/build-css.mjs, package.json, package-lock.json, src/Support/Icons.php, src/Support/StyleRegistry.php, src/Testing/AtriumStyles.php, src/Facades/Atrium.php, src/Atrium.php, src/AtriumServiceProvider.php, src/Http/**, src/Domains/*/ *ServiceProvider.php (view loading only), .gitattributes, .github/workflows/browser-tests.yml, tests/Browser/**, tests/BrowserTestCase.php, tests/ArchTest.php, tests/Feature/RemovalTest.php, tests/Feature/FacadeDocblockTest.php, tests/Feature/AtriumStylesTest.php, tests/Feature/ComponentLibraryTest.php, tests/Feature/IconsTest.php, tests/Feature/PaginationComponentTest.php, tests/Feature/SharedComponentsTest.php, tests/Feature/UserMenuTest.php, tests/Feature/HistoryRemovedTest.php, tests/Feature/DomainLayoutTest.php, composer.json
criteria: 10, 16, 17

- [x] 6.1 Write tests: the removal test (files, classes, config keys, `package.json` CSS scripts and deps); the facade `@method` reflection test; `.gitattributes` `export-ignore` for `nuxt/`, `workbench/` and the tests; the token guard exists only under `workbench/`; ArchTest: no `view(`, `Illuminate\View` or `Blade::` in `src/`; controllers are single-line `persist()` returns
- [x] 6.2 Delete the views, CSS, icons, the public build, `StyleRegistry`, `Icons`, `AtriumStyles`, `css()`/`stylesheet()`, the view and component registration, the browser suite and workflow, and the CSS npm build. Update the facade docblock, the `composer.json` scripts (drop `test:browser` and `build:css`) and `.gitattributes`.
- [x] 6.3 Run vendor/bin/pest and composer test; all green

## Group 7: Workbench, contract fixtures and API version
depends on: 6
files: workbench/**, tests/Feature/Api/ContractFixturesTest.php, tests/Feature/ApiVersionTest.php, nuxt/layer/test/fixtures/*.json
criteria: 21, 28, 31

- [x] 7.1 Write tests: the fixture comparison for shell, dashboard, resolved screen and settings: seeded uuids, frozen time, writes only with `UPDATE_FIXTURES=1`; `Atrium::API_VERSION` equals the major.minor in `nuxt/layer/package.json`, and the test is skipped with a clear message until group 8 creates the file
- [x] 7.2 Workbench: demo plugins register API routes and their widgets/panel keys; port `AuthenticateWorkbenchToken` (marked workbench-only) and the CORS setup from the spike; remove the Blade demo views
- [x] 7.3 Generate the fixtures with `UPDATE_FIXTURES=1` and commit them.
- [x] 7.4 Run vendor/bin/pest; all green

## Group 8: Nuxt layer and playground
depends on: 7
files: nuxt/**, composer.json (test:nuxt script), .nvmrc, .github/workflows/nuxt.yml
criteria: 19, 20, 22, 25, 26, 27, 28, 34, 35

- [x] 8.1 Write the Vitest suites (`nuxt/layer/test/**`) for every AC 22 case: registry and fallback, the 401 hook, empty-list create, lazy fetch by uuid, the tab switch, theme switching; ⌘K search links and `noopener`, nav `link`/`badge`, the grid layout payload with `version`, and a 409 reload; settings and screen render, the per-placement `error` card; the Iconify render and unknown-icon fallback; a locale switch with a test-only second locale; the version banner: equal, minor and major mismatch; fixtures checked with `satisfies` against the TS types
- [x] 8.2 Port `nuxt/layer` and `nuxt/playground` from the spike, with pinned versions, `packageManager`, `.nvmrc` and the lockfile; no `workspace:` dependencies in the layer. Then: add `@nuxtjs/i18n` with `en` only, and switch to the shell `locale`; add `@iconify-json/lucide` with a local `serverBundle`, the remote API as an opt-in, and a fallback icon; add the version banner, the error card, and 409 handling with a reload and a notice; send `version` and the uuids in the layout payload
- [x] 8.3 Add the `composer test:nuxt` script: frozen install, typecheck, build, Vitest, fail when the fixtures are missing, and a temp-directory consumer build of `nuxt/layer`. Add the CI job `.github/workflows/nuxt.yml`.
- [x] 8.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 9: Docs, upgrade guide and release checks
depends on: 8
files: README.md, CHANGELOG.md, CLAUDE.md, resources/boost/**, docs/agent/standards/atrium/components.md, docs/agent/standards/atrium/domains.md, .github/pull_request_template.md, tests/Feature/DocsTest.php, tests/Feature/ChangelogUpgradeTest.php
criteria: 23, 24, 25

- [x] 9.1 Write tests: the v2.0.0 CHANGELOG section names every removed symbol, config key and route from AC 16, the published-view cleanup, the migration step and the removed `Atrium::path()`/`url()` (D-016); update `DocsTest` for the new README sections
- [x] 9.2 README: install, host auth (cookie with CORS/CSRF, token with the `Authorization` header, token storage owned by the host, the workbench guard not for production), the `local` gate warning, layer `extends` with `GIGET_AUTH`, SHA pinning, `client_path`, adding icon packs.
- [x] 9.3 CHANGELOG v2.0.0 upgrade guide. Rewrite the Boost skill, the `CLAUDE.md` frontend section, and the local standards `atrium/components` and `atrium/domains`. Add PR template checklist items: the MySQL/Postgres migration check, the sibling `^1` constraint grep, the protected `v*` tags, and the manual doc items with their owner.
- [x] 9.4 Run composer test and composer test:nuxt; all green

## Group 10: Archive rules and path helpers (D-015, D-016)
depends on: 6
files: .gitattributes, tests/Feature/RemovalTest.php, tests/Feature/FacadeDocblockTest.php, src/Atrium.php, src/Facades/Atrium.php, src/Domains/Navigation/Data/NavItem.php, tests/Unit/NavItemActiveTest.php
criteria: 16

- [x] 10.1 Write tests: `RemovalTest` asserts the dev parts of `nuxt/` are export-ignored and `/nuxt/layer` is not; `Atrium::path()`/`url()` no longer exist and the facade docblock matches; `NavItem::isActive()` does not read `atrium.path`
- [x] 10.2 Narrow the `nuxt/` export-ignore rules (D-015); remove `Atrium::path()`/`url()` and their `@method` lines; update `NavItem::isActive()` (D-016)
- [x] 10.3 Run vendor/bin/pest and composer test; all green

---

# Suite integrations (addendum 2026-11-23, AC 38 to 77)

The seven packages must be built first: each package's v2 `openapi.json` and `client/src/schema.d.ts` must be in its sibling checkout (`../{Pkg}`, or `$ATRIUM_SUITE_PATH/{Pkg}`). Old UIs to port, read-only, are in each package's main checkout, under `src/Atrium` and `resources/views`. Never edit them. Atrium PHP never imports a package class (AC 45).

Every layer group runs `composer test:nuxt` beside `vendor/bin/pest`. The package groups list dropped v1 actions in a `// Not ported (D-032)` comment, at the top of their `index.ts` or, for the split Roster and Showroom screen groups, of their area's index page. Group 28 collects them.

## Group 11: Integration framework (PHP)
depends on: none
files: config/atrium.php, src/Domains/Integrations/**, src/Domains/DomainServiceProvider.php, src/AtriumServiceProvider.php, src/Integrations/Cortex/CortexFeature.php, src/Integrations/Impex/ImpexFeature.php, src/Integrations/Keen/KeenFeature.php, src/Integrations/PennantPlus/PennantPlusFeature.php, src/Integrations/Polycart/PolycartFeature.php, src/Integrations/Roster/RosterFeature.php, src/Integrations/Showroom/ShowroomFeature.php, src/Domains/Navigation/Data/NavItem.php, src/Domains/Navigation/Http/Resources/ShellResource.php, src/Domains/Navigation/Http/Requests/ShowShellRequest.php, src/Domains/Navigation/Http/Controllers/ShellController.php, src/Domains/Screens/Http/Resources/ResolvedScreenResource.php, src/Domains/Screens/Services/ScreenExtensions.php, tests/Fixtures/Integrations/**, tests/Feature/Integrations/IntegrationConfigTest.php, tests/Feature/Integrations/RegistrationTest.php, tests/Feature/Integrations/ApiBaseTest.php, tests/Feature/Integrations/FeatureFlagsTest.php, tests/Feature/Integrations/ScreenRouteTest.php, tests/Feature/Integrations/NoPackageCodeTest.php, tests/Feature/SurfaceTest.php, tests/Unit/NavItemLiveTest.php, tests/Feature/Api/RoutesApiTest.php, tests/Feature/Api/AuthApiTest.php, tests/Feature/Api/ShellApiTest.php, tests/Feature/Api/ContractFixturesTest.php, tests/ArchTest.php, nuxt/layer/test/fixtures/shell.json, nuxt/layer/test/fixtures/shell-integrations.json, docs/agent/standards-feedback.md
criteria: 38, 39, 40, 41, 42, 43, 44, 45, 46

- [x] 11.1 Write tests for: the exact `atrium.integrations` default array and the banner points (AC 38); registration gating through a fake `InstalledPackages` and a fixture integration (installed and enabled; not installed; `enabled` false and `"false"`; registries equal the baseline when off); the API-base rules, with one warning per process (AC 40); Pennant flags with the array driver (off: shell `active: false`, its nav, widgets, panels and sources omitted, `widgets.index` omits it, `screens.show` 404; on; Pennant unavailable through the seam: on; `Gatekeeper` untouched); the shell `integrations`, `search.sources` and `search.per_source` exact structure, plus the `shell-integrations.json` fixture; the `NavItem::live()` setter, its key pattern and `live: {key, options}`; `atrium.screens.show` (declared screen, `record` echo, `?tab=` open-tab-only, unknown-tab fallback, 404 for unknown, undeclared or inactive, AC 33 isolation); the route list and gate tests including the new route; ArchTest and a `src/` grep: no `RefactorCircus\{Cortex,Impex,Keen,PennantPlus,Polycart,Roster,Showroom}`; `composer.json` `require` unchanged; `Surface::route('atrium.', 'atrium')`, with a spy and a resolution test.
- [x] 11.2 Build `src/Domains/Integrations/`: the `Integration` contract and its abstract base, which declares nav, widgets, a settings panel, search source descriptors and `ScreenDeclaration`s (key, kind, path, `subject_type`); the `InstalledPackages` contract and `ComposerInstalledPackages`; `IntegrationRegistry`, which finds `RefactorCircus\Atrium\Integrations\{Pkg}\{Pkg}Integration` from the config keys and skips a missing class; `IntegrationFeatures`, Pennant or all-on, behind an availability seam; `IntegrationsServiceProvider`, added to `DomainServiceProvider::$providers`. Integration nav items, widgets and panels are gated per request by `IntegrationFeatures` through `Gated::authorize()`.
- [x] 11.3 Add the seven `{Pkg}Feature` classes (`resolve()` returns true; no Pennant import). Add the `integrations` config section and its banner.
- [x] 11.4 Add `NavItem::live()`, the shell additions and `atrium.screens.show`: its controller, `Show{…}Request`, resource reuse and `routes.php` in the Integrations domain. Call `Surface::route('atrium.', 'atrium')` in `AtriumServiceProvider`.
- [x] 11.5 Add a test helper in `tests/Fixtures/Integrations/` that writes a package's declarations to `nuxt/layer/test/fixtures/integrations/{pkg}.json` under the AC 31 rules. Groups 13 to 22 use it. Regenerate `shell.json` and write `shell-integrations.json` with `UPDATE_FIXTURES=1`. Add the two standards-feedback rows (`architecture/dependencies`, `architecture/domain-modules`).
- [x] 11.6 Run vendor/bin/pest and composer test; all green

## Group 12: Layer integration framework
depends on: 11
files: nuxt/package.json, nuxt/pnpm-lock.yaml, nuxt/scripts/sync-clients.mjs, nuxt/layer/package.json, nuxt/layer/nuxt.config.ts, nuxt/layer/app/plugins/atrium.ts, nuxt/layer/app/plugins/atrium-integrations.ts, nuxt/layer/app/composables/useAtriumIntegration.ts, nuxt/layer/app/composables/useIntegrationQuery.ts, nuxt/layer/app/composables/useAtriumScreen.ts, nuxt/layer/app/composables/useAtriumSearch.ts, nuxt/layer/app/middleware/atrium-integration.global.ts, nuxt/layer/app/components/Atrium/IntegrationUnavailable.vue, nuxt/layer/app/components/Atrium/IntegrationScreen.vue, nuxt/layer/app/components/Atrium/NoAccess.vue, nuxt/layer/app/components/Atrium/Navigation.vue, nuxt/layer/app/components/Atrium/Search.vue, nuxt/layer/app/layouts/default.vue, nuxt/layer/app/layouts/public.vue, nuxt/layer/app/stores/atriumShell.ts, nuxt/layer/app/types/atrium.ts, nuxt/layer/app/integrations/*/client/**, nuxt/layer/i18n/locales/en.json, nuxt/layer/i18n/locales/integrations/*.en.json, nuxt/layer/test/integrations/support.ts, nuxt/layer/test/integration-client.test.ts, nuxt/layer/test/integration-routing.test.ts, nuxt/layer/test/integration-search.test.ts, nuxt/layer/test/integration-live.test.ts, nuxt/layer/test/integration-absent.test.ts, nuxt/layer/test/integration-i18n.test.ts, nuxt/layer/test/fixtures.test-d.ts, tests/Feature/Integrations/VendoredClientsTest.php
criteria: 47, 48, 49, 50, 51, 52, 53

- [x] 12.1 Write tests: Vitest: `useAtriumIntegration()` base resolution (host override, absolute and relative `apiBase`, page origin), with caching, and `null` when inactive; one adapter: headers, credentials and `Accept` on two integration clients plus Atrium's, and `onUnauthorized()` on a 401 from any of them; the global middleware: `<AtriumIntegrationUnavailable>` for absent, disabled and flagged-off integrations, with no package `fetch`; a public page skips the shell; ⌘K fan-out, with a 403 or rejecting source dropped and the link guard applied; `live` resolvers for badge and children; a shell with `integrations: []` renders no integration UI; `<AtriumIntegrationScreen>` fetches `atrium.screens.show` with key, `record` and `tab`, and renders tabs, sections and `NoAccess` on 403; the i18n key check helper; fixtures `satisfies` the new shell types; Pest `VendoredClientsTest`: each stamp matches its `openapi.json`; with a sibling checkout present, both files equal the sibling's; otherwise skipped with the `sync:clients` message; no `@refactor-circus/*-client` import under `nuxt/`
- [x] 12.2 Write `nuxt/scripts/sync-clients.mjs` and the `sync:clients` script (D-020). It fails naming the package and path when a source is missing (D-039). Run it for all seven packages and commit the vendored `client/` folders.
- [x] 12.3 Add a pinned `openapi-fetch` to `nuxt/layer/package.json` and update the lockfile.
- [x] 12.4 Write `useAtriumIntegration()` with the auth middleware, and `useIntegrationQuery()` for one shared request per integration per dashboard load.
- [x] 12.5 Add the registry's `searchSource()` and `live()`, the integrations plugin (it loads `app/integrations/*/index.ts` through `import.meta.glob`), the global middleware, the public layout and the `public` page meta, `<AtriumIntegrationScreen>`, `<AtriumNoAccess>`, `<AtriumIntegrationUnavailable>`, and Navigation and Search support. Extend the shell types.
- [x] 12.6 Create and register in `nuxt.config.ts` the locale files: `cortex`, `impex`, `keen`, `pennantplus`, `polycart`, `roster`, `roster-users`, `roster-organizations`, `roster-access`, `showroom`, `showroom-catalog`, `showroom-structure`, `showroom-assets` and `hooks`, each as `{}`. Add the layer's own strings for the new components to `en.json`.
- [x] 12.7 Write `test/integrations/support.ts` with `mockPackageApi(pkg, routes)`, typed by the vendored `paths`, and a mounting helper with a shell carrying one active integration.
- [x] 12.8 Run composer test:nuxt and vendor/bin/pest; all green

## Group 13: Cortex integration
depends on: 12
files: src/Integrations/Cortex/CortexIntegration.php, lang/en/integrations/cortex.php, tests/Feature/Integrations/CortexIntegrationTest.php, nuxt/layer/test/fixtures/integrations/cortex.json, nuxt/layer/app/integrations/cortex/index.ts, nuxt/layer/app/integrations/cortex/components/**, nuxt/layer/app/pages/cortex/**, nuxt/layer/i18n/locales/integrations/cortex.en.json, nuxt/layer/test/integrations/cortex/**
criteria: 39, 40, 45, 53, 54, 55, 61, 62

- [x] 13.1 Write tests: Pest: gating for Cortex: installed and enabled, not installed, disabled; the API base from `cortex.routes.prefix`; the six nav items (labels, Iconify icons, paths); the `cortex` panel and search source with static data; the 11 screen declarations (keys, kinds, paths, subject aliases); writing `fixtures/integrations/cortex.json`; Vitest: one file per screen of AC 55 (load, each mutation's method, path and body, 403, 422 where there is a form), the settings panel against `cortex.settings-summary.show`, the search source and its links, every fixture screen having a page, and the i18n keys
- [x] 13.2 Write `CortexIntegration` and `lang/en/integrations/cortex.php`, porting the labels and icons from the old `CortexPlugin`.
- [x] 13.3 Write the Vue pages and components for the 11 screens, the panel, the search source and `index.ts` (registrations and `screens` map). Check every old action against the vendored `openapi.json`, and list the missing ones in `// Not ported (D-032)`.
- [x] 13.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 14: Impex integration
depends on: 12
files: src/Integrations/Impex/ImpexIntegration.php, lang/en/integrations/impex.php, tests/Feature/Integrations/ImpexIntegrationTest.php, nuxt/layer/test/fixtures/integrations/impex.json, nuxt/layer/app/integrations/impex/index.ts, nuxt/layer/app/integrations/impex/components/**, nuxt/layer/app/pages/impex/**, nuxt/layer/i18n/locales/integrations/impex.en.json, nuxt/layer/test/integrations/impex/**
criteria: 39, 40, 45, 53, 54, 56, 60, 61, 62, 63

- [x] 14.1 Write tests: Pest: gating; the API base; the five nav items, with `runs` carrying `live('impex.active-runs')`; the three widgets with `data: {}`; the `impex` panel and search source; the 10 screen declarations; writing `fixtures/integrations/impex.json`; Vitest: one file per screen of AC 56; the three widgets sharing one `impex.stats.show` request; `message-volume` hidden when `messages` is null; widget 403; the panel against `impex.settings-summary.show`; the search source; the active-runs badge (count, 0 and failure); fixture pages; the i18n keys
- [x] 14.2 Write `ImpexIntegration` and its lang file, porting from the old `ImpexPlugin`.
- [x] 14.3 Write the Vue pages, widgets, panel, search source, `live` resolver and `index.ts`, with `// Not ported (D-032)` (it names operator mode).
- [x] 14.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 15: Keen integration
depends on: 12
files: src/Integrations/Keen/KeenIntegration.php, lang/en/integrations/keen.php, tests/Feature/Integrations/KeenIntegrationTest.php, nuxt/layer/test/fixtures/integrations/keen.json, nuxt/layer/app/integrations/keen/index.ts, nuxt/layer/app/integrations/keen/components/**, nuxt/layer/app/pages/keen/**, nuxt/layer/i18n/locales/integrations/keen.en.json, nuxt/layer/test/integrations/keen/**
criteria: 39, 40, 45, 53, 54, 57, 64

- [x] 15.1 Write tests: Pest: gating; the API base from `keen.routes.prefix`; the audit-log nav item; the History item with `live('keen.history', {exclude, groups, sort})`, absent when `history.nav.enabled` is false; the 3 screen declarations; writing `fixtures/integrations/keen.json`; Vitest: `keen.entries` (filters, cursor paging, the record form posting to `keen.entries.store` with 422), `keen.entry` (changes rendering), `keen.history` (`source` filter); the History `live` resolver (exclusion, grouping, sorting, failure); fixture pages; the i18n keys
- [x] 15.2 Write `KeenIntegration` and its lang file, porting from `KeenPlugin`.
- [x] 15.3 Write the pages, an entries table and a changes component (shared with group 26's section and tab), the `live` resolver and `index.ts`.
- [x] 15.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 16: PennantPlus integration
depends on: 12
files: src/Integrations/PennantPlus/PennantPlusIntegration.php, lang/en/integrations/pennantplus.php, tests/Feature/Integrations/PennantPlusIntegrationTest.php, nuxt/layer/test/fixtures/integrations/pennantplus.json, nuxt/layer/app/integrations/pennantplus/index.ts, nuxt/layer/app/integrations/pennantplus/components/**, nuxt/layer/app/pages/pennantplus/**, nuxt/layer/i18n/locales/integrations/pennantplus.en.json, nuxt/layer/test/integrations/pennantplus/**
criteria: 39, 40, 45, 53, 54, 58

- [x] 16.1 Write tests: Pest: gating; the API base; the one nav item; the `pennantplus.features` declaration; the fixture; Vitest: the features screen: features, scopes, scope models and values load; set a value (`values.update`), delete a value (`values.destroy`) and purge (`features.destroy`), each with its confirmation; a 403 hides the controls; fixture pages and the i18n keys
- [x] 16.2 Write `PennantPlusIntegration` and its lang file, porting from `PennantPlugin` and `resources/views/atrium/index.blade.php`.
- [x] 16.3 Write the page, components and `index.ts`.
- [x] 16.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 17: Polycart integration
depends on: 12
files: src/Integrations/Polycart/PolycartIntegration.php, lang/en/integrations/polycart.php, tests/Feature/Integrations/PolycartIntegrationTest.php, nuxt/layer/test/fixtures/integrations/polycart.json, nuxt/layer/app/integrations/polycart/index.ts, nuxt/layer/app/integrations/polycart/components/**, nuxt/layer/app/pages/polycart/**, nuxt/layer/i18n/locales/integrations/polycart.en.json, nuxt/layer/test/integrations/polycart/**
criteria: 39, 40, 45, 53, 54, 59, 60, 62

- [x] 17.1 Write tests: Pest: gating; not registered, with one warning, while `polycart.routes.enabled` is false (its shipped default); registered once it is true; the two nav items, the two widgets, the search source, the 3 screen declarations and the fixture; Vitest: carts list with the type and status filters; the cart detail: every action of AC 59 (method, path, body), plus 403 and 422; the types list; both widgets sharing one `polycart.stats.show`; the search source, fixture pages and the i18n keys
- [x] 17.2 Write `PolycartIntegration` and its lang file, porting from `PolycartPlugin`.
- [x] 17.3 Write the pages, widgets, search source and `index.ts`, with `// Not ported (D-032)` (it names operator mode).
- [x] 17.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 18: Roster integration (PHP, widgets, search)
depends on: 12
files: src/Integrations/Roster/RosterIntegration.php, lang/en/integrations/roster.php, tests/Feature/Integrations/RosterIntegrationTest.php, nuxt/layer/test/fixtures/integrations/roster.json, nuxt/layer/app/integrations/roster/index.ts, nuxt/layer/app/integrations/roster/components/widgets/**, nuxt/layer/app/integrations/roster/components/search/**, nuxt/layer/i18n/locales/integrations/roster.en.json, nuxt/layer/test/integrations/roster/integration.test.ts, nuxt/layer/test/integrations/roster/widgets.test.ts, nuxt/layer/test/integrations/roster/search.test.ts
criteria: 39, 40, 45, 53, 60, 62, 69

- [x] 18.1 Write tests: Pest: gating, and not registered while `roster.routes.enabled` is false; the six nav items, the two widgets and the two search sources; the 14 screen declarations with paths and subject aliases (`roster.user`, `roster.organization`), and the fixture; Vitest: `index.ts` registers a `screens` entry for every fixture screen key; `roster.user-status` against `roster.stats.users`, and `roster.organizations` against `roster.stats.organizations`, with 403; `roster-users` and `roster-organizations` sources and their links
- [x] 18.2 Write `RosterIntegration` and its lang file, porting from `RosterPlugin`.
- [x] 18.3 Write `index.ts` with the full `screens` map (route names for all of AC 69 and the public page), the widgets and the search sources.
- [x] 18.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 19: Roster screens: users and impersonations
depends on: 18
files: nuxt/layer/app/pages/roster/users/**, nuxt/layer/app/pages/roster/impersonations/**, nuxt/layer/app/integrations/roster/components/users/**, nuxt/layer/i18n/locales/integrations/roster-users.en.json, nuxt/layer/test/integrations/roster/users/**
criteria: 54, 69

- [x] 19.1 Write Vitest files for `roster.users` (active and deleted tabs, status filter, paging), `roster.user-create` (422), `roster.user` and `roster.impersonations`. On `roster.user`, cover the profile update and each action of AC 69: approve, reject, suspend, deactivate, reactivate, delete, restore, purge, impersonate, switch context, domain join, role assign and revoke. On `roster.impersonations`, cover the list and stop. Assert method, path and body per action, plus 403 and 404, and that each of these screen keys has its page.
- [x] 19.2 Write the pages and components, porting from `resources/views/ui/users/**` and `impersonations/**` in Roster's main checkout. List missing routes in a `// Not ported (D-032)` comment at the top of `pages/roster/users/index.vue`.
- [x] 19.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 20: Roster screens: organizations, teams and the public invitation page
depends on: 18
files: nuxt/layer/app/pages/roster/organizations/**, nuxt/layer/app/pages/roster/invitations/**, nuxt/layer/app/integrations/roster/components/organizations/**, nuxt/layer/app/integrations/roster/components/invitation/**, nuxt/layer/i18n/locales/integrations/roster-organizations.en.json, nuxt/layer/test/integrations/roster/organizations/**
criteria: 54, 69, 70

- [x] 20.1 Write Vitest files: `roster.organizations` (active and deleted tabs); `roster.organization-create`; `roster.organization`: members, teams, invitations, links and role assignments (`roster.organizations.role-assignments.index`); update, delete, restore, purge, transfer, link and unlink, add and remove members, invite and revoke; `roster.team`: update, delete, add and remove members; the public page: no shell call, and the lookup 401 does not call `onUnauthorized()`; details rendered; one generic state for 404, and a 429 state; accept and decline, with `onUnauthorized()` first when signed out; the token is absent from `document.title` and from storage. Also assert that each of these screen keys has its page.
- [x] 20.2 Write the pages and components, porting from `ui/organizations/**`, `teams/**` and `invitations/show`. The public page uses the public layout and page meta (D-038). List missing routes in a `// Not ported (D-032)` comment at the top of `pages/roster/organizations/index.vue`.
- [x] 20.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 21: Roster screens: roles, permissions and transfers
depends on: 18
files: nuxt/layer/app/pages/roster/roles/**, nuxt/layer/app/pages/roster/permissions/**, nuxt/layer/app/pages/roster/transfers/**, nuxt/layer/app/integrations/roster/components/access/**, nuxt/layer/app/integrations/roster/components/transfers/**, nuxt/layer/i18n/locales/integrations/roster-access.en.json, nuxt/layer/test/integrations/roster/access/**
criteria: 54, 69

- [x] 21.1 Write Vitest files for `roster.roles` and `roster.role` (create, update, delete), `roster.permissions` (create, update, delete), `roster.transfers` (import, export, template link) and `roster.transfer` (confirm, cancel, download link), with 403 and 422, and assert that each of these screen keys has its page.
- [x] 21.2 Write the pages and components, porting from `ui/roles/**`, `permissions/**` and `transfers/**`. List missing routes in a `// Not ported (D-032)` comment at the top of `pages/roster/roles/index.vue`.
- [x] 21.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 22: Showroom integration (PHP, widgets, panel, search)
depends on: 12
files: src/Integrations/Showroom/ShowroomIntegration.php, lang/en/integrations/showroom.php, tests/Feature/Integrations/ShowroomIntegrationTest.php, nuxt/layer/test/fixtures/integrations/showroom.json, nuxt/layer/app/integrations/showroom/index.ts, nuxt/layer/app/integrations/showroom/components/widgets/**, nuxt/layer/app/integrations/showroom/components/settings/**, nuxt/layer/app/integrations/showroom/components/search/**, nuxt/layer/i18n/locales/integrations/showroom.en.json, nuxt/layer/test/integrations/showroom/integration.test.ts, nuxt/layer/test/integrations/showroom/widgets.test.ts, nuxt/layer/test/integrations/showroom/settings.test.ts, nuxt/layer/test/integrations/showroom/search.test.ts
criteria: 39, 40, 45, 53, 60, 61, 62, 71

- [x] 22.1 Write tests: Pest: gating; the API base; the eleven nav items; the four widgets; the `showroom` panel and search source; the 27 screen declarations; the `transfers.flow_prefix` config read; the fixture; Vitest: `index.ts` maps every fixture screen; the four widgets sharing one `showroom.stats.show`; the panel against `showroom.settings-summary.show`; the search source, with a link per `type`
- [x] 22.2 Write `ShowroomIntegration` and its lang file, porting from `ShowroomPlugin`.
- [x] 22.3 Write `index.ts` with the full `screens` map, the widgets, the panel and the search source.
- [x] 22.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 23: Showroom screens: products, product models and families
depends on: 22
files: nuxt/layer/app/pages/showroom/products/**, nuxt/layer/app/pages/showroom/product-models/**, nuxt/layer/app/pages/showroom/families/**, nuxt/layer/app/pages/showroom/family-variants/**, nuxt/layer/app/integrations/showroom/components/catalog/**, nuxt/layer/i18n/locales/integrations/showroom-catalog.en.json, nuxt/layer/test/integrations/showroom/catalog/**
criteria: 54, 71

- [x] 23.1 Write Vitest files for `products` (status filter, paging), `product-create`, `product`, `product-models`, `product-model`, `families`, `family` and `family-variant`. On `product`, cover values, assets, categories, associations, flags, external ids, workflow transitions, versions and revert, each mutation's method, path and body, plus 403 and 422. Assert that each of these screen keys has its page.
- [x] 23.2 Write the pages and shared catalog components (value editor, inherited values, axes, slot picker), porting from `ui/products/**`, `product-models/**`, `families/**`, `family-variants/**` and `ui/partials/**` in Showroom's main checkout. List missing routes in a `// Not ported (D-032)` comment at the top of `pages/showroom/products/index.vue`.
- [x] 23.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 24: Showroom screens: attributes, categories, channels and flags
depends on: 22
files: nuxt/layer/app/pages/showroom/attributes/**, nuxt/layer/app/pages/showroom/attribute-groups/**, nuxt/layer/app/pages/showroom/association-types/**, nuxt/layer/app/pages/showroom/categories/**, nuxt/layer/app/pages/showroom/channels/**, nuxt/layer/app/pages/showroom/flags/**, nuxt/layer/app/integrations/showroom/components/structure/**, nuxt/layer/i18n/locales/integrations/showroom-structure.en.json, nuxt/layer/test/integrations/showroom/structure/**
criteria: 54, 71

- [x] 24.1 Write Vitest files for `attributes`, `attribute-create` and `attribute` (with options), `attribute-groups` and `attribute-group`, `association-types`, `categories` (the tree) and `category`, `channels` and `channel` (with locales), and `flags` and `flag`. Cover each mutation's method, path and body, plus 403 and 422, and assert that each of these screen keys has its page.
- [x] 24.2 Write the pages and components, porting from the matching `ui/**` folders. List missing routes in a `// Not ported (D-032)` comment at the top of `pages/showroom/attributes/index.vue`.
- [x] 24.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 25: Showroom screens: assets, owners and transfers
depends on: 22
files: nuxt/layer/app/pages/showroom/assets/**, nuxt/layer/app/pages/showroom/owners/**, nuxt/layer/app/pages/showroom/owner-types/**, nuxt/layer/app/pages/showroom/transfers/**, nuxt/layer/app/integrations/showroom/components/assets/**, nuxt/layer/app/integrations/showroom/components/owners/**, nuxt/layer/app/integrations/showroom/components/transfers/**, nuxt/layer/i18n/locales/integrations/showroom-assets.en.json, nuxt/layer/test/integrations/showroom/assets/**
criteria: 54, 71

- [x] 25.1 Write Vitest files: `assets` (grid and list, upload) and `asset` (links); `owners`, `owner`, `owner-types` and `owner-type` (with rules); `transfers`: `impex.flows.index` filtered by `flow_prefix`; one `impex.runs.index?flow=` per flow, merged into the 20 newest; import and export through `showroom.imports.store` and `showroom.exports.store`; the "requires Impex" notice when Impex is inactive, with import and export still offered. Cover 403 and 422, and assert that each of these screen keys has its page.
- [x] 25.2 Write the pages and components, porting from `ui/assets/**`, `owners/**`, `owner-types/**` and `transfers/**`. The transfers screen uses `useAtriumIntegration('impex')` (D-035). List missing routes in a `// Not ported (D-032)` comment at the top of `pages/showroom/assets/index.vue`.
- [x] 25.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 26: Cross-package hooks
depends on: 13, 14, 15, 18, 22
files: src/Integrations/Hooks/**, src/Domains/Integrations/IntegrationsServiceProvider.php, lang/en/integrations/hooks.php, tests/Feature/Integrations/HooksTest.php, nuxt/layer/app/integrations/hooks/**, nuxt/layer/i18n/locales/integrations/hooks.en.json, nuxt/layer/test/integrations/hooks/**
criteria: 65, 66, 67, 68

- [x] 26.1 Write tests: Pest: each hook with its defaults; a changed config; an invalid target or slot: thrown in `local`/`testing`, reported and skipped otherwise; each hook absent when its other integration is not registered; Keen history on every matched integration screen except the excluded ones; the `atrium.screens.show` payloads of `roster.organization` (the `cortex.mcp` tab and the `keen.activity` tab, scoped), `roster.user` (the `cortex.redirect-domains` aside and the `keen.history` section) and `showroom.transfers` (the `impex.run-link` row action); Vitest: the redirect-domains tab and section: list with `owner_type`/`owner_id`, add, remove, 422; the run link's path; the `keen.history` section: subject filter on detail and `source` only on list; renders nothing on 403 or for a package missing from `keen.packages.index`; the `keen.activity` tab: scoped by `scope_type`/`scope_id`
- [x] 26.2 Write the hook registrars, `CortexRedirectDomains`, `ImpexRunLink` and `KeenHistory`. They read `atrium.integrations.*` and register through `ScreenExtensions` from `IntegrationsServiceProvider`, after the integrations.
- [x] 26.3 Write the Vue hook components and their `index.ts` registrations. Reuse Keen's entries and changes components from group 15.
- [x] 26.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 27: Atrium OpenAPI and generated layer client
depends on: 12
files: composer.json, composer.lock, testbench.yaml, workbench/app/Providers/WorkbenchServiceProvider.php, workbench/app/OpenApi/**, openapi.json, src/Domains/Dashboard/Resources/DashboardResource.php, src/Domains/Dashboard/Resources/DashboardWidgetResource.php, src/Domains/Navigation/Http/Resources/ShellResource.php, src/Domains/Widgets/Http/Resources/WidgetDefinitionResource.php, src/Domains/Screens/Http/Resources/ResolvedScreenResource.php, src/Domains/Settings/Http/Resources/SettingsPanelResource.php, src/Domains/Search/Http/Resources/SearchResultResource.php, tests/Feature/OpenApiTest.php, tests/ArchTest.php, nuxt/package.json, nuxt/pnpm-lock.yaml, nuxt/layer/package.json, nuxt/scripts/generate-client.mjs, nuxt/layer/app/client/schema.d.ts, nuxt/layer/app/composables/useAtriumClient.ts, nuxt/layer/app/types/atrium.ts, nuxt/layer/test/client.test.ts, nuxt/layer/test/fixtures.test-d.ts
criteria: 72, 73, 74, 75

- [x] 27.1 Write tests: Pest `OpenApiTest` (no Node): a fresh `scramble:export` equals `openapi.json` as decoded JSON; the operations equal the `atrium.*` routes minus `atrium.plugins.*`, with `operationId` = the route name, and `info` as in AC 72; each 2xx schema has the resource's `schema()` required properties; the `schema.d.ts` header hash matches, and the failure messages name both commands; ArchTest: nothing in `src/` uses `Dedoc\`; Vitest: `useAtriumClient()` carries the auth adapter, and the fixtures `satisfies` the generated aliases
- [x] 27.2 Add `dedoc/scramble` to `require-dev`, the workbench Scramble config, the workbench resource-schema extension and `composer openapi:export`. Give each Atrium resource a `schema()`. If no Scramble release supports Laravel 13 / PHP 8.5, stop and return a decision.
- [x] 27.3 Add pinned `openapi-typescript` and `generate:client` (`nuxt/scripts/generate-client.mjs`, which writes the sha header), and generate `nuxt/layer/app/client/schema.d.ts`. Make `composer test:nuxt` fail when regeneration changes the file. Point `types/atrium.ts` at the generated `components['schemas']`, keeping its public names. Add `useAtriumClient()`.
- [x] 27.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 28: Integration docs, changelog and release checks
depends on: 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27
files: README.md, CHANGELOG.md, CLAUDE.md, resources/boost/**, docs/agent/standards/atrium/components.md, docs/agent/standards/atrium/domains.md, docs/agent/standards/atrium/integrations.md, docs/agent/standards.index.yml, .github/pull_request_template.md, tests/Feature/DocsTest.php, tests/Feature/ChangelogUpgradeTest.php
criteria: 76, 77

- [x] 28.1 Write tests: `DocsTest`, for the README's "Suite integrations" keys: detection and `enabled`; `api_base`, and `polycart.routes.enabled` and `roster.routes.enabled`; Pennant; the hook keys; `/{pkg}/` routes; `sync:clients`; `openapi.json`, `openapi:export` and `generate:client`; `ChangelogUpgradeTest`: every replaced package key (`{pkg}.ui.*`, `{pkg}.atrium.*`, each `{Pkg}SupportFeature`, `pennantplus.atrium.resolve_features`); `atrium.screens.show`; the shell additions; the D-020 release step
- [x] 28.2 Write the README "Suite integrations" section, and the CHANGELOG v2.0.0 integrations entries. The CHANGELOG lists every `// Not ported (D-032)` item, from the integrations' `index.ts` files and the Roster and Showroom area index pages, and the parity changes (D-031, D-032).
- [x] 28.3 Update the Boost skill and `CLAUDE.md`. Write the local standard `atrium/integrations` (layout, data-only PHP, Vue through clients, gating, hooks, vendored clients), list it in `standards.index.yml`, and update `atrium/components` and `atrium/domains`.
- [x] 28.4 Add PR template release items: switch the vendored clients to pnpm git dependencies once the v2 tags exist (D-020), confirm Polycart no longer export-ignores `/client`, and widen the Keystone constraint (D-037). Each item has an owner.
- [x] 28.5 Run composer test, composer test:nuxt and vendor/bin/pest; all green

---

# Guardian integration (addendum 2026-11-23, AC 78 to 101)

Builders: if a design question comes up, choose the most conservative option consistent with spec.md and decisions.md, record it as the next D-entry, and continue. You may change files outside a group's list when the group needs it; commit them with the group.

This build runs after Guardian's build (`Guardian/2026-11-23-1718-guardian-v2-security-platform`) and Roster's addendum build (criteria 28 to 46 of `Roster/2026-11-23-0943-roster-v2-api-and-mcp-only`). Group 29 syncs both clients and fails as D-039 says until both exist in `$ATRIUM_SUITE_PATH`. Before the build, add a `Guardian` symlink to `/Users/jay/Projects/packages/Guardian--2026-11-23-1718-guardian-v2-security-platform` in the D-040 suite folder (D-045). Every Guardian group depends on group 29.

Check every Guardian call against the vendored `nuxt/layer/app/integrations/guardian/client/openapi.json`. A route the spec names but the document lacks is left out (D-032), and it is listed in a `// Not ported (D-032)` comment at the top of the group's main page. The v1 Guardian UI to port, read-only, is at `/Users/jay/Projects/packages/Guardian/src/Atrium` and `resources/views/atrium`. Atrium PHP never imports a Guardian or Roster class (AC 81). Every group runs `composer test:nuxt` beside `vendor/bin/pest` (D-041's `pnpm` shim on PATH).

## Group 29: Client sync and Roster role removal
depends on: none
files: nuxt/scripts/sync-clients.mjs, tests/Feature/Integrations/VendoredClientsTest.php, nuxt/layer/app/integrations/guardian/client/**, nuxt/layer/app/integrations/roster/client/**, src/Integrations/Roster/RosterIntegration.php, lang/en/integrations/roster.php, tests/Feature/Integrations/RosterIntegrationTest.php, nuxt/layer/test/fixtures/integrations/roster.json, nuxt/layer/app/integrations/roster/index.ts, nuxt/layer/app/integrations/roster/components/access/**, nuxt/layer/app/integrations/roster/components/users/**, nuxt/layer/app/integrations/roster/components/organizations/**, nuxt/layer/app/pages/roster/roles/**, nuxt/layer/app/pages/roster/permissions/**, nuxt/layer/app/pages/roster/transfers/index.vue, nuxt/layer/app/pages/roster/users/**, nuxt/layer/app/pages/roster/organizations/**, nuxt/layer/i18n/locales/integrations/roster.en.json, nuxt/layer/i18n/locales/integrations/roster-access.en.json, nuxt/layer/i18n/locales/integrations/roster-users.en.json, nuxt/layer/i18n/locales/integrations/roster-organizations.en.json, nuxt/layer/test/integrations/roster/**
criteria: 78, 99

- [x] 29.1 Write tests: Pest: `VendoredClientsTest` lists `guardian` => `Guardian`, and asserts Roster's vendored `openapi.json` has no `roster.roles.*`, `roster.permissions.*`, `roster.users.roles.*`, `roster.users.permissions` or `roster.organizations.role-assignments.index` operation; `RosterIntegrationTest` asserts four nav items (users, organizations, impersonations, transfers) and 11 screen keys, without `roster.roles`, `roster.role` or `roster.permissions`; Vitest: `roster/integration.test.ts` maps the 11 keys; a new `roster/removed-access.test.ts` greps `app/` and `test/` for the removed Roster operations and for `/roster/roles` and `/roster/permissions`; `roster.user` and `roster.organization` tests no longer expect role calls
- [x] 29.2 Add `guardian: 'Guardian'` to `sync-clients.mjs`, and run `ATRIUM_SUITE_PATH=… pnpm -C nuxt sync:clients guardian roster`. If either source is missing, stop and return a needs-decision (D-039, D-045), and never write a schema by hand.
- [x] 29.3 Remove Roster's roles and permissions from the PHP side: the nav items, screen declarations and lang keys in `RosterIntegration` and `lang/en/integrations/roster.php`. Regenerate `roster.json` with `UPDATE_FIXTURES=1`.
- [x] 29.4 Remove them from the layer: delete `pages/roster/roles/**`, `pages/roster/permissions/**`, `RolePermissions.vue`, `RosterUserRoles.vue` and `OrganizationRoles.vue`; delete the role and permission helpers in `access.ts`, `users.ts` and `organizations.ts`, keeping what transfers use; update `[user].vue` and `[organization]/index.vue`; drop the role and permission entries from the `screens` map, the locale keys, the Vitest files and the test-support fixtures; move the `// Not ported (D-032)` comment to `pages/roster/transfers/index.vue`, without its role and permission items.
- [x] 29.5 Run composer test:nuxt and vendor/bin/pest; all green

## Group 30: Guardian integration (PHP declarations, gating, layer registration)
depends on: 29
files: config/atrium.php, src/Integrations/Guardian/**, lang/en/integrations/guardian.php, tests/Feature/Integrations/GuardianIntegrationTest.php, tests/Feature/Integrations/IntegrationConfigTest.php, tests/Feature/Integrations/RegistrationTest.php, tests/Feature/Integrations/ApiBaseTest.php, tests/Feature/Integrations/NoPackageCodeTest.php, tests/ArchTest.php, nuxt/layer/test/fixtures/integrations/guardian.json, nuxt/layer/app/integrations/guardian/index.ts, nuxt/layer/nuxt.config.ts, nuxt/layer/i18n/locales/integrations/guardian.en.json, nuxt/layer/i18n/locales/integrations/guardian-two-factor.en.json, nuxt/layer/i18n/locales/integrations/guardian-security.en.json, nuxt/layer/i18n/locales/integrations/guardian-access.en.json, nuxt/layer/i18n/locales/integrations/guardian-admin.en.json, nuxt/layer/i18n/locales/integrations/guardian-sso.en.json, nuxt/layer/test/integrations/guardian/integration.test.ts, docs/agent/standards-feedback.md
criteria: 79, 80, 81, 82

- [x] 30.1 Write tests: Pest, config: the exact `atrium.integrations` default with eight keys, including `guardian.scope_types` and `guardian.screens` (AC 97's default); the banner points of AC 79; Pest, gating: installed and enabled, not installed, and `enabled` false or `"false"`; the API base `/guardian` from `guardian.routes.prefix`; not registered while `guardian.routes.enabled` is false, with one warning per process; registered without Roster installed; Pennant flag off, on and unavailable; Pest, declarations: the nine nav items in order (labels, icons, paths, the "Security" group); no widgets, panel or search sources; the 15 screen declarations (keys, kinds, paths) with their static options; Pest, `GuardianScopeTypes`: a null value resolving through `guardian.adopt.scope_types.{key}`, an explicit value winning, and an unresolved value dropped; Pest, no package code: ArchTest and the `src/` grep cover `RefactorCircus\Guardian`; Pest, fixture: writing `fixtures/integrations/guardian.json`; Vitest: `guardian/index.ts` exports a `screens` entry for every fixture key.
- [x] 30.2 Write `GuardianFeature`, `GuardianScopeTypes` (resolves once per process) and `GuardianIntegration`. The integration's screen options read `guardian.tokens.abilities`, `guardian.tokens.max_lifetime_days` and `guardian.ip_rules.mode`, with their Guardian defaults (D-054). Write `lang/en/integrations/guardian.php`.
- [x] 30.3 Add the `guardian` config section and its banner (D-048, D-059). Add Guardian to the `architecture/dependencies` row in `standards-feedback.md`.
- [x] 30.4 Write `guardian/index.ts` with the full `screens` map (route names for every AC 82 screen). Create the six Guardian locale files as `{}` and register them in `nuxt.config.ts`.
- [x] 30.5 Run composer test:nuxt and vendor/bin/pest; all green

## Group 31: Two-factor responses, challenge and setup pages
depends on: 30
files: nuxt/layer/app/plugins/atrium.ts, nuxt/layer/app/composables/useAtriumIntegration.ts, nuxt/layer/app/composables/useAtriumClient.ts, nuxt/layer/app/composables/useAtriumApi.ts, nuxt/layer/app/types/atrium.ts, nuxt/layer/app/layouts/default.vue, nuxt/layer/app/components/Atrium/ResponseNotice.vue, nuxt/layer/i18n/locales/en.json, nuxt/layer/app/integrations/guardian/index.ts, nuxt/layer/app/integrations/guardian/components/two-factor/**, nuxt/layer/app/pages/guardian/two-factor/**, nuxt/layer/package.json, nuxt/pnpm-lock.yaml, nuxt/layer/i18n/locales/integrations/guardian-two-factor.en.json, nuxt/layer/test/response-handlers.test.ts, nuxt/layer/test/integrations/guardian/two-factor/**
criteria: 83, 84, 85, 86, 87

- [x] 31.1 Write Vitest tests. Response handlers: called on every response of an integration client, `useAtriumClient()` and `useAtriumApi()`, in registration order, a throwing handler logged and skipped, and run when the shell request fails. Guardian's handler: `two_factor_challenge_required` goes to the challenge page with `redirect`, `two_factor_enrollment_required` goes to setup, concurrent 403s navigate once, nothing happens on those pages, the deadline header shows the notice, and other 403s are left alone. Challenge page: no shell call, the base-URL order, each method (TOTP, email and SMS with send, passkey with a mocked `navigator.credentials.get`, recovery), 204 reloading the shell and following a guarded `redirect` (an off-site one falls back to `/`), 422, 429 and 401 (`onUnauthorized()`), and the code absent from the URL, `document.title` and storage. Setup page: `allowed_methods`, the deadline, TOTP enrolment, then recovery codes, then the redirect. AC 87 components: TOTP request bodies, the QR rendered as SVG with no `fetch` beyond Guardian's, and the secret dropped on unmount; recovery codes shown once, with copy, download and regenerate after a confirmation; passkeys (options, a mocked `create()`, store, list, remove, hidden on `passkeys_available` false, on 501 and without `PublicKeyCredential`); email and SMS (enrol, confirm, a 422 `method_unavailable` hiding the type, a 429 resend); removal needing another factor's code or a recovery code, and a 422 `two_factor_required`.
- [x] 31.2 Add `$atrium.responseHandler()` to the registry and run it in the integration-client middleware, `useAtriumClient()` and `useAtriumApi()`. Add the app-wide notice component, which renders in the default layout, and its `en.json` strings (D-049).
- [x] 31.3 Add `uqr`, pinned to an exact version, to `nuxt/layer/package.json` and update the lockfile (D-051). Write the WebAuthn base64url helper (D-052), the shell-less Guardian client (D-050) and the AC 87 components under `components/two-factor/`.
- [x] 31.4 Write the challenge and setup pages with the public layout and page meta. Register Guardian's response handler in `index.ts`. Exempt the two pages from AC 49's `atrium.screens.show` check, as `roster.invitation` is.
- [x] 31.5 Run composer test:nuxt and vendor/bin/pest; all green

## Group 32: My security page
depends on: 31
files: nuxt/layer/app/pages/guardian/security/**, nuxt/layer/app/integrations/guardian/components/security/**, nuxt/layer/i18n/locales/integrations/guardian-security.en.json, nuxt/layer/test/integrations/guardian/security/**
criteria: 88

- [x] 32.1 Write Vitest tests for `guardian.security`, asserting method, path and body for every call: the two-factor status with the group 31 components; sessions: the current one flagged; revoke one; "sign out everywhere else", with and without `tokens: true`; confirmations; devices: list, and forget with a confirmation; API tokens: list; issue, with abilities from the option and `expires_at` capped at the maximum lifetime; the plain token shown once and absent from storage; revoke; the 501 "not enabled" state; recent activity, with cursor paging; each section's own 403 leaving the others working; the page exists for the screen key.
- [x] 32.2 Write the page and the section components, reusing `components/two-factor/`.
- [x] 32.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 33: Roles, permissions, role assignments and the user security screen
depends on: 30
files: nuxt/layer/app/pages/guardian/roles/**, nuxt/layer/app/pages/guardian/permissions/**, nuxt/layer/app/pages/guardian/role-assignments/**, nuxt/layer/app/pages/guardian/users/**, nuxt/layer/app/integrations/guardian/components/access/**, nuxt/layer/app/integrations/guardian/components/users/**, nuxt/layer/i18n/locales/integrations/guardian-access.en.json, nuxt/layer/test/integrations/guardian/access/**
criteria: 89, 90

- [x] 33.1 Write Vitest tests: `guardian.roles`: list; create, with scope choices `global`, `any` and the `scope_types` option; `guardian.role`: show; update with the permission picker; delete with a confirmation; `guardian.permissions`: list, create, update and delete; `system` rows locked; `guardian.role-assignments`: the filters `user`, `role`, `scope_type` and `scope_id`; paging; assign; revoke with a confirmation; escalation 422s naming the missing permissions; 403 and 404; `guardian.user`: assignments with assign and revoke; abilities with and without a scope; sessions with "revoke all"; tokens with "revoke all", hidden on 501; recent events; the two-factor reset with a confirmation naming the user; each block's own 403; each screen key has its page.
- [x] 33.2 Write the pages and the `access/` and `users/` components. Port the role, permission and assignment behavior from Roster's removed group 21 screens (at `git show 812b797:nuxt/layer/app/pages/roster/roles/index.vue` and its siblings), adapted to Guardian's schema. Write the `users/` blocks so group 36's hook components can mount them with a user key.
- [x] 33.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 34: Security administration screens
depends on: 30
files: nuxt/layer/app/pages/guardian/security-events/**, nuxt/layer/app/pages/guardian/lockouts/**, nuxt/layer/app/pages/guardian/ip-rules/**, nuxt/layer/app/pages/guardian/password-policy/**, nuxt/layer/app/pages/guardian/two-factor-policies/**, nuxt/layer/app/integrations/guardian/components/admin/**, nuxt/layer/i18n/locales/integrations/guardian-admin.en.json, nuxt/layer/test/integrations/guardian/admin/**
criteria: 91, 92, 93, 94, 95

- [x] 34.1 Write Vitest tests: `guardian.security-events`: the `type` select, `user`, `from` and `to`; cursor paging; `guardian.security-event`: the detail, with its context rows; `guardian.lockouts`: clearing an identifier (`DELETE lockouts`, body `{identifier}`), with a confirmation and a 422; the `login.locked_out` events list; `guardian.ip-rules`: list; create, with a 422 for an invalid CIDR; delete with a confirmation; the `allowlist` warning and the extra confirmation when deleting an allow rule; `guardian.password-policy`: rendered read-only; `guardian.two-factor-policies`: list, create, update and delete, with every field; 403 on every screen; each screen key has its page.
- [x] 34.2 Write the pages and the `admin/` components. The event-type list comes from the vendored schema's enum when it has one, and otherwise from a layer constant matching Guardian AC 23.
- [x] 34.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 35: SSO connections and SCIM tokens
depends on: 30
files: nuxt/layer/app/pages/guardian/sso-connections/**, nuxt/layer/app/integrations/guardian/components/sso/**, nuxt/layer/i18n/locales/integrations/guardian-sso.en.json, nuxt/layer/test/integrations/guardian/sso/**
criteria: 96

- [x] 35.1 Write Vitest tests: the SSO tab component: list for an organization record; create (`name`, `protocol`); links to the detail page; `guardian.sso-connection`: show; update (`name`, `enabled`, `enforced`, `jit` and the protocol fields); delete with a confirmation; the back link to `/roster/organizations/:organization?tab=guardian.sso` only while Roster is active; the SCIM tab component: list; issue (`name`, `expires_in_days`, `sso_connection`), with the plain token shown once and absent from storage; revoke with a confirmation; the base URL built from Guardian's API origin, `scim_path` and the record; the SSO identities section: list; empty renders nothing; unlink with a confirmation; 403 and 422 throughout; the page exists for `guardian.sso-connection`.
- [x] 35.2 Write the page and the `sso/` components, porting from Guardian v1's `Screens.php`, `SsoUiController`, `ScimUiController` and `resources/views/atrium/**` (read-only, in Guardian's main checkout). List the v1 features with no v2 route in a `// Not ported (D-032)` comment at the top of `pages/guardian/sso-connections/[connection].vue`.
- [x] 35.3 Run composer test:nuxt and vendor/bin/pest; all green

## Group 36: Guardian hooks on Roster's screens
depends on: 29, 30, 33, 35
files: src/Integrations/Hooks/GuardianScreens.php, src/Integrations/Hooks/Hooks.php, lang/en/integrations/hooks.php, tests/Feature/Integrations/HooksTest.php, nuxt/layer/app/integrations/hooks/**, nuxt/layer/i18n/locales/integrations/hooks.en.json, nuxt/layer/test/integrations/hooks/**
criteria: 97, 98

- [x] 36.1 Write tests. Pest: the defaults (`guardian.access`, `guardian.sso` and `guardian.scim` tabs on `roster.organization`; `guardian.access` and `guardian.user-security` tabs and the `guardian.sso-identities` section in `aside` on `roster.user`); a changed config; an unknown key, an invalid target and an invalid slot, each thrown in `local`/`testing` and reported and skipped otherwise; every Guardian hook absent without Roster or without Guardian; an unresolved organization scope type skipping the organization access tab with one warning per process; the data `{scope_type}`, `{scope_type: null}`, `{}` and `{scim_path}`; the `atrium.screens.show` payloads of `roster.organization` and `roster.user` with Cortex, Keen and Guardian all on. Vitest: the organization access tab (list by scope, assign, revoke, role links); the user access tab; the user-security tab mounting group 33's blocks for the record; the SSO, SCIM and identities wrappers; 403 on each; the `hooks/index.ts` registrations.
- [x] 36.2 Write `GuardianScreens` and add it to `Hooks::HOOKS`. It validates as AC 68 does and reads `GuardianScopeTypes` and `guardian.scim.prefix`. Add the hook labels to `lang/en/integrations/hooks.php`.
- [x] 36.3 Write the Vue hook components, which wrap group 33's `access/` and `users/` components and group 35's `sso/` components. Register them in `hooks/index.ts` and add their strings to `hooks.en.json`.
- [x] 36.4 Run composer test:nuxt and vendor/bin/pest; all green

## Group 37: Guardian docs, changelog and release checks
depends on: 29, 30, 31, 32, 33, 34, 35, 36
files: README.md, CHANGELOG.md, CLAUDE.md, resources/boost/**, docs/agent/standards/atrium/integrations.md, .github/pull_request_template.md, tests/Feature/DocsTest.php, tests/Feature/ChangelogUpgradeTest.php
criteria: 100, 101

- [x] 37.1 Write tests: `DocsTest`: the README's Guardian keys: `guardian.routes.enabled`, `scope_types`, `guardian.two-factor`, `guardian.session`, `Guardian-Two-Factor-Deadline`, `rp_id`, `guardian.tokens.driver`, `atrium.integrations.guardian.screens` and `responseHandler`; `ChangelogUpgradeTest`: `roster.roles`, `roster.role` and `roster.permissions`, each with its Guardian replacement; `guardian.access`; `responseHandler`; `uqr`.
- [x] 37.2 Write the README's Guardian part of "Suite integrations", and the CHANGELOG v2.0.0 entries. The CHANGELOG collects Guardian's `// Not ported (D-032)` items and the removed Roster screens and nav items.
- [x] 37.3 Update the Boost skill, `CLAUDE.md` and the local standard `atrium/integrations` (response handlers, shell-less pages, roles in Guardian). Add Guardian to the PR template's D-020 release item.
- [x] 37.4 Run composer test, composer test:nuxt and vendor/bin/pest; all green

## Group 38: Vite + Vue front end (SDK and app)
depends on: 37
files: ui/sdk/**, ui/app/**, ui/package.json, ui/pnpm-workspace.yaml, ui/pnpm-lock.yaml, ui/tsconfig.base.json, dist/**
criteria: 104, 106

- [x] 38.1 Move the layer into `ui/sdk` (registry, composables, store, types, utils, `Atrium*` components, locales, contract fixtures) and `ui/app` (entry, router, layouts, core pages, stylesheet); replace Nuxt's conveniences with SDK exports; explicit imports in the SDK.
- [x] 38.2 Build Atrium's app with one entry per shared specifier (exports preserved) and `build.json` carrying the entry and the import map's files; commit `dist/`.
- [x] 38.3 Port the core Vitest suite to `@refactor-circus/atrium/testing` (happy-dom); `pnpm -C ui test` and `typecheck` green.

## Group 39: The Blade page and its routes
depends on: 38
files: src/Domains/Frontend/**, resources/views/app.blade.php, config/atrium.php, tests/Feature/Frontend/PageTest.php, tests/Feature/Frontend/ClientDisabledTest.php, tests/ArchTest.php, tests/Feature/RemovalTest.php
criteria: 102, 103

- [x] 39.1 Write tests: the page at and under `client_path`; the API's paths kept out; guest redirect and 403; the boot data; the import map and entry; `client.enabled`.
- [x] 39.2 Write the Frontend domain (`AppPage`, `ShowAppRequest`, the fallback route) and the view.

## Group 40: Serving the prebuilt files
depends on: 39
files: src/Domains/Frontend/Services/FrontendAssets.php, src/Domains/Frontend/Http/Requests/ShowAssetRequest.php, tests/Feature/Frontend/AssetTest.php
criteria: 105

- [x] 40.1 Write tests: types and caching, older versions, no session, module files and chunks, and every refusal (outside the folders, dotfiles, `..`, encoded `..`, other extensions, unknown owners).
- [x] 40.2 Write the asset route and locator.

## Group 41: Module discovery and registration
depends on: 39
files: src/Domains/Frontend/Services/ModuleDiscovery.php, src/Domains/Frontend/Services/ModuleRegistry.php, src/Domains/Frontend/Data/ModuleManifest.php, src/Atrium.php, src/Facades/Atrium.php, src/Domains/Plugins/**, tests/Feature/Frontend/ModuleDiscoveryTest.php, tests/Fixtures/Frontend/**
criteria: 107, 108, 109

- [x] 41.1 Write tests: discovery from `installed.json`, the cache and its commands, unsafe paths dropped; `Atrium::module()`, `script()`, `style()`, config scripts; integration gating, `atrium.disabled`, the shared API major.
- [x] 41.2 Write discovery, the registry and the facade methods; extend `atrium:discover` and `atrium:clear-discovered`; write `defineAtriumModule()` and `installAtriumModules()` in the SDK.

## Group 42: Session auth by default and the gate's default
depends on: 39
files: config/atrium.php, src/Domains/Access/**, ui/sdk/src/runtime/http.ts, tests/Feature/Api/AuthApiTest.php, tests/Feature/GateFallbackTest.php, tests/TestCase.php
criteria: 110, 111

- [x] 42.1 Write tests: 401 JSON on every route with the default middleware; the AtriumUser fallback, `local`, and a defined gate winning.
- [x] 42.2 Default the API to `['web', 'auth', Authorize::class]`; sign same-origin requests with the XSRF and CSRF tokens; reload on 401; write `AtriumUser`.

## Group 43: The module preset and styles
depends on: 38
files: ui/sdk/vite/**, ui/sdk/css/**, ui/scripts/nuxt-ui-theme.mjs
criteria: 112, 113

- [x] 43.1 Write `atriumModule()` (build and test config), `nuxtUi()`, the shared list, the auto-imports and component resolvers, `module.css`, `theme.css`, the generated Nuxt UI theme and Atrium's class list.
- [x] 43.2 Write `atriumClientOptions()`, the factory form of `useAtriumIntegration()` and the `AtriumIntegrationPaths` augmentation.

## Group 44: Build freshness and CI
depends on: 38, 43
files: tests/Feature/Frontend/BuildFreshnessTest.php, composer.json, .github/workflows/ui.yml, .gitattributes, .github/pull_request_template.md
criteria: 114, 117

- [x] 44.1 Write `BuildFreshnessTest` (the source hash recomputed in PHP), `composer test:ui`, the `ui` CI job (rebuild and diff), the export-ignore rules (the SDK and `dist/` ship).

## Group 45: Staged modules and the workbench
depends on: 41, 43
files: ui/modules/**, ui/workbench/**, workbench/**, tests/Feature/Integrations/VendoredClientsTest.php, tests/Feature/Api/ContractFixturesTest.php
criteria: 115, 116

- [x] 45.1 Stage each integration in `ui/modules/{pkg}` (entry, routes, locales, client, tests, hooks moved to their provider module, stand-in composer.json); each type-checks, passes Vitest and builds.
- [x] 45.2 The workbench: session sign-in, the PHP suite stand-in, the staged modules and the demo module through `Atrium::module()`; remove the playground and the token guard.
- [x] 45.3 Screenshot the served page against `final2` (desktop and mobile, dark, light and the signal theme).

## Group 46: Phase 2: each module moves into its package
depends on: 45
files: ui/modules/{pkg}/**, workbench/app/Atrium/DemoSuite.php, ui/scripts/sync-clients.mjs, tests/Feature/Integrations/VendoredClientsTest.php
criteria: 115

- [x] 46.1 Cortex ships its module (MODULES.md, phase 2); remove `ui/modules/cortex`.
- [x] 46.2 Guardian ships its module; remove `ui/modules/guardian`.
- [x] 46.3 Impex ships its module; remove `ui/modules/impex`.
- [x] 46.4 Keen ships its module; remove `ui/modules/keen`.
- [x] 46.5 PennantPlus ships its module; remove `ui/modules/pennantplus`.
- [x] 46.6 Polycart ships its module; remove `ui/modules/polycart`.
- [x] 46.7 Roster ships its module; remove `ui/modules/roster`.
- [x] 46.8 Showroom ships its module; remove `ui/modules/showroom`.
- [x] 46.9 Remove the vendored clients (`sync-clients.mjs`, `sync:clients`, `VendoredClientsTest`); the workbench loads sibling checkouts' modules through `ATRIUM_SUITE_PATH` (D-089); MODULES.md becomes the guide to writing a module.

## Group 47: Docs for the page and the module contract
depends on: 39, 41, 43, 45
files: README.md, CHANGELOG.md, AGENTS.md, MODULES.md, resources/boost/**, docs/agent/standards/atrium/**, docs/agent/specs/2026-11-22-1823-atrium-v2-headless/{decisions,spec,tasks,build}.md, tests/Feature/DocsTest.php, tests/Feature/ChangelogUpgradeTest.php
criteria: 117

- [x] 47.1 Record D-079 to D-087; this addendum; `MODULES.md`.
- [x] 47.2 README (serving, the module contract, the shared modules, the preset, the app's scripts), CHANGELOG, CLAUDE.md, the Boost skill and the standards; DocsTest and ChangelogUpgradeTest check them.
