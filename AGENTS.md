# Atrium

This repository is a Laravel package. Keep the package focused, idiomatic, and easy for Laravel developers to install, test, and maintain.

## Package Conventions

- Use Laravel-native package APIs and the existing service provider shape before adding abstractions.
- Keep package names, namespaces, Composer metadata, publish tags, documentation, and examples aligned with `refactor-circus/atrium`.
- Add only the files and dependencies needed for the package behavior being implemented.
- Prefer explicit Laravel package code over helper abstractions unless the extension point is real.
- Keep tests focused on observable package behavior through public APIs, service provider wiring, commands, routes, published resources, and documentation promises.

## Architecture Conventions

These are recorded in full under `agent-os/standards/`; the short form:

- **Code lives in domain modules.** `src/Domains/{Domain}/` (`Access`, `Dashboard`, `History`, `Navigation`, `Plugins`, `Search`, `Settings`, `Themes`, `Widgets`), namespace `RefactorCircus\Atrium\Domains\{Domain}`, each with a `{Domain}ServiceProvider` registered by `Domains\DomainServiceProvider`. Models are `{Entity}Model` in `Models/`; value objects in `Data/`; registries in `Services/`. Package-wide base classes, contracts and `Support/` stay at the top level. A moved model keeps its old class name as a morph alias. See `agent-os/standards/architecture/domain-modules.md`.
- **Actions own mutating logic.** Extend `RefactorCircus\Keystone\Actions\Action`, implement a `protected handle()` with a concrete return type, and let callers use `execute()`. Action input is a `final readonly` `{Action}Data` in the domain's `Data/` (on `RefactorCircus\Keystone\Data\Data`), never an array: fields are promoted constructor properties (camelCase of the input keys; `T|Missing = new Missing` for partial updates), `rules()` lives on the Data, and the starting event carries it. Requests' `rules()` return `XData::rules()` and `persist()` builds with `XData::fromValidated($this->validated())` - never `XData::from()` in a request; untrusted input elsewhere uses `XData::from()`, which validates, and code that vouches for its values uses `new XData(...)`. Nested input is nested Data (`#[ListOf(WidgetPlacementData::class)]`), checked by the parent's rules under its key (`widgets.*.widget_key`). `tests/ArchTest.php` checks this with Keystone's `Testing\Arch`, along with the event pair on every action, writes only inside a transaction, and a `{Entity}{Hook}Event` for every model hook. `handle()` dispatches a starting `{Subject}{Verb-ing}ActionEvent` with the input, runs the work in a private `perform()` wrapped in `DB::transaction()`, then dispatches the finished `{Subject}{Verb-ed}ActionEvent` with the result.
- **Requests own validation, authorization, and the call into an action.** Extend `RefactorCircus\Atrium\Http\Requests\Request` and implement `persist()`. Controllers only `return $request->persist();` and never contain database calls.
- **Events are final classes using `Dispatchable` and `SerializesModels`.** Action events live in the domain's `Events/` and implement `RefactorCircus\Keystone\Contracts\ActionStartingEvent` or `ActionFinishedEvent` (after commit); every action has one of each. Model events live beside them, are named `{Entity}{Hook}Event`, implement `RefactorCircus\Keystone\Contracts\ModelLifecycleEvent`, and are mapped by the `RefactorCircus\Keystone\Models\Concerns\DispatchesModelEvents` trait every model uses.
- **Shared runtime lives in `refactor-circus/keystone`.** The `Action` and `Request` bases, event contracts, `DispatchesModelEvents`, the package registry and the audit seams come from Keystone, which every package in the suite requires. Atrium registers itself as the `atrium` package from `AtriumServiceProvider::definition()`.
- **Tables are configurable.** Models resolve their table with `getTable()` from `Support\Tables` (`atrium.tables`, on Keystone's `Database\Tables`), and the migrations use the same keys, never literal `atrium_*` names. `tests/ArchTest.php` checks with `Arch::literalTableNames()`, and that every model has a policy in `atrium.policies` with `Arch::modelsWithoutPolicies()`; `tests/Modes/RenamedTables` reruns dashboard flows with every table renamed.
- **Requests authorize through policies.** `authorize()` calls `$this->allows()` / `allowsEach()`: `viewAny`/`create` on the model class, `view`/`update`/`delete` on the instance. Every model has a policy; policies extend `Domains\Dashboard\Policies\Policy`, are registered from `atrium.policies` by `registerPolicies()`, and child-model policies defer to the dashboard through the Gate with Keystone's `Policy::allowsOn()`.
- Do not require a feature-flag package such as Pennant; gating is the host application's concern. Pennant is a dev dependency only, for `Domains\Themes\Features\ThemeSwitcherFeature`, which only Pennant resolves. Feature-flag management lives in `refactor-circus/pennantplus`, which plugs into Atrium like any other package.

## PHP Conventions

- The package targets PHP 8.5. Use its syntax where it earns its place.
- Value objects (`NavItem`, `WidgetDefinition`, `SettingsPanel`, `SearchSource`, `SearchResult`, `Theme`) expose state as `public private(set)` properties rather than getter methods, so they read as `$item->label` and stay immutable from the outside. Configure them through the fluent setters, which share the property's name.
- Closures and other internals stay `private`; only meaningful state is publicly readable.

## Frontend Conventions

- Components use Tailwind CSS 4 utility classes in the markup, adapted from Penguin UI (MIT). There are no semantic `atrium-*` classes.
- Styling tokens are design tokens in `resources/css/atrium.css` (`--color-primary`, `--color-on-surface`, and so on). Themes (`Domains\Themes`) set those tokens at runtime, light and `-dark` together, on `:root[data-atrium-theme]`; never hard-code a colour a theme should own. `config('atrium.theme')` still retunes the built-in `atrium` theme.
- Run `npm run build:css` after changing any Blade file, and commit the compiled `public/atrium.css`. The build regenerates the `@source` list, so new views are picked up automatically.
- Test hooks use `data-testid` attributes, which the browser suite selects with `@name`.
- **Atrium owns every component and style of the first-party suite.** Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom ship no stylesheet and no component namespace; their views use `x-atrium::*` components and the utility safelist in `resources/css/atrium.css` only, checked by `RefactorCircus\Atrium\Testing\AtriumStyles`. When a package screen needs new UI, add a generic component here. `Atrium::css()`, `Atrium::stylesheet()` and custom component namespaces remain for third-party packages. See `agent-os/standards/frontend/components.md`.

## Quick Commands

- Full validation: `composer test`
- Formatting check: `composer lint:check`
- Static analysis: `composer analyse`
- Pest tests: `composer test:unit`
- Browser tests: `composer test:browser` (needs `npm install`)
- Stylesheet build: `npm run build:css`
- Workbench build: `composer build`
- Workbench server: `composer serve`

## Local Skills

- `package-scaffold`: use when adding package capabilities or wiring them through the service provider, including commands, migrations, routes, config, views, translations, assets, middleware, publish tags, workbench files, and console-only behavior.
- `package-testing`: use when adding or changing package tests with Pest 4/5 and Orchestra Testbench.
- `package-release`: use when preparing changelog, release notes, tags, or GitHub release workflow changes.
- `package-compatibility`: use when reviewing code, dependencies, or CI against the PHP and Laravel support matrix.
- `package-generate-skill`: use when updating the bundled Boost skill from the package implementation, README, and examples.
