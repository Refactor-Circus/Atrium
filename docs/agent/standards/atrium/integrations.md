---
description: "Atrium's suite integrations (Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster, Showroom): the framework in Domains/Integrations; each package declares its integration in a JSON manifest (integration.json, D-090) Atrium checks against the SDK-published schema, never in Atrium PHP; Vue in each package's own Atrium module (its atrium/ folder, D-089) calls the package API through useAtriumIntegration() with the package's own client; registration by manifest found + enabled + API base, activation by Pennant flags; cross-package hooks declared by the package whose API they call; response handlers and shell-less pages; roles and permissions in Guardian; no staged modules or vendored clients in Atrium."
tags: [atrium, integrations, suite, modules, vue, openapi, pennant, hooks]
kind: architectural
---

# Suite Integrations

Complements [[components]] and [[domains]]: Atrium hosts the front ends of the eight suite packages, which in v2 ship a JSON API, an MCP server, `openapi.json`, a generated client and their own Atrium module. Atrium names the packages by the user's decision (shape.md); the departures from [[dependencies]] and [[domain-modules]] are rows in `docs/agent/standards-feedback.md`.

## Layout

- **Framework:** `src/Domains/Integrations/`: `Contracts\InstalledPackages` (the installed packages' manifests, bound to `Services\ComposerInstalledPackages` over `atrium:discover`'s module cache), `Services\IntegrationManifests` (reads and checks a manifest: `Support\ManifestSchema` for the schema, then the manifest rules), `Support\ManifestValues` (the `$config`, `$screen`, `$option` and `$subject_scope` expressions), `Services\IntegrationRegistry`, `Services\IntegrationHooks`, `Services\IntegrationFeatures`, `Data\IntegrationManifest`, `Data\RegisteredIntegration`, `Data\ScreenDeclaration` and `Data\SearchSourceDeclaration`, and the `atrium.screens.show` controller, request and `routes.php`. `IntegrationsServiceProvider` is in `DomainServiceProvider::$providers`.
- **Per package: a manifest, in the package (D-090).** `atrium/src/integration.json`, copied by the preset to `dist/atrium/integration.json` and named by `extra.atrium.integration`. Atrium has no `src/Integrations/`, no feature class and no label file of any package, and `config/atrium.php` lists no package: `atrium.integrations.{pkg}.*` only overrides. The schema is `ui/sdk/schema/integration.schema.json`; PHP and the SDK (`ui/sdk/vite/manifest.mjs`) implement it and the same rules, and refuse `ui/sdk/test/fixtures/manifests/cases.json` at the same JSON pointers. `MODULES.md` §8 is the format's guide.
- **Sources:** installed packages (while `atrium.discover`), `Atrium::module()` folders, then `Atrium::integration(path|array)` (an app's manifest-only integration), each winning over the one before for its key; a manifest's `key` is its module's.
- **Hooks:** each manifest's `hooks`, run by `IntegrationHooks` after the integrations register, in integration key order then manifest order.
- **Strings:** server-side labels are the manifest's plain English, through `__()` (hosts translate them in lang JSON); the module's strings in the package's `atrium/src/locales/{pkg}.en.json` (Guardian, Roster and Showroom also one file per screen area, the hooks `hooks.en.json` in the module that owns them), passed as the module's `messages`. Only `en` ships.
- **Module (D-089):** each package ships its front-end module in its own repository, in `atrium/`: `src/atrium.ts` (`defineAtriumModule()` with its registrations, its `screens` map of screen key to route name, its `responseHandlers`, and its `// Not ported (D-032)` comment), `src/routes.ts` (explicit routes keeping the old route names, such as `impex-runs-run`), `src/pages/`, `src/components/`, `src/env.d.ts` (its `AtriumIntegrationPaths` augmentation over the package's own `client/`), `test/`, and the committed `dist/atrium/` declared in the package's `extra.atrium`. Every path starts with `/{pkg}/`; `@refactor-circus/atrium/testing` has `mockPackageApi()`. Atrium stages no module (no `ui/modules/{pkg}`) and vendors no client. The workbench loads the sibling checkouts' built modules with `Atrium::module()` when `ATRIUM_SUITE_PATH` is set (`DemoSuite`), and shows the fallback cards otherwise. `MODULES.md` is the guide to writing a module.
- **Fixtures:** Atrium's tests read the suite's manifests from `tests/Fixtures/Manifests/{pkg}/integration.json` (the workbench's `DemoSuite` too, a checkout's own winning); each package's integration test writes what its manifest registers to `ui/sdk/test/fixtures/integrations/{pkg}.json` under the contract-fixture rules (compare by default, rewrite only with `UPDATE_FIXTURES=1`), exported to modules as `@refactor-circus/atrium/fixtures/integrations/{pkg}.json`.

## A manifest declares data only

- A manifest holds nav items, widget definitions, a settings panel, search source descriptors and screen declarations (key, kind, front-end path, subject morph alias, optional `options`), `features` and `hooks`. Every widget, settings panel, tab and section sends static data only: `{}` or its hook configuration, never a resolver that reads package state. Values the host configures are `$config` expressions, read at registration, limited to `{pkg}.*` and `atrium.integrations.{pkg}.*` so a manifest cannot send a host secret to the browser.
- Atrium's PHP never loads a package's classes, models or actions: nothing in `src/` names `RefactorCircus\Cortex`, `\Guardian`, `\Impex`, `\Keen`, `\PennantPlus`, `\Polycart`, `\Roster` or `\Showroom`, not even as a string, and `composer.json` `require` names only PHP, Laravel and `refactor-circus/keystone`.
- Screen, widget, live and hook extension keys start with `{pkg}.`, screen and nav paths with `/{pkg}/`; a bad manifest throws `InvalidIntegrationException` naming the file and the JSON pointer. v1 keys are kept, so host extensions still attach.
- Morph aliases a hook needs (`subject_type`, `owner_type`) are the screens' `subject_type` in the owning package's manifest.

## Vue calls the package through its client

- A component calls only its own package's API, through `useAtriumIntegration(pkg).client` (an `openapi-fetch` client typed by the module's `AtriumIntegrationPaths` augmentation over the package's own generated `schema.d.ts`; or `useAtriumIntegration(pkg, createXClient)` with a client factory, D-083), plus `atrium.screens.show` for extensions. A cross-package hook is the one exception, and lives in the module of the package whose API it calls.
- Every client is signed like every Atrium request (`atriumClientOptions(pkg)`: the session's CSRF headers by default, or the one `useAtrium().auth()` adapter): its headers and credentials, `Accept: application/json`, and `onUnauthorized()` on a 401 (except on a page declared public).
- The widgets of one integration share one request per dashboard load through `useIntegrationQuery(pkg, operation)`.
- Search sources register in the module's `searchSources` (keyed by the shell's source key) and live nav badges or children in its `liveResolvers`. Results pass the link guard.
- Every screen follows the common contract: lists page as the endpoint does and send the old filters as its query; every v1 action calls the matching v2 route then reloads, destructive ones after a confirmation; 422 shows field errors, 403 `<AtriumNoAccess>`, 404 a not-found state; tabs and sections come from `<AtriumIntegrationScreen>` and switching tab sends `?tab=`.
- An old action with no v2 route is left out and named in the `// Not ported (D-032)` comment at the top of `src/atrium.ts` (or the area's index page for Roster and Showroom), then in the CHANGELOG. Never invent an Atrium-side substitute.
- Each screen has a Vitest file that mocks `fetch`, types each payload with `satisfies` against the package client's `paths`/`components`, and asserts the load request, every mutation (method, path, body) and the 403 state.

## Gating

- **Registration (boot):** an integration registers when Atrium finds its manifest, `atrium.integrations.{pkg}.enabled` is true (boolean-coerced), and it has an API base: a non-empty `api_base`, else `/` plus `{pkg}.routes.prefix` while `{pkg}.routes.enabled`. Without one it does not register and logs one warning per process. Tests bind a fake `InstalledPackages` (`IntegrationFixture::installed()`) and re-run `IntegrationRegistry::register()`.
- **Activation (per request):** every name in the manifest's `features` (or `atrium.integrations.{pkg}.features`) must be active, through Pennant's `Feature::for($user)->active()` when Pennant is available (behind a seam the tests replace), all on otherwise. Atrium defines a manifest's own names as on until the host defines them; a name only the host lists reads as off until defined. Nav items, widgets and the settings panel are gated through `Gated::authorize()`; the shell, `atrium.widgets.index` and `atrium.screens.show` read the same answer.
- **Front end:** the page loads a module's script only while its integration is registered and active for the user, and its key is not in `atrium.disabled`. The shell's `integrations` decides at run time: Atrium's integration guard (`ui/app/src/integration-guard.ts`) renders `<AtriumIntegrationUnavailable>` on a `/{pkg}/` path whose integration is not active, and calls no package API.
- The plugin feature gate (`Gatekeeper`) is separate and unchanged. Nav items are not filtered by package permissions (D-031).

## Cross-package hooks

- A hook is declared in the manifest of the package whose API its component calls (Cortex's redirect domains, Impex's run link, Keen's history and activity, Guardian's tabs and section). It registers only while both of its integrations are registered, and follows both their flags; it has no flag of its own.
- Its placements are its manifest `default`, or the host's `atrium.integrations.{pkg}.{config}` (the v1 config shapes: `map`, `lists`, `targets`, `options`). A target is `*`, `{package}.*` or a screen key, and a slot matches `Screen::NAME_PATTERN`. An invalid one throws `InvalidArgumentException` in `local` and `testing`, and is reported and skipped elsewhere.
- Hook data is the manifest's `data`, with `$screen` (`subject_type`, `package`, `key`), `$option` and `$subject_scope` read per screen; the Vue component adds the record key from `?record=`.
- A hook's Vue component lives in `src/components/hooks/` of the module whose package API it calls, and wraps that module's own components (Guardian's `guardian.access` wraps `GuardianAssignments`), which take their record as a prop rather than reading the route.

## Roles and permissions live in Guardian

- Guardian, not Roster, owns roles, permissions and role assignments. Their screens are `guardian.roles`, `guardian.role`, `guardian.permissions`, `guardian.role-assignments` and `guardian.user`; Roster's `roster.roles`, `roster.role` and `roster.permissions` are gone with no alias (D-046), and Roster's organization and user screens get role assignments from the `guardian.access` hook (`GuardianScreens`).
- Scoped screens name a scope by the morph type Guardian stores, from Guardian's manifest (`$config` `map` of `atrium.integrations.guardian.scope_types`, null values through `guardian.adopt.scope_types.{key}`; `$subject_scope` for the access tab); a scope that does not resolve is not offered, and its hook tab is skipped with one warning per process (D-048).

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
- `tests/Feature/Integrations/*IntegrationTest.php`: gating, API base, declarations and the fixture, per package, from the fixture manifests; `HooksTest` for the hooks; `ManifestTest` for the schema, the rules, the sources and the expressions (and that `src/Integrations` and `lang/en/integrations` stay gone); `ui/sdk/test/manifest.test.ts` for the SDK's validator, `expectIntegrationManifest()` and the preset's copy.
- Vitest, in each package's module: every fixture screen key has a page at its declared path, every `t()` key exists, and each screen's requests.
- `OpenApiTest` and `BuildFreshnessTest` (no Node), and `composer test:ui` (with the consumer check, a module built, type-checked and tested against the packed SDK).
