VERDICT: PASS

## Gate commands

- `composer test`: phpstan 0 errors, pint passed, type coverage 100.0%, pest 1357 tests (1350 passed, 7 skipped), 4690 assertions.
- `composer lint:check`: pint passed.
- `composer exec ringside check`: passed.

`composer test:nuxt` (AC 26) is not part of this gate run and was not run here.

## Acceptance criteria to proof (PHP side)

| AC | Proof |
| --- | --- |
| 1, 2, 3 | tests/Feature/Api/RoutesApiTest.php, tests/ArchTest.php, tests/Feature/RemovalTest.php |
| 4 | tests/Feature/Api/ShellApiTest.php, tests/Feature/ShellTest.php |
| 5 | tests/Feature/Api/AuthApiTest.php |
| 6, 7, 8 | tests/Feature/Api/DashboardApiTest.php |
| 9 | tests/Feature/PlacementUuidMigrationTest.php, tests/Modes/RenamedTables/RenamedTablesTest.php, tests/Feature/Api/WidgetApiTest.php |
| 10 | tests/Feature/RequestPersistTest.php, tests/Feature/Api/DashboardApiTest.php, tests/ArchTest.php |
| 11 | tests/Unit/ExtensionContractTest.php, tests/Feature/Api/ScreenApiTest.php, tests/Unit/Screens/* |
| 12 | tests/Feature/PluginRoutesTest.php, tests/Feature/PluginFeatureRoutesTest.php |
| 13 | tests/Unit/Support/JsonDataTest.php, tests/Feature/JsonDataResolveTest.php, tests/Feature/Screens/FailureIsolationTest.php |
| 14 | tests/Unit/Support/ClientPathTest.php, tests/Feature/Api/SearchApiTest.php |
| 15 | tests/Unit/Support/IconifyTest.php |
| 16, 17 | tests/Feature/RemovalTest.php, tests/Feature/FacadeDocblockTest.php, tests/ArchTest.php |
| 18 | tests/Feature/ConfigTest.php |
| 19 to 22 | Nuxt layer: nuxt/layer/test (run by composer test:nuxt) |
| 23 | tests/Feature/ChangelogUpgradeTest.php, tests/Feature/DocsTest.php |
| 24, 77 | composer test passed (above) |
| 25, 26 | composer test:nuxt, .github/workflows/nuxt.yml |
| 27 | nuxt/layer i18n; shell locale in tests/Feature/Api/ShellApiTest.php |
| 28 | tests/Feature/ApiVersionTest.php |
| 29 | tests/Feature/RemovedConfigKeysTest.php |
| 30 | tests/Feature/Api/DashboardLayoutApiTest.php, tests/Feature/DashboardLayoutTest.php |
| 31 | tests/Feature/Api/ContractFixturesTest.php |
| 32, 33 | tests/Feature/Api/DashboardLayoutApiTest.php, tests/Feature/Screens/FailureIsolationTest.php, tests/Feature/Api/WidgetApiTest.php |
| 34, 35 | Nuxt layer Vitest |
| 36 | tests/Feature/ThemesTest.php |
| 37 | tests/Unit/Support/ClientPathTest.php |
| 38 | tests/Feature/Integrations/IntegrationConfigTest.php |
| 39 | tests/Feature/Integrations/RegistrationTest.php |
| 40 | tests/Feature/Integrations/ApiBaseTest.php |
| 41 | tests/Feature/Integrations/FeatureFlagsTest.php |
| 42, 43 | tests/Feature/Api/ShellApiTest.php, tests/Unit/NavItemLiveTest.php |
| 44 | tests/Feature/Integrations/ScreenRouteTest.php |
| 45 | tests/Feature/Integrations/NoPackageCodeTest.php, tests/ArchTest.php |
| 46 | tests/Feature/SurfaceTest.php |
| 47 to 52 | Nuxt layer Vitest; AC 50 PHP side in tests/Feature/Integrations/VendoredClientsTest.php |
| 53 | per-package Integration tests (label keys), Vitest (layer keys) |
| 54 to 64, 69 to 71 | per-package tests/Feature/Integrations/{Cortex,Impex,Keen,PennantPlus,Polycart,Roster,Showroom}IntegrationTest.php and nuxt/layer/test/integrations |
| 65 to 68 | tests/Feature/Integrations/HooksTest.php, KeenIntegrationTest.php |
| 72 to 75 | tests/Feature/OpenApiTest.php, Vitest |
| 76 | tests/Feature/DocsTest.php, tests/Feature/ChangelogUpgradeTest.php |

The Nuxt rows are proved by `composer test:nuxt`, which this gate does not run.
