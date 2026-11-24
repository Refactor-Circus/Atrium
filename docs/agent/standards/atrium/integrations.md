---
description: "Atrium's suite integrations (Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster, Showroom): the framework in Domains/Integrations and per-package definitions in src/Integrations/{Pkg}; PHP declares static data only and never loads package code; Vue in each package's own Atrium module (its atrium/ folder, D-089) calls the package API through useAtriumIntegration() with the package's own client; registration by installed + enabled + API base, activation by Pennant flags; cross-package hooks; response handlers and shell-less pages; roles and permissions in Guardian; no staged modules or vendored clients in Atrium."
tags: [atrium, integrations, suite, modules, vue, openapi, pennant, hooks]
kind: architectural
---

# Suite Integrations

Complements [[components]] and [[domains]]: Atrium hosts the front ends of the eight suite packages, which in v2 ship a JSON API, an MCP server, `openapi.json`, a generated client and their own Atrium module. Atrium names the packages by the user's decision (shape.md); the departures from [[dependencies]] and [[domain-modules]] are rows in `docs/agent/standards-feedback.md`.

## Layout

- **Framework:** `src/Domains/Integrations/`: the `Contracts\Integration` contract and its `Support\Integration` base, `Contracts\InstalledPackages` (bound to `Services\ComposerInstalledPackages`), `Services\IntegrationRegistry`, `Services\IntegrationFeatures`, `Data\ScreenDeclaration` and `Data\SearchSourceDeclaration`, and the `atrium.screens.show` controller, request and `routes.php`. `IntegrationsServiceProvider` is in `DomainServiceProvider::$providers`.
- **Per package:** `src/Integrations/{Pkg}/` holds `{Pkg}Integration` and `{Pkg}Feature`, nothing else. The registry finds `RefactorCircus\Atrium\Integrations\{Pkg}\{Pkg}Integration` by convention from the keys of `atrium.integrations`, so adding a package adds a folder and a config key, not a registration.
- **Hooks:** `src/Integrations/Hooks/` (`CortexRedirectDomains`, `ImpexRunLink`, `KeenHistory`, `GuardianScreens`), registered from `IntegrationsServiceProvider` after the integrations.
- **Strings:** server-side labels in `lang/en/integrations/{pkg}.php`; the module's strings in the package's `atrium/src/locales/{pkg}.en.json` (Guardian, Roster and Showroom also one file per screen area, the hooks `hooks.en.json` in the module that owns them), passed as the module's `messages`. Only `en` ships.
- **Module (D-089):** each package ships its front-end module in its own repository, in `atrium/`: `src/atrium.ts` (`defineAtriumModule()` with its registrations, its `screens` map of screen key to route name, its `responseHandlers`, and its `// Not ported (D-032)` comment), `src/routes.ts` (explicit routes keeping the old route names, such as `impex-runs-run`), `src/pages/`, `src/components/`, `src/env.d.ts` (its `AtriumIntegrationPaths` augmentation over the package's own `client/`), `test/`, and the committed `dist/atrium/` declared in the package's `extra.atrium`. Every path starts with `/{pkg}/`; `@refactor-circus/atrium/testing` has `mockPackageApi()`. Atrium stages no module (no `ui/modules/{pkg}`) and vendors no client. The workbench loads the sibling checkouts' built modules with `Atrium::module()` when `ATRIUM_SUITE_PATH` is set (`DemoSuite`), and shows the fallback cards otherwise. `MODULES.md` is the guide to writing a module.
- **Fixtures:** each package's PHP integration test writes its declarations to `ui/sdk/test/fixtures/integrations/{pkg}.json` under the contract-fixture rules (compare by default, rewrite only with `UPDATE_FIXTURES=1`), exported to modules as `@refactor-circus/atrium/fixtures/integrations/{pkg}.json`. The fixtures and the PHP declarations stay in Atrium.

## PHP declares data only

- An integration returns nav items, widget definitions, a settings panel, search source descriptors and screen declarations (key, kind, front-end path, subject morph alias, optional static `options`). Every widget, settings panel, tab and section sends static data only: `{}` or its hook configuration, never a resolver that reads package state.
- Atrium's PHP never loads a package's classes, models or actions: nothing in `src/` names `RefactorCircus\Cortex`, `\Guardian`, `\Impex`, `\Keen`, `\PennantPlus`, `\Polycart`, `\Roster` or `\Showroom`, not even as a string, and `composer.json` `require` names only PHP, Laravel and `refactor-circus/keystone`.
- Screen keys start with `{pkg}.` and paths with `/{pkg}/`; the registry throws otherwise. v1 keys are kept, so host extensions still attach.
- Morph aliases a hook needs (`subject_type`, `owner_type`) are constants in Atrium, checked against the package's documented alias by its integration test.

## Vue calls the package through its client

- A component calls only its own package's API, through `useAtriumIntegration(pkg).client` (an `openapi-fetch` client typed by the module's `AtriumIntegrationPaths` augmentation over the package's own generated `schema.d.ts`; or `useAtriumIntegration(pkg, createXClient)` with a client factory, D-083), plus `atrium.screens.show` for extensions. A cross-package hook is the one exception, and lives in the module of the package whose API it calls.
- Every client is signed like every Atrium request (`atriumClientOptions(pkg)`: the session's CSRF headers by default, or the one `useAtrium().auth()` adapter): its headers and credentials, `Accept: application/json`, and `onUnauthorized()` on a 401 (except on a page declared public).
- The widgets of one integration share one request per dashboard load through `useIntegrationQuery(pkg, operation)`.
- Search sources register in the module's `searchSources` (keyed by the shell's source key) and live nav badges or children in its `liveResolvers`. Results pass the link guard.
- Every screen follows the common contract: lists page as the endpoint does and send the old filters as its query; every v1 action calls the matching v2 route then reloads, destructive ones after a confirmation; 422 shows field errors, 403 `<AtriumNoAccess>`, 404 a not-found state; tabs and sections come from `<AtriumIntegrationScreen>` and switching tab sends `?tab=`.
- An old action with no v2 route is left out and named in the `// Not ported (D-032)` comment at the top of `src/atrium.ts` (or the area's index page for Roster and Showroom), then in the CHANGELOG. Never invent an Atrium-side substitute.
- Each screen has a Vitest file that mocks `fetch`, types each payload with `satisfies` against the package client's `paths`/`components`, and asserts the load request, every mutation (method, path, body) and the 403 state.

## Gating

- **Registration (boot):** an integration registers when `InstalledPackages` reports `refactor-circus/{pkg}` installed, `atrium.integrations.{pkg}.enabled` is true (boolean-coerced), and it has an API base: a non-empty `api_base`, else `/` plus `{pkg}.routes.prefix` while `{pkg}.routes.enabled`. Without one it does not register and logs one warning per process. Tests bind a fake `InstalledPackages` and re-run `IntegrationRegistry::register()`.
- **Activation (per request):** every name in `atrium.integrations.{pkg}.features` must be active, through Pennant's `Feature::for($user)->active()` when Pennant is available (behind a seam the tests replace), all on otherwise. `{Pkg}Feature` resolves `true` and imports nothing from Pennant. Nav items, widgets and the settings panel are gated through `Gated::authorize()`; the shell, `atrium.widgets.index` and `atrium.screens.show` read the same answer.
- **Front end:** the page loads a module's script only while its integration is registered and active for the user, and its key is not in `atrium.disabled`. The shell's `integrations` decides at run time: Atrium's integration guard (`ui/app/src/integration-guard.ts`) renders `<AtriumIntegrationUnavailable>` on a `/{pkg}/` path whose integration is not active, and calls no package API.
- The plugin feature gate (`Gatekeeper`) is separate and unchanged. Nav items are not filtered by package permissions (D-031).

## Cross-package hooks

- A hook registers only while both of its integrations are registered, and follows both their flags; it has no flag of its own.
- Its targets come from `atrium.integrations.{pkg}.*` with the v1 defaults. A target is `*`, `{package}.*` or a screen key, and a slot matches `Screen::NAME_PATTERN`. An invalid one throws `InvalidArgumentException` in `local` and `testing`, and is reported and skipped elsewhere.
- Hook data is the hook's configuration plus the screen's declared `subject_type`; the Vue component adds the record key from `?record=`.
- A hook's Vue component lives in `src/components/hooks/` of the module whose package API it calls, and wraps that module's own components (Guardian's `guardian.access` wraps `GuardianAssignments`), which take their record as a prop rather than reading the route.

## Roles and permissions live in Guardian

- Guardian, not Roster, owns roles, permissions and role assignments. Their screens are `guardian.roles`, `guardian.role`, `guardian.permissions`, `guardian.role-assignments` and `guardian.user`; Roster's `roster.roles`, `roster.role` and `roster.permissions` are gone with no alias (D-046), and Roster's organization and user screens get role assignments from the `guardian.access` hook (`GuardianScreens`).
- Scoped screens name a scope by the morph type Guardian stores, from `GuardianScopeTypes` (`atrium.integrations.guardian.scope_types`, null values through `guardian.adopt.scope_types.{key}`); a scope that does not resolve is not offered, and its hook tab is skipped with one warning per process (D-048).

## Response handlers and shell-less pages

- A module's `responseHandlers` (or `useAtrium().responseHandler(key, handler)`) registers a handler that sees every response of every integration client, `useAtriumClient()` and `useAtriumApi()`, in registration order, before the caller. Each gets its own copy; one that throws is logged and skipped. Register it in the module's `responseHandlers`, so it is installed before the first navigation and runs even when the shell request fails. A handler shows an app-wide notice with `useAtrium().notify(key, notice)` rather than its own banner (D-065).
- Guardian's `guardian.two-factor` handler sends a 403 `two_factor_challenge_required` or `two_factor_enrollment_required` to its challenge or setup page, once for concurrent 403s, and never while one of those pages is open.
- A page that must work without the shell (`/roster/invitations/:token`, `/guardian/two-factor/challenge`, `/guardian/two-factor/setup`) declares `meta: { atrium: { public: true } }` on its route and renders in the public layout, builds a client of its own (the page's boot data, a loaded shell's `api_base`, then the package default), never reloads the page on a 401, never calls `atrium.screens.show`, and is exempt from the page-has-a-screen check (D-038, D-050).
- Secrets a page handles (two-factor codes, plain API and SCIM tokens, TOTP secrets) stay in component state: never in the URL, the title, logs or storage.

## Clients (D-089, superseding D-020)

- Each module types its package's API with the package's own generated client (`client/src/schema.d.ts` in the package). Atrium keeps no copy of any package's `openapi.json` or `schema.d.ts`; a module that needs another package's types keeps its own copy (Showroom's `atrium/types/impex-schema.d.ts`), never imports another package's module.
- Atrium's own API follows the same idea: `openapi.json` from `composer openapi:export`, `ui/sdk/src/client/schema.d.ts` from `pnpm -C ui generate:client`, and `OpenApiTest` failing when either is stale.

## Enforcement

- `tests/ArchTest.php` and `tests/Feature/Integrations/NoPackageCodeTest.php`: no package namespace in `src/`, `require` unchanged.
- `tests/Feature/Integrations/*IntegrationTest.php`: gating, API base, declarations and the fixture, per package; `HooksTest` for the hooks.
- Vitest, in each package's module: every fixture screen key has a page at its declared path, every `t()` key exists, and each screen's requests.
- `OpenApiTest` and `BuildFreshnessTest` (no Node), and `composer test:ui` (with the consumer check, a module built, type-checked and tested against the packed SDK).
