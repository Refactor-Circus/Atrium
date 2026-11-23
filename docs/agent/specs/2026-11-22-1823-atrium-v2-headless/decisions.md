# Decisions

## D-001: How is the Nuxt layer distributed to host apps?
- Choice: Git `extends` from the repo tag (`github:refactor-circus/atrium/nuxt/layer#v2.0.0`), no registry
- Rationale: The user took the recommendation: it needs no registry, and the layer stays on the same tag as the Composer package.
- Date: 2026-11-22
- Raised by: spec review (scope, testability)

## D-002: Where do the Nuxt checks (typecheck, build, Vitest) run?
- Choice: A `composer test:nuxt` script, which CI runs as its own job; `composer test` stays PHP-only
- Rationale: The user took the recommendation: Node stays out of the PHP gate, and the layer is still gated.
- Date: 2026-11-22
- Raised by: spec review (scope, testability)

## D-003: Is layer localization (i18n) in scope for v2.0.0?
- Choice: In scope: the layer ships i18n with locale files
- Rationale: Chosen by the user over the recommendation to leave it out.
- Date: 2026-11-22
- Raised by: spec review (scope)

## D-004: How is version skew between the Composer API and the Nuxt layer handled?
- Choice: The shell response carries an API version, and the layer warns on a mismatch
- Rationale: The user took the recommendation.
- Date: 2026-11-22
- Raised by: spec review (risk)

## D-005: What happens at boot when a v1 config still has the removed keys?
- Choice: Log a deprecation warning at boot that names the keys
- Rationale: The user took the recommendation. A guard left in the old `middleware` key must not be dropped silently.
- Date: 2026-11-22
- Raised by: spec review (risk)

## D-006: How does the layout save treat placements missing from the payload, and orphaned placements?
- Choice: Placements omitted from the payload are deleted; orphaned placements are kept
- Rationale: The user took the recommendation. The payload is the full layout, and orphans survive a plugin that is temporarily disabled.
- Date: 2026-11-22
- Raised by: spec review (risk)

## D-007: How do tests guard against drift between the API and the layer contract?
- Choice: PHP tests write JSON fixtures, and the Vitest tests and TypeScript types are checked against them
- Rationale: The user took the recommendation.
- Date: 2026-11-22
- Raised by: spec review (testability)

## D-008: How does layout save guard against a stale client overwriting a newer layout?
- Choice: Optimistic lock: the client sends the dashboard's version, a mismatch returns 409 and the layer reloads
- Rationale: Recommended; D-006 makes the payload the full layout, so a stale save would silently delete placements.
- Date: 2026-11-22
- Raised by: spec review pass 2 (risk)

## D-009: What happens when an eager widget's resolver throws or fails JsonData::check()?
- Choice: Isolate in production only (placement gets data null plus error, logged); 500 in local and testing
- Rationale: Recommended; one broken plugin widget must not make the dashboard unloadable.
- Date: 2026-11-22
- Raised by: spec review pass 2 (risk)

## D-010: Where does the layer get Iconify icon data?
- Choice: Bundle lucide locally; hosts add @iconify-json packs or opt in to the remote Iconify API
- Rationale: Recommended; works offline and under a strict CSP, and doesn't leak icon usage.
- Date: 2026-11-22
- Raised by: spec review pass 2 (risk)

## D-011: Which locales ship in v2.0.0?
- Choice: English only; the i18n mechanism plus a second locale used only in Vitest
- Rationale: Recommended; bounds the D-003 scope.
- Date: 2026-11-22
- Raised by: spec review pass 2 (scope)

## D-012: What happens to the atrium.theme config key?
- Choice: Keep it; its values go out as the built-in theme's properties in the shell
- Rationale: Recommended.
- Date: 2026-11-22
- Raised by: spec review pass 2 (scope)

## D-013: How does ClientPath decide same-host, and what does it return for rejected forms?
- Choice: Same host means the host of config('app.url'); a rejected form returns null and the link is omitted
- Rationale: Recommended; the request host is the API's, not the SPA's.
- Date: 2026-11-22
- Raised by: spec review pass 2 (testability)

## D-014: How should the factory gate groups 2 to 5 while Blade-era callers remain until group 6?
- Choice: Accept a red full suite until group 6. Groups 2 to 5 are gated on their own test files plus PHPStan and Pint; the full gate (vendor/bin/pest, composer test) applies from group 6 on.
- Rationale: The user took the recommendation. The breaking tests belong to groups 3 to 6, which rewrite or delete them.
- Date: 2026-11-23
- Raised by: factory build (group 2 implementer)

## D-015: How should the archive rules treat `nuxt/`, given giget fetches GitHub tarballs built with `git archive`?
- Choice: Export-ignore only the dev parts (`/nuxt/playground`, `/nuxt/package.json`, `/nuxt/pnpm-workspace.yaml`, `/nuxt/pnpm-lock.yaml`, `/nuxt/layer/test`) and keep `/nuxt/layer` in the archive, so Composer dists carry the layer source too.
- Rationale: The user took the recommendation; D-001's git `extends` needs the layer in the tarball.
- Date: 2026-11-23
- Raised by: factory build (group 6 implementer)

## D-016: What happens to `Atrium::path()`, `Atrium::url()` and `NavItem::isActive()`, which read the removed `atrium.path` key?
- Choice: Remove `Atrium::path()` and `Atrium::url()` and their facade `@method` lines, list them in the v2.0.0 CHANGELOG, and make `NavItem::isActive()` stop reading `atrium.path`.
- Rationale: The user took the recommendation.
- Date: 2026-11-23
- Raised by: factory build (group 6 implementer)

## D-017: How do Nuxt UI's sub-modules (`@nuxt/icon` and the like) reach a host that extends the layer by git?
- Choice: Add `@nuxt/icon` and any other module `@nuxt/ui` installs by name (`@nuxt/fonts`, `@nuxtjs/color-mode` if needed) as direct, pinned dependencies of `nuxt/layer/package.json`, and update `nuxt/pnpm-lock.yaml`.
- Rationale: The user took the recommendation: explicit and locked, independent of the host's package-manager settings.
- Date: 2026-11-23
- Raised by: factory rework (round 2), consumer build test

## D-018: Registry-only requests (shell, search, settings) inherit authorize() => true; accept, or add a policy check?
- Choice: Accept. The route group's viewAtrium gate decides; record the departure as a row in docs/agent/standards-feedback.md.
- Rationale: The user took the recommendation: these requests read registries, so there is no model or policy to ask.
- Date: 2026-11-23
- Raised by: factory review round 1 (standards)

## D-019: Is the integrations addendum spec-reviewed before the build?
- Choice: No. The spec review is skipped and `meta.yml` goes straight to `approved`.
- Rationale: The user asked to proceed without stopping. The review's job is covered by D-020 to D-039, which are each marked as defaults for the user to check.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-020: How does the layer get each package's client during this local build, while the package v2 tags are not pushed?
- Choice: Vendor each package's generated types. This departs from the user's choice of a git dependency on the v2 tags, and the departure is pending the user's review.
  - `nuxt/layer/app/integrations/{pkg}/client/` holds:
    - `openapi.json`
    - `schema.d.ts`, the package's `client/src/schema.d.ts`, verbatim
    - `openapi.sha256`
  - `pnpm -C nuxt sync:clients` (`nuxt/scripts/sync-clients.mjs`) copies them from the sibling checkout at `$ATRIUM_SUITE_PATH/{Pkg}`, which defaults to the repository's parent directory.
  - A Pest checksum test checks the stamps, and compares the copies with the sibling when it is present.
  - The layer uses a pinned `openapi-fetch` directly, wrapped by `useAtriumIntegration()`.
  - Recorded release step: once the package v2 tags exist, replace each vendored folder with a pnpm git dependency, `"@refactor-circus/{pkg}-client": "github:refactor-circus/{pkg}#v2.0.0&path:/client"`. Polycart's `/client` export-ignore must be removed first. Then update the lockfile, drop `sync:clients` and the vendored folders, and switch the imports to `create{Pkg}Client`. It is a PR-template item.
- Rationale: The tags do not exist and will not during this build, so a git dependency cannot install. Vendoring only the generated types keeps the typed contract and catches drift. It also leaves a mechanical, one-step switch to the user's chosen distribution.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-021: How does the layer reach several API bases (one per package) with one auth adapter?
- Choice: There is one `openapi-fetch` client per integration, made by `useAtriumIntegration(key)` and cached per app. Each carries middleware that applies the single `$atrium.auth()` adapter: its headers, its credentials, and `onUnauthorized()` on a 401. Base URLs are resolved in this order:
  1. the host's `runtimeConfig.public.atrium.integrations.{key}.apiBase`
  2. the shell's `api_base`. A path is resolved against the origin of `runtimeConfig.public.atrium.apiBase` when that is absolute, and against the page's origin otherwise.
- Rationale: Hosts configure auth once. Package APIs normally share Atrium's host and auth stack, and the override covers split hosts.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-022: How do package screens map to Nuxt routes, and how do extensions reach them?
- Choice:
  - Each screen keeps its v1 key and gets a layer page under `app/pages/{pkg}/…`, so its path is `/{pkg}/…`. The paths mirror the v1 Blade URLs, minus the `atrium` prefix.
  - PHP declares each screen as data: key, kind, path and subject morph alias.
  - A new route, `atrium.screens.show` (GET `screens/{screen}?record=&tab=`), serves the screen's extension tabs and sections from the existing `ScreenExtensions`, with no model loaded.
- Rationale: The v1 screen keys stay stable for host extensions and hooks, and the routes are predictable. Extensions remain a server-side registry without Atrium loading package models.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-023: What happens at build time, and at run time, when a package is not installed?
- Choice:
  - Build time: every integration always compiles, because the vendored clients make the build independent of which packages a host installs.
  - Run time: the shell decides. Its `integrations` list says which integrations exist and are active. A global route middleware renders `<AtriumIntegrationUnavailable>` for `/{pkg}/…` paths of absent, disabled or flagged-off integrations, and makes no package request.
  - There is no build-time pruning option in v2.0.0.
- Rationale: Build-time pruning would need a host build flag and break the single layer artifact. Integration pages are split into their own chunks by Nuxt, so their cost to hosts that never visit them is small.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-024: Where does integration code live, and is it split into one task group per package?
- Choice: The code lives in four places:
  - the framework in `src/Domains/Integrations/`
  - the per-package definitions in `src/Integrations/{Pkg}/`, as shaped
  - Vue code in `nuxt/layer/app/integrations/{pkg}/` and `app/pages/{pkg}/`
  - per-package lang and locale files

  The registry finds `{Pkg}Integration` by convention from the config keys.

  There is one task group per package for PHP and Vue together. Roster's and Showroom's Vue screens are split three ways. Two framework groups come first, and the hooks, Atrium's OpenAPI and the docs follow as their own groups.
- Rationale: The file lists stay disjoint, so package groups can run in parallel. Each group fits one agent session.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-025: How do tests fake `Composer\InstalledVersions`?
- Choice: A `Domains\Integrations\Contracts\InstalledPackages` contract, bound as a singleton to `ComposerInstalledPackages`, which wraps `InstalledVersions::isInstalled()`. Tests bind a fake and re-run `IntegrationRegistry::register()`.
- Rationale: `InstalledVersions` is static and reflects the real vendor directory, so it cannot be faked in place. The contract follows `architecture/container-bindings`.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-026: Where does an integration's API base come from, and what if the package API is off?
- Choice: A non-empty `atrium.integrations.{pkg}.api_base` wins. Otherwise the API base is `/` plus the trimmed `{pkg}.routes.prefix`, but only while `{pkg}.routes.enabled` is true. When neither applies, the integration does not register, and a warning is logged once per process naming both keys.
- Rationale: This fails closed: a UI pointing at an API that is not served would only produce 404s. Polycart and Roster ship with their APIs off, so the warning and the config banner tell the host what to turn on.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-027: How are the per-integration feature flags resolved, and does the plugin gate change?
- Choice:
  - `atrium.integrations.{pkg}.features` lists Pennant feature names, by default `{Pkg}Feature::class`, a class whose `resolve()` returns true. All of them must be active.
  - When Pennant is available, each resolves through `Feature::for($user)->active()`; otherwise each is on.
  - The hooks have no flags of their own: they follow both their integrations.
  - `Gatekeeper` (the plugin features) keeps its host-supplied resolver unchanged.
- Rationale: This matches the user's "Pennant when installed, otherwise on", and it replaces `{Pkg}SupportFeature` and PennantPlus's resolver. It also avoids turning off existing plugins: an undefined feature reads as false in Pennant.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-028: What does the shell add for integrations?
- Choice: The shell adds:
  - `integrations: [{key, label, active, api_base, features}]`, one entry per registered integration
  - `search.sources` and `search.per_source`
  - `live: {key, options} | null` on nav items

  A new fixture, `shell-integrations.json`, comes from a fake integration, and each package writes `test/fixtures/integrations/{pkg}.json`.
- Rationale: The layer needs to know which integrations are active, where their APIs are, and which client-side resolvers to run. The fixtures keep D-007's drift guard across PHP and Vue.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-029: Where do integration widgets, panels and extensions get their data?
- Choice: In the browser. PHP declares them with static data only, `{}` or their hook configuration, and no resolver. The Vue component calls the package API. The widgets of one integration share one request per dashboard load.
- Rationale: The user ruled that Atrium never calls package models or actions. Sharing the request keeps a dashboard with several Impex or Showroom widgets to one stats call per package.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-030: How does ⌘K search cover the packages?
- Choice: Client-side sources. The shell lists them in `search.sources`, and each registers in the layer with `$atrium.searchSource()`. ⌘K runs `atrium.search` and those sources in parallel. A failing or forbidden source is dropped without failing the others, and its results go through the existing link guard. The v1 source keys are kept.
- Rationale: PHP-side sources would have to call package code or proxy HTTP. Running in parallel keeps latency at the slowest single source.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-031: Are integration nav items hidden by permission, as in v1?
- Choice: No, not in v2.0.0. Integration nav items show to every user the `viewAtrium` gate admits while the integration is active. Screens show a no-access state on a package 403. Widgets show a no-access card. Search sources skip silently. The CHANGELOG lists this as a parity change.
- Rationale: v1 asked package policies in PHP, which Atrium may no longer call. Probing every API from the browser to hide links would cost a request per item. Per-user flags (D-027) remain for hiding a whole integration.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-032: What happens to v1 UI features with no v2 API route?
- Choice: Each group checks its old screen's actions against the vendored `openapi.json`. An action with no route is left out, and the CHANGELOG names it. Operator mode (`impex.atrium.show_all`, `polycart.atrium.show_all`) is not ported, because Impex D-006 and Polycart give it no API.
- Rationale: The packages own their APIs. Inventing an Atrium-side substitute would break the no-package-code rule.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-033: Where do the integration labels and strings come from?
- Choice: Server-side labels come from Atrium's `lang/en/integrations/{pkg}.php`. Layer strings come from `nuxt/layer/i18n/locales/integrations/{pkg}.en.json`, merged into `en`. Keen's `nav.groups` values name Atrium nav groups, not the packages' translation keys. English only.
- Rationale: The packages no longer ship UI strings. Per-package files keep the parallel groups disjoint. D-011 already limits v2.0.0 to `en`.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-034: How do the cross-package hooks identify the record, and how are invalid targets handled?
- Choice:
  - Detail-screen declarations carry the package's morph alias as `subject_type`. The record key arrives as `?record=` and is passed to the Vue components, which add `subject_id`/`owner_id`.
  - A hook registers only while both its integrations are registered.
  - Invalid targets and slots throw `InvalidArgumentException` in `local` and `testing`. Elsewhere they are reported and skipped, as Keen's v1 `HistoryExtensions::invalid()` did.
- Rationale: This keeps v1 behavior and defaults without Atrium loading models.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-035: How does `/showroom/transfers` list transfers?
- Choice: Through Impex, as Showroom's D-001 says. The screen reads `impex.flows.index` and keeps the flows whose name starts with `atrium.integrations.showroom.transfers.flow_prefix` (`showroom:`). It calls `impex.runs.index?flow=` for each, merges the results and keeps the 20 newest by `created_at`. This is v1's `where flow like 'showroom:%' latest limit 20`. Without Impex, the screen shows a notice and keeps import and export.
- Rationale: Impex's `flow` filter matches exactly, and the feed flows have dynamic names, so reading the flows first keeps v1's prefix semantics.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-036: How do Atrium's own OpenAPI document and client fit the existing layer?
- Choice:
  - Scramble goes in `require-dev`, configured in the workbench.
  - Atrium's resources gain `schema()`, and a workbench extension writes each one into the document.
  - `nuxt/layer/app/client/schema.d.ts` carries a sha header. `types/atrium.ts` becomes aliases of the generated types, with the public names kept.
  - A new `useAtriumClient()` wraps `openapi-fetch`, and `useAtriumApi()` (`$fetch`) stays, so verified composables and tests do not churn.
- Rationale: The user wants a generated client, and Scramble cannot follow `persist()` without the resources' schemas. Keeping `useAtriumApi()` avoids a rewrite of verified code.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-037: Does Atrium change its Keystone constraint for `Surface::route()`?
- Choice: No. `Surface::route()` exists in Keystone `^0.1`. Atrium calls it at boot either way, and the test uses a spy, so it does not rely on Keystone's built-in `atrium.` prefix. Widening the constraint to Keystone's next release is a release step.
- Rationale: The Keystone tag is not cut yet, and the call works on both versions.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-038: How does the public Roster invitation page work inside an authenticated SPA?
- Choice:
  - The page is declared public in its page meta. It skips the shell and suppresses `onUnauthorized()` for the lookup.
  - It renders one generic state for every 404 and a separate state for 429.
  - Accept and decline call `onUnauthorized()` first when the visitor is not signed in.
  - The token is never put in the title, the logs or storage.
- Rationale: The invitee is usually signed out, so a shell call would bounce them to login before they see the invitation. Roster's ACs 3 to 5 make the lookup the security boundary.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-039: What if a package's v2 build (its `openapi.json` and `client/`) is not in the sibling checkout when the integration groups run?
- Choice: Group 12's `sync:clients` fails for that package, and the build stops with a needs-decision. No group writes or hand-edits a package schema.
- Rationale: The user's order is Keystone, then the packages, then the integrations. Typing screens against guessed schemas would hide exactly the drift this spec guards against.
- Date: 2026-11-23
- Raised by: write-spec (integrations); default chosen because the user asked to proceed without stopping

## D-040: Where does the client sync (group 12) read the package builds from during this local build?
- Choice: `ATRIUM_SUITE_PATH=/private/tmp/claude-501/-Users-jay-Projects-packages/86612d5b-5a93-4b4f-bd9d-c72c44a795af/scratchpad/suite`. That folder holds one symlink per package (`Cortex`, `Impex`, `Keen`, `PennantPlus`, `Polycart`, `Roster`, `Showroom`) pointing at that package's v2 job worktree (`/Users/jay/Projects/packages/{Pkg}--2026-11-23-0943-{pkg}-v2-api-and-mcp-only`). Each worktree is approved, clean, and has a committed `openapi.json` and `client/`. Run sync, and any test that reads package files, with this variable set. Never read the packages' main checkouts, which are still v1.
- Rationale: the package v2 branches are not merged or pushed (user: do not push), so the main checkouts do not have the v2 API yet.
- Date: 2026-11-23
- Raised by: orchestrator, before the integrations build

## D-041: pnpm is not on PATH on this machine
- Choice: run Node workspace commands with `PATH=/private/tmp/claude-501/-Users-jay-Projects-packages/86612d5b-5a93-4b4f-bd9d-c72c44a795af/scratchpad/bin:$PATH` (a `pnpm` shim that runs `npx -y pnpm@10.18.0`), or with `npx -y pnpm@10.18.0` directly. `composer test:nuxt` needs the shim on PATH.
- Rationale: the shim passed `composer test:nuxt` earlier in this job.
- Date: 2026-11-23
- Raised by: orchestrator

## D-042: How does `atrium.integrations.showroom.transfers.flow_prefix` (D-035) reach the layer's `/showroom/transfers` screen?
- Choice: Add an optional static `options` array to `ScreenDeclaration`, sent in the `atrium.screens.show` payload and in the integration fixture. `ShowroomIntegration` declares `showroom.transfers` with `['flow_prefix' => config('atrium.integrations.showroom.transfers.flow_prefix')]`, and the transfers page reads it from the screen response it already fetches. This touches group 11's `ScreenDeclaration`, `ResolvedScreenResource`, the layer's `ScreenData` type and the shell/screen fixtures. Group 22 may change those files.
- Rationale: Recommended option. It keeps AC 38 and D-035, does not misuse `live` (AC 43), and does not widen the shell contract.
- Date: 2026-11-23
- Raised by: factory build (group 22); default chosen because the user asked to proceed without stopping
