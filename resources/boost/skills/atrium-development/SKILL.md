---
name: atrium-development
description: >
  Configure and apply the Atrium dashboard package in Laravel applications,
  including the authorization gate, dashboard policies, events, plugins,
  widgets, dashboards, and the shared Blade component library.
license: MIT
metadata:
  author: Jay Fletcher
---

# Atrium

Use this skill when a Laravel application needs to integrate the Atrium package, or when a package needs to expose itself inside an Atrium dashboard.

## Primary Goal

- apply the `refactor-circus/atrium` public API in the smallest correct way

## Workflow

### 1. Inspect the Laravel app context

- confirm the app is a Laravel project with `refactor-circus/atrium` installed
- read `config/atrium.php` if it has been published
- check whether a `viewAtrium` gate is already defined

### 2. Install and open the dashboard

```bash
php artisan atrium:install
```

Atrium denies access outside the local environment until its gate is defined. Add to a service provider:

```php
Gate::define('viewAtrium', fn ($user) => $user->is_admin);
```

The dashboard serves from `config('atrium.path')`, which defaults to `/atrium`.

### 3. Add a plugin

A plugin is how anything appears in the dashboard. Generate one with `php artisan atrium:plugin BillingPlugin`, then extend `RefactorCircus\Atrium\Domains\Plugins\Support\Plugin` and implement only the methods needed:

- `navigation()` returns `NavItem` objects (`RefactorCircus\Atrium\Domains\Navigation\Data\NavItem`) for the sidebar. Gate them with `->can($ability, $arguments)`, `->feature(...$features)`, or `->authorize(fn (Request $request) => bool)`; every rule must pass, and children are filtered the same way
- `navigationGroups()` returns `NavGroup::make($name)` rules that hide a whole sidebar group
- `features()` lists features that must all be on for the plugin to appear at all; its routes 404 otherwise
- `routes()` registers routes inside Atrium's group, so the prefix, middleware, and route name prefix already apply
- `widgets()` returns `WidgetDefinition` objects (`RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition`) offered in the widget picker; `->lazy()` renders a placeholder and fetches the body after the page loads (plain Blade only: scripts and Livewire in a lazy body do not boot)
- `settings()` returns a `SettingsPanel` (`RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel`) for the settings page
- `search()` returns a `SearchSource` (`RefactorCircus\Atrium\Domains\Search\Data\SearchSource`, results are `Data\SearchResult`) for the command palette. Give it a `label()` and `description()`: sources run with `atrium.search.concurrency` (`sync` by default; `process` runs them concurrently, at most `atrium.search.concurrency_limit` at once when classification is off, and is the only driver that enforces timeouts), queries shorter than `atrium.search.min_length` (2) run nothing, a source that throws or exceeds its timeout (`atrium.search.timeout`, or `->timeout($seconds)`) is reported and skipped, results are capped by `atrium.search.results.per_source` and `.total`, and with `atrium.search.classification.enabled` and laravel/ai installed only the `atrium.search.classification.sources` most likely sources run, chosen from those labels and descriptions
- `authorize(Request $request)` hides the whole plugin when it returns false

Atrium has no permission or feature-flag system of its own. `can()` asks Laravel's Gate unless the application calls `Atrium::resolvePermissionsUsing()`, and `feature()` is always on until something calls `Atrium::resolveFeaturesUsing()` (refactor-circus/pennantplus does, with Pennant). Guard other routes with the `atrium.feature:{features}` middleware.

Register it one of two ways. Packages declare the class in their `composer.json` under `extra.atrium.plugins` and Atrium discovers it (cached in `bootstrap/cache/atrium-plugins.php` by `atrium:discover`, which `package:discover` and `optimize` run; `optimize:clear` removes it). Applications call `Atrium::plugin(BillingPlugin::class)` in a service provider's `boot()` method.

### 4. Use the component library

Screens follow one convention: actions are `<x-atrium::icon-button icon="…" :label="…" />` (icon only, labelled tooltip), statuses are `<x-atrium::status-dot variant="…" label="…" />` (`info` only for pending), navigation items get `->icon(\RefactorCircus\Atrium\Support\Icons::svg('…'))`, and controls are hidden unless their action would be allowed. Icons are Heroicons outline names; add more with `Icons::register()`. Atrium's stylesheet only has the utilities its own views use: add the rest with `Atrium::css($css, 'key')` or `Atrium::stylesheet($href)` from your provider's `boot()`.


Components are namespaced Blade components that work anywhere, in the dashboard shell or in the application's own pages, with no Livewire dependency:

`card`, `stat`, `table` (with `table.row`, `table.cell`), `button`, `icon-button`, `icon`, `status-dot`, `badge`, `alert`, `modal`, `dropdown`, `tabs`, `tab-panel`, `empty-state`, `page-header`, `section`, `form.input`, `form.select`, `form.textarea`, `form.checkbox`.

```blade
<x-atrium::card title="Revenue">
    <x-atrium::stat label="Total" value="$48,120" change="+12%" trend="up" />
</x-atrium::card>
```

Wrap a page in the shell with `<x-atrium::layout>`, which exposes `brand`, `topbar`, `topbarEnd`, `breadcrumbs`, `header`, `footer`, and `sidebarFooter` slots.

### 5. Theme without rebuilding assets

Atrium ships one compiled stylesheet whose values are all CSS custom properties. Themes set those tokens at runtime, and may choose the `top` layout (sections across a bar, pages as tabs) with `->layout('top')`: the built-in `atrium`, `harbor`, `sunset`, `forest`, `midnight` and `ledger` (top layout), any under `config('atrium.themes.available')` (token => value, light and `-dark` together), and any a package registers with `Atrium::theme(Theme::make('key')->label(...)->colors([...]))`. `atrium.themes.default` picks the default; a switcher beside the light/dark toggle lets people choose, shown while the `atrium.themes.switcher_feature` feature is on (Atrium's `ThemeSwitcherFeature`, a Pennant feature on until turned off globally or per user; always shown with no feature resolver or when null). `config('atrium.theme')` still retunes the built-in `atrium` theme. No Tailwind build is required in the host application. Dark mode is a `dark` class on `<html>`, driven by the topbar's light / dark / system switcher; the sidebar is a rail of sections (pages outside a group, then one icon per `NavItem::group()`) beside a docked panel of the current section's pages, so give `NavItem`s an `icon()` and describe groups with `NavGroup::make('Billing')->icon(...)->sort(...)` from a plugin's `navigationGroups()`.

### 6. Customize who may change dashboards

The gate decides who reaches Atrium at all. Each dashboard request is then checked against the policy in `config('atrium.policies')`: `create` on `DashboardModel::class` to store, `update`/`delete` on the dashboard to rename or remove it, and for a layout save `update` on the dashboard, `delete` on each placement it replaces, and `create` on `DashboardWidgetModel::class` (both in `RefactorCircus\Atrium\Domains\Dashboard\Models`). By default the owner may do anything, everyone may view a shared dashboard, and `DashboardWidgetPolicy` defers to the dashboard. To change the rules, extend `RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardPolicy` and point `atrium.policies` at it:

```php
'policies' => [
    DashboardModel::class => App\Policies\AtriumDashboardPolicy::class,
    DashboardWidgetModel::class => DashboardWidgetPolicy::class,
],
```

### 7. React to dashboard changes

- Model events: `RefactorCircus\Atrium\Domains\Dashboard\Events\{Entity}{Hook}Event` (e.g. `DashboardCreatedEvent`, `DashboardWidgetDeletedEvent`), synchronous, with `$event->dashboard` / `$event->widget`, `model()` and `hook()`.
- Actions take Data objects, never arrays: `app(CreateDashboardAction::class)->execute(new CreateDashboardData('Operations'), $user)`; also `UpdateDashboardData` (partial, fields left out stay) and `SaveDashboardLayoutData` (`new SaveDashboardLayoutData([new WidgetPlacementData('billing.revenue', gridWidth: 6)])`), in `RefactorCircus\Atrium\Domains\Dashboard\Data`. Use `XData::from($input)` to validate untrusted input.
- Action events: `RefactorCircus\Atrium\Domains\Dashboard\Events\*ActionEvent` pairs per action, a start event carrying the input Data (`DashboardLayoutSavingActionEvent`) and a finish event carrying the result (`DashboardLayoutSavedActionEvent`), which fires only after commit.
- Listen to a whole family through `RefactorCircus\Keystone\Contracts\ModelLifecycleEvent`, `ActionStartingEvent` or `ActionFinishedEvent`.

```php
Event::listen(DashboardCreatedActionEvent::class, fn ($event) => Log::info('Dashboard created', ['id' => $event->dashboard->id]));
```

In tests, fake only the events being asserted: `Event::fake([DashboardCreatedActionEvent::class])`.

## Rules, References, and Templates

Read before executing:

- `config/atrium.php` for `path`, `domain`, `middleware`, `gate`, `policies`, `tables` (table names, set before migrating), `discover`, `plugins`, `disabled`, `alpine`, `themes` and `theme`
- the package README for the full plugin and component reference

## Key Behaviors

- **Widgets are offered, not placed.** Returning a `WidgetDefinition` makes a widget available in the picker. Only a user adding it puts it on a dashboard. Never tell a user a widget will appear automatically.
- **Users keep multiple dashboards.** Each belongs to one user; a dashboard can be marked shared so everyone sees it. Only the owner can modify one, unless the application swaps in its own `DashboardPolicy`.
- **Uninstalled plugins degrade gracefully.** A placement whose definition is gone is skipped rather than breaking the page.
- **Host applications stay in control.** `plugins` adds, `disabled` hides by key, and `discover: false` turns discovery off.

## Examples

- Add a "Billing" section to an existing dashboard: create a plugin with `navigation()` and `routes()`, register it in a provider, done.
- Offer a revenue widget: return a `WidgetDefinition` from `widgets()` with a view and a `resolve()` callback, then tell the user to add it from the widget picker.
- Use Atrium's components on a non-dashboard page: use `<x-atrium::card>` directly; no shell or plugin is needed.

## Anti-patterns

- do not document package internals here; keep the skill focused on adoption in Laravel apps
- do not place widgets on a user's dashboard programmatically as a convenience
- do not register plugin routes outside the plugin's `routes()` method, which would skip Atrium's middleware and prefix
- do not require a Tailwind build in the host app; the shipped stylesheet is self-contained
- do not bypass the policies by writing dashboards directly in a controller; call the actions, and check `$user->can(...)` first
- do not use the pre-release `Atrium\Atrium` namespace or its `Events\Dashboard\*`, `Events\DashboardWidget\*` and `Events\Actions\*` classes
- do not use the pre-domain class names (`RefactorCircus\Atrium\Plugins\Plugin`, `RefactorCircus\Atrium\Navigation\NavItem`, `RefactorCircus\Atrium\Models\Dashboard`, `RefactorCircus\Atrium\Events\Model\*`, `RefactorCircus\Atrium\Events\Action\*` and so on); every class now lives in a domain module under `RefactorCircus\Atrium\Domains\{Access,Dashboard,Navigation,Plugins,Search,Settings,Widgets}`, with value objects in `Data\`, registries in `Services\` and models named `*Model`
