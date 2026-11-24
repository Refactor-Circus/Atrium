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
- Superseded by D-089: each package's module now lives in the package and uses its own client; Atrium vendors none.
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

## D-043: Which version does the suite release under?
- Choice: Every suite package releases as v2.0.0 to match: Keystone, Atrium, Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom. Every `refactor-circus/*` constraint (require and require-dev) is `^2.0`, and every repo aliases `dev-main` to `2.0.x-dev`. Foundry and Guardian stay on Keystone `^0.1` until they migrate.
- Rationale: The user said "i'd like everything release as v2 to match". This supersedes any earlier choice to keep `^0.1` constraints or release Keystone as v0.2.0.
- Date: 2026-11-23
- Raised by: user

## D-044: Is the Guardian integration addendum spec-reviewed before the build?
- Choice: No. `meta.yml` goes straight to `approved`. D-045 to D-061 are defaults for the user to check.
- Rationale: The user asked to skip the review, as for D-019.
- Date: 2026-11-23
- Raised by: user

## D-045: How does the build get Guardian's client, and when does it run?
- Choice:
  - Group 29 adds `guardian` to `sync:clients` and `VendoredClientsTest`, and syncs Roster again from its addendum build, which removes the role routes.
  - Every Guardian group depends on group 29. Group 29 fails as D-039 says until both Guardian's build (its `openapi.json` and `client/`) and Roster's addendum build exist in `$ATRIUM_SUITE_PATH`.
  - Before the build, the orchestrator adds a `Guardian` symlink to the Guardian job worktree (`/Users/jay/Projects/packages/Guardian--2026-11-23-1718-guardian-v2-security-platform`) in the D-040 suite folder.
  - This build runs after Guardian's.
- Rationale: Guardian's `openapi.json` does not exist yet, and typing screens against guessed schemas would hide drift (D-039). Group 29 also removes Roster's role screens: once Roster's client is synced again, those screens no longer type-check, so the two must land together for the group to end green.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-046: What happens to the `roster.roles`, `roster.role` and `roster.permissions` screen keys and their paths?
- Choice: They are removed, with no alias or redirect. The Guardian screens get new keys (`guardian.roles`, `guardian.role`, `guardian.permissions`, `guardian.role-assignments`) under `/guardian/…`. The CHANGELOG maps each old key to its replacement.
- Rationale: Roster's API no longer serves these screens, so an alias would point at a different package's semantics. Every integration keeps its pages under its own `/{pkg}/` paths (D-022). Nothing has been released, so no v2 host depends on the old keys.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-047: How are Guardian's tabs and sections placed on Roster's screens?
- Choice: `atrium.integrations.guardian.screens` uses Guardian v1's `guardian.atrium.screens` shape: a plain value is a tab, and a `slot => key` entry is a section. The defaults are:
  - `roster.organization`: `guardian.access`, `guardian.sso` and `guardian.scim`
  - `roster.user`: `guardian.access` and `guardian.user-security`, plus `guardian.sso-identities` in `aside`

  The extensions register only while Guardian and the target's integration are both registered, and they are validated as in AC 68. Role assignments move from Roster's own page code into the `guardian.access` tab. `roster.team` gets nothing.
- Rationale: This keeps v1 Guardian's host-facing placement config and Atrium's hook rules (D-034), and keeps Roster's screens free of Guardian code. v1 Roster managed team roles from the organization page, and Guardian's assignment filter can scope to a team, so a team tab is left for later.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-048: Which `scope_type` does Atrium send for organization-scoped roles?
- Choice: `atrium.integrations.guardian.scope_types` defaults to `['organization' => null, 'team' => null]`.
  - A null value resolves to `config('guardian.adopt.scope_types.{key}')`, which Guardian already uses to map Roster's scopes.
  - An unresolved organization type skips the organization `guardian.access` tab, with one warning per process.
  - The resolved list is also sent as the `scope_types` screen option of the role, assignment, user and policy screens.
- Rationale: Guardian stores the scope model's morph class, which for Roster today is its class name. Atrium's `roster.organization` subject alias would not match it. Reading Guardian's config, as Atrium reads `{pkg}.routes.*`, avoids naming Roster classes in Atrium. Failing closed means no tab rather than assignments in the wrong scope.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-049: How does the layer react to Guardian's `guardian.two-factor` 403s?
- Choice: A generic `$atrium.responseHandler(key, handler)` runs on every response of every client: integration clients, `useAtriumClient()` and `useAtriumApi()`. Guardian's `index.ts` registers one handler:
  - `two_factor_challenge_required` goes to the challenge page.
  - `two_factor_enrollment_required` goes to the setup page.
  - A `Guardian-Two-Factor-Deadline` header shows an app-wide notice.

  The handler runs whether or not the shell loaded.
- Rationale: The host may put `guardian.two-factor` on Atrium's own route group, so the shell itself can answer 403. A generic hook keeps Guardian-specific code in Guardian's integration folder, and it matches only Guardian's own codes.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-050: How do the challenge and setup pages load when the shell is blocked?
- Choice: As D-038's invitation page does:
  - `public` page meta and the public layout
  - a Guardian client of their own, whose base is the host override, then a loaded shell's `api_base`, then `/guardian`
  - no `atrium.screens.show` call

  A 401 calls `onUnauthorized()`. The `redirect` passes the AC 14 link guard, or the page falls back to `/`.
- Rationale: A pending user cannot load the shell. Guardian's enrolment, challenge and status routes are never blocked by its middleware, and the guard stops open redirects.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-051: How is the TOTP QR code rendered?
- Choice: In the browser, as an inline SVG, with `uqr` pinned to an exact version. The secret is also shown for manual entry. Nothing is sent to a QR service, stored or logged, and both values are dropped when the component unmounts.
- Rationale: Guardian returns only the `otpauth://` URI (Guardian D-009). `uqr` is small, has no dependencies and outputs SVG. A remote QR service would leak the secret.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-052: How does the layer call WebAuthn?
- Choice: Through the browser's `navigator.credentials` API, with a small in-layer base64url/JSON helper (it uses `PublicKeyCredential.parseCreationOptionsFromJSON` and `toJSON` when they exist) and no npm library. Passkey controls hide when `passkeys_available` is false, on a 501, or when `window.PublicKeyCredential` is missing.
- Rationale: The ceremony itself is browser-native. Guardian's library already does the verification server side, and a client library would add a dependency for a few lines of encoding.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-053: How does the UI know whether email or SMS codes are available?
- Choice: No route reports it. The UI offers `email` and `sms`, limited to `allowed_methods` when 2FA is required. A 422 `method_unavailable` shows "not available on this site" and hides that type for the rest of the page's life.
- Rationale: Guardian AC 29 answers 422 for an unsupported channel, and the default binding has no SMS. Asking Guardian for a capability route is Guardian's spec.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-054: How are API tokens shown when no driver is configured, and what bounds issuing?
- Choice:
  - A 501 from the token index hides the form, with an "API tokens are not enabled" note. The admin block hides too.
  - The ability choices and the maximum lifetime come from `guardian.tokens.abilities` and `guardian.tokens.max_lifetime_days`, sent as static options of the `guardian.security` and `guardian.user` screens. Guardian still validates both.
  - The plain token shows once and is never stored.
- Rationale: Guardian defaults to no driver (Guardian D-017). Static options follow D-042.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-055: Where do admins manage another user's security?
- Choice:
  - A Guardian screen `guardian.user` (`/guardian/users/:user`), which works without Roster: role assignments, abilities, sessions (revoke all), tokens (revoke all), recent events, and a two-factor reset.
  - The `guardian.user-security` and `guardian.access` tabs on `roster.user` reuse its components.
  - No other user's two-factor status is shown.
- Rationale: Guardian runs without Roster (Guardian AC 3), so its admin view cannot live only on Roster's screen. Guardian has no route for another user's two-factor status, only the reset.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-056: What does the lockouts screen show without a lockout list route?
- Choice: A form that clears an identifier, plus recent `login.locked_out` security events.
- Rationale: Guardian AC 50 offers only `DELETE lockouts`. Its events hold an identifier HMAC, not the identifier, so the form is typed by hand.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-057: What does Guardian add to navigation, the dashboard and search?
- Choice: Nine nav items in one "Security" group, shown to every admitted user, as D-031 says. There are no widgets, settings panel or search sources.
- Rationale: v1 Guardian had no nav or widgets (its D-025). The screens need entry points now that they are standalone, and adding widgets or sources would go beyond the requested scope.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-058: How is the SCIM base URL shown?
- Choice: The `guardian.sso` and `guardian.scim` data carries `scim_path`, which is `'/'.trim(config('guardian.scim.prefix', 'scim/v2'), '/')`. The layer shows the origin of Guardian's API base, then `scim_path`, then `/`, then the organization record.
- Rationale: v1 built `url(prefix/slug)` server side. Guardian's API gives no base URL, and the SCIM endpoints live outside `guardian.routes.prefix`.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-059: What if Guardian's API is off, as it ships?
- Choice: As AC 40 says for Polycart and Roster: Guardian does not register, and one warning names `guardian.routes.enabled`. The banner and the README tell the host to turn the API on behind auth.
- Rationale: Guardian D-022 keeps its routes off by default, and the integration fails closed.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-060: How does the layer handle `password_expired` and `session_revoked`?
- Choice: There is no special handling. `session_revoked` is a 401, so `onUnauthorized()` runs. `password_expired` is a 403, so the screen shows its no-access state.
- Rationale: Guardian has no password-change route (password change is the host's flow), so there is nothing for the layer to offer.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-061: How are the Guardian groups split?
- Choice:
  - Group 29: client sync and the Roster removal.
  - Group 30: Guardian's PHP declarations, `index.ts`, and every Guardian locale file as `{}`, so later groups do not share `nuxt.config.ts`.
  - Group 31: response handlers, the challenge and setup pages, and the shared two-factor components.
  - Groups 32 to 35, in parallel: the security page, access and user screens, admin screens, and SSO/SCIM.
  - Group 36: the hooks.
  - Group 37: the docs.
- Rationale: The file lists stay disjoint, as D-024 requires, and each group fits one session.
- Date: 2026-11-23
- Raised by: write-spec (Guardian integration); default chosen because no user was available ("choose conservative defaults")

## D-062: What shape does the `scope_types` screen option take?
- Choice: A list of `{key, type}` objects in config order, for example `[{"key": "organization", "type": "App\\Models\\Organization"}]`, built by `GuardianScopeTypes::options()`. Scope keys that do not resolve are left out, so an empty result is `[]`.
- Rationale: AC 82 says "the resolved list". A list keeps the same JSON type when it is empty (a PHP map would encode as `[]` when empty and `{}` otherwise), and it gives the layer both the label key and the value Guardian stores.
- Date: 2026-11-23
- Raised by: implement (group 30); default chosen because no user was available

## D-063: What does `token_max_lifetime_days` carry when Guardian sets no limit?
- Choice: `null`. Guardian's config documents `null` as "no limit", so the option passes it through and the layer then caps nothing. A value that is not a positive integer falls back to Guardian's default, 365. `token_abilities` keeps only non-empty strings and falls back to `['*']`. `mode` is `allowlist` only when Guardian says so exactly, otherwise `denylist`.
- Rationale: AC 82 gives only the defaults. Passing Guardian's own "no limit" through keeps the form from refusing what Guardian allows, and Guardian validates both values anyway (D-054).
- Date: 2026-11-23
- Raised by: implement (group 30); default chosen because no user was available

## D-064: How does the layer send the proof for removing a two-factor method or passkey?
- Choice: In the JSON body of the `DELETE` (`{code}`), never the query string. Guardian's request validates `code` from the request input, which includes the JSON body; its vendored schema documents `code` as a query parameter, so the layer sends an untyped body.
- Rationale: AC 85 and 87 keep codes out of URLs, which end up in logs and history. Guardian reads both, so nothing changes on its side.
- Date: 2026-11-23
- Raised by: implement (group 31); default chosen because no user was available

## D-065: What do response handlers receive, and how does a handler show a notice?
- Choice:
  - Each handler gets its own copy of the response (`response.clone()`), in registration order, inside the Nuxt app's context until its first `await`. For `useAtriumApi()`, whose body `$fetch` has already parsed, the copy is rebuilt from the parsed data with the same status and headers.
  - The registry gains `notify(key, notice)` and `dismiss(key)`, and `<AtriumResponseNotice>` (in the default layout) renders the notices. A dismissed notice stays hidden until a notice under the same key arrives with a different `id`, so a new two-factor deadline shows again.
- Rationale: A handler that reads the body must not consume the caller's. A generic notice keeps Guardian's banner out of the layout (D-049) and lets other packages raise their own.
- Date: 2026-11-23
- Raised by: implement (group 31); default chosen because no user was available

## D-066: Which methods does the challenge page offer, and where may `redirect` lead?
- Choice:
  - TOTP, email and SMS when the user has that method confirmed; a passkey when the user has one, Guardian reports passkeys available, and the browser has `PublicKeyCredential`; a recovery code while `recovery_codes_remaining` is above 0.
  - `redirect` is followed only when it is a path inside the SPA (`isInternalPath()`, now exported from `atriumLink.ts`) and is not the challenge or setup page itself; anything else goes to `/`.
  - `uqr` (0.1.3, exact) is a runtime `dependency` of the layer, since consumers render the QR code.
- Rationale: Offering a method the user cannot use only produces a 422. Refusing the two-factor pages as targets avoids a redirect loop.
- Date: 2026-11-23
- Raised by: implement (group 31); default chosen because no user was available

## D-067: How does the security page send "also revoke my API tokens" and bound a token's expiry?
- Choice:
  - "Sign out everywhere else" sends no body; with the option ticked it sends `{tokens: true}` in the `DELETE` body. Guardian's schema lists `tokens` as a query parameter, but the request reads its input either way, and a body matches AC 88's wording.
  - The expiry is a date input whose `max` is today plus `token_max_lifetime_days`; a later day is refused in the page without calling Guardian, and a picked day is sent as the end of that day in ISO 8601. A null lifetime (D-063) sets no limit. Guardian still validates both.
  - Sessions, devices and events load 50 at a time (`per_page`), and events page by cursor with "older" and "newer".
- Rationale: The conservative reading of AC 88. Users rarely have more than 50 sessions or devices, and the shared state per section keeps one 403 from hiding the others.
- Date: 2026-11-23
- Raised by: implement (group 32); default chosen because no user was available

## D-068: How do the access screens identify roles and permissions, and how do their lists page?
- Choice:
  - Roles are addressed by `slug` and permissions by `name`, as Guardian's resources carry no other key and its routes take them in the path.
  - Each list keeps its page and filters in component state (25 roles or assignments, 50 permissions a page) rather than the route, so the same `GuardianAssignments` block works on the `guardian.user` screen and, in group 36, on Roster's screens without fighting over `?page=`.
  - A 422 lists every message Guardian sends, so the escalation guard's missing permissions show whatever field it names them under. A super role's update sends no permission list.
  - A `system` permission keeps its description editable; only its rename and delete are disabled.
- Rationale: The conservative reading of AC 89 and 90. Route-held filters, as Roster's group 21 screens had, would clash once these blocks are mounted inside another package's screen.
- Date: 2026-11-23
- Raised by: implement (group 33); default chosen because no user was available

## D-069: Where does the security events filter get its event types?
- Choice: From a layer constant, `SECURITY_EVENT_TYPES` in `guardian/components/admin/admin.ts`, typed against the vendored schema's `SecurityEventType` enum: it must be a subset (`satisfies`), and a compile-time check fails while the enum has a type the list lacks. A Vitest case compares it with the enum in the vendored `openapi.json`, order included.
- Rationale: AC 91 asks for the schema's enum when it has one; it does. Bundling `openapi.json` (over 300 KB) into the layer to read one enum at run time costs every host, while the typecheck and the test tie the constant to the enum just as firmly, and `sync:clients` surfaces any new type.
- Date: 2026-11-23
- Raised by: implement (group 34); default chosen because no user was available

## D-070: How does the lockouts screen send the identifier it clears?
- Choice: In the JSON body of `DELETE lockouts` (`{identifier}`), never the query string. Guardian's request validates `identifier` from its input, which includes the body; its vendored schema lists it as a query parameter, so the call is untyped there. The confirmation names the identifier; the success notice names it once and the field is cleared.
- Rationale: The identifier is usually an email address, and query strings end up in access logs and history, as D-064 says for codes. Task 34.1 names the body.
- Date: 2026-11-23
- Raised by: implement (group 34); default chosen because no user was available

## D-071: What can a two-factor policy's update change, and how are no methods sent?
- Choice:
  - An existing policy updates `required`, `methods` and `grace_days` only, in place on its row, as Guardian's `UpdateTwoFactorPolicyRequest` accepts nothing else; its scope and role are shown read-only. To change them, delete the policy and create another.
  - With every method unticked the form sends `methods: null` ("any method"), as Guardian's schema requires at least one method in a list; the methods it sends follow Guardian's order (`totp`, `email`, `sms`, `passkey`).
  - `grace_days` is a whole number, 0 by default; the scope id is sent only with a scope type, and "Everyone" sends both as null.
  - The IP rules and policies lists page 25 at a time, and the events lists 50 at a time by cursor.
- Rationale: The conservative reading of AC 95 against the vendored schema: offering fields the update ignores would mislead.
- Date: 2026-11-23
- Raised by: implement (group 34); default chosen because no user was available

## D-072: What do the SSO forms send, and where does the connection page go after a delete?
- Choice:
  - A new connection sends `name`, `protocol` and the settings of that protocol (`issuer`, `client_id` and `client_secret` for OIDC; `tenant`, `client_id` and `client_secret` for Entra ID; `metadata_url`, `entity_id`, `sso_url` and `certificate` for SAML), as v1's form did, because Guardian refuses a connection without its required settings. Blank settings are left out. Its flags keep Guardian's defaults; the connection page, which the form opens next, edits them.
  - An update sends `name`, `enabled`, `enforced`, `jit` and the protocol's settings. Guardian never sends the client secret or certificate back, so their inputs start blank and a blank one is left out, keeping the stored value; any other blanked setting is sent as `null`. The vendored schema documents no update body, so the body is untyped; it holds only fields Guardian's `UpdateSsoConnectionData` accepts.
  - After a delete the page opens the organization's SSO tab while Roster is active, else `/`. The "test sign-in" link shows only for an http(s) URL.
  - The connections and SCIM token lists page 25 at a time (v1's size); the token form's connection choice loads up to 100; identities load 50. The plain SCIM token lives in component state, never in storage or the URL, and is dropped on unmount. The identities section renders nothing while it loads or when empty, and the no-access state on a 403.
- Rationale: The conservative reading of AC 96 against Guardian's request rules, keeping v1's behaviour where the API allows it.
- Date: 2026-11-23
- Raised by: implement (group 35); default chosen because no user was available

## D-073: Where does Guardian's `// Not ported (D-032)` list live?
- Choice: At the top of `app/integrations/guardian/index.ts`, as every other integration's list does (and as `CLAUDE.md` describes), rather than at the top of `pages/guardian/sso-connections/[connection].vue` as task 35.2 says. The page's doc comment points to it. It lists v1's Atrium UI features only (the SSO and SCIM tabs, the identities section and the connection page), since Guardian's other screens are new in v2.
- Rationale: One list per integration keeps group 37's CHANGELOG collection and `ChangelogUpgradeTest` uniform, and the job's instructions named `index.ts`.
- Date: 2026-11-23
- Raised by: implement (group 35); default chosen because no user was available

## D-074: How does the `guardian.access` hook tell a scope screen from a user screen?
- Choice:
  - By the last segment of the screen's declared subject type. `user` (as in `roster.user`) sends `{scope_type: null}`, and the layer lists by user. Any other segment is read as a `scope_types` key (`organization` in `roster.organization`); its resolved type is sent as `{scope_type}`, and while it does not resolve the tab is skipped there, with one warning per process and scope key naming `atrium.integrations.guardian.scope_types`.
  - Guardian's extensions never go on Guardian's own screens, and, like every hook, only on detail screens that declare a subject type.
  - On a user, the tab reads the scope types it offers from the `guardian.role-assignments` screen's options (one `atrium.screens.show` call, without the page's `?tab=`); when that fails it offers global assignments only.
- Rationale: AC 97 names the two default screens; keying off the subject type keeps the hook generic for a host that places the tab elsewhere, and refusing an unresolved scope is the conservative path D-048 sets.
- Date: 2026-11-23
- Raised by: implement (group 36); default chosen because no user was available

## D-075: How do integration links stay inside the SPA when it is served under a `client_path`?
- Choice:
  - Integration-declared links are SPA paths, not host URLs. `NavItem` gains `path('/showroom/products')`, which clears `url()`/`route()` (and they clear it). `NavItem::link()` sends a path as `{path, external: false}` untouched; any other item goes through `ClientPath::for(resolveUrl())` as before. `NavSection::link()` is its first item's. `ShellResource` sends both, and the integration fixtures use `link()`.
  - `resolveUrl()` of a path item is the path under `atrium.client_path` read at resolve time (`ClientPath::url()`: `/admin/showroom/products`), so `isActive()`, the registry's "parent with no link" check and a `client_path` changed after boot all stay right.
  - `path()` checks the value with `ClientPath::assertSpaPath()` (one leading `/`, never `//` or `/\`, no whitespace, control characters or backslash) and throws `InvalidArgumentException` otherwise.
  - Every suite integration's nav uses `path()`. `IntegrationRegistry` refuses (`InvalidIntegrationException`, at registration) an integration nav item, or child, declared with `url()` or `route()` or with a path outside `/{key}/`; an item with no link (Keen's History, a `live()` parent) stays allowed.
  - Host-declared `url()`/`route()` keep their documented ClientPath behaviour; the README's plugin examples move to `path()` for SPA pages. `SearchResult` keeps its URL: no integration sends server-side search results (their sources run in the layer and already link `{path, external: false}`), and the hooks (`impex.run-link` and the others) send no links; the layer builds `/impex/runs/:id` and its other paths as router paths, which NuxtLink puts under `app.baseURL`. The layer needed no change.
- Rationale: With `client_path` `/admin`, integrations' relative `url('/showroom/products')` reached ClientPath as a host path outside the SPA and went out external, so the browser opened Showroom's JSON API. Declaring SPA pages as what they are fixes it at the source for every consumer of the item, rather than prefixing at boot (stale on config changes) or teaching ClientPath to guess.
- Date: 2026-11-23
- Raised by: bug report (Atrium under `/admin` on the test host); default chosen because no user was available

## D-076: How does the layer's sidebar group navigation, how do themes reach Nuxt UI, and how do static hosts get icons?
- Choice:
  - **Navigation.** `AtriumNavigation` gives `UNavigationMenu` one list per section: the loose sections' items first as one list, then each grouped section as its own list holding one `type: 'trigger'` parent (the section's label and icon) with the section's items as children; Nuxt UI draws a separator between lists. A section is open only while the current route is inside it: one of its pages, or a page beneath one; failing that, a section whose pages all share the route's first segment (a package's page the nav does not list, such as `/showroom/flags`). A nested item opens while it holds the route, no longer always. The menu is keyed on the open sections, because the accordion reads its open items only when it mounts: entering another section opens it, other navigation keeps what the user opened. `unmountOnHide` is off, so closed sections' links stay in the DOM (hidden). Collapsed, loose items show a tooltip and sections a popover of their pages (`tooltip`, `popover`). `data-testid="atrium-nav"` stays on the menu. Vitest mounts the collapsed menu inside `<UApp>` (`inApp()` in `test/support.ts`), as `app.vue` does, for the tooltip provider.
  - **Theme bridge.** `atrium.css` maps `surface` to `--ui-bg`, `surface-alt` to `--ui-bg-muted` and `--ui-bg-elevated`, `on-surface` to `--ui-text` and `--ui-text-toned`, `on-surface-strong` to `--ui-text-highlighted`, `outline` to `--ui-border` and `--ui-border-muted`, `outline-strong` to `--ui-border-accented`, and `secondary`, `info`, `success`, `warning`, `danger` to `--ui-secondary`, `--ui-info`, `--ui-success`, `--ui-warning`, `--ui-error`, beside the existing `primary` and radius. `.dark` reads the `-dark` tokens (`surface-dark`, `surface-dark-alt`, `on-surface-dark-strong`, `outline-dark-strong`, ...) and falls back to Nuxt UI's dark defaults, never to a light token; the status colours, which themes send once, serve both. `canvas` becomes `--atrium-canvas`, the background of the content area (`.atrium-canvas`), while the sidebar (`.atrium-sidebar`) and cards sit on `--ui-bg`, so the sidebar reads as a panel. Surface rather than canvas is `--ui-bg` because Nuxt UI paints cards, inputs and menus with it.
  - **Top layout: not done.** The theme's `layout: 'top'` is still sent and still ignored; the bundled layer uses the sidebar for every theme, as the README says. A top bar needs its own nav (grouped dropdowns for ~70 items), search and user menu and a responsive fallback, which is more than a small change; left for a follow-up rather than half-built.
  - **Icons.** The layer's `icon` config keeps `provider: 'server'` and `serverBundle: ['lucide']` and adds `clientBundle` with every Lucide icon (`sizeLimitKb: 0`), read from `@iconify-json/lucide/icons.json` at config time, as icon names reach the client at runtime and a scan cannot find them. A static SPA (`nuxt generate`) has no `/api/_nuxt_icon` server, so the server provider alone rendered nothing. The consumer build fails when the client bundle lacks a Lucide icon the source never names (`ferris-wheel`). A host's own `icon` config (the test host's `provider: 'none'` with its own Lucide client bundle) still merges over it.
- Rationale: A user on the test host (8 integrations, ~70 items) found the sidebar unreadable: every group open in one flat list with only a label row between groups, and themes changing only the primary colour on Nuxt UI's grey. Grouping by section with route-driven open state and bridging the full token set is the smallest change inside Nuxt UI's `UNavigationMenu` and variables; bundling Lucide in the client makes the documented static-hosting path work without host config, at the cost of a larger client bundle.
- Date: 2026-11-23
- Raised by: user report via coordinator (sidebar "melds together" on the test host); default chosen because no user was available

## D-077: What does the layer look like, and how does it get around? (the "command deck" design system)
- Choice:
  - **Direction.** A compact, dark-first admin surface: a near-black canvas (light: a cool off-white) with a faint engineering grid and a primary haze at the top; panels on the surface colour with a hairline border and a lit top edge; the theme's primary colour as the one accent and its glow (the current section and page, focus, primary buttons, panel-heading ticks); uppercase monospaced micro-labels for section names, column heads and panel headings; monospaced tabular figures for IDs, counts and times. Light mode is the same structure, not an inversion.
  - **Scale.** Tailwind's theme is retuned in `atrium.css`: `text-xs` 11px, `text-sm` 13px (the UI size), `text-base` 14px, headings capped at 22px, and `--spacing` 0.225rem (every spacing step a tenth tighter). Buttons and fields stay Nuxt UI's `md` with tighter padding (13px text, 28px tall); badges, checkboxes, switches, tabs and menus default to `sm`. Table rows are 34px with a sticky 30px header.
  - **Fonts.** Geist and Geist Mono from `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` 5.3.0 (exact pins, imported in `atrium.css`, so the layer's build carries the files: no request to a font CDN). Hosts override `--font-sans`/`--font-mono`/`--default-font-family`; the test host's Calibre still applies under its theme.
  - **Shell.** `layouts/default.vue` keeps `UDashboardGroup` (dashboard panels need its context) but drops `UDashboardSidebar`: `<AtriumNavigation>` is a 52px rail (the app's mark, one button per group from `useAtriumNavigation()` with CSS tooltips, Settings at its foot) and a 232px panel listing one group's pages (`<AtriumNavList>`, nested items behind a disclosure open while they hold the route). The route's group is lit on the rail; clicking another shows its pages without navigating. `<AtriumTopbar>` holds the drawer button (below `lg`), the panel toggle (remembered as `atrium-nav-collapsed`), the breadcrumb (group / page), ⌘K, an online indicator with the API version, the theme switcher and colour mode. Collapsed, the rail's buttons open their pages in a popover. Below `lg` the same navigation opens in a `USlideover`. Every page renders inside `.atrium-page`, a padded scrolling frame; a page whose root is a dashboard panel fills it instead (`:has()`), so the 26 panel pages and the ~50 plain ones line up.
  - **Navigation model.** `useAtriumNavigation()` turns the shell's sections into groups: the loose sections' items together as Home first, then each grouped section; the current group is the one holding the route (the deepest match), else the one whose pages share the route's first segment, else none. Live resolvers run only for `useAtriumNavigation({ live: true })` (the navigation itself), once per shell load per instance, as before; the breadcrumb and ⌘K read the items as sent. `data-testid="atrium-nav"` is on the navigation's root, with `data-collapsed`.
  - **⌘K is navigation.** `useAtriumPalette()` gives the palette the recent pages (`atrium-recent`, the navigation's pages only, six at most, shown while no term is typed), every navigation page with its section (filtered by the palette), the search results after them, and actions (colour mode, each theme). One `<AtriumSearch>` owns the shortcut and renders both launchers (a full one from `md`, an icon below).
  - **Theme bridge.** `useAtriumTheme()` sets every token as sent and as `--atrium-token-*` (`--radius-radius` as `--atrium-token-radius`); `atrium.css` reads only the latter. Reading `--color-primary` made a cycle with Nuxt UI's `--color-primary: var(--ui-primary)` whenever a theme left the token out, so the default theme's primary buttons rendered transparent. Fallbacks are now the deck's own neutrals (and Nuxt UI's primary scale, `indigo` on `slate` by default in `app.config.ts`). Derived tokens (`--atrium-glow`, `--atrium-tint`, `--atrium-field`, `--atrium-control-ring`, ...) mix the bridged colours, so a brand theme re-colours the glow, tints and field rings. Control rings mix `outline` and `outline-strong`, so a theme with a near-black `outline-strong` (SECLOCK's) does not draw black fields.
  - **Global restyle over per-page edits.** Nuxt UI defaults live in the layer's `app.config.ts` (`ui`: sizes, card and modal slots, badge, command palette, dashboard panel and navbar). Inside the shell, `atrium.css` styles every page's `<h1>`, `<h2>` (a micro-label with a lit tick), tables (header, row height, hover, sticky head) and native `<select>` in the `utilities` layer with compound selectors, which outrank the pages' own `py-2 pr-3`, so no page needed rewriting for them. Pages were swept only where they clashed: 52 empty-list paragraphs use the new `atrium-empty` class, oversized gaps (`gap-6`, `space-y-6`) became the deck's, and the Impex message volume widget uses `<AtriumStat>`.
  - **Shared blocks.** `<AtriumPageHeader>`, `<AtriumStat>`, `<AtriumState>` (empty, error, locked, info), and `<AtriumErrorCard>`/`<AtriumNoAccess>` redrawn as strips with a lit edge (same test ids and roles).
  - **Accessibility.** Text colours meet WCAG AA on their surfaces in both modes (muted 6.2:1 dark, 5.4:1 light; `dimmed` is for decoration only); focus is a primary outline plus a soft glow; rail buttons carry `aria-label`, `aria-pressed` and `aria-controls`, the current page `aria-current="page"`; motion stops under `prefers-reduced-motion`. A brand's own primary can fall short (white on SECLOCK red is 3.9:1); that is the host's colour.
  - **Design bench.** The served workbench reports every suite package installed (`workbench/app/Atrium/DemoSuite.php`, not under the console or tests; `ATRIUM_WORKBENCH_SUITE=false` turns it off), points their APIs at the playground's stand-in (`nuxt/playground/server/routes/_suite/`), which answers from each vendored `openapi.json` with deterministic values (a path holding `__fail` answers 500, a search for `__empty` nothing), and registers `signal`, a SECLOCK-like brand theme.
- Rationale: The user found the UI "a mess" and asked for something compact, sleek and ultra futuristic that breaks the mold. Screenshots showed why (build.md, "UI redesign: critique"): ~600px of accordion chrome for four links, no navigation on a phone, two page models (half the pages flush against the sidebar), invisible primary buttons under the default theme, loose type and density, and no identity. A rail plus one panel shows a section's pages at once and every section in one column; ⌘K reaches any of ~50 pages in a few keystrokes; restyling through tokens, Nuxt UI's app config and scoped global rules changes all ~190 page and component files consistently without rewriting them, and keeps hosts' themes in charge of colour.
- Date: 2026-11-24
- Raised by: user request via coordinator ("ui is a mess... compact, sleek and ultra futuristic"); choices made without a user available

## D-078: How far does the deck go? (second pass: the flight-deck interface)
- Choice:
  - **Concept.** One metaphor, a flight deck's instrument panel, applied everywhere while keeping D-077's density (13px text, 28px controls, 34px rows). Everything is CSS, inline SVG and one small client plugin; no new dependency.
  - **Depth and light.** Panels (`UCard` through the card theme, `<AtriumStat>`, tables straight on a page) are glass (`--atrium-glass`, backdrop blur) with an inner top highlight, primary brackets on all four corners (brighter on hover) and a ruler of ticks under their heads. Behind them the canvas has a dot matrix fading in perspective and a large primary glow drifting over 26s (`transform` only). `plugins/atrium-spotlight.client.ts` sets `--mx`/`--my` on the panel under a mouse pointer (one passive listener, one write per frame, off under reduced motion and for touch), drawn as a soft radial light.
  - **Shell.** The rail is a luminous spine (a hairline lit from the top, a pulse of light travelling down it every 7s); the mark is a clipped, lit chip; tooltips are mono caps with a primary edge. The section panel's head is mono caps with a tick ruler; the active page gets a lit bar and one sweep of light when it becomes active. The top bar shows a section code (`CTL/PRD`: initials, or consonants of one word) before the breadcrumb and a primary light along its lower edge. `<AtriumStatusBar>` runs along the foot of the content: online state, each integration as a live dot (pulsing while active), the shell's latency (`latency` on the shell store, measured around GET /shell), API version, route and a UTC clock; the API status moved there from the top bar.
  - **Data.** Coloured badges (subtle, soft and outline, through compound variants in `app.config.ts`) are statuses: a glowing dot and a label (`atrium-signal`); neutral badges stay mono chips. Table heads are tracked mono caps with a lit first column; rows arrive staggered and sweep a band of light on hover with a lit start edge. `<AtriumStat>` gains `delta` (a chip) and `series` (an inline SVG sparkline with a fading area), big mono numerals and a toned top edge; inside a panel (a stat widget) it borrows the panel's frame. The playground's stat widget uses it.
  - **Controls.** Primary solid buttons are luminous (gradient, inner highlight, glow, `atrium-btn-primary`); neutral and primary outline buttons are hairline ghosts with corner accents (`atrium-btn-ghost`). Fields carry a brighter lower edge and a glow on focus. Tabs are mono caps with a glowing indicator. Filter forms (`data-testid="*-filters"`, 14 of them) became command-line query bars (`atrium-querybar`): a `›_` prompt, inline `LABEL:` tokens and underline fields, through CSS on the existing markup.
  - **States.** `<AtriumErrorCard>` is a terminal fault readout (`ERR FAULT`, `›` prompt, blinking cursor) and `<AtriumNoAccess>` a `403 RESTRICTED` readout; the codes are CSS decoration, so their text and roles are unchanged. Error and warning `UAlert`s are fault lines. Empty lists sweep a radar; skeletons scan. ⌘K is a HUD overlay (glass, a lit top edge, a `COMMAND · JUMP ANYWHERE · ESC` head, a primary caret).
  - **Motion.** Pages and their panels rise in (200ms), rows follow 20ms apart; all of it, the drift, the spine's pulse, the pings, the radar, the blink and the spotlight stop under `prefers-reduced-motion`.
  - **Light mode ("lab white").** Paper panels, ink hairlines, crisp short shadows, the same brackets, ticks, codes and glows in the primary colour.
  - **Also.** The dashboard grid stacks below 640px; the settings page lists modules as lit sockets with a `01 · CORTEX` code. The playground screenshots hide the Nuxt devtools pill in the screenshot script (devtools stay on for development).
- Rationale: The user's verdict on D-077: "not bad, but i think you can do better. really wow me"; the coordinator read it as still a tidy Nuxt UI admin. Committing to one concept and carrying it into every shared surface (panels, tables, statuses, controls, states, shell) changes all pages at once without rewriting them, keeps the host's primary colour in charge of every light, and keeps the density the admin needs.
- Date: 2026-11-24
- Raised by: user verdict via coordinator; choices made without a user available

## D-079: How does Atrium deliver its front end? (the Blade-served app)
- Choice:
  - **One Blade page, a prebuilt app.** Atrium serves `atrium::app` (`resources/views/app.blade.php`) at every path under `atrium.client_path` (default now `/atrium`, was `/`): a fallback route `{client_path}/{path?}` named `atrium.app`, behind `atrium.client.middleware` (default `['web', 'auth', Authorize::class]`), whose `path` excludes the API and asset prefixes. Hosts need no Node, no build and no Nuxt app: the front end ships prebuilt in `dist/` (committed), like Horizon's and Telescope's. `atrium.client.enabled = false` turns the page and its assets off for a host that serves its own front end.
  - **Vue 3 + Vite, not Nuxt.** Nuxt cannot expose its runtime to scripts loaded after its build, which the module contract (D-082) needs, so the Nuxt layer and playground are replaced by a pnpm workspace in `ui/`: `ui/sdk` (`@refactor-circus/atrium`: registry, composables, `Atrium*` components, the store, types, the module contract, the Vite preset, test helpers), `ui/app` (Atrium's entry, router, layouts and core pages, built to `dist/`), `ui/modules/{pkg}` (the staged suite modules, D-087) and `ui/workbench` (the workbench's own module). Same pins as the layer: Vue 3.5.46, vue-router 5.5.1, Pinia 3.0.4, Nuxt UI 4.1.0 through its Vite plugin in Vue mode, vue-i18n 11.4.23, VueUse 13.9.0, Vite 8.3.8; the D-077/D-078 design, components, styles and data-testids are unchanged (screenshots of the served page match `final2` within a few percent of pixels, the differences being data and clock text).
  - **The page.** `<html lang data-atrium-theme>`, a CSRF meta tag, an inline script that applies the stored colour mode before the first paint and defines the `window.Atrium` queue, the import map (D-082), Atrium's stylesheets, every module's stylesheet, the boot JSON (`<script type="application/json" id="atrium-boot">`: `version`, `api_base`, `client_path`, `locale`, `csrf_token`, `user` {id, name, email}, `theme`, `integrations` {key: {api_base, active}}, `known_integrations`, `modules`, `icons.remote`), then one `<script type="module">` per module script and Atrium's entry last. A CSP nonce from `Vite::cspNonce()` goes on every script. The response is `Cache-Control: no-store, private`.
  - **Boot order.** Module scripts run first and declare themselves (`defineAtriumModule()`); Atrium's entry then creates the app, installs Pinia, vue-i18n and Nuxt UI, installs every declared module whose integration is active (routes with `router.addRoute()`, then its registrations and `setup()`), adds the integration guard, takes the first navigation and mounts. Routes keep Nuxt's names (`impex-runs-run`), which screen declarations and links use; the router is `createWebHistory(client_path)`.
  - **Architecture rule.** `src/` still renders no HTML but the Frontend domain's one page: `ShowAppRequest` returns `response()->view('atrium::app', …)`, and ArchTest checks it is the only file that renders a view (the `view()` helper, `Illuminate\View` and `Blade::` stay banned everywhere).
- Rationale: The user's decision (2026-11-24): "lets give atrium a blade file for serving the app … js should be injected into the blade file. modules are responsible for their own frontend". Prebuilt assets behind one Blade view is the Laravel-native way (Horizon, Telescope, Pulse) and removes Node from host apps; plain Vue + Vite is the smallest change that lets independently built modules share one runtime.
- Date: 2026-11-24
- Raised by: user decision via coordinator; choices made without a user available

## D-080: How does the served front end authenticate, and how do API errors read?
- Choice:
  - **The session, by default.** `atrium.routes.middleware` defaults to `['web', 'auth', Authorize::class]` (was `['api', Authorize::class]`), the same as the page's, so the page and its API share the session with no host configuration. The SDK signs every request to the page's own origin with `X-Requested-With`, `X-XSRF-TOKEN` (Laravel's `XSRF-TOKEN` cookie) and `X-CSRF-TOKEN` (the boot data's token), `credentials: 'same-origin'` and `Accept: application/json`; CSRF headers never go to another origin. Token auth is unchanged: an app or module sets `useAtrium().auth({ headers, credentials, onUnauthorized })`, and an API client on another origin uses `['api', 'auth:sanctum', Authorize::class]`.
  - **401 is JSON, never a redirect.** `ForceJsonResponse` (already first in the group) makes the host's `auth` guard's AuthenticationException render as `401 {"message":"Unauthenticated."}`; `AuthApiTest` checks every route with the default middleware. On a 401 with no adapter of the app's own, the front end reloads the page, so the page's `auth` middleware sends the user to the host's login; a public page (D-038) never does.
  - The suite packages' own APIs keep their own middleware: a host serving them to the page puts `web` and its guard in each package's `routes.middleware` (README).
- Rationale: "Session auth must work same-origin with no host config". Reusing Laravel's own `web` group gets CSRF protection and the session for free; the reload on 401 hands sign-in back to the host, which owns it.
- Date: 2026-11-24
- Raised by: coordinator brief; choices made without a user available

## D-081: How are the prebuilt files served, so it works on Octane and Vapor?
- Choice:
  - **A route, not a publish step.** `GET /{atrium.assets.path}/{owner}/{version}/{path}` (`vendor/atrium` by default, route `atrium.assets`, no middleware, no session) streams files straight from the packages: `owner` is `atrium` (the package's `dist/`) or a module's key (the folders its composer.json names its scripts and styles in, chunks beside them included). `version` is the first 12 characters of the build's source hash (D-085), so every URL changes with a build; a current-version URL is `public, max-age=31536000, immutable`, an older one (a page loaded before a deploy) gets the current file with `no-cache`. Relative chunk imports and CSS `url()`s resolve under the same prefix, since every build uses a relative base.
  - **Only front-end files.** An allow-list of extensions with their content types (`.js`, `.css`, `.map`, `.json`, fonts, images), `X-Content-Type-Options: nosniff`, no dotfile (so `.vite/manifest.json` stays private), no backslash or NUL, and the real path must sit inside an allowed folder (`..` and symlinks out are refused).
  - No `vendor:publish --tag=atrium-assets`: nothing is written to `public/`, nothing goes stale after `composer update`, and the same code serves on Octane (stateless reads), Vapor (the files ship in the Lambda package and the CDN caches the immutable URLs) and behind any web server. A host that wants a CDN fronts the route. v1's published `public/vendor/atrium` must be deleted (the CHANGELOG says so): a web server would serve those stale files first.
- Rationale: Horizon's publish step is the usual cause of stale admin assets; Pulse and Telescope avoid it by inlining. A hashed route keeps the files separate (cacheable, CSP-friendly) without a publish step.
- Date: 2026-11-24
- Raised by: coordinator brief ("choose what's robust for Octane/Vapor"); choices made without a user available

## D-082: What is the module contract? (module-owned front ends)
- Choice:
  - **JS.** A module's entry calls `defineAtriumModule({ key, integration?, routes, widgets, extensions, settingsPanels, liveResolvers, searchSources, responseHandlers, screens, messages, setup })` (all but `key` optional; the maps are keyed as the PHP declarations and the shell send them; `messages` by locale, merged into vue-i18n; `setup({ app, router, atrium, boot })` runs last). Importing the entry registers it; `window.Atrium.register({ … })` does the same for a classic script. A module registers only while the integration named by `integration` (default: its `key` when the page lists an integration by that key; `null` never gates) is active for the user; one that throws is reported and skipped. Search sources are a map keyed by the shell's source key, like the other registrations, not a list.
  - **PHP, with no dependency on Atrium.** A package declares its module in its composer.json: `"extra": { "atrium": { "key": "roster", "scripts": ["dist/atrium/atrium.js"], "styles": ["dist/atrium/atrium.css"] } }` (paths relative to the package; `key` defaults to the package name's second part; absolute paths, `..` and backslashes are dropped). Atrium discovers them from `vendor/composer/installed.json` like plugins, cached in `bootstrap/cache/atrium-modules.php` (folders relative to `vendor/`) by `atrium:discover` (run by `package:discover` and `optimize`), cleared by `atrium:clear-discovered`; `atrium.discover = false` turns discovery off. `Atrium::module($path)` loads a module folder as if installed (an app's own module, a checkout beside the app, the staged modules). `Atrium::script($urlOrViteEntry)` / `Atrium::style()` and `atrium.scripts` / `atrium.styles` add the app's own files (a URL, or an entry of the app's Vite build through `Vite::asset()`), loaded after every module as the `app` module. Keys `atrium` and `app` are reserved.
  - **Per request** the page keeps a suite integration's module only while that integration is registered and active for the user, drops keys in `atrium.disabled`, and drops a module whose `build.json` says another major of the shared API (logged once).
  - **The shared modules are a versioned API.** The import map maps exactly `vue`, `vue-router`, `pinia`, `vue-i18n`, `@vueuse/core`, `openapi-fetch`, `@refactor-circus/atrium` (the SDK) and `@refactor-circus/atrium/ui` (Nuxt UI's components and composables as Atrium compiled them with its theme, a curated re-export: everything but the marketing, blog, changelog, pricing and chat components) to the very chunks Atrium's app uses, one instance each (each is an entry of Atrium's build with its exports preserved). `ATRIUM_SHARED_API` (`ui/sdk/vite/shared.mjs`, `1.0`) versions the list: removing a specifier or moving a library to a new major is a new major; every module build records the version it targets. Modules externalise these specifiers; anything else they bundle (Guardian bundles `uqr`).
- Rationale: The user: "modules need to register their js. js should be injected into the blade file. modules are responsible for their own frontend and js clients". Declaring the module in composer.json keeps packages free of a Composer dependency on Atrium (the suite rule "require only Keystone; add-ons integrate via config"), and reuses the plugin discovery hosts already run.
- Date: 2026-11-24
- Raised by: user decision via coordinator; choices made without a user available

## D-083: How do modules call their own APIs, typed?
- Choice:
  - Modules keep their own client generation (`client/`, `createXClient(options)`). The SDK supplies the auth and base URL: `atriumClientOptions(key)` returns `{ baseUrl, fetch }` (the integration's API base from the shell, or the boot data before it loads, made absolute; and the SDK's signing `fetch`), so `createRosterClient(atriumClientOptions('roster')!)` authenticates as every Atrium client does. `useAtriumIntegration(key, createXClient)` returns `{ active, apiBase, client }` with the factory's client, cached per key and factory.
  - Without a factory, `useAtriumIntegration(key)` returns an `openapi-fetch` client typed by the paths a module declares once: `declare module '@refactor-circus/atrium' { interface AtriumIntegrationPaths { roster: paths } }` (each staged module's `src/env.d.ts`); `useIntegrationQuery(key, …)` and the test helper `mockPackageApi(key, …)` read the same augmentation. A key no module typed gets an untyped client.
  - The staged modules keep the vendored `openapi.json`/`schema.d.ts` (now `ui/modules/{pkg}/client/`, `pnpm -C ui sync:clients`, `VendoredClientsTest`) until phase 2 swaps them for each package's own `client/`. Showroom, which reads Impex's runs, carries a copy of Impex's schema (`client/impex/`) and types `impex` in its augmentation.
- Rationale: "all modules keep their client generation … modules are responsible for their own … js clients". Augmentation keeps every existing call site (`useAtriumIntegration('impex').client!.GET(...)`) typed with no rewrite, while the factory form is open to a package's own client.
- Date: 2026-11-24
- Raised by: user decision via coordinator; choices made without a user available

## D-084: How does a module build, and how are its styles kept consistent with the page?
- Choice:
  - **The preset.** `@refactor-circus/atrium/vite` exports `atriumModule({ key, entry = 'src/atrium.ts', outDir = 'dist/atrium', inputs, test, vite })`: a library build (ES, `atrium.js` with lazy page chunks under `chunks/`, one `atrium.css`), every shared specifier external, the same auto-imports as Atrium (Vue, Vue Router, Pinia, `useI18n`, every SDK export, Nuxt UI composables from `@refactor-circus/atrium/ui`), `<Atrium*>` resolved to the SDK and `<U*>` to `@refactor-circus/atrium/ui`, Tailwind, and `build.json` (D-085). Under Vitest the same call returns the test config: Vue, Nuxt UI's Vite plugin with Atrium's theme (`vite/ui-config.mjs`, the D-077 app config), the auto-imports, happy-dom with file loading off, and the SDK's test setup. A module's vite.config.ts is one call.
  - **Nuxt UI is compiled once**, in Atrium's build, with Atrium's theme; modules never run Nuxt UI's plugin for a build and never bundle it. Atrium's stylesheet scans its own sources, the SDK and the theme config only.
  - **Module styles.** A module's CSS entry is `@import "@refactor-circus/atrium/module.css"; @source "./";`: Tailwind's theme and utilities only (no preflight, no base), with Atrium's tokens (`css/theme.css`, shared with Atrium's stylesheet) and Nuxt UI's theme (`css/nuxt-ui-theme.css`, generated from Nuxt UI by `ui/scripts/nuxt-ui-theme.mjs`, checked by `pnpm -C ui theme:check`), so `p-4` or `text-muted` compute to the page's values. Its utilities go in the `atrium-modules` cascade layer, after Atrium's `utilities`, and leave out every class Atrium's stylesheet already defines (`css/core-classes.css`, written by Atrium's build): otherwise a module's `.hidden`, later in the cascade, beat Atrium's `lg:flex` and hid the navigation. A module's variant still beats a base utility Atrium defines; the one remaining case (a module-only base utility against an Atrium-defined variant on the same element) is rare and documented.
- Rationale: "A Vite preset for modules … so each module's vite.config is ~5 lines", with styles that cannot fight the page's.
- Date: 2026-11-24
- Raised by: coordinator brief; choices made without a user available

## D-085: How do we know the committed builds are current?
- Choice: Every build writes `build.json` beside it: `key`, `shared_api`, `root` (relative to the build), `inputs` and `hash`, the SHA-256 of `{path}\0{sha256 of the file, CRLF as LF}\n` lines for every file under the inputs (sorted; `node_modules`, `dist` and dotfiles skipped). Atrium's covers `ui/app`, `ui/sdk` (src, css, locales, vite, package.json) and `ui/pnpm-lock.yaml`; Atrium's also carries the entry and the import map's files. `tests/Feature/Frontend/BuildFreshnessTest.php` recomputes each hash in PHP (no Node in `composer test`), and the `ui` CI job runs `composer test:ui` (which rebuilds) and fails on any `git diff` of `dist`, the module builds, the generated client or the SDK's CSS.
- Rationale: "a staleness check test (built output matches sources hash) and a CI job". Hashing sources, not outputs, keeps the PHP check Node-free and independent of minifier output.
- Date: 2026-11-24
- Raised by: coordinator brief; choices made without a user available

## D-086: What does the `viewAtrium` gate allow while the app defines none?
- Choice: The gate stays the host's (`atrium.gate`, `viewAtrium`); a defined gate always decides. While it is undefined, a user model implementing `RefactorCircus\Atrium\Domains\Access\Contracts\AtriumUser` decides with `canAccessAtrium()`; any other signed-in user gets in only in `local` (as before), and elsewhere is refused with one log notice per process saying how to let them in (define the gate, or implement the contract). `atrium:install` says the same.
- Rationale: No v2 suite package defines `viewAtrium` any more, so every production host had to write a gate before anyone could open Atrium. Opening Atrium to every signed-in user by default would expose the admin to an app's customers (Polycart's shoppers share the guard). A contract on the user model is the Filament-style default: one method, discoverable, and a package that owns users or permissions (Guardian's roles) can implement it on its trait without Atrium knowing the package. Recorded as a follow-up for Guardian.
- Date: 2026-11-24
- Raised by: coordinator brief ("make the viewAtrium gate have a sane default"); choices made without a user available

## D-087: How are the eight integrations staged until phase 2, and what replaced Nuxt's conveniences?
- Choice:
  - **Staged modules.** Each integration's Vue code (components, pages, locales, tests, its vendored client) lives in `ui/modules/{pkg}/`, laid out as the package's `atrium/` folder will be: `package.json`, a one-call `vite.config.ts`, `src/atrium.ts` (`defineAtriumModule`), `src/routes.ts` (explicit routes with Nuxt's names; the public pages carry `meta.atrium.public`), `src/env.d.ts`, `src/locales/*.en.json`, `test/` (with `test/setup.ts` calling `useTestModule()`), a stand-in `composer.json` with `extra.atrium`, and its committed `dist/atrium/`. Each depends on the SDK by `workspace:*` (in its package: `github:refactor-circus/atrium#<tag>&path:ui/sdk`). Atrium's own build contains the core only. The workbench loads them through the same discovery path: `DemoSuite` calls `Atrium::module(ui/modules/{pkg})` for each, so the workbench is the end-to-end proof. `MODULES.md` is the step-by-step move for phase 2.
  - **Cross-package hooks** moved to the module of the package whose API they call (Cortex's redirect domains, Impex's run link, Keen's history and activity, Guardian's access, SSO, SCIM and security tabs), each with its own copy of the helpers it uses.
  - **PHP declarations stay.** `src/Integrations/*` (nav, widgets, screens, settings, hooks, features) stays in Atrium for now, as the user asked only for the Vue files to move; moving the declarations into the packages is a possible follow-up. The integration fixtures stay Atrium's contract and are exported to modules as `@refactor-circus/atrium/fixtures/integrations/{pkg}.json`.
  - **Nuxt's conveniences, in the SDK:** `useAsyncData()` (the keyed subset Atrium used: shared data while mounted, `refresh`, `watch`, getter keys), `navigateTo()`, `useHead()` (unhead), `useColorMode()` (VueUse, `localStorage['vueuse-color-scheme']`, the key Nuxt UI's Vue plugin uses), `useAtriumI18n()` for `useNuxtApp().$i18n`, `runInAtrium()` for `runWithContext()`, `useAtriumBoot()` for runtime config, `<AtriumLink>` for an internal-or-external `<NuxtLink>` (pages use `<RouterLink>`), and the icon setup (Lucide bundled with `addCollection`, the Iconify API cut off unless `atrium.icons.remote`; `addAtriumIcons()` for more packs). Test helpers moved to `@refactor-circus/atrium/testing` (`mountSuspended`, `mockAtriumApi`, `mockNavigateTo`, `registerEndpoint`, `clearAtriumData`, `mockPackageApi`, …). The types that share a component's name were renamed: `AtriumScreenData`, `AtriumExtensionData`, `AtriumSettingsPanelData`, `AtriumIntegrationScreenData`.
  - **Departures.** Nuxt UI's Vue-mode `<ULink>` renders no `rel`, so ⌘K's external results carry `target="_blank"` only (browsers imply `noopener` for it); the nav's own external links keep `rel="noopener noreferrer"`. There is no HMR dev server: `pnpm -C ui dev` rebuilds every build on change (`vite build --watch`) and the served page picks them up. The playground's Nitro stand-in for the suite APIs is now the workbench's PHP `SuiteStandIn` (`/_suite/{pkg}/…`), value for value.
- Rationale: The brief preferred staging each module as an external module would be built, the best proof the contract works; phase 2 then only moves folders.
- Date: 2026-11-24
- Raised by: coordinator brief; choices made without a user available

## D-088: How does the SDK work when a module installs it from GitHub?
- Choice:
  - **The SDK is self-contained.** Every SDK `.vue` file imports the `Atrium*` components it renders (`./AtriumX.vue`) and the `U*` ones from the same `@nuxt/ui/components/X.vue` (or `@nuxt/ui/runtime/vue/components/{Icon,Link}.vue`) file `src/ui.ts` re-exports, so Atrium's build still has one copy of each, in the `@refactor-circus/atrium/ui` chunk of the import map. Not from `../ui` (every component in every test file) nor from the package's own `@refactor-circus/atrium/ui` specifier. A module's build is unchanged: the SDK is external there.
  - **Atrium's suites see what a module's see.** `nuxtUi()` passes the component plugin an `exclude` that adds the SDK's `src/` to Nuxt UI's default (one RegExp: defu replaces a RegExp but would concatenate an array), so an SDK component that forgets an import fails Atrium's own tests rather than only a module's.
  - **Types the SDK's sources import are its `dependencies`** (`@types/sortablejs` moved from `devDependencies`): a module's `vue-tsc` type-checks the SDK's sources.
  - **Tests never reach the network.** The SDK's test setup replaces `fetch` with one that rejects at once (`No test mock answers GET …`); mocks sit in front of it. Before, a request no mock answered (typically a page refetching after its test reset `mockPackageApi`) went to happy-dom's `fetch`, which tried `http://localhost:3000` and printed `ECONNREFUSED` thousands of times per run.
  - **A consumer check.** `ui/scripts/check-consumer.mjs` (`pnpm -C ui test:consumer`, in `composer test:ui`) packs the SDK, installs it with pnpm into a temporary module (`ui/scripts/consumer/`) beside only the dependencies `MODULES.md` lists (so it lands under `node_modules/.pnpm/…/node_modules/@refactor-circus/atrium`), then builds it (checking the SDK stayed external), type-checks it and runs its Vitest suite, which fails on an unresolved component or a test that reaches the network. About 15 seconds.
- Rationale: Every package that moved its module (phase 2) hit "Failed to resolve component: AtriumScreen / AtriumNoAccess / UAlert" (Nuxt UI's resolver skips `node_modules` except `.pnpm` and `@nuxt/ui`; the second `node_modules` of a pnpm path matched) and TS7016 for `sortablejs`, and worked around both in its own config. Inside Atrium's workspace `workspace:*` links `ui/sdk`, so neither showed. Fixing the preset's `exclude` instead would have kept the SDK dependent on its consumer's resolver and on pnpm's layout (npm's flat `node_modules/@refactor-circus/atrium` would still be skipped); explicit imports work under any installer and any resolver.
- Date: 2026-11-24
- Raised by: coordinator (package agents' reports from the phase-2 moves); choices made without a user available

## D-089: Where do the suite modules and their clients live after phase 2, and how does the workbench show them?
- Choice:
  - **Phase 2 is done.** Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and Showroom each ship their module in their own repository (`atrium/`, built into a committed `dist/atrium/`, declared under `extra.atrium`), typed by the package's own generated client. Atrium deletes `ui/modules/*` and its workspace entry, and stages no module.
  - **No vendored clients (supersedes D-020).** `ui/scripts/sync-clients.mjs`, the `sync:clients` script, `VendoredClientsTest` and every vendored `client/` (Showroom's copy of Impex's schema included) are deleted. A module that needs another package's types keeps its own copy in its package (Showroom's `atrium/types/impex-schema.d.ts`). The D-020 release step (pnpm git dependencies on each package's client) is dropped: no Atrium code imports a package client.
  - **The workbench.** `DemoSuite` still reports the eight packages installed and points their API bases at `SuiteStandIn` (`/_suite/{pkg}`). When `ATRIUM_SUITE_PATH` names a folder of sibling checkouts (`Cortex`, `Guardian`, …), it registers each checkout that declares `extra.atrium` and has a built `dist/atrium/build.json` with `Atrium::module($checkout)`, which reads the checkout's `composer.json` through the same `ModuleManifest::fromComposer()` discovery uses for an installed package, and `SuiteStandIn` answers from the checkout's `openapi.json`. Without it, the workbench shows Atrium's core, `ui/workbench` and the integrations' fallback cards. Atrium requires none of the packages, in `require` or `require-dev`.
  - **Gates.** `BuildFreshnessTest` checks Atrium's and the workbench's builds and that `ui/modules` is gone; the `ui` CI job diffs `dist` and `ui/workbench/dist`; `ChangelogUpgradeTest` reads the `// Not ported (D-032)` comments from the sibling checkouts when `ATRIUM_SUITE_PATH` is set, and checks only the CHANGELOG otherwise. The SDK consumer check (`pnpm -C ui test:consumer`) stays, as the in-repository proof that a module installed from the packed SDK builds, type-checks and tests.
  - **Kept.** The PHP integration declarations (`src/Integrations/*`), the hooks and the integration fixtures stay in Atrium.
- Rationale: The packages now own and build their modules, so the staged copies and the vendored clients would only drift. Requiring the packages (even as dev dependencies) for the workbench would make Atrium depend on the suite it hosts and on their unreleased v2 tags; sibling checkouts through one environment variable keep the full design bench for anyone with the suite checked out and a working workbench for everyone else, through the same manifest path a host uses.
- Date: 2026-11-24
- Raised by: coordinator (phase 2, MODULES.md step 9); choices made without a user available

## D-090: How do the packages declare their integrations without Atrium knowing them?
- Choice:
  - **A static JSON manifest per package.** Each package declares its integration in `atrium/src/integration.json` (or `atrium/integration.json`), which the preset checks and copies to `dist/atrium/integration.json` (and adds to the build hash); composer.json's `extra.atrium.integration` names the shipped file (default `dist/atrium/integration.json` when it exists). The manifest mirrors the old `Integration` contract: `version: 1`, `key`, `label`, `features`, `navigation`, `widgets`, `settings`, `search_sources`, `screens` (key, kind, path, `subject_type`, `options`) and `hooks`. Labels are plain English, passed through Laravel's `__()`, so hosts translate them in lang JSON.
  - **Config-derived values are expressions, read at registration.** `{"$config": key, "type": cast, "default": …}` reads only the package's own config (`{pkg}.*`) or its integration's (`atrium.integrations.{pkg}.*`), with nine casts (`string`, `bool`, `int`, `positive-int`, `enum`, `strings`, `string-map`, `path`, `map`); hook data adds `$screen` (`subject_type`, `package`, `key`), `$option` (an `options` hook's placement options) and `$subject_scope` (Guardian's scope lookup: null for `self`, skipped with one warning per process where it does not resolve). A nav item's `when` and `sort` may be expressions (Keen's History item).
  - **Hooks move to the package whose API they call**, matching where their Vue lives: Cortex's redirect domains, Impex's run link, Keen's history section and activity tab, Guardian's tabs and section. A hook is a `map`, `lists`, `targets` or `options` placement with its manifest `default` and a `config` key under `atrium.integrations.{pkg}.` the host overrides, plus a `screens` filter (`kind`, `subject`, `others`). The four old config shapes are exactly these formats, so every host config keeps working. Hooks run in integration key order, then manifest order.
  - **One schema, two validators.** The JSON Schema is `ui/sdk/schema/integration.schema.json` (shipped in the SDK as `@refactor-circus/atrium/schema/integration.schema.json` and in the Composer package); PHP (`ManifestSchema` + `IntegrationManifests`) and the SDK (`vite/manifest.mjs`: `validateIntegrationManifest()`, `expectIntegrationManifest()` in `/testing`) implement its subset and the same rules, and refuse the shared cases (`ui/sdk/test/fixtures/manifests/cases.json`) at the same JSON pointers. A bad manifest throws `InvalidIntegrationException` naming the file and the pointer.
  - **Sources.** `IntegrationRegistry` reads the installed packages' manifests through the `InstalledPackages` seam (now `integrations(): array<key, path>`, over `atrium:discover`'s module cache, while `atrium.discover` is on), then `Atrium::module()` folders', then `Atrium::integration(path|array)` (an app's manifest-only integration), each later one winning for its key. A manifest's key must equal its module's key. Registration is unchanged: enabled, API base, then active per user by `features`.
  - **Features by name.** The `{Pkg}Feature` classes are gone; the suite's manifests name `{pkg}.atrium`. With Pennant available, Atrium defines a name the manifest declares (and the host has not defined) as on, as the classes resolved; a name only the host lists reads as off until defined. `atrium.integrations.{pkg}.features` still replaces the list.
  - **Atrium keeps no package declaration.** `src/Integrations/*` (eight integrations, their feature classes, `GuardianScopeTypes`, `Hooks/`) and `lang/en/integrations/*.php` are deleted; `config/atrium.php` lists no package (`'integrations' => []`, the banner documents the suite's keys and defaults). Atrium's tests read fixture manifests (`tests/Fixtures/Manifests/{pkg}/integration.json`, generated from the PHP declarations at 26a143f) and the workbench's `DemoSuite` reports them installed, a sibling checkout's own manifest winning once it ships one.
  - **Equivalence.** Every registry, shell and `atrium.screens.show` payload (every screen, every tab opened) built from the manifests was compared with the PHP classes' under four config scenarios and eight partial installs: identical but for the feature names, the order of hook tabs on one screen (Roster's: Guardian's before Keen's activity tab, as hooks now run in key order), and a non-array `atrium.integrations.keen.history.nav`, which now falls back to the manifest's defaults. The integration fixtures (`ui/sdk/test/fixtures/integrations/*.json`) changed only in `features`.
- Rationale: The packages may not require Atrium or use its PHP classes (the user's rule: no cross-package knowledge), so their declarations cannot be PHP. Data the browser and PHP both read, checked by one published schema, lets a package test its integration in its own Vitest suite and ship it in the build it already commits. A host keeps every config key it had. Expressions are limited to the package's own config so a manifest cannot send a host secret to the browser.
- Date: 2026-11-24
- Raised by: user ("move the php declarations" out of Atrium into the packages); design from the coordinator's brief

## D-091: Are Atrium's own components built from Nuxt UI?
- Choice:
  - **Every `Atrium*` component, layout and core page composes Nuxt UI 4.** The shell is a `UDashboardGroup` (the deck's canvas) with a collapsible `UDashboardSidebar` (rail and section panel; its slideover below `lg`, remembered per browser under `atrium-sidebar-nav`), the top bar a `UDashboardNavbar` (`UBreadcrumb`, a `UBadge` code, `UColorModeButton`), ⌘K `UDashboardSearchButton` + `UDashboardSearch`, the status strip a `UDashboardToolbar` with `UChip` dots and `UTooltip`s. The rail is `UButton`s in `UTooltip`s (a `UPopover` per section while collapsed), a section's pages a vertical `UNavigationMenu` (`AtriumNavList`), the user a `UUser`. `AtriumPageHeader` is `UPageHeader`, `AtriumState` and the empty dashboard `UEmpty`, `AtriumErrorCard` / `AtriumNoAccess` / `AtriumUnregistered` `UAlert`s (`data-code` `ERR` / `403`), the widget picker a `UCommandPalette` in a `UModal`, the settings index a `UPageGrid` of `UPageCard`s. Props, slots, emits, `data-testid`s and behaviour are kept; nothing a module imports changed shape.
  - **The deck's look lives in the Nuxt UI theme.** `ui/sdk/vite/ui-config.mjs` carries it as slot classes, variants and compound variants (glass panels with brackets and a ruler head, the lit primary button, fault-line alerts, status-dot badges, the lit active nav item, the ⌘K HUD, the dashboard shell); `atrium.css` keeps the theme bridge, the composite tokens those classes read (`--atrium-panel-shadow`, `--atrium-brackets`, `--atrium-sheen`, `--atrium-fault`, ...), the base layer, two micro-label utilities and the styling of what modules' pages render as plain HTML inside `[data-atrium-content]` (tables, headings, native selects, `.atrium-querybar`, `.atrium-empty`), which the suite's modules still use. 1,319 lines became about 560; the `spotlight` plugin, the rail's travelling pulse, the drifting haze and the row sweeps are gone.
  - **Safe external links everywhere.** `nuxtUi()` patches Nuxt UI's Vue-mode `Link.vue` to send `rel="noopener noreferrer"` (or the `rel` given) on an external link, which it otherwise drops (D-087), so `UNavigationMenu`, `UButton to`, `UCommandPalette` and `UBreadcrumb` links match `<AtriumLink>`; the build fails if a Nuxt UI release reshapes the file.
  - **Shared.** `@refactor-circus/atrium/ui` adds `UDashboardSearch`, `UDashboardSearchButton`, `UPageGrid`, `UPageList`, `UPageColumns`, `UPageSection`, `UPageBody`, `UPageAside`, `UPageFeature`, `UPageLinks`, `UMain`, `UBanner` and the colour-mode controls (additive, within `ATRIUM_SHARED_API` 1.x); still one copy in the shared chunk.
  - **Tests.** `mountSuspended()` mounts inside `<UApp>` (tooltips and overlays need its providers, as on the page). `ui/sdk/test/nuxt-ui-guard.test.ts` fails when a `.vue` file under `ui/sdk/src` or `ui/app/src` renders `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<details>` or an `<a href>` (allowed only in `AtriumLink.vue`).
- Rationale: The user: "the atrium components should be based on nuxtui as well". Hand-rolled markup with a bespoke class tree duplicated what Nuxt UI provides (keyboard handling, focus, overlays, theming hooks) and kept the look out of the one place modules share. Expressing the deck through the Nuxt UI theme keeps it compact and lit while moving toward Nuxt UI's dashboard idioms; modules' raw tables and filter bars keep their styling until they move to `UTable`.
- Date: 2026-11-24
- Raised by: user; choices made by the implementing agent without a user available

## D-092: What identifies a screen's record to another package's hook?
- Choice:
  - **The morph type the host stores, from the model the owning package names.** A screen's `subject_type` stays the suite's name for its subject (hook targeting and `$subject_scope` read it), and a screen whose `subject_type` is such a name (any value with a `.`, such as `roster.organization`) declares `subject_model`: a model class, morph alias, or a `$config` reading one from the package's own config (Roster's user is `roster.users.model`). Atrium resolves it once the providers have booted, through the host's morph map (`Relation::getMorphAlias()`), else keeps the class; a model this app lacks is kept as written. `$screen` `subject_type` in hook data and the `subject_type` of `atrium.screens.show` send that morph type (`ScreenDeclaration::morphType()`), the subject type itself when no model is named (Showroom's aliases).
  - **The record is the route key.** A screen passes its route parameter as `record`, the subject model's route key (an organization's slug, a user's id); the APIs a hook calls resolve a record reference by route key, as `models/stored-identifiers` says for records a package does not own (Cortex's `owner_id`, Guardian's `scope_id`). Atrium itself never resolves a record.
  - **Caught where it happens.** The manifest rules (PHP and SDK, shared cases) refuse a dotted `subject_type` without `subject_model`, and a `subject_model` without `subject_type` or reading another package's config. The workbench's `SuiteStandIn` refuses an `owner_type`, `scope_type` or `subject_type` that names no morph type (no alias, model class or declared subject model), with 422 as the packages do, instead of answering anything. `suite-screens.json` now records the morph types.
- Rationale: In a real host (no `roster.*` morph aliases, organizations by slug, ULID keys) Cortex's redirect domains 404'd on `owner_type=roster.organization` and Guardian's access tab 422'd on `scope_id=<slug>`: Roster declared a label where the contract said "morph alias", and the screen's record is a slug while the APIs looked up primary keys. Only Roster knows its models, and only the host's morph map knows their stored type, so the owning package names the model and Atrium resolves it per host, leaving Cortex and Keen's manifests unchanged and naming no package class in Atrium. The stand-in answered any query, and the test fixtures aliased `roster.organization`, so neither showed it.
- Date: 2026-11-24
- Raised by: user (bugs found in a real host); choices made by the implementing agent without a user available
