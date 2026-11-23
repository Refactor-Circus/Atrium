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
