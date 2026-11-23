VERDICT: PASS

# Gate, round 2

- `composer test`: phpstan passed (0 errors), pint passed, type coverage 100.0%, Pest 893 passed (3160 assertions).
- `composer lint:check`: pint passed.
- `composer exec ringside check`: passed.

Not run by this gate: `composer test:nuxt` (AC 22, 26) was not among the gate commands. Vitest suites exist under `nuxt/layer/test`.

## Acceptance criteria to proof

1-3, 12: tests/Feature/Api/RoutesApiTest.php, tests/Feature/PluginRoutesTest.php, tests/Feature/PluginFeatureRoutesTest.php
4, 36: tests/Feature/Api/ShellApiTest.php, tests/Feature/ShellTest.php
5: tests/Feature/Api/AuthApiTest.php, tests/Feature/PolicyTest.php
6-8, 10, 32: tests/Feature/Api/DashboardApiTest.php, tests/Feature/DashboardPersistenceTest.php, tests/Feature/RequestPersistTest.php, tests/ArchTest.php
9, 30: tests/Feature/PlacementUuidMigrationTest.php, tests/Feature/Api/DashboardLayoutApiTest.php, tests/Feature/DashboardLayoutTest.php, tests/Modes/RenamedTables/RenamedTablesTest.php, tests/Feature/LazyWidgetTest.php
11: tests/Unit/ExtensionContractTest.php, tests/Feature/Api/ScreenApiTest.php
13, 33: tests/Unit/Support/JsonDataTest.php, tests/Feature/JsonDataResolveTest.php, tests/Feature/Screens/FailureIsolationTest.php
14, 37: tests/Unit/Support/ClientPathTest.php, tests/Feature/Api/SearchApiTest.php, nuxt/layer/test/search.test.ts
15: tests/Unit/Support/IconifyTest.php, tests/Feature/IconsTest.php
16, 17: tests/Feature/RemovalTest.php, tests/Feature/FacadeDocblockTest.php, tests/ArchTest.php
18: tests/Feature/ConfigTest.php
19-22, 27, 34, 35: nuxt/layer/test/*.test.ts, nuxt/layer/test/consumer/build.mjs
23: tests/Feature/ChangelogUpgradeTest.php, tests/Feature/DocsTest.php (rest manual checklist)
24: gate above
25: tests/Feature/DocsTest.php
26: composer.json `test:nuxt`, .github/workflows/nuxt.yml
28: tests/Feature/ApiVersionTest.php, nuxt/layer/test/version.test.ts
29: tests/Feature/RemovedConfigKeysTest.php
31: tests/Feature/Api/ContractFixturesTest.php, nuxt/layer/test/fixtures.test-d.ts, nuxt/layer/test/fixtures-present.mjs
