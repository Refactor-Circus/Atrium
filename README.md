<p align="center">
    <img src="art/icon.png" width="160" alt="Atrium icon">
</p>

# Atrium

[![Tests](https://github.com/refactor-circus/atrium/actions/workflows/tests.yml/badge.svg)](https://github.com/refactor-circus/atrium/actions/workflows/tests.yml)
[![Latest Version](https://img.shields.io/packagist/v/refactor-circus/atrium.svg)](https://packagist.org/packages/refactor-circus/atrium)
[![License](https://img.shields.io/packagist/l/refactor-circus/atrium.svg)](LICENSE.md)

A plug-and-play dashboard for Laravel that other packages can extend.

Atrium is headless. The Composer package serves the dashboard as a JSON API: the shell (navigation, themes, settings panels, search), the user's dashboards and their widgets, and the screens packages extend. A Nuxt 4 layer in this repository, `nuxt/layer`, renders that API as a single-page app. Packages register a plugin on the PHP side and a Vue component per key on the Nuxt side, and their navigation, pages, settings, widgets and search results appear. The host application chooses how users sign in.

Upgrading from v1? Atrium 2 removes the Blade dashboard entirely: see the v2.0.0 upgrade guide in [CHANGELOG.md](CHANGELOG.md).

## Installation

```bash
composer require refactor-circus/atrium
php artisan atrium:install
php artisan migrate
```

`atrium:install` publishes `config/atrium.php`. The API is then served under `atrium/api` (`atrium.routes.prefix`), with every route named `atrium.*`.

Atrium refuses everyone outside the `local` environment until you define its gate. Add this to a service provider:

```php
use Illuminate\Support\Facades\Gate;

Gate::define('viewAtrium', fn ($user) => $user->is_admin);
```

Atrium ships no authentication: add your application's guard before the API answers anyone (see [Authentication](#authentication)), then point the Nuxt layer at it (see [The Nuxt layer](#the-nuxt-layer)).

## Authentication

Atrium ships no authentication, OAuth server or login UI. Your application's guard signs the user in, and Atrium's `Authorize` middleware then checks the `viewAtrium` gate against that user. Add the guard to `atrium.routes.middleware`, before `Authorize::class`, which must stay last:

```php
// config/atrium.php
'routes' => [
    'enabled' => true,
    'prefix' => 'atrium/api',
    'middleware' => ['api', 'auth:sanctum', Authorize::class], // or 'auth:api' for Passport
],
```

Without a guard there is no signed-in user, and every route answers 401 JSON. A signed-in user the gate refuses gets 403. On a 401 the layer calls your auth adapter's `onUnauthorized()`, where you refresh a token or send the user to sign in.

Every route answers JSON whatever the `Accept` header, so a guest never gets a redirect to a login page.

### Cookie auth (Sanctum's SPA flow)

When the SPA is served from another origin than the API, cookie auth needs the host's CORS and CSRF setup:

- In `config/cors.php`, add the API's prefix to `paths` (`'atrium/api/*'`, beside `'sanctum/csrf-cookie'`) and set `supports_credentials` to `true`.
- List the SPA's domain in Sanctum's stateful domains (`SANCTUM_STATEFUL_DOMAINS`), make the `api` group stateful (`$middleware->statefulApi()` in `bootstrap/app.php`), and use `auth:sanctum` as the guard.
- Have the SPA call `/sanctum/csrf-cookie` before its first write, so CSRF protection passes, and send the `X-XSRF-TOKEN` header from the `XSRF-TOKEN` cookie on writes.
- Tell the layer to send cookies:

```ts
useAtrium().auth({
  credentials: 'include',
  headers: () => ({ 'X-XSRF-TOKEN': decodeURIComponent(useCookie('XSRF-TOKEN').value ?? '') }),
  onUnauthorized: () => navigateTo('/login', { external: true }),
})
```

### Token auth

With a token guard (Passport's `auth:api`, Sanctum personal access tokens, or your own), the SPA sends the token in the `Authorization` header (`Authorization: Bearer ...`) from the auth adapter. CORS `paths` must still include the prefix.

```ts
useAtrium().auth({
  headers: () => ({ Authorization: `Bearer ${yourTokenStore.token}` }),
  onUnauthorized: () => yourTokenStore.refresh(),
})
```

How the token is obtained, stored and refreshed is up to you: token storage belongs to the host, and Atrium never reads or writes it.

### The workbench token guard

The workbench (`composer serve`) signs the playground in with `Workbench\App\Http\Middleware\AuthenticateWorkbenchToken`, which accepts one fixed, public token in the `local` environment. It is a stand-in so the playground can run: never copy it into production, or into any application. It is not part of the package and not in the distributed archive.

### The `local` gate fallback

While the `viewAtrium` gate is undefined, `Authorize` lets **any authenticated user** through when the application runs in the `local` environment, and nobody anywhere else. Never run a shared dev or staging server with `APP_ENV=local` unless everyone who can sign in there may see the dashboard: define the gate instead.

## The Nuxt layer

`nuxt/layer` (`@refactor-circus/atrium-nuxt`) is a Nuxt 4 layer built with Nuxt UI 4, Pinia, VueUse and `@nuxtjs/i18n`, rendered client-side only (`ssr: false`). It provides the shell layout, navigation, ⌘K search and theme switching; the dashboard page with its grid editor and dashboard switcher; the settings pages; and screens with their tabs and sections.

### Extending the layer

The layer is distributed by git, not by a registry. Your Nuxt app extends it from the release tag of the Composer package it talks to:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['github:refactor-circus/atrium/nuxt/layer#v2.0.0'],

  runtimeConfig: {
    public: {
      // Atrium's API; override with NUXT_PUBLIC_ATRIUM_API_BASE.
      atrium: { apiBase: 'https://app.example.com/atrium/api' },
    },
  },
})
```

Nuxt fetches the layer with giget. For a private fork, set `GIGET_AUTH` to a GitHub token with read access before `nuxi dev` or `nuxi build`.

For production, pin the layer to a commit SHA rather than a tag: a `v*` tag is mutable, a SHA is not. Use the commit the `v2.0.0` tag points at:

```ts
extends: ['github:refactor-circus/atrium/nuxt/layer#<commit SHA of v2.0.0>'],
```

The release process protects `v*` tags, but a pinned SHA keeps your build reproducible regardless.

Keep the layer and the Composer package on the same release. The shell sends `api_version` (`Atrium::API_VERSION`, the release's major.minor), and the layer shows a dismissible warning, and logs one, when it differs from its own version.

### `client_path`

`atrium.client_path` (default `/`) is the base path the host serves the SPA from, and it must match it. Navigation items and search results are sent as `link: {path, external}`: a URL on your application's host (`app.url`) under `client_path` becomes a path inside the SPA, and any other http(s) URL is external (opened with `rel="noopener noreferrer"`). Serving the SPA from `/admin`? Set `'client_path' => '/admin'`. A link that is neither an http(s) URL nor a relative path is sent as `link: null`.

A nav item that links to a page of the SPA declares it with `path()` (`NavItem::make('Invoices')->path('/billing/invoices')`): the path is sent as `{path: '/billing/invoices', external: false}` whatever `client_path` is, and the layer's router puts it under the SPA's base URL. `url()` is a URL the host serves: a relative `url('/billing/invoices')` with `client_path` `/admin` is outside the SPA and sent as external. The suite integrations' nav items all use `path()`.

### Registering components

Everything a package shows is a Vue component the app registers under the key its PHP side declares: the widget, screen extension or settings panel key, unless the PHP definition names another with `->component('...')`. Register them, and your auth adapter, in a Nuxt plugin:

```ts
// plugins/atrium.ts
import RevenueWidget from '~/components/RevenueWidget.vue'
import InvoicesTab from '~/components/InvoicesTab.vue'
import BillingSettings from '~/components/BillingSettings.vue'

export default defineNuxtPlugin(() => {
  useAtrium()
    .widget('billing.revenue', RevenueWidget)
    .extension('acme.invoices', InvoicesTab)
    .settingsPanel('billing', BillingSettings)

  useAtrium().auth({ headers: () => ({ Authorization: `Bearer ${token()}` }) })
})
```

In templates and components the registry is `$atrium`: `$atrium.auth(adapter)`, `$atrium.widget(key, component)`, `$atrium.extension(key, component)` and `$atrium.settingsPanel(key, component)`.

A widget component receives `data` (what its PHP resolver returned) and `settings` props; an extension receives `data` and `record`; a settings panel receives `data`. A key with no component registered renders a fallback card naming the key, never an error.

The layer's public surface is the `$atrium` registry, the `useAtrium*` composables (`useAtriumApi`, `useAtriumDashboard`, `useAtriumTheme`, `useAtriumIcon`, `useAtriumSearch`, `useAtriumSettingsPanel`), the `Atrium*` components and the `ScreenData` and `Shell` types. `useAtriumApi()` is `$fetch` bound to the API with your auth adapter applied, for a package's own pages:

```ts
const { data } = await useAtriumApi()<{ data: Invoice[] }>('/plugins/billing/invoices')
```

### Icons

Icons are [Iconify](https://iconify.design) names such as `i-lucide-home`, on the PHP side (`->icon('i-lucide-home')`, checked when the definition is built) and in components. The layer bundles every `lucide` icon into the client (`icon.clientBundle`) and serves the collection from the app's server too (`icon.serverBundle`), with the remote Iconify API off, so it works offline, under a strict CSP and as a static SPA (`nuxt generate`, served by Laravel) with no config. An unknown icon renders a fallback, not an error.

Add another pack by installing it and listing it:

```bash
pnpm add @iconify-json/heroicons
```

```ts
// nuxt.config.ts
icon: {
  serverBundle: { collections: ['lucide', 'heroicons'] },
  // fallbackToApi: true, // opt in to fetching unknown icons from the Iconify API
},
```

A static SPA has no server to answer `/api/_nuxt_icon`, so list another pack's icons in `icon.clientBundle.icons` (`['heroicons:home', ...]`) instead.

### Locales

The layer's own strings come from locale files; v2.0.0 ships `en`. The shell sends the application's `locale` (`app()->getLocale()`), and the layer switches to it when it has messages for it. Add or override locales with your app's own `i18n.locales`. Server-side labels (navigation, widgets, panels, tabs) stay translated by Laravel.

## Writing a plugin

Generate a plugin class:

```bash
php artisan atrium:plugin BillingPlugin
```

Every method is optional. A plugin that only adds one navigation link implements one method.

```php
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

class BillingPlugin extends Plugin
{
    public function navigation(): array
    {
        return [
            NavItem::make('Invoices')
                ->path('/billing/invoices')       // a page of the SPA
                ->icon('i-lucide-receipt')
                ->group('Billing')
                ->badge(fn () => Invoice::unpaid()->count()),
        ];
    }

    public function routes(): void
    {
        // JSON routes inside Atrium's API group, under plugins/billing and
        // named atrium.plugins.billing.*, behind its middleware.
        Route::get('invoices', InvoiceController::class)->name('invoices.index');
    }

    public function widgets(): array
    {
        return [
            WidgetDefinition::make('billing.revenue')
                ->label('Revenue')
                ->description('Revenue for the current month.')
                ->icon('i-lucide-banknote')
                ->defaultSize(4, 2)
                ->resolve(fn (array $settings) => ['total' => Invoice::revenue()]),
        ];
    }
}
```

On the Nuxt side, register a component for `billing.revenue` and add the `/billing/invoices` page to your app or your package's own layer. A navigation link to a page nobody provides shows the layer's "page not found" panel.

### Shared plugin helpers

- `$this->featuresFromConfig('billing.atrium.features')` in `features()` returns the features listed under a config key that can be loaded, skipping feature classes whose package (such as refactor-circus/pennantplus) is missing.
- `RefactorCircus\Atrium\Support\ScreenAccess::allows('billing', 'refund', $invoice)` asks a package's policies exactly as its JSON API and MCP tools do, honouring its `authorization` switch. Use it to send which controls a user may use.

### Registering the plugin

Packages declare their plugin in `composer.json` and Atrium discovers it on install:

```json
{
    "extra": {
        "atrium": {
            "plugins": ["Acme\\Billing\\BillingPlugin"]
        }
    }
}
```

Applications register their own plugins in a service provider's `boot()` method:

```php
Atrium::plugin(BillingPlugin::class);
```

Host applications stay in control. Add plugin classes to `plugins` in `config/atrium.php`, list keys under `disabled` to hide a discovered plugin, or set `discover` to `false` to turn discovery off entirely.

Discovered plugins are cached in `bootstrap/cache/atrium-plugins.php`, as Laravel caches its package manifest, so a request does not read Composer's `installed.json`. `package:discover` (which Composer runs after every install and update) and `optimize` rebuild it, `atrium:discover` rebuilds it by hand, and `optimize:clear` (or `atrium:clear-discovered`) removes it. Without the file, plugins are read from the installed packages on every boot.

## Data sent to the client

Every resolver's output (widgets, tabs, sections and settings panels) is checked by `RefactorCircus\Atrium\Support\JsonData` before it is sent. Scalars, arrays, `JsonSerializable`, `Arrayable` (models and collections, through `toArray()`, so `$hidden` applies), backed enums and dates are accepted. A closure, an `Htmlable` or any other object throws `UnserializableDataException`, as do cyclic structures and nesting beyond the depth limit. Prefer returning JSON resources, so you choose exactly which fields leave the server.

When a resolver throws or returns something unserializable outside the `local` and `testing` environments, only that widget, tab, section or panel fails: it is sent with `data: null` and `error: {message}`, the exception is reported, and the layer renders an error card in its place. In `local` and `testing` the exception propagates (500), so you see it.

## Screen extensions

Any package can add tabs and sections to any screen that declares itself, without the screen knowing the package exists. A screen declares only generic facts: its key (`{package}.{screen}`), its record, its kind, its built-in tabs and its slots. Atrium declares its own settings pages: `atrium.settings` (a list screen whose rows are the settings panels) and `atrium.settings-panel`.

Extensions are rendered on the client: each tab or section is sent as `{key, label, component, data}`, and the layer renders the Vue component registered under its `component` with `$atrium.extension()`.

### Registering tabs and sections

Register from a service provider's `boot()`, and only there. The registry lasts for the process and nothing can be unregistered, so a registration made during a request would leak into the next one. Each registration is copied, so changing your definition afterwards changes nothing.

```php
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Facades\Atrium;

public function boot(): void
{
    Atrium::screens()
        // A tab on one screen, opened with ?tab=acme.invoices.
        ->tab('crm.customer', TabDefinition::make('acme.invoices')
            ->label('Invoices')
            ->icon('i-lucide-banknote')
            ->permission('acme.invoices.view')
            ->resolve(fn (?Model $record, Screen $screen): array => [
                'invoices' => InvoiceResource::collection(Invoice::forCustomer($record)->latest()->get()),
            ]))

        // A section in one slot of one screen, rendered by another component key.
        ->section('crm.customer', 'aside', SectionDefinition::make('acme.balance')
            ->component('acme.balance-card')
            ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $request->user()?->can('view', $record) === true)
            ->resolve(fn (?Model $record, Screen $screen): array => ['balance' => Balance::of($record)]))

        // A row section: sent once per row of a list screen, with the row as $record.
        ->section('crm.customers', 'row.actions', SectionDefinition::make('acme.row-balance')
            ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $record instanceof Customer))

        // A wildcard section: every screen that declares the slot. Return early.
        ->section('*', 'aside', SectionDefinition::make('acme.notes')
            ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $screen->kind === Screen::DETAIL
                && $record !== null
                && $request->user()?->can('acme.notes', $record) === true));
}
```

```ts
// The Nuxt side: one component per key.
useAtrium()
  .extension('acme.invoices', InvoicesTab)
  .extension('acme.balance-card', BalanceCard)
  .extension('acme.row-balance', RowBalance)
  .extension('acme.notes', Notes)
```

- **Targets.** An exact screen key (`crm.customer`), every screen of one package (`{package}.*`, such as `crm.*`), or every screen (`*`). A `*` tab joins every declared screen; a `*` section joins every screen declaring its slot. A section on a slot the screen does not declare is never sent and its closures never run, and a registration for a screen no installed package declares is kept and never sent, with no error.
- **Keys.** Prefix every key with your vendor, as `vendor.key` (`acme.invoices`). Keys go into `?tab=` and URLs, and match `^[a-z0-9][a-z0-9._-]*$`. A registered tab may not reuse a built-in tab key (`overview` included): it is skipped and reported.
- **Rendering.** `component()` defaults to the extension key; set it to share one Vue component between keys. The component receives the resolver's data as its `data` prop, and the screen's record as `record`.
- **Who sees it.** Extensions are hidden by default. One shows only when its `permission()` passes the screen's `access` closure, its `authorize()` closure returns `true`, both pass when it has both, or it is `public()`. A screen without an `access` closure hides every `permission()` extension. An `authorize()` that throws counts as a denial and is reported once per request.

### Closures and evaluation order

Every closure receives the `Screen` last:

```php
->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => ...)
->resolve(fn (?Model $record, Screen $screen): array => [...])
```

`$record` is the screen's record (null on screens without one), or the row inside a row slot.

1. The host authorizes the request itself. Nothing of yours runs for a screen the viewer may not open.
2. The host resolves the screen. Each registered tab's visibility is checked, then each section's for each slot that is sent, once per row in a row slot.
3. Resolvers run only for what is sent: the open registered tab and each visible section in a sent slot. Answers and data are remembered for the request, per screen, slot, extension and record.

Wildcard and row-slot closures run on every matching screen or row, so keep them cheap: return early on `$screen->key` or `$screen->kind` before any query.

### Opening tabs

A tab opens through `?tab={key}`. An absent or unknown key opens the host's default tab with a 200. A registered tab the viewer cannot see answers 403. That 403-versus-200 difference reveals which tab keys exist, which is accepted: never put anything secret in a key. Only the open tab's data is resolved; the layer asks for another tab's with `?tab=`.

The tab bar shows only when two or more tabs are visible. A screen with no built-in tabs gets one, `overview`, holding the page. Registered tabs follow the built-in ones (exact registrations first, then wildcard ones, each in registration order) and are never the default. Built-in labels come from the host; Atrium translates nothing.

A host that leaves out a built-in tab the viewer may not open still reserves its key with `$screen->reserve('salaries')`: a registered tab using a reserved key is skipped and reported, as for a built-in key, so it shows to no one. Reserved keys are never sent, and `?tab=` naming one opens the default tab with a 200. They match the same key pattern; an invalid one throws.

### What is sent around an open registered tab

The tab's panel replaces the host's page content. `header.actions` is always sent; `before`, `after`, `aside` and row slots are sent only while a built-in tab is open.

A tab or section whose resolver fails follows the rule in [Data sent to the client](#data-sent-to-the-client): outside `local` and `testing` it is sent with `data: null` and an `error`, the rest of the screen answers 200, and the layer shows an error card.

A section renders inside the host's page, but it writes through your own routes and your own authorization: forms in it post to your plugin's routes, and your requests authorize them. The host only decided who may open the screen.

### Duplicates

- **The same key twice on one target** (the same target string, and for sections the same slot): registration throws `InvalidArgumentException` naming the key and the target in the `local` and `testing` environments. In production, and any other environment, it reports the exception once through `report()`, skips the later registration and keeps the first, rather than taking down every route and command from `boot()`.
- **The same key on one screen through different targets**: the more specific target wins: the exact key, then `{package}.*`, then `*`. Each less specific duplicate is skipped and reported once per request.

### Declaring a screen

A host declares a screen per request with `Screen::standard()`, which gives the standard slots: `header.actions`, `before` and `after`, plus `aside` on a `detail` screen or the row slot `row.actions` on a `list` screen. Add more with `slots()` and `rowSlots()`. Resolve it only after your own authorization, and send it with `ResolvedScreenResource` beside your own payload:

```php
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;

// In the request behind GET plugins/acme/invoices/{invoice}, after authorize().
public function persist(): JsonResponse
{
    $screen = Screen::standard('acme.invoice', Screen::DETAIL)
        ->record($this->invoice)
        ->tabs([
            ['key' => 'details', 'label' => __('Details'), 'icon' => 'i-lucide-file-text'],
            ['key' => 'payments', 'label' => __('Payments'), 'icon' => 'i-lucide-banknote'],
        ])
        ->access(fn (string $permission, Request $request, ?Model $record): bool => Gate::forUser($request->user())
            ->allows($permission, $record ? [$record] : []));

    $resolved = app(ScreenExtensions::class)->resolve($screen, $this);

    return InvoiceResource::make($this->invoice)
        ->additional(['screen' => ResolvedScreenResource::make($resolved)->resolve($this)])
        ->response();
}
```

The screen payload is `{key, kind, open_tab, tabs, sections, rows}`. Render it in your page with the layer's `<AtriumScreen :screen="screen" :record="invoice">`, which draws the tabs and every slot's sections and puts your own content for a built-in tab in its default slot; `<AtriumSections :screen="screen" name="row.actions">` renders one slot on its own. On a list screen, pass the rows to `ResolvedScreenResource::make($resolved)->withRows($rows)`, and each row's row-slot sections are sent under `rows`, by row key.

### Packages know nothing of each other

Atrium requires only [Keystone](https://github.com/Refactor-Circus/Keystone) among the suite's packages; every other suite package is a `suggest`, never a requirement, and a package's Atrium UI loads only when Atrium is installed. So a package's code never names another package's screens. It ships editable defaults in its own config instead, and the application changes or empties the list:

```php
// config/acme.php
'atrium' => [
    'screens' => [
        // The target screen => 'tab', or the slot to add a section to.
        'crm.customer' => 'tab',
        'crm.contact' => 'aside',
    ],
],
```

```php
// AcmeServiceProvider::boot(); Atrium is suggested, so it may be missing.
if (class_exists(Atrium::class)) {
    foreach (config('acme.atrium.screens', []) as $target => $slot) {
        $slot === 'tab'
            ? Atrium::screens()->tab($target, $this->invoicesTab())
            : Atrium::screens()->section($target, $slot, $this->balanceSection());
    }
}
```

A default takes effect only when its target screen exists: a registration for a screen nobody declares is never sent.

The suite's own packages follow the same rule from the other side: in v2 they ship no Atrium code at all, and Atrium's [Suite integrations](#suite-integrations) carry their cross-package defaults in `atrium.integrations`.

### Testing

Registrations made in a test would otherwise outlive it. Use `RefactorCircus\Atrium\Testing\ResetsScreenExtensions` on your test case: it snapshots the registry once the application has booted, keeping every provider's `boot()` registrations, and restores the snapshot after each test.

```php
uses(TestCase::class, ResetsScreenExtensions::class)->in('Feature');
```

## Suite integrations

Atrium hosts the front ends of the Refactor Circus suite: Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and Showroom. In v2 each of those packages ships only its JSON API and MCP server, with a committed `openapi.json` and a generated client. Their pages, widgets, settings panels, search sources and navigation live in Atrium: the PHP side declares them as data, and the Nuxt layer renders them and calls each package's own API from the browser, with your one auth adapter.

Atrium's PHP never loads a package's classes, models or actions, and `composer.json` still requires only PHP, Laravel and `refactor-circus/keystone`. Install the packages you want; the rest stay out of the way. Everything below is configured under `atrium.integrations` in `config/atrium.php`.

### Detection and `enabled`

An integration registers at boot when both hold:

- `refactor-circus/{pkg}` is installed (asked through Composer's `InstalledVersions`, behind the `InstalledPackages` contract), and
- `atrium.integrations.{pkg}.enabled` is true (the default). It is read as a boolean, so `"false"` from an env file turns it off.

```php
// config/atrium.php
'integrations' => [
    'polycart' => ['enabled' => env('ATRIUM_POLYCART', true)],
],
```

Set `enabled` to `false` to keep a package installed (its API and MCP server still answer) while hiding it from Atrium.

### The API base

The layer calls each package where its API is served:

- a non-empty `atrium.integrations.{pkg}.api_base` wins: a path such as `/cortex/api`, or an absolute URL for a package served from another host;
- otherwise `/` plus the package's own `{pkg}.routes.prefix`, while `{pkg}.routes.enabled` is true.

When neither applies, the integration does not register, and Atrium logs one `warning` per process naming `{pkg}.routes.enabled` and `atrium.integrations.{pkg}.api_base`.

Guardian, Polycart and Roster ship with their API off (`guardian.routes.enabled`, `polycart.routes.enabled` and `roster.routes.enabled` are `false`), so their integrations stay away until you turn the API on, behind your authentication middleware:

```php
// config/polycart.php (and config/guardian.php and config/roster.php alike)
'routes' => [
    'enabled' => true,
    'middleware' => ['api', 'auth:sanctum'],
],
```

The package APIs answer with their own authorization, so a user Atrium lets in still sees only what each package's policies allow. Cookie auth across origins needs the package prefixes in your CORS `paths` as well.

On the Nuxt side, the shell sends each integration's `api_base`. A path is resolved against the origin of `runtimeConfig.public.atrium.apiBase` when that is absolute, and against the page's origin otherwise. A host serving a package elsewhere overrides it per key with `runtimeConfig.public.atrium.integrations.{key}.apiBase`.

### Feature flags (Pennant)

An integration is active for a request only when every name in `atrium.integrations.{pkg}.features` is active. The default is one class per package, `RefactorCircus\Atrium\Integrations\{Pkg}\{Pkg}Feature`, which resolves to `true`.

- With [Laravel Pennant](https://laravel.com/docs/pennant) installed, each name resolves through `Feature::for($user)->active($name)`, so you can turn an integration off for everyone or per user:

  ```php
  use Laravel\Pennant\Feature;
  use RefactorCircus\Atrium\Integrations\Polycart\PolycartFeature;

  Feature::for($user)->deactivate(PolycartFeature::class);   // one user
  Feature::deactivateForEveryone(PolycartFeature::class);   // everyone
  ```

- Without Pennant every flag is on. An empty `features` list always shows the integration; list your own feature names to gate it on them.

An inactive integration is listed in the shell with `active: false`, and none of its navigation, widgets, settings panel or search sources is sent; `atrium.widgets.index` leaves its widgets out, and `atrium.screens.show` answers 404 for its screens. These flags are separate from plugin features, which go through `Atrium::resolveFeaturesUsing()`.

### Cross-package hooks

Some integrations add a tab or section to another's screens. Each hook registers only while both of its integrations are registered, and follows both their flags. The defaults keep v1's:

```php
'integrations' => [
    'cortex' => [
        // atrium.integrations.cortex.redirect_domains.screens: Cortex's redirect domains
        // on Roster screens, as the `cortex.mcp` tab or a `cortex.redirect-domains` section.
        'redirect_domains' => ['screens' => ['roster.organization' => 'tab', 'roster.user' => 'aside']],
    ],
    'impex' => [
        // atrium.integrations.impex.run_link.screens: the `impex.run-link` row section.
        'run_link' => ['screens' => ['showroom.transfers' => 'row.actions']],
    ],
    'keen' => [
        // atrium.integrations.keen.history: the `keen.history` section, the
        // `keen.activity` tab and the History nav item.
        'history' => [
            'screens' => ['*'],
            'slot' => 'after',
            'exclude' => ['keen.*', 'atrium.*'],
            'tabs' => ['roster.organization' => ['scope' => true]],
            'nav' => [
                'enabled' => true,
                'sort' => 90,
                'exclude' => [],
                'groups' => ['showroom' => 'showroom', 'pennantplus' => 'pennantplus'],
            ],
        ],
    ],
    'guardian' => [
        // atrium.integrations.guardian.screens: Guardian's tabs and sections on Roster's
        // screens. A plain value is a tab; a `slot => key` entry is a section.
        'screens' => [
            'roster.organization' => ['guardian.access', 'guardian.sso', 'guardian.scim'],
            'roster.user' => ['guardian.access', 'guardian.user-security', 'aside' => 'guardian.sso-identities'],
        ],
    ],
    'showroom' => [
        // atrium.integrations.showroom.transfers.flow_prefix: the Impex flows
        // Showroom's transfers screen lists, by name prefix.
        'transfers' => ['flow_prefix' => 'showroom:'],
    ],
],
```

A target is a screen key (`roster.user`), `{package}.*` or `*`, and a slot must be a valid slot name. An invalid one throws `InvalidArgumentException` in `local` and `testing`, and is reported and skipped anywhere else. `keen.history.nav.groups` values name Atrium nav groups.

### The Nuxt routes

Each integration's pages live in the layer under its key, so their paths start with `/{pkg}/` and mirror the v1 URLs without the `atrium` prefix:

| Integration | Pages |
| --- | --- |
| Cortex | `/cortex/virtual-agents`, `/cortex/concrete-agents`, `/cortex/tools`, `/cortex/servers`, `/cortex/redirect-domains`, `/cortex/run` and their detail pages |
| Guardian | `/guardian/security`, `/guardian/roles`, `/guardian/permissions`, `/guardian/role-assignments`, `/guardian/users/:user`, `/guardian/security-events`, `/guardian/lockouts`, `/guardian/ip-rules`, `/guardian/two-factor-policies`, `/guardian/password-policy`, `/guardian/sso-connections/:connection`, and the shell-less `/guardian/two-factor/challenge` and `/guardian/two-factor/setup` |
| Impex | `/impex/runs`, `/impex/flows`, `/impex/messages`, `/impex/channels`, `/impex/subscriptions` and their detail pages |
| Keen | `/keen/entries`, `/keen/entries/:entry` and `/keen/history/:package` |
| PennantPlus | `/pennantplus/features` |
| Polycart | `/polycart/carts`, `/polycart/carts/:cart` and `/polycart/types` |
| Roster | `/roster/users`, `/roster/organizations`, `/roster/impersonations`, `/roster/transfers`, their detail pages, and the public `/roster/invitations/:token` |
| Showroom | `/showroom/products`, `/showroom/product-models`, `/showroom/families`, `/showroom/attributes`, `/showroom/categories`, `/showroom/channels`, `/showroom/owners`, `/showroom/flags`, `/showroom/assets`, `/showroom/transfers` and the rest of its 27 screens |

- Every screen keeps its v1 key, so host extensions registered on `roster.organization` or `showroom.product` still attach. A page fetches its tabs and sections from `atrium.screens.show` (`GET screens/{screen}?record=&tab=`), which serves the screen's extensions without Atrium loading the record.
- On a `/{pkg}/` path whose integration is not active in the shell, the layer renders `<AtriumIntegrationUnavailable>` (not installed, disabled or flagged off) and calls nothing.
- `/roster/invitations/:token` is a public page: it loads no shell, and a 401 there never calls `onUnauthorized()` until the visitor accepts or declines.
- Override any page by defining the same path in your own app.

### Vendored clients and `sync:clients`

Until the packages' v2 tags exist, the layer vendors each package's generated types (D-020). `nuxt/layer/app/integrations/{pkg}/client/` holds:

- `openapi.json`, copied from the package;
- `schema.d.ts`, the package's generated `client/src/schema.d.ts`, verbatim;
- `openapi.sha256`, the SHA-256 of `openapi.json`.

`useAtriumIntegration(key)` returns `{ active, apiBase, client }`, where `client` is an `openapi-fetch` client typed by that `schema.d.ts` and signed by your auth adapter. Refresh the copies after a package's API changes with:

```bash
ATRIUM_SUITE_PATH=/path/to/checkouts pnpm -C nuxt sync:clients
```

`ATRIUM_SUITE_PATH` defaults to the repository's parent directory, holding one checkout per package (`Cortex`, `Impex`, ...). `tests/Feature/Integrations/VendoredClientsTest.php` (no Node) checks each stamp, and compares the copies with a sibling checkout when there is one. At release the vendored folders become pnpm git dependencies; the CHANGELOG records the step.

### Atrium's own OpenAPI document and client

Atrium's API has its own `openapi.json` at the repository root (OpenAPI 3.1, one operation per `atrium.*` route, `operationId` the route name), and the layer's `nuxt/layer/app/client/schema.d.ts` is generated from it:

```bash
composer openapi:export        # rewrite openapi.json from the routes and resources
pnpm -C nuxt generate:client   # regenerate nuxt/layer/app/client/schema.d.ts
```

`tests/Feature/OpenApiTest.php` fails when either file is stale, naming both commands. `useAtriumClient()` returns an `openapi-fetch` client for Atrium's API with the same auth adapter; `useAtriumApi()` keeps working.

### Guardian

[refactor-circus/guardian](https://github.com/Refactor-Circus/Guardian) is the suite's security package, and Atrium hosts its screens: the current user's security settings (`/guardian/security`), roles, permissions and role assignments (which moved from Roster), one user's security (`/guardian/users/:user`), the security log, lockouts, IP rules, two-factor policies, the password policy, SSO connections and SCIM tokens. All of them sit in one "Security" nav group.

**Turn its API on behind your auth.** Guardian ships with `guardian.routes.enabled` off, so the integration stays away (with one warning) until you turn it on in `config/guardian.php`, behind your authentication middleware, as above. Its API base is then `/` plus `guardian.routes.prefix` (`/guardian`). The integration registers whether or not Roster is installed; only its hooks on Roster's screens need Roster.

**Scope types.** Scoped roles, assignments and two-factor policies name a scope by the morph type Guardian stores. `atrium.integrations.guardian.scope_types` maps each scope key to it:

```php
'guardian' => [
    'scope_types' => [
        'organization' => null, // null: read guardian.adopt.scope_types.organization
        'team' => null,
    ],
],
```

A `null` value resolves to `guardian.adopt.scope_types.{key}`; a value that does not resolve to a non-empty string is dropped, and the layer offers no scope it cannot name. While `organization` does not resolve, the `guardian.access` tab is left off `roster.organization`, and Atrium logs one warning naming `atrium.integrations.guardian.scope_types`.

**Two-factor and sessions.** Guardian's `guardian.two-factor` and `guardian.session` middleware can go on Atrium's route group (`atrium.routes.middleware`, before `Authorize`) and on each package's API group. A user who still owes a second factor then gets Guardian's 403, whose JSON `code` is `two_factor_challenge_required` or `two_factor_enrollment_required`, and the layer sends them to `/guardian/two-factor/challenge` or `/guardian/two-factor/setup` with a guarded `redirect` back. Both pages are shell-less (`definePageMeta({ atrium: { public: true } })` with the public layout): they load no shell and reach Guardian through a client of their own (`runtimeConfig.public.atrium.integrations.guardian.apiBase`, a loaded shell's `api_base`, or `/guardian`). A response carrying `Guardian-Two-Factor-Deadline` shows an app-wide notice with the enrolment deadline. On split hosts, expose that header through CORS so the browser can read it:

```php
// config/cors.php
'exposed_headers' => ['Guardian-Two-Factor-Deadline'],
```

**API tokens.** The security page issues and revokes personal API tokens through Guardian's token driver, `guardian.tokens.driver` (`sanctum`, `passport` or your own `TokenDriver`). With no driver the token routes answer 501, and the page shows "API tokens are not enabled" with no form; `guardian.user` hides its tokens block. A token's plain value shows once and is never stored.

**Passkeys** need `web-auth/webauthn-lib` installed in the host (without it Guardian's passkey routes answer 501 and the layer hides the passkey controls), HTTPS, and a `guardian.two_factor.passkeys.rp_id` that matches the SPA's host: WebAuthn binds a passkey to that relying party, so a SPA on another host cannot register or use one.

**Hooks on Roster's screens.** `atrium.integrations.guardian.screens` places Guardian's tabs and sections, as Guardian v1's `guardian.atrium.screens` did (a plain value is a tab, a `slot => key` entry a section); the defaults are in the hooks block above. `guardian.access` lists and assigns roles in the organization's scope, or the user's own; `guardian.user-security` shows a user's sessions, tokens, events and the two-factor reset; `guardian.sso` and `guardian.scim` manage an organization's SSO connections and SCIM tokens, whose base URL uses `guardian.scim.prefix`; and `guardian.sso-identities` lists a user's linked identities. Each is placed only while Guardian and Roster are both registered and active.

**Response handlers.** Guardian's redirect is one use of `$atrium.responseHandler(key, (response, request) => void)`, which any plugin or integration can register: every integration client, `useAtriumClient()` and `useAtriumApi()` pass each response to every handler, in registration order, before the caller sees it. A handler gets its own copy of the response, and one that throws is logged and skipped.

```ts
export default defineNuxtPlugin(() => {
  useAtrium().responseHandler('my-app.maintenance', (response) => {
    if (response.status === 503) {
      navigateTo('/maintenance')
    }
  })
})
```

### Parity with v1

The integrations port v1's screens, with three departures, each listed in the CHANGELOG:

- **No permission-filtered navigation (D-031).** Integration nav items show to everyone the `viewAtrium` gate admits while the integration is active. A screen shows a no-access state on the package's 403, a widget a no-access card, and a search source is dropped. Use the feature flags above to hide a whole integration from someone.
- **Operator mode is gone (D-032).** `impex.atrium.show_all` and `polycart.atrium.show_all` have no v2 API, so every list shows what the package API returns for the signed-in user.
- **Actions without a v2 route are left out (D-032).** Each is named in a `// Not ported (D-032)` comment in the layer and in the CHANGELOG.

The Feature flags screen of [refactor-circus/pennantplus](https://github.com/Refactor-Circus/PennantPlus) is the PennantPlus integration's `/pennantplus/features` page.

## Widgets are offered, never placed

Returning a `WidgetDefinition` makes a widget *available* in the widget picker. It does not put it on anyone's dashboard. Only a user adding it does that.

Users keep as many dashboards as they like. Each dashboard belongs to one user, and a dashboard can be marked shared so everyone sees it. Reading never creates one: a user with no dashboard gets `{"data": null}` from `GET dashboard`, and the layer creates their first with `POST dashboards`.

Each placement has a `uuid`. A widget that is slow to resolve can be marked `->lazy()`: the dashboard is sent without its `data`, and the layer fetches it afterwards from `atrium.dashboards.widgets.show` (`GET dashboards/{dashboard:slug}/widgets/{widget:uuid}`), behind the same gate and policies. A lazy widget's failure affects only its own response.

When a plugin is uninstalled, its placements are kept and sent with `component: null` (an orphan), and the layer says the widget is unavailable. A layout save never deletes an orphan, so a plugin that is disabled for a while gets its widgets back.

A layout save (`PUT dashboards/{dashboard:slug}/layout`) sends the full layout: placements are identified by `uuid`, a placement without one is new, and a placement left out is deleted. Every dashboard has a `version` that each layout or dashboard update increments; both requests send the `version` they were made from, and a stale one gets 409 and changes nothing, so the layer reloads the dashboard and tells the user.

## Theming

Atrium ships six themes, sent in the shell with their design tokens. People pick one from the switcher; the choice is kept in their browser, and the layer applies the theme's tokens as CSS custom properties on `:root`.

| Theme | Look |
|---|---|
| **Atrium** (default) | Indigo on zinc |
| **Harbor** | Teal on slate, softer corners |
| **Sunset** | Orange on warm stone |
| **Forest** | Green on sage |
| **Midnight** | Violet on deep indigo, the roundest corners |
| **Ledger** | Monochrome, near-square corners |

The layer applies a theme's tokens to Nuxt UI: `surface` is the background of panels, menus, fields and the navigation rail (`--ui-bg`), `surface-alt` the muted and elevated backgrounds, `canvas` the deck behind the panels, `on-surface` and `on-surface-strong` the text, `outline` and `outline-strong` the borders, and `primary`, `secondary`, `info`, `success`, `warning` and `danger` Nuxt UI's colours of the same names (`danger` is `error`). Dark mode reads the `-dark` tokens. A token a theme leaves out keeps the layer's default. The layer sets each token on `:root` both as sent (`--color-primary`, for your own CSS) and as `--atrium-token-primary`, which its stylesheet reads.

The primary colour is the shell's one accent: the lit edge of the current section and page, focus rings, the glow of primary buttons. A brand theme (`primary`, the neutrals and a `radius`) is enough to make the shell the brand's.

Each theme also carries a `layout` (`sidebar` or `top`) for a layer that lays the shell out by theme; the bundled layer uses its rail and section panel for every theme.

### The look: command deck

The bundled layer is a compact, dark-first admin surface (D-077): 13px UI text, 28px controls, 34px table rows, hairline borders, uppercase micro-labels and monospaced figures for IDs, counts and times. Light mode keeps the same structure on a cool off-white. Motion is short (160ms) and off when the user asks for reduced motion.

- **Shell.** A slim rail of sections (one per navigation group, labelled on hover and focus) beside a panel listing the chosen section's pages; the top bar shows where you are, ⌘K, the API's live status and version, the theme switcher and colour mode. The panel collapses to the rail alone, whose sections then open their pages in a flyout (remembered per browser). Below `lg` the navigation opens as a drawer from the top bar.
- **⌘K is the way around.** The palette lists the pages you visited lately, every page in the navigation, the search results and the shell's actions (colour mode, each theme).
- **Fonts.** Geist and Geist Mono, bundled from `@fontsource-variable` (no font CDN). Your stylesheet overrides them with `--font-sans`, `--font-mono` and `--default-font-family`, on `:root` or `:root[data-atrium-theme="…"]`.
- **Nuxt UI defaults** come from the layer's `app.config.ts` (`ui`: control sizes, panel padding, badges, tables). Override any of them in your own `app.config.ts`.
- **Shared blocks** for packages and hosts: `<AtriumPageHeader>`, `<AtriumStat>`, `<AtriumState>` (empty, error, locked), `<AtriumErrorCard>` and `<AtriumNoAccess>`; the class `atrium-empty` for an empty list; and pages' own `<h1>`, `<h2>`, tables and native selects pick up the deck's styles inside the shell.

```php
// config/atrium.php
'themes' => [
    'default' => 'atrium',
    'switcher_feature' => \RefactorCircus\Atrium\Domains\Themes\Features\ThemeSwitcherFeature::class,
    'available' => [
        'dusk' => [
            'label' => 'Dusk',
            'swatch' => '#ea580c',
            'radius' => '0.5rem',
            'layout' => 'sidebar', // or 'top'
            'colors' => ['primary' => '#ea580c', 'primary-dark' => '#fb923c'],
        ],
    ],
],
```

Packages register themes in code:

```php
use RefactorCircus\Atrium\Domains\Themes\Data\Theme;
use RefactorCircus\Atrium\Facades\Atrium;

Atrium::theme(Theme::make('grove')->label('Grove')->swatch('#15803d')->icon('i-lucide-trees')->colors([
    'primary' => '#15803d',
    'primary-dark' => '#4ade80',
]));
```

Set the `-dark` tokens as well as the light ones, so dark mode stays readable in your theme. Tokens a theme leaves out keep the layer's defaults (in `nuxt/layer/app/assets/css/atrium.css`).

The switcher shows only when there is more than one theme and the feature named by `switcher_feature` is on, asked through Atrium's feature resolver. By default that is Atrium's `ThemeSwitcherFeature`, a Pennant feature that is on globally until you set its global value, and that every user follows until they are given their own. Once your feature resolver asks Pennant (`Atrium::resolveFeaturesUsing()`, see [Who sees what](#who-sees-what)), you turn it off globally or for particular users with Pennant, or from the PennantPlus integration's feature flags screen (`/pennantplus/features`). Atrium does not require Pennant: with no feature resolver registered every feature is on, so the switcher always shows. Set `switcher_feature` to `null` for the same, or to a feature name of your own. While the switcher is hidden, everyone sees the default theme.

### Retuning the built-in theme

`atrium.theme` overrides tokens of the built-in `atrium` theme without defining a new one; its values are sent in the shell as that theme's properties:

```php
'theme' => [
    'primary' => '#0f766e',
    'on-primary' => '#ffffff',
],
```

## Navigation

Navigation is sent in the shell as sections: pages outside any group (the app's own) first, then one section per group, such as each package's. Each item has a `label`, an `icon`, a `link` (`{path, external}`, see [`client_path`](#client_path)), a `badge` and its `children`. The layer's rail shows the loose pages together as Home first, then one entry per group; the section panel beside it lists the pages of the section holding the current page (or of the one chosen on the rail), and ⌘K lists every page.

Items join a section with `NavItem::group('Billing')`. Describe the group to give its section an icon and a place in the list; otherwise it uses its first page's icon and sorts by its first page:

```php
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;

// In a plugin
public function navigationGroups(): array
{
    return [NavGroup::make('Billing')->icon('i-lucide-banknote')->sort(30)];
}
```

Give nav items an `icon()` (an Iconify name); `icon()` throws `InvalidArgumentException` for anything else, such as inline SVG or `lucide:home`.

### Who sees what

Navigation is filtered per request. An item, a whole group, or a whole plugin can be gated by permissions, by feature flags, or by any callback, and every rule must pass:

```php
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;

class BillingPlugin extends Plugin
{
    // Hides the plugin's navigation, widgets, settings, and search, and
    // answers its routes with a 404, while any of these features is off.
    public function features(): array
    {
        return ['billing'];
    }

    // Rules for a whole group. The host application can describe the same
    // group with Atrium::navigationGroup() to override these.
    public function navigationGroups(): array
    {
        return [NavGroup::make('Billing admin')->can('billing.manage')];
    }

    public function navigation(): array
    {
        return [
            NavItem::make('Invoices')
                ->path('/billing/invoices')
                ->can('billing.invoices.view')            // a permission
                ->feature('billing-v2')                   // a feature flag
                ->authorize(fn (Request $request) => ...) // anything else
                ->children([
                    NavItem::make('Refunds')->path('/billing/refunds')->can('billing.refunds.view'),
                ]),
        ];
    }
}
```

Hidden children are removed from their parent, and a parent with no link of its own disappears once all of its children are hidden. A group disappears once it has no visible items.

Atrium has no feature-flag or permission system of its own; it asks resolvers you can replace, typically from a service provider:

```php
use RefactorCircus\Atrium\Facades\Atrium;

// Permissions default to Laravel's Gate. Replace them with any system.
Atrium::resolvePermissionsUsing(fn (string $ability, array $arguments, Request $request): bool =>
    $request->user()?->hasPermission($ability) ?? false);

// Until a resolver is registered every feature is on, so gating is opt-in.
Atrium::resolveFeaturesUsing(fn (string $feature, Request $request): bool =>
    Feature::for($request->user())->active($feature));
```

Register the resolver yourself (refactor-circus/pennantplus v2 no longer registers one; its `pennantplus.atrium.resolve_features` key is gone). Suite integrations have their own flags, which ask Pennant directly (see [Suite integrations](#suite-integrations)). Hiding a link does not protect the data behind it: plugin routes follow the plugin's `features()`, `atrium.feature:billing,billing-v2` guards any other route the same way, and permissions still belong in your routes, requests, or policies.

## Search

A plugin's `search()` returns a `SearchSource`, or a list of them, and the layer's ⌘K palette queries every source the user may see through `atrium.search` (`GET search?q=...`). Return one source per kind of thing the plugin finds: each gets its own `results.per_source`, and classification can choose between them.

```php
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;

public function search(): ?SearchSource
{
    return SearchSource::make('invoices')
        ->label('Invoices')
        ->description('Invoices by number, customer, or amount.')
        ->using(fn (string $query) => Invoice::search($query)->take(5)->get()
            ->map(fn (Invoice $invoice) => SearchResult::make($invoice->number, '/billing/invoices/'.$invoice->id)
                ->icon('i-lucide-receipt'))
            ->all());
}
```

Each result's URL is sent as `link: {path, external}` (see [`client_path`](#client_path)).

Sources run with the `Concurrency` driver in `atrium.search.concurrency`: `sync` by default, which runs them one after another inside the request and costs nothing extra for fast sources. Set it to `process` to run them concurrently, each in its own PHP process with its own timeout - worth it for slow sources, but every search then boots the framework once per source - or to null for the application's default. A source that throws is reported and skipped, so one broken plugin never empties the palette. With the `process` or `fork` driver each source runs outside the request: Atrium hands it the signed-in user and the request's root URL (so `route()` and `url()` link to the host the user is on, not `APP_URL`), but nothing else from the request.

Each source gets `atrium.search.timeout` seconds (5 by default), or its own `->timeout(10)`. A source still running then is stopped, reported, and left out, while the others' results are still returned. Only the `process` driver can stop a running source; with `sync` or `fork` the timeout is not enforced.

A source's closures are serialized into the child process, so they must be defined somewhere that process can autoload, such as a plugin class. Closures written inside a Pest test file are scoped to a test class that only exists in the test run, so set `atrium.search.concurrency` to `sync` in tests that register sources that way.

The palette asks for results once a query has `atrium.search.min_length` characters (2 by default, sent in the shell), and the endpoint answers a shorter `q` with 422 before any source runs. A newer keystroke cancels the search in flight, so a slow, stale answer never replaces a newer one.

Without classification every source runs, so `atrium.search.concurrency_limit` caps how many run at once. The rest wait their turn: with the `process` driver the next source starts the moment a running one finishes, and with other drivers sources run in batches of that size. Null runs every source at once.

`atrium.search.results.per_source` (5) caps what one source contributes and `atrium.search.results.total` (20) caps the whole response. Set either to null for no limit.

With [laravel/ai](https://github.com/laravel/ai) installed, set `atrium.search.classification.enabled` to `true` and Atrium classifies each query against the sources' labels and descriptions (with Jev, laravel/ai's default classifier), then only runs the `atrium.search.classification.sources` (3) most likely sources, most likely first. If classification fails, every source runs.

## The API

Every route sits under `atrium.routes.prefix` and `atrium.routes.middleware`, is named `atrium.*`, and answers JSON. Set `atrium.routes.enabled` to `false` to register none.

| Name | Method and path | Answers |
| --- | --- | --- |
| `atrium.shell` | `GET shell` | The app and user, navigation (each item with its `live` key or null), themes, settings panel summaries, `search` (`min_length`, `per_source` and the client-side `sources`), `integrations`, `locale` and `api_version` |
| `atrium.dashboards.default` | `GET dashboard` | The user's default dashboard, or `{"data": null}` |
| `atrium.dashboards.index` | `GET dashboards` | The dashboards the user may see |
| `atrium.dashboards.show` | `GET dashboards/{dashboard:slug}` | A dashboard with its placements, and `meta.abilities` |
| `atrium.dashboards.store` | `POST dashboards` | 201 and the new dashboard |
| `atrium.dashboards.update` | `PUT dashboards/{dashboard:slug}` | The renamed dashboard; needs `version` (409 when stale) |
| `atrium.dashboards.destroy` | `DELETE dashboards/{dashboard:slug}` | 204 |
| `atrium.dashboards.layout` | `PUT dashboards/{dashboard:slug}/layout` | The dashboard with its new layout; needs `version` (409 when stale) |
| `atrium.dashboards.widgets.show` | `GET dashboards/{dashboard:slug}/widgets/{widget:uuid}` | One placement with its data (a lazy widget's) |
| `atrium.widgets.index` | `GET widgets` | The widget catalogue for the picker |
| `atrium.search` | `GET search?q=` | Search results |
| `atrium.settings.index` | `GET settings` | Settings panel summaries and the `atrium.settings` screen |
| `atrium.settings.show` | `GET settings/{panel}` | One panel with its data and the `atrium.settings-panel` screen |
| `atrium.screens.show` | `GET screens/{screen}` | A suite integration's screen (`?record=`, `?tab=`): its key, kind, path, subject type, record, tabs and sections; 404 for an unknown, undeclared or inactive screen (see [Suite integrations](#suite-integrations)) |

Plugin routes follow, under `plugins/{key}` and named `atrium.plugins.{key}.*`.

A dashboard is `{slug, name, is_default, version, widgets}`; abilities (`update`, `delete`) are in `meta.abilities`, never in the body. Each placement is `{uuid, key, component, title, icon, lazy, grid, settings}`, plus `data` when it is not lazy.

## Events

Atrium announces everything it does, so a host application can react without patching the package. It fires two families of events, and every event uses `Dispatchable` and `SerializesModels`, so queued listeners work.

### Model events

`DashboardModel` and `DashboardWidgetModel` fire a class-based event for every Eloquent hook: `retrieved`, `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `deleting`, `deleted`, and `replicating`. They live beside the models in `RefactorCircus\Atrium\Domains\Dashboard\Events` and are named `{Entity}{Hook}Event`, such as `DashboardCreatingEvent` or `DashboardWidgetDeletedEvent`. The model is a typed property (`$event->dashboard`, `$event->widget`) and is also available as `$event->model()`, alongside `$event->hook()`.

```php
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardSavingEvent;

Event::listen(DashboardSavingEvent::class, function (DashboardSavingEvent $event) {
    $event->dashboard->name = trim($event->dashboard->name);
});
```

They fire synchronously, as Eloquent's own events do, so a `creating`, `updating`, `saving` or `deleting` listener that returns `false` stops the write. A subclass of a package model, such as your `TeamDashboard extends DashboardModel`, fires the `Dashboard*` events. The mapping comes from the `RefactorCircus\Keystone\Models\Concerns\DispatchesModelEvents` trait; entries a subclass declares on `$dispatchesEvents` win over the derived ones.

### Action events

Every action dispatches a start event before it does any work, carrying the input (the action's Data object), and a finish event once it succeeds, carrying the result:

| Action | Start event (carries) | Finish event (carries) |
| --- | --- | --- |
| `CreateDashboardAction` | `DashboardCreatingActionEvent` (`data`, `owner`) | `DashboardCreatedActionEvent` (`dashboard`) |
| `UpdateDashboardAction` | `DashboardUpdatingActionEvent` (`dashboard`, `data`) | `DashboardUpdatedActionEvent` (`dashboard`) |
| `DeleteDashboardAction` | `DashboardDeletingActionEvent` (`dashboard`) | `DashboardDeletedActionEvent` (`dashboard`) |
| `SaveDashboardLayoutAction` | `DashboardLayoutSavingActionEvent` (`dashboard`, `data`) | `DashboardLayoutSavedActionEvent` (`dashboard`, `widgetKeys`) |

```php
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavedActionEvent;

Event::listen(DashboardLayoutSavedActionEvent::class, function (DashboardLayoutSavedActionEvent $event) {
    // $event->dashboard, $event->widgetKeys
});
```

Start events fire immediately. Finish events wait for the surrounding transaction to commit (`ShouldDispatchAfterCommit`), and do not fire at all when it rolls back or the action throws.

### Listening to a whole family

Each family implements an interface from `RefactorCircus\Keystone\Contracts`, and Laravel delivers an event to listeners of the interfaces it implements:

| Interface | Receives |
| --- | --- |
| `ModelLifecycleEvent` | every model event |
| `ActionStartingEvent` | every action start |
| `ActionFinishedEvent` | every action finish |

```php
use RefactorCircus\Keystone\Contracts\ActionFinishedEvent;

Event::listen(ActionFinishedEvent::class, fn (ActionFinishedEvent $event) => Log::info(class_basename($event)));
```

Reach for action events for business side effects such as notifications and integrations. Use model events for data concerns such as auditing and derived columns. When testing, fake only the events you assert on: a bare `Event::fake()` also stops the model hook that slugs a new dashboard.

## Authorization

Access is checked in two layers:

1. **The dashboard gate.** The `Authorize` middleware checks `config('atrium.gate')` (`viewAtrium` by default) on every Atrium and plugin route, after your guard (see [Authentication](#authentication)).
2. **Model policies.** Every dashboard request is then checked against the policy registered for the model it touches, from `config('atrium.policies')`:

| Endpoint | Request | Ability |
| --- | --- | --- |
| `POST dashboards` | `StoreDashboardRequest` | `create` on `DashboardModel::class` |
| `PUT dashboards/{dashboard:slug}` | `UpdateDashboardRequest` | `update` on the dashboard |
| `DELETE dashboards/{dashboard:slug}` | `DeleteDashboardRequest` | `delete` on the dashboard |
| `PUT dashboards/{dashboard:slug}/layout` | `SaveDashboardLayoutRequest` | `update` on the dashboard, `delete` on each placement it removes, and `create` on `DashboardWidgetModel::class` when it places any |

A dashboard response's `meta.abilities` says whether the user may `update` and `delete` it, asked through the same policies, so the layer shows only the controls that would succeed.

The bundled `DashboardPolicy` lets a dashboard's owner do anything, lets everyone view a shared dashboard, and refuses everything else, including guests. `DashboardWidgetPolicy` defers to the dashboard through the Gate: reading a placement needs `view` on its dashboard, changing one needs `update`. So a replacement dashboard policy governs its widgets too.

Swap a policy by pointing the model at your own class, typically one extending the bundled policy:

```php
// config/atrium.php
'policies' => [
    DashboardModel::class => App\Policies\AtriumDashboardPolicy::class,
    DashboardWidgetModel::class => DashboardWidgetPolicy::class,
],
```

```php
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardPolicy;
use Illuminate\Database\Eloquent\Model;

class AtriumDashboardPolicy extends DashboardPolicy
{
    public function update(Model $user, DashboardModel $dashboard): bool
    {
        return parent::update($user, $dashboard) || ($dashboard->is_shared && $user->is_admin);
    }
}
```

## Extending Atrium's own behavior

Atrium's writes follow the same pattern its plugins should. Requests own validation and authorization and expose their work through `persist()`; controllers only pass through. The work itself lives in an action, which announces that it is starting, wraps the write in a transaction, and announces that it finished once the write commits.

```php
$dashboard = app(CreateDashboardAction::class)->execute(new CreateDashboardData('Operations'), $user);
```

Actions expose `execute()` and keep `handle()` protected, so there is one entry point per action. Their input is a `final readonly` Data object (`CreateDashboardData`, `UpdateDashboardData`, `SaveDashboardLayoutData`, whose `widgets` are `WidgetPlacementData`, in `RefactorCircus\Atrium\Domains\Dashboard\Data`, on refactor-circus/keystone's `Data`), never an array: build it with `new` for values your code vouches for, or with `CreateDashboardData::from($input)` to validate untrusted input against its `rules()`. Code that vouches for the dashboard's state may leave out `version`; the save is then not checked against it.

## Package layout

The code is organised into domain modules under `src/Domains/{Domain}`, namespace `RefactorCircus\Atrium\Domains\{Domain}`. Each has its own service provider, registered by `RefactorCircus\Atrium\Domains\DomainServiceProvider`, which `AtriumServiceProvider` registers in turn. Each domain loads its own `routes.php` into the one API group.

| Domain | What lives there |
| --- | --- |
| `Access` | `Services\Gatekeeper`, the `Concerns\Gated` trait, and the `Authorize`, `ForceJsonResponse` and `EnsureFeaturesAreEnabled` middleware (`Http\Middleware`) |
| `Dashboard` | `Models\DashboardModel` and `Models\DashboardWidgetModel`, their resources (`Resources\DashboardResource`, `Resources\DashboardWidgetResource`), policies, actions, events, requests and controllers, and `Services\DashboardManager` |
| `Integrations` | The suite integration framework: the `Contracts\Integration` contract and its `Support\Integration` base, `Services\IntegrationRegistry`, the `Contracts\InstalledPackages` seam, `Services\IntegrationFeatures` (Pennant or all-on), `Data\ScreenDeclaration` and the `atrium.screens.show` endpoint. Each package's definitions (`{Pkg}Integration`, `{Pkg}Feature`) sit in the top-level `src/Integrations/{Pkg}/`, and the cross-package hooks in `src/Integrations/Hooks/` |
| `Navigation` | `Data\NavItem`, `Data\NavGroup`, `Services\NavigationRegistry` and the shell endpoint (`Http\Resources\ShellResource`) |
| `Plugins` | The `Contracts\Plugin` contract, the `Support\Plugin` base class, `Services\PluginRegistry`, Composer discovery, plugin routes and the plugin commands |
| `Screens` | `Data\Screen`, `Data\TabDefinition`, `Data\SectionDefinition` and `Data\ResolvedScreen`, `Services\ScreenExtensions` (the registry behind `Atrium::screens()`), `Services\ScreenVisibility` and `Http\Resources\ResolvedScreenResource` |
| `Search` | `Data\SearchSource`, `Data\SearchResult`, `Services\SearchRegistry` and the search endpoint |
| `Settings` | `Data\SettingsPanel`, `Services\SettingsRegistry` and the settings endpoints |
| `Themes` | `Data\Theme`, `Services\ThemeRegistry` and `Features\ThemeSwitcherFeature` |
| `Widgets` | `Data\WidgetDefinition`, `Services\WidgetRegistry` and the widget catalogue endpoint |

Package-wide pieces stay at the top level: the `Atrium` class and facade, the `Http\Requests\Request` base class, `Exceptions` (`AtriumException`, `UnserializableDataException`) and `Support` (`ClientPath`, `Iconify`, `JsonData`, `Tables`, `ScreenAccess`, `ServiceProvider`). The `Action` base, the event contracts and the `DispatchesModelEvents` trait come from [refactor-circus/keystone](https://github.com/Refactor-Circus/Keystone), the shared runtime of the suite.

The models keep the class names they had before the domain move (`RefactorCircus\Atrium\Models\Dashboard`, `RefactorCircus\Atrium\Models\DashboardWidget`) as their morph aliases, so any polymorphic column or audit record that stored those names still resolves, and new records store the same values.

## Configuration

| Key | Purpose |
| --- | --- |
| `routes.enabled` | Whether Atrium registers its API routes at all. |
| `routes.prefix` | The URI prefix of every route. Defaults to `atrium/api`. |
| `routes.middleware` | The middleware of every route, plugin routes included. Defaults to `['api', Authorize::class]`; add your guard before `Authorize`, which stays last. |
| `client_path` | The base path the host serves the SPA from. Defaults to `/`. |
| `gate` | The gate ability `Authorize` checks. |
| `policies` | The policy class the Gate uses for `DashboardModel` and `DashboardWidgetModel`. |
| `tables` | The table each model is stored in (`dashboards`, `dashboard_widgets`). Rename them **before** migrating: the migrations and models read the same keys, and a published config that lists only some keeps the defaults for the rest. |
| `audit.enabled` | Whether Keen, when installed, records Atrium's own dashboard changes. |
| `discover` | Whether to discover plugins from installed packages. |
| `plugins` | Plugin classes registered manually. |
| `disabled` | Plugin keys to hide. |
| `themes` | `default`, `switcher_feature` and your own themes under `available`. |
| `theme` | Token values for the built-in `atrium` theme. |
| `search.concurrency` | The `Concurrency` driver search sources run with: `sync` (default), `process` or `fork`. Null uses the application's default. |
| `search.concurrency_limit` | The most search sources run at once when classification is not choosing them. Null for no limit. |
| `search.timeout` | Seconds a search source may run before it is stopped. Enforced by the `process` driver. |
| `search.min_length` | The fewest characters a query needs (2); a shorter one gets 422. |
| `search.results` | `per_source` and `total` result caps. Null for no limit. |
| `search.classification` | `enabled`, `sources` (how many of the most likely sources run, default 3), `provider`, and `model` for classifying search queries with laravel/ai. |
| `integrations` | One entry per suite package (`cortex`, `impex`, `keen`, `pennantplus`, `polycart`, `roster`, `showroom`): `enabled`, `api_base`, `features`, and the cross-package hook settings. See [Suite integrations](#suite-integrations). |

At boot, Atrium logs one warning per process if the v1 keys `path`, `domain`, `middleware`, `alpine` or `logout_route` are still in `config/atrium.php`.

## Commands

| Command | Purpose |
| --- | --- |
| `atrium:install` | Publish the config, and print the gate stub. |
| `atrium:plugins` | List the plugins currently registered. |
| `atrium:discover` | Cache the plugins installed packages declare (also run by `package:discover` and `optimize`). |
| `atrium:clear-discovered` | Remove that cache (also run by `optimize:clear`). |
| `atrium:plugin` | Generate a new plugin class. |

## Testing

```bash
composer test        # PHPStan, Pint, type coverage and Pest
composer test:nuxt   # the layer: frozen pnpm install, typecheck, build, Vitest and a consumer build
```

`composer test` needs no Node. `composer test:nuxt` needs the Node and pnpm versions pinned in `.nvmrc` and `nuxt/package.json`.

The PHP suite writes the API's contract fixtures (`nuxt/layer/test/fixtures/*.json`) only on request, with `UPDATE_FIXTURES=1 vendor/bin/pest`; a plain run compares them and fails on a difference, and Vitest checks each fixture against the layer's TypeScript types.

To see a working dashboard locally:

```bash
composer serve          # the API on http://127.0.0.1:8000
pnpm -C nuxt install
pnpm -C nuxt dev        # the playground on http://localhost:3000
```

Every `composer serve` reseeds the workbench with a demo shop through Atrium's own actions: a few users, the signed-in admin's default and second dashboards with widgets placed, and a dashboard shared by another user. Its demo plugin exercises every plugin surface, including permission- and feature-gated navigation, a lazy widget, a settings panel with screen extensions, and two search sources. The playground extends `../layer` and registers the demo components.

## Credits

- [Refactor Circus](https://github.com/Refactor-Circus)

The layer is built on [Nuxt UI](https://ui.nuxt.com) (MIT).

## License

The MIT License (MIT). See [License File](LICENSE.md) for more information.
