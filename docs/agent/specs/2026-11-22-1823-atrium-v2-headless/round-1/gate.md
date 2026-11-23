VERDICT: CHANGES

## Gate results

- `composer test`: passed (phpstan 0 errors, pint passed, type coverage 100%, Pest 893/893).
- `composer lint:check`: passed.
- `composer exec ringside check`: FAILED (exit 1). Output: "ringside: 1 problem(s) - Generated files are stale or missing. Run: vendor/bin/ringside sync". Blocker: the generated Ring Master files must be regenerated (via `composer exec ringside sync`) and committed.

## Acceptance criteria mapping (by test file; not individually re-verified beyond the green suite)

- 1-3, 12: tests/Feature/Api/RoutesApiTest.php, PluginRoutesTest.php, PluginFeatureRoutesTest.php, ArchTest.php
- 4: tests/Feature/Api/ShellApiTest.php, ShellTest.php
- 5: tests/Feature/Api/AuthApiTest.php
- 6-8, 10: tests/Feature/Api/DashboardApiTest.php, RequestPersistTest.php
- 9, 30, 32: tests/Feature/PlacementUuidMigrationTest.php, Api/DashboardLayoutApiTest.php, DashboardLayoutTest.php
- 11, 13, 33: tests/Feature/Screens/*, JsonDataResolveTest.php, tests/Unit/Support/JsonDataTest.php, LazyWidgetTest.php, Api/WidgetApiTest.php, Api/ScreenApiTest.php
- 14, 37: tests/Unit/Support/ClientPathTest.php, Api/SearchApiTest.php
- 15: tests/Unit/Support/IconifyTest.php, IconsTest.php
- 16, 17: tests/Feature/RemovalTest.php, FacadeDocblockTest.php, ArchTest.php
- 18: tests/Feature/ConfigTest.php
- 19-22, 25, 26, 27, 28 (Vitest): nuxt/layer/test/*.test.ts (not run in this gate; `composer test:nuxt` is a separate gate)
- 23: tests/Feature/ChangelogUpgradeTest.php, DocsTest.php
- 24: composer test (green)
- 28 (PHP): tests/Feature/ApiVersionTest.php
- 29: tests/Feature/RemovedConfigKeysTest.php
- 31: tests/Feature/Api/ContractFixturesTest.php
- 36: tests/Feature/ThemesTest.php

## Not run

`composer test:nuxt` was not part of this task's commands.
