Risk: high

## What changed

Atrium v2.0.0 stops rendering HTML and becomes a JSON API plus a Nuxt 4 layer.

- **PHP API:** every domain loads its own `routes.php` through Keystone's `loadApiRoutesFrom()` into one group (`atrium/api`, middleware `['api', Authorize::class]`, names `atrium.*`). Payloads are `final` resources, including `ShellResource` and `DashboardResource`, with abilities in `meta.abilities`. Resolver output passes through `JsonData::check()`.
- **Dashboards:** placements get a `uuid`. Dashboards get a `version` for a stale-write guard (409). The layout save is now full-layout and runs in one transaction. Reads no longer write.
- **Extensions:** widgets, tabs, sections and settings panels are sent as `{key, component, data}`. `view()` is gone. Icons are Iconify names. Links are `{path, external}` from `ClientPath`.
- **Removed:** Blade views, CSS, the heroicons set, `public/atrium.*`, `StyleRegistry`, `tests/Browser`, the npm CSS build, the config keys `path`, `domain`, `middleware`, `alpine` and `logout_route`, and `Atrium::path()` / `url()`.
- **Nuxt:** `nuxt/layer` (`@refactor-circus/atrium-nuxt`) and `nuxt/playground` in a pnpm workspace, with a committed lockfile, Vitest suites and contract fixtures.
- **Tooling and docs:** new `composer test:nuxt`, a `nuxt.yml` workflow, a PR template, `.gitattributes` archive rules, README, CHANGELOG upgrade guide, Boost skill and local standards.

## Why

v1 shipped a Blade dashboard that tied hosts to Atrium's markup and auth. v2 serves a JSON API, and a Nuxt layer renders it. Hosts choose their own auth, and suite packages plug in Vue components by key. The Blade dashboard is removed, not kept beside it (no compatibility shim).

Decisions that shaped it:

- D-001: the layer is distributed by git `extends`, not a registry.
- D-002: the Node gate is separate from `composer test`.
- D-003, D-011: the layer has i18n, and only `en` ships.
- D-004: `api_version` is compared with the layer version.
- D-005: removed config keys log a boot warning.
- D-006: full-layout save semantics, with orphans kept.
- D-007: contract fixtures are shared between PHP and Vitest.
- D-008: the `version` guard rejects stale writes.
- D-009: eager widget failure is isolated outside `local` and `testing`.
- D-010: icons come from a bundled lucide pack.
- D-012, D-013: `atrium.theme` stays, and `ClientPath` returns `null` for rejected URLs.
- D-015 to D-017: the archive rules, removal of the path helpers, and direct pinned layer dependencies.

## Look at

- `src/Domains/Dashboard/Actions/Concerns/ClaimsDashboardVersion.php:28`: the stale-write guard. Check that the 409 and the version increment are atomic and run inside the action transaction.
- `src/Support/ClientPath.php:57`: the URL allow-list. It is the open-redirect and XSS boundary for nav and search links.
- `src/Support/JsonData.php:42`: the serializability walk, with its depth limit and cycle guard, and the failure isolation that depends on it.
- `src/Domains/Dashboard/Http/Requests/SaveDashboardLayoutRequest.php:51`: the full-layout save, uuid scoping and orphan handling.
- `database/migrations/*_add_uuid_and_version_to_atrium_dashboards.php`: the backfill, the configurable table keys and `down()`.

## Tested

The round 2 gate passed. `composer test` ran phpstan (0 errors), pint, type coverage 100% and Pest (904 tests, 3194 assertions).

| Acceptance criteria | Tests |
|---|---|
| 1-3, 12 | `RoutesApiTest`, `PluginRoutesTest`, `PluginFeatureRoutesTest` |
| 4, 36 | `ShellApiTest`, `ShellTest` |
| 5 | `AuthApiTest`, `PolicyTest` |
| 6-8, 10, 32 | `DashboardApiTest`, `DashboardPersistenceTest`, `RequestPersistTest`, `ArchTest` |
| 9, 30 | `PlacementUuidMigrationTest`, `DashboardLayoutApiTest`, `WidgetApiTest`, `DashboardLayoutTest`, `RenamedTablesTest` |
| 11 | `ExtensionContractTest`, `ScreenApiTest` |
| 13, 33 | `JsonDataTest`, `JsonDataResolveTest`, `FailureIsolationTest` |
| 14, 37 | `ClientPathTest`, `SearchApiTest` |
| 15 | `IconifyTest` |
| 16, 17 | `RemovalTest`, `FacadeDocblockTest`, `ArchTest` |
| 18 | `ConfigTest` |
| 23, 25 | `ChangelogUpgradeTest`, `DocsTest` |
| 28 | `ApiVersionTest`, `version.test.ts` |
| 29 | `RemovedConfigKeysTest` |
| 31 | `ContractFixturesTest`, `fixtures.test-d.ts`, `fixtures-present.mjs` |
| 19-22, 27, 34, 35 | Vitest suites in `nuxt/layer/test` and `consumer/build.mjs` |

## Risks

- **Not run by the gate:** `composer test:nuxt` (AC 19-22, 26, 27, 34, 35). The Vitest suites, typecheck, build and consumer build were not run in the gate. Run it before merge. Done requires it.
- **Breaking release:** this is a public contract, config, schema and dependency change. Nothing on `^2` renders without the Nuxt layer, and the config keys and routes from v1 are gone. Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom must stay on `^1` until each is migrated, and each needs its own spec.
- **Manual checklist (owner: PR author):** the migration on MySQL and Postgres (CI covers SQLite only), the sibling `composer.json` and CI check for `^1` and not `dev-main`, and the docs items not covered by Pest.
- **Security:** `APP_ENV=local` lets any authenticated user through the `viewAtrium` gate. Atrium ships no auth, and the fail-closed default is `Authorize`, which returns 401 JSON. The layer is fetched from a mutable `v*` tag, so production hosts should pin a SHA.
- Nits: 0.
