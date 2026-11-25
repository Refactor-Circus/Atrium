# Atrium v2 headless — Shaping Notes

## Scope

Atrium v2 (released as **v2.0.0**) stops rendering HTML. It becomes a JSON API plus a Nuxt layer, kept in this repo, that renders the dashboard. This replaces the Blade dashboard; it does not run beside it.

In scope (this package only):

1. **JSON API is the only HTTP surface.** It carries over the spike's routes: shell, dashboards (list, show, create, update, delete, layout), lazy widget data, widget catalogue, search, settings index and panel, and `?tab=` on every screen.
   - Routes use the suite's API group (`atrium.routes.{enabled,prefix,middleware}` through Keystone's `loadApiRoutesFrom`) and are named `atrium.*`.
   - The Blade page routes and their `path`/`domain`/`middleware` group go away.
2. **Delete the Blade UI:**
   - all 65 views, and the Blade/Alpine components
   - `resources/css` and the `public/atrium.css`/`atrium.js` build
   - `StyleRegistry`, `Atrium::css()`/`stylesheet()`, `Testing\AtriumStyles`
   - `Support\Icons` and `resources/icons`, the `alpine` and `logout_route` config keys
   - the Blade controllers and their redirecting requests, `Http\Controllers\Concerns\AuthorizesScreens` if unused
   - `tests/Browser` (Playwright) and the npm CSS build
3. **Plugin contract:** `Plugin::routes()` registers API routes inside Atrium's API group, keeping the feature-gate middleware. Plugins no longer register Blade pages.
4. **Extension contract:** widgets, screen tabs/sections and settings panels serialize as `{key, component, data}`.
   - `view()` is removed from `WidgetDefinition`, `SettingsPanel` and `DefinesExtension`.
   - `component()` names the Vue registry key, and defaults to the definition key.
   - `JsonData::check()` guards every resolver's output and fails loudly.
5. **Icons:** only Iconify names (`i-lucide-home`), on `NavItem`, `NavGroup`, `WidgetDefinition`, `TabDefinition`, `SettingsPanel`, `SearchResult` and `Theme` swatches. Inline SVG is dropped.
6. **Nuxt layer `nuxt/layer`** (`@refactor-circus/atrium-nuxt`): Nuxt 4 SPA, Nuxt UI 4, Pinia, pnpm. It promotes the spike's layer:
   - shell, navigation, ⌘K search, theme tokens
   - dashboard grid editor, switcher, settings pages, screen tabs and sections
   - key → component registry, and an auth adapter the host app supplies
   - `nuxt/playground` replaces the workbench's Blade demo
7. **Workbench and docs:**
   - workbench demo plugins move to API routes, with the playground's Vue widgets beside them
   - README, CHANGELOG (v2.0.0 upgrade guide), the Boost skill, `CLAUDE.md` frontend conventions
   - rewrite the local standards `atrium/components` and `atrium/domains`

Out of scope: migrating suite packages. Each gets its own spec, queued with `waits_for_this` on this one (see Context).

## Decisions

- **Auth is the host's.** Atrium ships no guard. The host puts Passport (`auth:api`), Sanctum, or anything else in `atrium.routes.middleware`, which defaults to `['api', Authorize::class]`. The Nuxt layer takes an auth adapter (`headers`, `credentials`, `onUnauthorized`) from the host app. Decided with the user: not Sanctum, not OAuth forced by Atrium.
- **Extension UI is a data contract.** The API sends `{key, component, data}`, and Vue components are registered by key from each package's Nuxt layer. There is no HTML or Blade fallback.
- **Iconify names only**, chosen by the user over keeping SVG.
- **The Nuxt layer lives in this repo** under `nuxt/` (pnpm workspace: `layer` + `playground`), so one PR changes the API and its client together.
- **Reads are safe.** `GET` never creates a dashboard. The client posts one when the list is empty, which replaces the Blade first-visit auto-create.
- **Same Request/Action pipeline.** `{Verb}{Entity}Request::persist()` calls the existing action and returns a resource, following `http/request-persist`. The spike's subclass-and-override approach goes away, because the Blade requests are deleted.
- **Corrections to the spike from standards** (the spike broke these):
  - `http/resources`: the dashboard resource moves beside its model (`Domains/Dashboard/Resources/`), `final` with `@mixin`, extends Keystone's `JsonResource`, exposes the slug, not the id.
  - `http/routes` + `models/stored-identifiers`: bind dashboards by `{dashboard:slug}` for mutations too, not by id.
  - `http/routes`: routes go in each domain's `routes.php`, not `api.php`.
  - `errors/exceptions`: `UnserializableDataException` becomes `final`, extends `AtriumException` with a `forX()` constructor and a non-409 status, and lives in the domain that owns it.
  - `testing/test-layers`: tests use route names, not URLs.
- **Open for `/ring-master-write-spec`:**
  - **Placement ids.** Placements have no slug, so how are lazy-widget URLs and layout payloads identified (`{widget}` id under a slug-bound dashboard, or position)?
  - **The `editable` flag.** `http/resources` forbids request-dependent fields, so `editable` needs a home (resource `meta`, or an `abilities` block).
  - **Where `JsonData` lives** (`Support/` or a domain).
  - **Layer distribution** (git dependency vs GitHub Packages).

## Context

- **The spike is the reference:** branch `spike/v2-headless`, commit `2607d9a`, worktree `../Atrium--v2-headless`. It passed 630 tests, type coverage 100%, Nuxt typecheck and build. See `references.md`.
- **Stack** mirrors `~/Herd/spike-seclock-v2/frontend`: Nuxt 4 `ssr:false`, Nuxt UI 4.1, Pinia 3, VueUse, pnpm 10.
- **Visuals:** none supplied. The playground is the reference UI, built from Nuxt UI dashboard components.
- **Product docs:** `docs/agent/product/` is empty, so there is no mission or roadmap to align with.
- **Suite rule** (memory: no cross-package knowledge): Atrium still requires only Keystone and knows no sibling package. Packages integrate by registering keys and Vue components.
- **Follow-up specs** (proposed tasks, `waits_for_this: true`): Cortex, Impex, Keen, PennantPlus, Polycart, Roster, Showroom. For each:
  - its Blade screens become API routes plus a Nuxt layer
  - `x-atrium::*` usage goes
  - its icons become Iconify names
  - its `require` moves to `refactor-circus/atrium ^2.0`
  - Keen also moves its history screen and audit components.

## Standards

- `architecture/configuration`: the `routes` banner states the auth-middleware security note; drop the Blade keys (`path`, `domain`, `middleware`, `alpine`, `logout_route`).
- `architecture/domain-modules`: new Http/Resources in each domain; resources beside models.
- `architecture/dependencies`: Atrium still requires only Keystone; nothing in the Nuxt layer knows sibling packages.
- `architecture/public-api`: `Atrium` facade loses `css()`/`stylesheet()`; the `@method` docblock must match.
- `architecture/naming`: `{Entity}Resource`, `{Verb}{Entity}Request`, `{Reason}Exception`.
- `http/authorization`: the gate stays first in the middleware; policies are unchanged; guest 401 vs 403 matters now that the host supplies auth.
- `http/request-persist`: `persist()` returns resources, controllers stay one line.
- `http/resources`: every payload goes through a final resource; slug, not id; no request-context conditionals.
- `http/routes`: one group from config; named `atrium.*`; slug binding; `scopeBindings` for widgets.
- `models/stored-identifiers`: request inputs and URLs reference dashboards by slug.
- `errors/exceptions`: the unserializable-data exception follows the hierarchy.
- `data/value-objects`: definitions keep `public private(set)` state; `component` and `icon` setters change meaning.
- `testing/arch-tests`: ArchTest keeps passing, and adds a ban on `view(` and Blade in `src/`.
- `testing/test-layers`: API tests check wiring only; behavior stays tested at the actions.
- `atrium/components` (local, rewritten): Atrium owns the suite's Vue components in `nuxt/layer`; packages ship Vue components registered by key, with no stylesheets.
- `atrium/domains` (local, rewritten): domain providers load `routes.php` through the API group; `loadDashboardRoutesFrom()` is removed.

---

## Reopened 2026-11-23: suite integrations

### Scope

Atrium v2 also hosts the front ends of the seven suite packages: Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom. Those packages keep only their JSON API and MCP. Foundry and Guardian are out of this round.

1. **One integration per package**, under `src/Integrations/{Package}/` (PHP) and `nuxt/layer/app/integrations/{package}/` (Vue). Each registers only when `Composer\InstalledVersions::isInstalled('refactor-circus/{package}')` and `atrium.integrations.{package}.enabled` (default true) both hold. The PHP side declares navigation, widgets, screens, tabs and sections, settings panels and search sources as data. It never calls the package's models or actions.
2. **The Vue side calls the package's API** through the package's generated client (`@refactor-circus/{package}-client`, `openapi-typescript` + `openapi-fetch`), pinned as a git dependency on the package's v2.0.0 tag. The shell tells the layer which integrations are on and each package's API base (`{package}.routes.prefix`).
3. **What gets ported**, from the 2026-11-23 inventory:
   - about 67 screens: Showroom 25, Roster 14, Cortex 11, Impex 10, Keen 3, Polycart 3, PennantPlus 1
   - 11 widgets, 3 settings panels, 6 search sources, and the Impex active-runs badge
   - the public Roster invitation page
4. **Cross-package hooks move to Atrium config**, with the old defaults:
   - `atrium.integrations.cortex.redirect_domains.screens` (tab on `roster.organization`, section on `roster.user`)
   - `atrium.integrations.impex.run_link.screens` (`showroom.transfers`, `row.actions`)
   - `atrium.integrations.keen.history.*` (section on every screen, tab on `roster.organization`, per-package nav)
5. **Per-integration feature flags** are resolved through Laravel Pennant when it is installed; otherwise every flag is on. This replaces each package's `<Pkg>SupportFeature` and PennantPlus's Atrium resolver.
6. **Atrium's own API client:** Atrium exports its OpenAPI with Scramble, commits `openapi.json`, and generates the layer's client from it. The layer's hand-written API types give way to the generated ones, and the contract fixtures (D-007) are kept.

### Decisions (user, 2026-11-23)

- **Atrium knows the suite packages.** The no-cross-package rule now has one exception: Atrium. Packages still know nothing of Atrium or of each other.
- **Detection:** Composer `InstalledVersions` plus the `atrium.integrations.{package}.enabled` switch.
- **Data path:** Vue calls the package API through generated clients. Every package, Atrium included, generates its own client.
- **OpenAPI from `dedoc/scramble`.** The client is `openapi-typescript` + `openapi-fetch`. Each repo commits `openapi.json` and `client/`, and the layer pins the clients as git dependencies.
- **Missing data becomes package API** (stats, search, settings summary, and the specific gaps). That is each package's spec, not this one.
- **Cross-package hooks go to Atrium config, with Pennant-resolved feature flags.**
- **Folded into this v2 spec.** Order: Keystone, then the seven package specs, then these integration groups. Atrium v2.0.0 is tagged last.

### Context

- **Package specs:** `{Package}/docs/agent/specs/2026-11-23-0943-{package}-v2-api-and-mcp-only`, all waiting for `Keystone/docs/agent/specs/2026-11-23-0943-drop-the-atrium-plugin-hook`.
- **Open for write-spec:**
  - how the layer reaches several API bases (one per package) with one auth adapter
  - the build-time behavior when a package isn't installed (the client is still a dependency, and the UI stays hidden)
  - how screens map to Nuxt routes (`/{package}/...`)
  - whether integrations are split into one task group per package
