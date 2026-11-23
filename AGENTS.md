# Atrium

This repository is a Laravel package. Keep the package focused, idiomatic, and easy for Laravel developers to install, test, and maintain.

## Package Conventions

- Use Laravel-native package APIs and the existing service provider shape before adding abstractions.
- Keep package names, namespaces, Composer metadata, publish tags, documentation, and examples aligned with `refactor-circus/atrium`.
- Add only the files and dependencies needed for the package behavior being implemented.
- Prefer explicit Laravel package code over helper abstractions unless the extension point is real.
- Keep tests focused on observable package behavior through public APIs, service provider wiring, commands, routes, published resources, and documentation promises.

## Architecture Conventions

These are recorded in full in the global standards and under `docs/agent/standards/`; the short form:

- **Code lives in domain modules.** `src/Domains/{Domain}/` (`Access`, `Dashboard`, `Integrations`, `Navigation`, `Plugins`, `Screens`, `Search`, `Settings`, `Themes`, `Widgets`), namespace `RefactorCircus\Atrium\Domains\{Domain}`, each with a `{Domain}ServiceProvider` registered by `Domains\DomainServiceProvider`. Models are `{Entity}Model` in `Models/`; value objects in `Data/`; registries in `Services/`. Package-wide base classes, contracts and `Support/` stay at the top level. A moved model keeps its old class name as a morph alias. See `architecture/domain-modules` (global standard) and `docs/agent/standards/atrium/domains.md`.
- **Actions own mutating logic.** Extend `RefactorCircus\Keystone\Actions\Action`, implement a `protected handle()` with a concrete return type, and let callers use `execute()`. Action input is a `final readonly` `{Action}Data` in the domain's `Data/` (on `RefactorCircus\Keystone\Data\Data`), never an array: fields are promoted constructor properties (camelCase of the input keys; `T|Missing = new Missing` for partial updates), `rules()` lives on the Data, and the starting event carries it. Requests' `rules()` return `XData::rules()` and `persist()` builds with `XData::fromValidated($this->validated())` - never `XData::from()` in a request; untrusted input elsewhere uses `XData::from()`, which validates, and code that vouches for its values uses `new XData(...)`. Nested input is nested Data (`#[ListOf(WidgetPlacementData::class)]`), checked by the parent's rules under its key (`widgets.*.widget_key`). `tests/ArchTest.php` checks this with Keystone's `Testing\Arch`, along with the event pair on every action, writes only inside a transaction, and a `{Entity}{Hook}Event` for every model hook. `handle()` dispatches a starting `{Subject}{Verb-ing}ActionEvent` with the input, runs the work in a private `perform()` wrapped in `DB::transaction()`, then dispatches the finished `{Subject}{Verb-ed}ActionEvent` with the result.
- **Requests own validation, authorization, and the call into an action.** Extend `RefactorCircus\Atrium\Http\Requests\Request` and implement `persist()`. Controllers only `return $request->persist();` and never contain database calls.
- **Events are final classes using `Dispatchable` and `SerializesModels`.** Action events live in the domain's `Events/` and implement `RefactorCircus\Keystone\Contracts\ActionStartingEvent` or `ActionFinishedEvent` (after commit); every action has one of each. Model events live beside them, are named `{Entity}{Hook}Event`, implement `RefactorCircus\Keystone\Contracts\ModelLifecycleEvent`, and are mapped by the `RefactorCircus\Keystone\Models\Concerns\DispatchesModelEvents` trait every model uses.
- **Shared runtime lives in `refactor-circus/keystone`.** The `Action` and `Request` bases, event contracts, `DispatchesModelEvents`, the package registry and the audit seams come from Keystone, which every package in the suite requires. Atrium registers itself as the `atrium` package from `AtriumServiceProvider::definition()`.
- **Tables are configurable.** Models resolve their table with `getTable()` from `Support\Tables` (`atrium.tables`, on Keystone's `Database\Tables`), and the migrations use the same keys, never literal `atrium_*` names. `tests/ArchTest.php` checks with `Arch::literalTableNames()`, and that every model has a policy in `atrium.policies` with `Arch::modelsWithoutPolicies()`; `tests/Modes/RenamedTables` reruns dashboard flows with every table renamed.
- **Requests authorize through policies.** `authorize()` calls `$this->allows()` / `allowsEach()`: `viewAny`/`create` on the model class, `view`/`update`/`delete` on the instance. Every model has a policy; policies extend `Domains\Dashboard\Policies\Policy`, are registered from `atrium.policies` by `registerPolicies()`, and child-model policies defer to the dashboard through the Gate with Keystone's `Policy::allowsOn()`.
- **Atrium is a JSON API.** Each domain loads its own `routes.php` with `loadApiRoutesFrom()` into the one group from `atrium.routes.*` (prefix `atrium/api`, middleware `['api', Authorize::class]`, names `atrium.*`); plugin routes sit in it under `plugins/{key}`, named `atrium.plugins.{key}.*`. Nothing in `src/` renders HTML: `tests/ArchTest.php` fails on `view(`, `Illuminate\View` or `Blade::`. Atrium ships no authentication; the host's guard goes before `Authorize`, which stays last. Every payload is a `final` resource on Keystone's `JsonResource`: beside its model in `Domains/{Domain}/Resources/`, or in `Domains/{Domain}/Http/Resources/` with no model behind it; abilities go in `meta.abilities`. Bind by `{dashboard:slug}` and `{widget:uuid}`.
- **Screens declare themselves.** Every Atrium endpoint that serves a screen builds `Domains\Screens\Data\Screen::standard()` with its key, record and kind, resolves it with `ScreenExtensions::resolve()` after its own authorization, and sends it with `ResolvedScreenResource` beside its payload (Settings declares `atrium.settings` and `atrium.settings-panel`). Other packages add tabs and sections through `Atrium::screens()` from `boot()`. Atrium requires only Keystone and has no audit concept of its own.
- **Atrium hosts the suite's front ends** (Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster, Showroom), whose v2 ship only a JSON API and MCP. Roles and permissions live in Guardian, not Roster: the `guardian.roles`, `guardian.role`, `guardian.permissions` and `guardian.role-assignments` screens replace Roster's, and the `guardian.access` hook puts role assignments on Roster's organization and user screens. The framework is `src/Domains/Integrations/` (`IntegrationRegistry`, the `InstalledPackages` seam, `IntegrationFeatures`, `ScreenDeclaration`, `atrium.screens.show`); each package's `{Pkg}Integration` and `{Pkg}Feature` sit in `src/Integrations/{Pkg}/`, the cross-package hooks in `src/Integrations/Hooks/`. An integration declares data only (nav, widgets, a settings panel, search source descriptors, screens with their Nuxt paths), sends static `data`, and never loads a package class: `tests/ArchTest.php` and `NoPackageCodeTest` fail on any `RefactorCircus\{Cortex,Guardian,Impex,Keen,PennantPlus,Polycart,Roster,Showroom}` in `src/`. It registers when the package is installed, `atrium.integrations.{pkg}.enabled` is true and it has an API base; it is active per user while its `features` resolve through Pennant (all on without it). See the local standard `atrium/integrations` (`docs/agent/standards/atrium/integrations.md`).
- Do not require a feature-flag package such as Pennant; gating is the host application's concern. Pennant is a dev dependency only, for `Domains\Themes\Features\ThemeSwitcherFeature`, which only Pennant resolves, and for the integration flag tests; `IntegrationFeatures` asks Pennant only when it is available, behind a seam. Feature-flag management is `refactor-circus/pennantplus`'s API, rendered by the PennantPlus integration's `/pennantplus/features` page.

## PHP Conventions

- The package targets PHP 8.5. Use its syntax where it earns its place.
- Value objects (`NavItem`, `WidgetDefinition`, `SettingsPanel`, `SearchSource`, `SearchResult`, `Theme`) expose state as `public private(set)` properties rather than getter methods, so they read as `$item->label` and stay immutable from the outside. Configure them through the fluent setters, which share the property's name.
- Closures and other internals stay `private`; only meaningful state is publicly readable.

## Frontend Conventions

- **The front end is the Nuxt layer in `nuxt/layer`** (`@refactor-circus/atrium-nuxt`): Nuxt 4, `ssr: false`, Nuxt UI 4, Pinia, VueUse and `@nuxtjs/i18n`, in a pnpm workspace (`nuxt/`) with `nuxt/playground`. Hosts extend it by git (`github:refactor-circus/atrium/nuxt/layer#<tag or SHA>`), so the layer has no `workspace:` dependency and imports nothing outside `nuxt/layer`. Node and pnpm are pinned in `.nvmrc` and `nuxt/package.json`, and `nuxt/pnpm-lock.yaml` is committed.
- **PHP sends data, Vue renders it.** Widgets, screen tabs and sections and settings panels are sent as `{key, component, data}`; `component` defaults to the definition key. The layer renders the component registered under it with `$atrium.widget(key, component)`, `$atrium.extension(key, component)` or `$atrium.settingsPanel(key, component)`, and a fallback card for an unregistered key. Resolver output goes through `Support\JsonData` (JSON-serializable only; failures isolated to `data: null` plus `error` outside `local` and `testing`). Links are `{path, external}` from `Support\ClientPath` against `atrium.client_path`.
- Icons are Iconify names (`i-lucide-home`), checked by `Support\Iconify` in every `icon()` setter. The layer bundles `lucide` locally and never calls the Iconify API unless the host opts in.
- Styling uses Nuxt UI and the design tokens in `nuxt/layer/app/assets/css/atrium.css`. Themes (`Domains\Themes`) are sent in the shell as token values, light and `-dark` together, and applied on `:root`; never hard-code a colour a theme should own. `config('atrium.theme')` retunes the built-in `atrium` theme.
- The layer's own strings live in `nuxt/layer/i18n/locales` (`en` only ships); server-side labels are translated by Laravel.
- The API and the layer share one contract: PHP feature tests compare payloads with `nuxt/layer/test/fixtures/*.json` and rewrite them only with `UPDATE_FIXTURES=1`; Vitest checks the fixtures against `nuxt/layer/app/types/atrium.ts`. `Atrium::API_VERSION` must match the major.minor of `nuxt/layer/package.json`.
- Test hooks use `data-testid` attributes, which the Vitest suites in `nuxt/layer/test` select.
- **Suite integrations in the layer** live in `nuxt/layer/app/integrations/{pkg}/` (`index.ts` with registrations, the `screens` map and the `// Not ported (D-032)` list; `components/`; the vendored `client/`) and `nuxt/layer/app/pages/{pkg}/`. Vue calls each package's API only through `useAtriumIntegration(pkg).client` (`openapi-fetch`, typed by the vendored `schema.d.ts`, signed by the one auth adapter) and `atrium.screens.show`. Refresh the vendored clients with `pnpm -C nuxt sync:clients` (`ATRIUM_SUITE_PATH`), never by hand; `VendoredClientsTest` checks them. Atrium's own `openapi.json` comes from `composer openapi:export` and `app/client/schema.d.ts` from `pnpm -C nuxt generate:client`; `OpenApiTest` fails when either is stale.
- **Response handlers and shell-less pages.** `$atrium.responseHandler(key, handler)` sees every response of every integration client, `useAtriumClient()` and `useAtriumApi()`, in registration order, before the caller; Guardian's (`guardian.two-factor`) sends a 403 `two_factor_challenge_required` / `two_factor_enrollment_required` to `/guardian/two-factor/challenge` or `/setup`, and `$atrium.notify()` shows its deadline notice. Pages that must work without a shell (`/roster/invitations/:token`, the two Guardian two-factor pages) declare `definePageMeta({ atrium: { public: true } })` with the public layout, build their own client and never call `atrium.screens.show`.
- **The layer owns every shared component and style.** Suite packages ship no stylesheet or design tokens of their own; their Vue components build on Nuxt UI and the layer's `Atrium*` components. When a package needs new generic UI, add an `Atrium*` component to the layer. See `docs/agent/standards/atrium/components.md`.

## Quick Commands

- Full validation (PHP): `composer test`
- Nuxt layer gate: `composer test:nuxt` (frozen pnpm install, typecheck, build, Vitest, consumer build). Work is done only when it passes too, whenever anything under `nuxt/` or the API's payloads changed.
- Formatting check: `composer lint:check`
- Static analysis: `composer analyse`
- Pest tests: `composer test:unit`
- Contract fixtures: `UPDATE_FIXTURES=1 vendor/bin/pest`
- Vendored package clients: `pnpm -C nuxt sync:clients`
- Atrium's OpenAPI and layer client: `composer openapi:export`, then `pnpm -C nuxt generate:client`
- Workbench build: `composer build`
- Workbench server (the API): `composer serve`; the playground: `pnpm -C nuxt dev`

## Local Skills

- `package-scaffold`: use when adding package capabilities or wiring them through the service provider, including commands, migrations, routes, config, views, translations, assets, middleware, publish tags, workbench files, and console-only behavior.
- `package-testing`: use when adding or changing package tests with Pest 4/5 and Orchestra Testbench.
- `package-release`: use when preparing changelog, release notes, tags, or GitHub release workflow changes.
- `package-compatibility`: use when reviewing code, dependencies, or CI against the PHP and Laravel support matrix.
- `package-generate-skill`: use when updating the bundled Boost skill from the package implementation, README, and examples.

<!-- ring-master:start -->
## Ring Master

- Specs, product docs and local standards live in `docs/agent/`. Shared standards come from `vendor/` through `docs/agent/standards.index.yml`; read the matching standards before changing code.
- Workflow: `/ring-master-shape-spec` → `/ring-master-write-spec` → `/ring-master-create-tasks` → `/ring-master-implement` → `/ring-master-verify-spec`.
- Done means `composer test` passes. When work must break a standard, add a row to `docs/agent/standards-feedback.md`.
- Keep this checkout on `main`: other packages' jobs build against it. Never switch branches, commit or stash here; do any change that is not a factory job (which makes its own) in a worktree beside the package: `git worktree add ../<Package>--<slug> -b <branch> origin/main`, removed once it is merged.
<!-- ring-master:end -->
