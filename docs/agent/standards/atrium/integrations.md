---
description: "Atrium's suite integrations (Cortex, Impex, Keen, PennantPlus, Polycart, Roster, Showroom): the framework in Domains/Integrations and per-package definitions in src/Integrations/{Pkg}; PHP declares static data only and never loads package code; Vue in app/integrations/{pkg} and app/pages/{pkg} calls each package API through useAtriumIntegration(); registration by installed + enabled + API base, activation by Pennant flags; cross-package hooks; vendored clients (D-020)."
tags: [atrium, integrations, suite, nuxt, vue, openapi, pennant, hooks]
kind: architectural
---

# Suite Integrations

Complements [[components]] and [[domains]]: Atrium hosts the front ends of the seven suite packages, which in v2 ship only a JSON API, an MCP server, `openapi.json` and a generated client. Atrium names the packages by the user's decision (shape.md); the departures from [[dependencies]] and [[domain-modules]] are rows in `docs/agent/standards-feedback.md`.

## Layout

- **Framework:** `src/Domains/Integrations/`: the `Contracts\Integration` contract and its `Support\Integration` base, `Contracts\InstalledPackages` (bound to `Services\ComposerInstalledPackages`), `Services\IntegrationRegistry`, `Services\IntegrationFeatures`, `Data\ScreenDeclaration` and `Data\SearchSourceDeclaration`, and the `atrium.screens.show` controller, request and `routes.php`. `IntegrationsServiceProvider` is in `DomainServiceProvider::$providers`.
- **Per package:** `src/Integrations/{Pkg}/` holds `{Pkg}Integration` and `{Pkg}Feature`, nothing else. The registry finds `RefactorCircus\Atrium\Integrations\{Pkg}\{Pkg}Integration` by convention from the keys of `atrium.integrations`, so adding a package adds a folder and a config key, not a registration.
- **Hooks:** `src/Integrations/Hooks/` (`CortexRedirectDomains`, `ImpexRunLink`, `KeenHistory`), registered from `IntegrationsServiceProvider` after the integrations.
- **Strings:** server-side labels in `lang/en/integrations/{pkg}.php`; layer strings in `nuxt/layer/i18n/locales/integrations/{pkg}.en.json` (Roster and Showroom also one file per screen area, the hooks `hooks.en.json`). Only `en` ships.
- **Layer:** `nuxt/layer/app/integrations/{pkg}/` holds `index.ts` (its registrations, its `screens` map of screen key to route name, and its `// Not ported (D-032)` comment), `components/` and the vendored `client/`. Pages live in `nuxt/layer/app/pages/{pkg}/`, so every path starts with `/{pkg}/`. Tests live in `nuxt/layer/test/integrations/{pkg}/`; `test/integrations/support.ts` has `mockPackageApi()`.
- **Fixtures:** each package's PHP integration test writes its declarations to `nuxt/layer/test/fixtures/integrations/{pkg}.json` under the contract-fixture rules (compare by default, rewrite only with `UPDATE_FIXTURES=1`).

## PHP declares data only

- An integration returns nav items, widget definitions, a settings panel, search source descriptors and screen declarations (key, kind, Nuxt path, subject morph alias, optional static `options`). Every widget, settings panel, tab and section sends static data only: `{}` or its hook configuration, never a resolver that reads package state.
- Atrium's PHP never loads a package's classes, models or actions: nothing in `src/` names `RefactorCircus\Cortex`, `\Impex`, `\Keen`, `\PennantPlus`, `\Polycart`, `\Roster` or `\Showroom`, not even as a string, and `composer.json` `require` names only PHP, Laravel and `refactor-circus/keystone`.
- Screen keys start with `{pkg}.` and paths with `/{pkg}/`; the registry throws otherwise. v1 keys are kept, so host extensions still attach.
- Morph aliases a hook needs (`subject_type`, `owner_type`) are constants in Atrium, checked against the package's documented alias by its integration test.

## Vue calls the package through its client

- A component calls only its own package's API, through `useAtriumIntegration(pkg).client` (an `openapi-fetch` client typed by the vendored `schema.d.ts`), plus `atrium.screens.show` for extensions. A cross-package hook is the one exception.
- Every client carries the one `$atrium.auth()` adapter: its headers and credentials, `Accept: application/json`, and `onUnauthorized()` on a 401 (except on a page declared public).
- The widgets of one integration share one request per dashboard load through `useIntegrationQuery(pkg, operation)`.
- Search sources register with `$atrium.searchSource(key, fn)` and live nav badges or children with `$atrium.live(key, fn)`. Results pass the link guard.
- Every screen follows the common contract: lists page as the endpoint does and send the old filters as its query; every v1 action calls the matching v2 route then reloads, destructive ones after a confirmation; 422 shows field errors, 403 `<AtriumNoAccess>`, 404 a not-found state; tabs and sections come from `<AtriumIntegrationScreen>` and switching tab sends `?tab=`.
- An old action with no v2 route is left out and named in the `// Not ported (D-032)` comment at the top of `index.ts` (or the area's index page for Roster and Showroom), then in the CHANGELOG. Never invent an Atrium-side substitute.
- Each screen has a Vitest file that mocks `fetch`, types each payload with `satisfies` against the vendored `paths`/`components`, and asserts the load request, every mutation (method, path, body) and the 403 state.

## Gating

- **Registration (boot):** an integration registers when `InstalledPackages` reports `refactor-circus/{pkg}` installed, `atrium.integrations.{pkg}.enabled` is true (boolean-coerced), and it has an API base: a non-empty `api_base`, else `/` plus `{pkg}.routes.prefix` while `{pkg}.routes.enabled`. Without one it does not register and logs one warning per process. Tests bind a fake `InstalledPackages` and re-run `IntegrationRegistry::register()`.
- **Activation (per request):** every name in `atrium.integrations.{pkg}.features` must be active, through Pennant's `Feature::for($user)->active()` when Pennant is available (behind a seam the tests replace), all on otherwise. `{Pkg}Feature` resolves `true` and imports nothing from Pennant. Nav items, widgets and the settings panel are gated through `Gated::authorize()`; the shell, `atrium.widgets.index` and `atrium.screens.show` read the same answer.
- **Layer:** the shell's `integrations` decides. `atrium-integration.global.ts` renders `<AtriumIntegrationUnavailable>` on a `/{pkg}/` path whose integration is not active, and calls no package API. Every integration always compiles: there is no build-time pruning.
- The plugin feature gate (`Gatekeeper`) is separate and unchanged. Nav items are not filtered by package permissions (D-031).

## Cross-package hooks

- A hook registers only while both of its integrations are registered, and follows both their flags; it has no flag of its own.
- Its targets come from `atrium.integrations.{pkg}.*` with the v1 defaults. A target is `*`, `{package}.*` or a screen key, and a slot matches `Screen::NAME_PATTERN`. An invalid one throws `InvalidArgumentException` in `local` and `testing`, and is reported and skipped elsewhere.
- Hook data is the hook's configuration plus the screen's declared `subject_type`; the Vue component adds the record key from `?record=`.

## Vendored clients (D-020)

- `nuxt/layer/app/integrations/{pkg}/client/` holds `openapi.json`, `schema.d.ts` (the package's `client/src/schema.d.ts`, verbatim) and `openapi.sha256`. Never hand-edit them: refresh with `pnpm -C nuxt sync:clients` from `$ATRIUM_SUITE_PATH/{Pkg}` (default: the repository's parent directory). A missing source fails the sync naming the package and the path; a missing package build stops the work with a decision (D-039).
- `VendoredClientsTest` checks every stamp, and compares the copies with a sibling checkout when present. Nothing in `nuxt/` imports `@refactor-circus/*-client` until the release step switches to pnpm git dependencies (`github:refactor-circus/{pkg}#v2.0.0&path:/client`), which the PR template tracks.
- Atrium's own API follows the same idea: `openapi.json` from `composer openapi:export`, `nuxt/layer/app/client/schema.d.ts` from `pnpm -C nuxt generate:client`, and `OpenApiTest` failing when either is stale.

## Enforcement

- `tests/ArchTest.php` and `tests/Feature/Integrations/NoPackageCodeTest.php`: no package namespace in `src/`, `require` unchanged.
- `tests/Feature/Integrations/*IntegrationTest.php`: gating, API base, declarations and the fixture, per package; `HooksTest` for the hooks.
- Vitest: every fixture screen key has a page at its declared path, every `t()` key exists, and each screen's requests.
- `VendoredClientsTest` and `OpenApiTest` (no Node), and `composer test:nuxt`.
