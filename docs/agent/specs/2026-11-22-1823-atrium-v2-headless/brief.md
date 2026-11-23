Risk: high

## What changed

- **PHP API:** Atrium v2.0.0 stops rendering HTML. The Blade dashboard, CSS build, `StyleRegistry`, browser tests and the config keys `path`, `domain`, `middleware`, `alpine` and `logout_route` are removed. Each domain now registers JSON routes (`atrium.*`) from its own `routes.php`, behind `atrium.routes.*` and the fail-closed `Authorize` middleware. Payloads are `final` resources (`DashboardResource`, `ShellResource` and others). Resolver output passes through `JsonData::check()`, links through `ClientPath`, icons through `Iconify`.
- **Dashboards:** placements get a `uuid` and dashboards a `version` (new migration with backfill). Layout save is full-layout with a 409 on a stale `version`. Reads no longer write.
- **Integrations:** a new `Domains/Integrations` framework and `src/Integrations/{Pkg}` data-only declarations for Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom. Adds `atrium.screens.show`, the shell `integrations` and `search.sources` keys, live nav keys, and the cross-package hooks.
- **Nuxt layer:** `nuxt/layer` and `nuxt/playground` (Nuxt 4, Nuxt UI, i18n) with vendored OpenAPI clients per package, plus Atrium's own `openapi.json` and generated client.
- **Docs and CI:** README, CHANGELOG upgrade guide, local standards, PR template, a Nuxt CI workflow and `.gitattributes` archive rules.

## Why

Atrium v2 is headless: a JSON API plus a Nuxt layer, with the host choosing its own auth, so suite packages can ship only an API and MCP (spec.md goal). Decisions that shaped it:

- Distribution by git `extends` (D-001).
- A separate Node gate, `composer test:nuxt` (D-002).
- Full-layout save with orphans kept (D-006).
- Version guard with 409 (D-008).
- Eager widget failures isolated outside local and testing (D-009).
- Vendored package clients (D-020).
- Operator modes and some old actions not ported (D-032).

## Look at

- `config/atrium.php:65` and `:362`: the new `routes` and `integrations` sections and removed keys. This is a public config break. Check the banner, defaults and the fail-closed behavior.
- `src/Domains/Dashboard/Actions/SaveDashboardLayoutAction.php:36`: full-layout semantics, orphan retention, version check and the single transaction.
- `src/Support/ClientPath.php:45`: the security-sensitive link filter (bypass forms from AC 14).
- `database/migrations/` (the new uuid and version migration): configurable table keys, chunked backfill, `down()`, and behavior on MySQL and Postgres, which CI does not cover.
- `composer.json`: the dependency changes and the `.gitattributes` archive rules.

## Tested

- Gate round 2 passed: `composer test` with PHPStan clean, Pint clean, type coverage 100% and Pest 1357 tests (1350 passed, 7 skipped).
- AC 1-5, 12: route-name, gate and middleware tests and `ArchTest`.
- AC 6-10, 30, 32: dashboard API, layout and migration tests, including the `RenamedTables` suite.
- AC 11, 13-15, 33: `JsonData`, `ClientPath` and `Iconify` tests.
- AC 16, 17, 18, 23, 76: `RemovalTest`, `ArchTest`, `DocsTest`, `ChangelogUpgradeTest`.
- AC 31: `ContractFixturesTest`.
- AC 38-46, 65-68: `tests/Feature/Integrations/*`.
- AC 50: `VendoredClientsTest`. Its 7 skips are the missing-sibling-checkout cases.
- AC 72-74: `OpenApiTest`.
- AC 19-22, 47-49, 51-64, 69-71, 75 (Vitest): `composer test:nuxt` was not run in the gate. These criteria are unproven until it passes.

## Risks

- This is a big-bang breaking release. It changes the public API, config, schema and the Composer archive, and removes the old UI. Suite packages on `^1` keep working until they move.
- The Node gate (Vitest, typecheck, build, consumer build) was not run in the gate, so the Nuxt layer is untested here. Run `composer test:nuxt` before merge.
- The migration is checked on SQLite only. MySQL and Postgres are a PR-template item for the author.
- Before merge, confirm that the 7 sibling `composer.json` files require Atrium by `^1` and not `dev-main`. This is an open manual checklist item (AC 23).
- Vendored clients depart from git dependencies until the release step (D-020). The Polycart `client/` export-ignore risk is open.
- Parity departures: no permission-filtered nav and no operator modes, and old actions without a v2 route are dropped. All are listed in the CHANGELOG.
- Findings left: none (nits: 0).
