# Verification: Atrium v2 headless

Date: 2026-11-23 · Result: PASS

Branch `ring-master/2026-11-22-1823-atrium-v2-headless` at `d978f19`.

## Checks

| Check | Result | Detail |
| --- | --- | --- |
| Criterion 1: exactly the 13 named API routes | pass | `tests/Feature/Api/RoutesApiTest.php`: `test_atrium_registers_exactly_its_api_routes`, `test_each_route_has_its_method_uri_and_public_binding`, `test_no_other_route_is_served_under_the_prefix` |
| Criterion 2: `routes.enabled` false registers none | pass | `RoutesApiTest::test_disabled_routes_register_nothing` |
| Criterion 3: per-domain `routes.php` via Keystone | pass | `RoutesApiTest::test_each_domain_loads_its_own_routes_file_through_keystone`, `test_no_domain_has_an_api_routes_file`, `test_nothing_loads_routes_through_the_dashboard_group` |
| Criterion 4: shell payload, exact structure | pass | `tests/Feature/Api/ShellApiTest.php` "answers with the exact shell structure", "sends every settings panel summary field, and those only", "links navigation through ClientPath, relative to atrium.client_path" |
| Criterion 5: 401 / 403 by auth state | pass | `tests/Feature/Api/AuthApiTest.php`: `test_a_guest_gets_401_json_on_every_route_with_no_guard_configured`, `test_a_guest_gets_401_json_from_the_hosts_guard_never_a_redirect`, `test_the_gate_refuses_a_signed_in_user_outside_local_on_every_route`, `test_the_gate_lets_a_signed_in_user_through_in_local`, `test_a_view_only_user_gets_403_on_every_mutation`; `PluginRoutesTest::test_plugin_routes_are_behind_the_gate` |
| Criterion 6: reads never write | pass | `tests/Feature/Api/DashboardApiTest.php` "never writes on a read", "answers {"data": null} with no meta when the user has no dashboard, and creates none" |
| Criterion 7: final `DashboardResource`, no id, placement shape | pass | `DashboardApiTest` "returns the default dashboard in the exact resource shape, with its abilities in meta"; `WidgetApiTest` "answers 404 for an orphaned placement" |
| Criterion 8: abilities in `meta.abilities` | pass | `DashboardApiTest` "shows a dashboard by its slug, with what the user may do to it", "creates a dashboard and answers 201 …", "deletes a dashboard with a 204 and no body"; `DashboardLayoutApiTest` "saves the layout and answers with the dashboard, its new version and its abilities" |
| Criterion 9: placement uuid, scoping, migration | pass | `tests/Feature/PlacementUuidMigrationTest.php` (all four tests); `WidgetApiTest` "only serves a placement through the dashboard it is on", "answers 404 for an orphaned placement"; `DashboardLayoutApiTest` "rejects a placement uuid from another dashboard and changes nothing", "treats a v1 payload with no uuids as an all-new layout"; `tests/Modes/RenamedTables/RenamedTablesTest.php`. MySQL/Postgres: manual PR checklist item |
| Criterion 10: Request `persist()`, one-line controllers, 422 | pass | `DashboardApiTest` create/update/delete tests, "rejects an invalid create", "rejects an invalid update and changes nothing"; `DashboardLayoutApiTest` "rejects an invalid layout …"; `tests/ArchTest.php` single-line controller rule |
| Criterion 11: `{key, component, data}`, no `view()`, `?tab=` | pass | `tests/Unit/ExtensionContractTest.php` "defaults the component to the definition key", "has no view, as a method or a property"; `tests/Feature/Api/ScreenApiTest.php` "resolves only the open tab", "falls back to the default tab for an unknown ?tab=" |
| Criterion 12: plugin routes in the API group | pass | `tests/Feature/PluginRoutesTest.php` (all six); `PluginFeatureRoutesTest::test_plugin_routes_are_not_found_while_a_feature_is_off`; `RoutesApiTest::test_every_atrium_route_carries_the_group_middleware_with_authorize_last` |
| Criterion 13: `JsonData::check()` and `UnserializableDataException` | pass | `tests/Unit/Support/JsonDataTest.php` (15 tests: accepted and rejected types, message, final with status 500, depth limit, cycle guard); `WidgetApiTest` "keeps a failing lazy widget out of the dashboard payload" |
| Criterion 14: search links via `ClientPath`, `min_length` 422 | pass | `tests/Unit/Support/ClientPathTest.php`; `tests/Feature/Api/SearchApiTest.php` "links results through ClientPath …", "refuses a query shorter than search.min_length with 422 …"; `nuxt/layer/test/search.test.ts`, `navigation.test.ts` (noopener, unsafe link refused) |
| Criterion 15: Iconify-only icons | pass | `tests/Unit/Support/IconifyTest.php`; `ExtensionContractTest` "rejects anything but an Iconify name on every icon setter" |
| Criterion 16: Blade UI removed | pass | `tests/Feature/RemovalTest.php` (12 tests); `tests/Feature/FacadeDocblockTest.php` |
| Criterion 17: no `view(`, `Illuminate\View`, `Blade::` in `src/` | pass | `tests/ArchTest.php` |
| Criterion 18: config `routes` banner | pass | `tests/Feature/ConfigTest.php` (prefix and middleware, no-auth note, `client_path`, CORS/CSRF, local gate warning) |
| Criterion 19: Nuxt layer surface | pass | `nuxt/layer/test/registry.test.ts`, `api.test.ts` ("calls the adapter onUnauthorized() on a 401 …"), `widget.test.ts` (unregistered fallback) |
| Criterion 20: empty-list create, lazy load by uuid | pass | `nuxt/layer/test/dashboard.test.ts` "creates the first dashboard with POST dashboards …"; `widget.test.ts` "fetches a lazy placement by uuid through atrium.dashboards.widgets.show …" |
| Criterion 21: playground and workbench auth | pass | `tests/Feature/Api/ContractFixturesTest.php` `test_the_demo_plugin_serves_its_pages_from_api_routes`, `test_the_workbench_token_guard_signs_the_playground_in_…_in_local`, `test_the_workbench_token_guard_does_nothing_outside_local`; `RemovalTest` "declares the workbench token guard only under workbench/". Playground served and answering 200 against the workbench |
| Criterion 22: typecheck, build, Vitest cases, consumer build | pass | `composer test:nuxt` exit 0: typecheck clean, build OK, 13 files / 69 Vitest tests, "a fresh app extending nuxt/layer builds". Visual layout and grid feel are manual |
| Criterion 23: docs, CHANGELOG upgrade guide | pass | `tests/Feature/ChangelogUpgradeTest.php` (9 tests); `tests/Feature/DocsTest.php` (12 tests); the remaining doc and sibling items are in `.github/pull_request_template.md` (manual, owner: PR author) |
| Criterion 24: `composer test` and `composer test:nuxt` | pass | Both exit 0 (see Full gate) |
| Criterion 25: git `extends` distribution docs | pass | `DocsTest` "documents using the Nuxt layer"; README covers `GIGET_AUTH` and SHA pinning; `RemovalTest` "keeps the nuxt layer in the dist, for git extends (D-015)" |
| Criterion 26: `composer test:nuxt`, CI job | pass | `composer.json` `test:nuxt`; `.github/workflows/nuxt.yml` runs it; `composer test` stays PHP-only |
| Criterion 27: layer i18n, shell `locale` | pass | `nuxt/layer/test/locale.test.ts` (3 tests); `ShellApiTest` exact structure (includes `locale`) |
| Criterion 28: `api_version` and mismatch banner | pass | `tests/Feature/ApiVersionTest.php` "equals the major.minor of nuxt/layer/package.json"; `nuxt/layer/test/version.test.ts` (equal, minor and major cases, dismissible) |
| Criterion 29: removed-key boot warning | pass | `tests/Feature/RemovedConfigKeysTest.php` (3 tests) |
| Criterion 30: full-layout save semantics | pass | `DashboardLayoutApiTest` "deletes placements left out of the payload", "keeps orphaned placements even when they are left out", "rejects an invalid layout and leaves the old placements intact" |
| Criterion 31: contract fixtures | pass | `ContractFixturesTest` (fixture match for shell, dashboard, screen and settings; deterministic; plain run never writes; `UPDATE_FIXTURES=1` writes); `nuxt/layer/test/fixtures.test-d.ts`; `fixtures-present.mjs` |
| Criterion 32: `version` guard, 409 | pass | `DashboardApiTest` "guards an update with the dashboard version"; `DashboardLayoutApiTest` "guards a layout save with the dashboard version"; `dashboard.test.ts` "on a 409 reloads the dashboard and tells the user …" |
| Criterion 33: eager failure isolation by environment | pass | `tests/Feature/JsonDataResolveTest.php`; `DashboardApiTest` "isolates a failing eager widget outside local and testing …", "lets a failing eager widget fail the request in local and testing"; `tests/Feature/Screens/FailureIsolationTest.php`; `screen.test.ts`/`widget.test.ts` error cards |
| Criterion 34: bundled lucide icons, fallback | pass | `nuxt/layer/test/icon.test.ts` (6 tests) |
| Criterion 35: `en` only | pass | `locale.test.ts` "renders the layer strings in English by default"; the second locale exists only in `nuxt/layer/test/locale-module.ts` |
| Criterion 36: `atrium.theme` in the shell | pass | `ShellApiTest` "sends atrium.theme as the built-in atrium theme …" |
| Criterion 37: `ClientPath` host and null | pass | `ClientPathTest` "returns null for a link that is not an http(s) URL or a relative path, and never throws"; `ShellApiTest` "sends link null for a navigation url ClientPath rejects"; `SearchApiTest` "sends link null for a result url ClientPath rejects" |
| Tasks | pass | Every box in `tasks.md` is ticked (groups 1 to 10) |
| Full gate | pass | `vendor/bin/pest`: 904 passed, 3194 assertions. `composer test` (phpstan 0 errors, pint, type coverage 100%, Pest) exit 0. `composer test:nuxt` exit 0 |
| Standards drift | pass | `vendor/bin/ringside check`: "check passed." |

## Manual items (not blocking; PR checklist, owner: PR author)

- Run the `add_uuid_and_version_to_atrium_dashboards` migration up and down on MySQL 8 and Postgres (CI covers SQLite).
- Check that every sibling `composer.json` and its CI require Atrium `^1`, not `dev-main`.
- Visual check of the playground layout and grid editing.

## Failures

None.

## Tasks to reopen

None.
