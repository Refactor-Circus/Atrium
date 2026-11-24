---
name: atrium-development
description: >
  Configure and apply the headless Atrium dashboard package in Laravel
  applications: its JSON API and host-chosen auth, the prebuilt front end
  it serves and the front-end modules packages register with
  defineAtriumModule(), the authorization gate, dashboard policies, events,
  plugins, widgets, dashboards, screen extensions (tabs and sections added
  to any declared screen) and the suite integrations.
license: MIT
metadata:
  author: Jay Fletcher
---

# Atrium

Use this skill when a Laravel application needs to integrate the Atrium package, or when a package needs to expose itself inside an Atrium dashboard.

Atrium 2 serves a JSON API (routes named `atrium.*`) and renders it with a Vue 3 front end it ships prebuilt in the package: one Blade page, `atrium::app`, at `atrium.client_path` (default `/atrium`) loads it, so the app needs no Node and no build. Everything a package shows is data from PHP plus a Vue component its front-end **module** registers under the same key. The page is the only HTML Atrium renders.

## Primary Goal

- apply the `refactor-circus/atrium` public API in the smallest correct way

## Workflow

### 1. Inspect the Laravel app context

- confirm the app is a Laravel project with `refactor-circus/atrium` installed, and which release (`^2` is headless; `^1` and `^0.1` were Blade)
- read `config/atrium.php` if it has been published; a v1 config with `path`, `domain`, `middleware`, `alpine` or `logout_route` needs upgrading (see the package CHANGELOG's v2.0.0 upgrade guide)
- check whether a `viewAtrium` gate is already defined, and which guard the app uses (Sanctum, Passport, other)
- check whether the app sets `atrium.client.enabled` to `false` (it serves a front end of its own against the API), or already loads modules or scripts of its own (`Atrium::module()`, `Atrium::script()`, `atrium.scripts`)

### 2. Install and secure the API

```bash
php artisan atrium:install
php artisan migrate
```

The page is served at `atrium.client_path` (default `/atrium`) and the API under `atrium.routes.prefix` (default `atrium/api`). Atrium ships no authentication: by default both use the session the page is served in, behind `atrium.client.middleware` and `atrium.routes.middleware`, which default to the same stack, with `Authorize::class` last:

```php
'routes' => [
    'enabled' => true,
    'prefix' => 'atrium/api',
    'middleware' => ['web', 'auth', Authorize::class],
],

'client' => [
    'enabled' => true,
    'middleware' => ['web', 'auth', Authorize::class],
],
```

A guest gets 401 JSON from the API and is sent to the app's login route by the page; the front end sends the CSRF headers itself. Then define the gate in a service provider, or implement `RefactorCircus\Atrium\Domains\Access\Contracts\AtriumUser` (`canAccessAtrium(): bool`) on the user model:

```php
Gate::define('viewAtrium', fn ($user) => $user->is_admin);
```

While neither exists, any authenticated user gets in under `APP_ENV=local` and nobody elsewhere: warn the user never to run a shared dev or staging server with `APP_ENV=local` and no gate.

Another client of the API (a front end on another origin, a script) swaps the guard: `['api', 'auth:sanctum', Authorize::class]` (`auth:api` for Passport). Cookie auth across origins needs the host's CORS (`paths` including the prefix, `supports_credentials`) and CSRF setup (`/sanctum/csrf-cookie`, stateful domains, `statefulApi()`); token auth sends the `Authorization` header, set with `useAtrium().auth({ headers, credentials, onUnauthorized })`. The host owns token storage. The suite packages' APIs keep their own middleware: put `web` and the guard in each package's `routes.middleware` to serve it to the page.

### 3. The front end and modules

Nothing to install or build: `php artisan atrium:install` and opening `/atrium` is enough. The page loads Atrium's prebuilt app from the package and its files from the `/vendor/atrium/{owner}/{version}/{path}` route (`atrium.assets.path`): never `vendor:publish` assets, and delete a v1 `public/vendor/atrium`.

- `atrium.client_path` (default `/atrium`) is where the page is served and the base of every front-end path: nav and search links are sent as `link: {path, external}` relative to it, and unsafe URLs as `link: null`. Link a nav item to a front-end page with `->path('/billing/invoices')`.
- Keep a package's module and the Composer package on one release: the shell's `api_version` is compared with the SDK's version, and a mismatch shows a warning banner.
- A package's front end is a **module**: Vue code built with Atrium's Vite preset (`atriumModule()` from `@refactor-circus/atrium/vite`, the SDK `github:refactor-circus/atrium#v2.0.0&path:ui/sdk` as a dev dependency) into a committed `dist/atrium/`, declared in the package's `composer.json` with no Composer dependency on Atrium, and discovered by `php artisan atrium:discover` (run by `package:discover`):

```json
"extra": { "atrium": { "scripts": ["dist/atrium/atrium.js"], "styles": ["dist/atrium/atrium.css"] } }
```

- Its entry registers one component per key, its pages and the rest:

```ts
export default defineAtriumModule({
  key: 'billing',
  routes: [{ path: '/billing/invoices', name: 'billing-invoices', component: () => import('./pages/Invoices.vue') }],
  widgets: { 'billing.revenue': RevenueWidget },
  extensions: { 'acme.invoices': InvoicesTab },
  settingsPanels: { billing: BillingSettings },
  responseHandlers: {},
  messages: { en: { billing: { title: 'Billing' } } },
})
```

- An application adds its own module or files from a provider: `Atrium::module(base_path('atrium'))`, `Atrium::script('resources/js/atrium.ts')` (an entry of its Vite build, or a URL), `Atrium::style(...)`, or `atrium.scripts` / `atrium.styles`; they load after every package's. `atrium.disabled` hides a module by key; `atrium.client.enabled = false` turns the page off for an app with its own front end.

A key with no component renders a fallback card. Widget components get `data` and `settings` props, extensions `data` and `record`, settings panels `data`. `useAtriumApi()` is an ofetch client of Atrium's API signed like every Atrium request, for a module's own pages; `useAtriumClient()` is its typed twin. `useAtrium()` still exposes the registry (`.auth()`, `.widget()`, `.extension()`, `.settingsPanel()`, `.responseHandler()`, `.notify()`) for a module's `setup()`. MODULES.md in the package is the full contract.

Icons are Iconify names (`i-lucide-home`). The front end bundles `lucide` locally and never calls the Iconify API; a module adds packs with `addAtriumIcons()`, or set `atrium.icons.remote` to `true`. Atrium's strings ship in `en`, each module brings its own `messages`, and the front end switches to the shell's `locale`.

### 4. Add a plugin

A plugin is how anything appears in the dashboard. Generate one with `php artisan atrium:plugin BillingPlugin`, then extend `RefactorCircus\Atrium\Domains\Plugins\Support\Plugin` and implement only the methods needed:

- `navigation()` returns `NavItem` objects (`RefactorCircus\Atrium\Domains\Navigation\Data\NavItem`). Link them to front-end pages with `->path('/billing/invoices')` (`->url()` is a URL the host serves), give them `->icon('i-lucide-receipt')`, and gate them with `->can($ability, $arguments)`, `->feature(...$features)`, or `->authorize(fn (Request $request) => bool)`; every rule must pass, and children are filtered the same way
- `navigationGroups()` returns `NavGroup::make($name)` rules (and `->icon()`, `->sort()`) for a whole group
- `features()` lists features that must all be on for the plugin to appear at all; its routes 404 otherwise
- `routes()` registers JSON routes inside Atrium's API group, under `plugins/{key}` and named `atrium.plugins.{key}.*`: name each by its operation only (`->name('invoices.index')`)
- `widgets()` returns `WidgetDefinition` objects (`RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition`) offered in the widget picker, with a `resolve(fn (array $settings) => [...])` for their data; `->lazy()` sends the placement without data and the front end fetches it from `atrium.dashboards.widgets.show` by uuid; `->component('...')` renders with another registered key
- `settings()` returns a `SettingsPanel` (`RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel`) with a `resolve()` for its data
- `search()` returns a `SearchSource` (`RefactorCircus\Atrium\Domains\Search\Data\SearchSource`, results are `Data\SearchResult`, linked to front-end paths) for the ⌘K palette. Give it a `label()` and `description()`: sources run with `atrium.search.concurrency` (`sync` by default; `process` runs them concurrently, at most `atrium.search.concurrency_limit` at once when classification is off, and is the only driver that enforces timeouts), a `q` shorter than `atrium.search.min_length` (2) answers 422, a source that throws or exceeds its timeout (`atrium.search.timeout`, or `->timeout($seconds)`) is reported and skipped, results are capped by `atrium.search.results.per_source` and `.total`, and with `atrium.search.classification.enabled` and laravel/ai installed only the `atrium.search.classification.sources` most likely sources run
- `authorize(Request $request)` hides the whole plugin when it returns false

Every resolver must return JSON-serializable data (scalars, arrays, `JsonSerializable`, `Arrayable`, backed enums, dates); a closure, an `Htmlable` or another object throws `UnserializableDataException`. Prefer JSON resources. Outside `local` and `testing` a failing resolver is isolated (`data: null` plus `error`) and reported.

Atrium has no permission or feature-flag system of its own. `can()` asks Laravel's Gate unless the application calls `Atrium::resolvePermissionsUsing()`, and `feature()` is always on until the application calls `Atrium::resolveFeaturesUsing()` (for example with Pennant; refactor-circus/pennantplus v2 no longer registers a resolver). Guard other routes with the `atrium.feature:{features}` middleware.

Register it one of two ways. Packages declare the class in their `composer.json` under `extra.atrium.plugins` and Atrium discovers it (cached in `bootstrap/cache/atrium-plugins.php` by `atrium:discover`, which `package:discover` and `optimize` run; `optimize:clear` removes it). Applications call `Atrium::plugin(BillingPlugin::class)` in a service provider's `boot()` method.

### 5. Suite integrations

Atrium hosts the front ends of the suite packages Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and Showroom: in v2 they ship a JSON API and MCP server plus their own Atrium module (the package's `atrium/`, built into its committed `dist/atrium/` and declared under `extra.atrium`, so installing the package loads it), which renders their pages under `/{pkg}/`. Their nav, widgets, settings panels, search sources, screens, feature flags and hooks are declared by each package's integration manifest (`dist/atrium/integration.json`, named by `extra.atrium.integration`; its source `atrium/src/integration.json`), which Atrium checks against the schema `@refactor-circus/atrium/schema/integration.schema.json`. Atrium has no PHP of any package; do not look for an Atrium plugin in those packages.

- An integration registers when Atrium finds its manifest (an installed package's, after `php artisan atrium:discover`; an `Atrium::module(path)` folder's; or the app's own, `Atrium::integration(path or array)`) and `atrium.integrations.{pkg}.enabled` is true (boolean-coerced). Set it to `false` to hide an installed package. Labels are plain English through `__()`: translate them in the app's `lang/{locale}.json`.
- It needs an API base: `atrium.integrations.{pkg}.api_base`, or else the package's own `{pkg}.routes.prefix` while `{pkg}.routes.enabled` is on. Polycart and Roster ship with their API off: set `polycart.routes.enabled` / `roster.routes.enabled` to `true` and put the app's guard (`auth:sanctum`, ...) in that package's `routes.middleware`, or the integration does not register (Atrium logs a warning naming both keys).
- It is active per user while every name in `atrium.integrations.{pkg}.features` is active: with Laravel Pennant installed through `Feature::for($user)->active()`, so `Feature::for($user)->deactivate('polycart.atrium')` hides Polycart from one user (each manifest names `{pkg}.atrium`, which Atrium defines as on until the app defines it); without Pennant every flag is on.
- Cross-package hooks are declared by the package whose API they call, with defaults in its manifest; move them with `atrium.integrations.cortex.redirect_domains.screens`, `atrium.integrations.impex.run_link.screens`, `atrium.integrations.keen.history` and `atrium.integrations.guardian.screens` (and Showroom's transfers with `atrium.integrations.showroom.transfers.flow_prefix`); each registers only while both its integrations are registered. Set a whole map (`scope_types`, `screens`), not one key of it: the manifest's default is replaced as a whole.
- In a module, integration components call their package's API through `useAtriumIntegration(pkg).client`, an `openapi-fetch` client signed like every Atrium request (or `useAtriumIntegration(pkg, createXClient)` with the package's own client); a host serving a package elsewhere sets `atrium.integrations.{pkg}.api_base`. Override an integration page from the app's own module with a route of the same name and path.
- Guardian (roles, permissions, two-factor, sessions, API tokens, the security log, IP rules, SSO and SCIM) ships with its API off too: set `guardian.routes.enabled` and its `routes.middleware`. Roles and permissions are Guardian's screens (`/guardian/roles`, `/guardian/permissions`), not Roster's. Map scopes with `atrium.integrations.guardian.scope_types` (null reads `guardian.adopt.scope_types.{key}`), and place Guardian's tabs on Roster's screens with `atrium.integrations.guardian.screens`. Put `guardian.two-factor` and `guardian.session` on Atrium's and the packages' route groups; Guardian's module then sends a user who owes a second factor to `/guardian/two-factor/challenge` or `/setup`. Expose `Guardian-Two-Factor-Deadline` through CORS on split hosts; API tokens need `guardian.tokens.driver` (501 without one); passkeys need `web-auth/webauthn-lib`, HTTPS and a `guardian.two_factor.passkeys.rp_id` matching the page's host.
- React to every package response with a module's `responseHandlers` (`{ key: (response, request) => ... }`) or `useAtrium().responseHandler(key, ...)` in its `setup()`; Guardian's two-factor redirect is one.
- Integration nav items are not hidden by package permissions; the package's 403 shows a no-access state. Operator modes (`show_all`) are gone, and v1 actions without a v2 route are listed in the CHANGELOG.

### 6. Themes

The shell sends every theme with its design tokens, and the front end applies the chosen one on `:root`: the built-in `atrium`, `harbor`, `sunset`, `forest`, `midnight` and `ledger`, any under `config('atrium.themes.available')` (token => value, light and `-dark` together), and any a package registers with `Atrium::theme(Theme::make('key')->label(...)->icon('i-lucide-...')->colors([...]))`. `atrium.themes.default` picks the default; the switcher shows while the `atrium.themes.switcher_feature` feature is on (Atrium's `ThemeSwitcherFeature`; always with no feature resolver or when null). `config('atrium.theme')` retunes the built-in `atrium` theme. No Tailwind build is required in the Laravel app. Nuxt UI's defaults are compiled into Atrium's build; retune the look with theme tokens and an app stylesheet (`Atrium::style()`), not an `app.config.ts`.

### 7. Customize who may change dashboards

The gate decides who reaches Atrium at all. Each dashboard request is then checked against the policy in `config('atrium.policies')`: `create` on `DashboardModel::class` to store, `update`/`delete` on the dashboard to rename or remove it, and for a layout save `update` on the dashboard, `delete` on each placement it removes, and `create` on `DashboardWidgetModel::class` (both in `RefactorCircus\Atrium\Domains\Dashboard\Models`). Responses carry `meta.abilities` (`update`, `delete`) so the layer hides what would fail. By default the owner may do anything, everyone may view a shared dashboard, and `DashboardWidgetPolicy` defers to the dashboard. To change the rules, extend `RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardPolicy` and point `atrium.policies` at it:

```php
'policies' => [
    DashboardModel::class => App\Policies\AtriumDashboardPolicy::class,
    DashboardWidgetModel::class => DashboardWidgetPolicy::class,
],
```

### 8. React to dashboard changes

- Model events: `RefactorCircus\Atrium\Domains\Dashboard\Events\{Entity}{Hook}Event` (e.g. `DashboardCreatedEvent`, `DashboardWidgetDeletedEvent`), synchronous, with `$event->dashboard` / `$event->widget`, `model()` and `hook()`.
- Actions take Data objects, never arrays: `app(CreateDashboardAction::class)->execute(new CreateDashboardData('Operations'), $user)`; also `UpdateDashboardData` (partial, fields left out stay) and `SaveDashboardLayoutData` (`new SaveDashboardLayoutData([new WidgetPlacementData('billing.revenue', gridWidth: 6)])`), in `RefactorCircus\Atrium\Domains\Dashboard\Data`. A layout is the full layout: placements are matched by `uuid`, one without a uuid is new, and one left out is deleted (orphans are kept). `version` guards against stale saves (409); code that vouches for the state may leave it out. Use `XData::from($input)` to validate untrusted input.
- Action events: `RefactorCircus\Atrium\Domains\Dashboard\Events\*ActionEvent` pairs per action, a start event carrying the input Data (`DashboardLayoutSavingActionEvent`) and a finish event carrying the result (`DashboardLayoutSavedActionEvent`), which fires only after commit.
- Listen to a whole family through `RefactorCircus\Keystone\Contracts\ModelLifecycleEvent`, `ActionStartingEvent` or `ActionFinishedEvent`.

```php
Event::listen(DashboardCreatedActionEvent::class, fn ($event) => Log::info('Dashboard created', ['slug' => $event->dashboard->slug]));
```

In tests, fake only the events being asserted: `Event::fake([DashboardCreatedActionEvent::class])`.

## Screen extensions

Any package can add tabs and sections to any screen that declares itself, without the screen knowing the package exists. A screen declares only its key (`{package}.{screen}`), record, kind, built-in tabs and slots. Atrium's own declared screens are `atrium.settings` (a list screen, one row per settings panel) and `atrium.settings-panel`. Each extension is sent as `{key, label, component, data}` and rendered by the Vue component a module registered under its `component`, in the `extensions` of `defineAtriumModule()`.

### Register from boot() only

Register through `Atrium::screens()` (`RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions`) from a service provider's `boot()`, never during a request: the registry lasts for the process and nothing can be unregistered. Registration keeps a copy of the definition.

```php
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;

Atrium::screens()
    // A tab on one screen, opened with ?tab=acme.invoices.
    ->tab('crm.customer', TabDefinition::make('acme.invoices')
        ->label('Invoices')
        ->icon('i-lucide-banknote')
        ->permission('acme.invoices.view')
        ->resolve(fn (?Model $record, Screen $screen): array => ['invoices' => InvoiceResource::collection(Invoice::forCustomer($record)->get())]))
    // A section in one slot of one screen, rendered by another component key.
    ->section('crm.customer', 'aside', SectionDefinition::make('acme.balance')
        ->component('acme.balance-card')
        ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $request->user()?->can('view', $record) === true))
    // A row section: once per row of a list screen, the row as $record.
    ->section('crm.customers', 'row.actions', SectionDefinition::make('acme.row-balance')
        ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $record instanceof Customer))
    // A wildcard section on every screen declaring the slot: return early.
    ->section('*', 'aside', SectionDefinition::make('acme.notes')
        ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $screen->kind === Screen::DETAIL
            && $record !== null
            && $request->user()?->can('acme.notes', $record) === true));
```

In the package's module: `defineAtriumModule({ key: 'acme', extensions: { 'acme.invoices': InvoicesTab, 'acme.balance-card': BalanceCard } })`, one component per key.

- Targets: an exact key (`crm.customer`), `{package}.*` (every screen of one package) or `*` (every screen). A registration for a screen nobody declares is never sent, with no error; a section on an undeclared slot never runs its closures.
- Keys: always `vendor.key` (`acme.invoices`), matching `^[a-z0-9][a-z0-9._-]*$`. A registered tab may not reuse a built-in tab key (`overview` included); it is skipped and reported.
- Rendering: `component()` defaults to the extension key; the Vue component gets the resolver's data as `data` and the screen's record as `record`.
- Visibility is default-deny: `permission()` (asked through the screen's `access` closure; a screen without one hides it), `authorize()`, both when both are set, or `public()`. A throwing `authorize()` is a denial, reported once per request.

### Closures and evaluation order

Every closure takes the `Screen` last: `authorize(fn (Request $request, ?Model $record, Screen $screen): bool)` and `resolve(fn (?Model $record, Screen $screen): array)`. `$record` is the screen's record, or the row inside a row slot. The host authorizes first and resolves the screen only then; tab visibility is checked at resolve, section visibility for each slot sent (per row in a row slot); resolvers run only for the open registered tab and each sent section; answers and data are memoized per request. Wildcard and row-slot closures run on every matching screen or row, so keep them cheap: return early on `$screen->key` or `$screen->kind`.

### Tabs, panels and failures

- `?tab={key}` opens a tab. An absent or unknown key opens the default tab (200); a registered tab the viewer cannot see answers 403. That 403-versus-200 difference reveals which keys exist, which is accepted, so never put secrets in a key. Only the open tab's data is resolved.
- The tab bar shows with two or more visible tabs. A screen without built-in tabs gets `overview`; registered tabs follow the built-ins and are never the default. Atrium translates no labels.
- `$screen->reserve('salaries')` reserves keys of built-in tabs this viewer may not open: a registered tab with one is skipped and reported, as for a built-in key; reserved keys are never sent, and `?tab=` naming one opens the default (200).
- An open registered tab's panel replaces the host's page content: `header.actions` is always sent, `before`, `after`, `aside` and row slots only on a built-in tab.
- A failing tab or section is sent with `data: null` and an `error` outside `local` and `testing` (reported, the screen still answers 200), and the front end shows an error card; in `local` and `testing` it throws (500).
- A section renders inside the host's page but writes through the registrant's own routes and authorization.

### Duplicates

- Same key twice on one target string (and slot): throws `InvalidArgumentException` in `local` and `testing`; in production and any other environment it is reported once through `report()`, the later one is skipped and the first kept.
- Same key on one screen through different targets: the more specific wins (exact, then `{package}.*`, then `*`); the rest are skipped and reported once per request.

### Declaring a screen (host side)

```php
$screen = Screen::standard('acme.invoice', Screen::DETAIL) // header.actions, before, after, aside
    ->record($invoice)
    ->tabs([['key' => 'details', 'label' => __('Details'), 'icon' => 'i-lucide-file-text']])
    ->access(fn (string $permission, Request $request, ?Model $record): bool => Gate::forUser($request->user())
        ->allows($permission, $record ? [$record] : []));

$resolved = app(ScreenExtensions::class)->resolve($screen, $request); // after the host's own authorization

return InvoiceResource::make($invoice)
    ->additional(['screen' => ResolvedScreenResource::make($resolved)->resolve($request)])
    ->response();
```

`Screen::standard($key, Screen::LIST)` gives `header.actions`, `before`, `after` and the row slot `row.actions`; add more with `slots()` / `rowSlots()`, and pass a list screen's rows with `ResolvedScreenResource::make($resolved)->withRows($rows)`. `ResolvedScreenResource` is `RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource`. In the package's Vue page, render the payload with `<AtriumScreen :screen="screen" :record="invoice">`, putting the built-in tab's content in its default slot.

### Suite rule and config defaults

Atrium requires only Keystone (`refactor-circus/keystone`) among the suite packages; every other suite package is a `suggest`, and a package's Atrium UI loads only when Atrium is installed. A package never names another package's screens in code: it ships editable defaults in its own config, applied only when the target screen exists, which the application may change or empty.

```php
// config/acme.php
'atrium' => ['screens' => ['crm.customer' => 'tab', 'crm.contact' => 'aside']],

// AcmeServiceProvider::boot()
if (class_exists(Atrium::class)) {
    foreach (config('acme.atrium.screens', []) as $target => $slot) {
        $slot === 'tab'
            ? Atrium::screens()->tab($target, $this->invoicesTab())
            : Atrium::screens()->section($target, $slot, $this->balanceSection());
    }
}
```

In tests, use `RefactorCircus\Atrium\Testing\ResetsScreenExtensions` on the test case: it snapshots the registry after boot and restores it after each test.

## Rules, References, and Templates

Read before executing:

- `config/atrium.php` for `routes` (`enabled`, `prefix`, `middleware`), `client_path`, `client` (`enabled`, `middleware`), `assets.path`, `scripts`, `styles`, `icons.remote`, `gate`, `policies`, `tables` (table names, set before migrating), `audit`, `discover`, `plugins`, `disabled`, `search`, `themes`, `theme` and `integrations`
- the package README for the API, the auth setups and the front end, and MODULES.md for the module contract
- the package CHANGELOG's v2.0.0 upgrade guide when moving an app or package off v1

## Key Behaviors

- **Widgets are offered, not placed.** Returning a `WidgetDefinition` makes a widget available in the picker. Only a user adding it puts it on a dashboard. Never tell a user a widget will appear automatically.
- **Users keep multiple dashboards.** Each belongs to one user; a dashboard can be marked shared so everyone sees it. Only the owner can modify one, unless the application swaps in its own `DashboardPolicy`. Reading never creates a dashboard; the front end creates the first.
- **Uninstalled plugins degrade gracefully.** A placement whose definition is gone is sent with `component: null` and kept by layout saves.
- **Host applications stay in control.** They choose the auth, `plugins` adds, `disabled` hides by key, and `discover: false` turns discovery off.

## Examples

- Add a "Billing" section to an existing dashboard: create a plugin with `navigation()` (front-end paths with `->path()`) and `routes()` (JSON), register it in a provider, and add the pages to the package's or the app's module (`routes` in `defineAtriumModule()`).
- Offer a revenue widget: return a `WidgetDefinition` from `widgets()` with a `resolve()` callback, register a Vue component for its key in the module's `widgets`, then tell the user to add it from the widget picker.
- Serve the API to a front end on another origin with Sanctum cookies: `['api', 'auth:sanctum', Authorize::class]` in `atrium.routes.middleware`, CORS and CSRF set up on the host, and `useAtrium().auth({ credentials: 'include' })` in that front end.

## Anti-patterns

- do not document package internals here; keep the skill focused on adoption in Laravel apps
- do not render HTML or Blade from a resolver or a plugin route; return JSON and register a Vue component
- do not place widgets on a user's dashboard programmatically as a convenience
- do not register plugin routes outside the plugin's `routes()` method, which would skip Atrium's middleware and prefix
- do not put the guard after `Authorize::class`, and do not rely on the `local` fallback instead of defining the gate
- do not copy the workbench's sign-in route (`/_workbench`) or its suite stand-in into an application, or store tokens on Atrium's behalf
- do not publish Atrium's assets or build its front end in the app; it ships prebuilt and serves its own files
- do not pass inline SVG or `prefix:name` icons; use Iconify names such as `i-lucide-home`
- do not bypass the policies by writing dashboards directly in a controller; call the actions, and check `$user->can(...)` first
- do not register screen extensions outside a provider's `boot()`, give them keys without a vendor prefix, or hard-code another package's screen keys in a package's code; read them from the package's own config
- do not require another suite package to integrate with it; suggest it and integrate through screens and config
- do not use the pre-release `Atrium\Atrium` namespace or the pre-domain class names (`RefactorCircus\Atrium\Plugins\Plugin`, `RefactorCircus\Atrium\Navigation\NavItem`, `RefactorCircus\Atrium\Models\Dashboard` and so on); every class lives in a domain module under `RefactorCircus\Atrium\Domains\{Access,Dashboard,Frontend,Integrations,Navigation,Plugins,Screens,Search,Settings,Themes,Widgets}`
