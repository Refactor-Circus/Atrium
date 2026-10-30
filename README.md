<p align="center">
    <img src="art/icon.png" width="160" alt="Atrium icon">
</p>

# Atrium

[![Tests](https://github.com/refactor-circus/atrium/actions/workflows/tests.yml/badge.svg)](https://github.com/refactor-circus/atrium/actions/workflows/tests.yml)
[![Latest Version](https://img.shields.io/packagist/v/refactor-circus/atrium.svg)](https://packagist.org/packages/refactor-circus/atrium)
[![License](https://img.shields.io/packagist/l/refactor-circus/atrium.svg)](LICENSE.md)

A plug-and-play dashboard for Laravel that other packages can extend.

Atrium gives you a dashboard shell and a shared component library. Packages register a plugin and their navigation, pages, settings, widgets, and search results appear automatically. Unlike Nova, Atrium never forces your screens through a resource abstraction or a single layout. The components are the product; the shell is scaffolding you can take or leave.

## Installation

```bash
composer require refactor-circus/atrium
php artisan atrium:install
```

Atrium denies access outside the local environment until you define its gate. Add this to a service provider:

```php
use Illuminate\Support\Facades\Gate;

Gate::define('viewAtrium', fn ($user) => $user->is_admin);
```

Then visit `/atrium`.

## Writing a plugin

Generate a plugin class:

```bash
php artisan atrium:plugin BillingPlugin
```

Every method is optional. A plugin that only adds one sidebar link implements one method.

```php
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use Illuminate\Support\Facades\Route;

class BillingPlugin extends Plugin
{
    public function navigation(): array
    {
        return [
            NavItem::make('Invoices')
                ->route('atrium.billing.invoices')
                ->group('Billing')
                ->badge(fn () => Invoice::unpaid()->count()),
        ];
    }

    public function routes(): void
    {
        // Registered inside Atrium's group, so the prefix, middleware,
        // and route name prefix already apply.
        Route::get('billing/invoices', InvoiceController::class)->name('billing.invoices');
    }

    public function widgets(): array
    {
        return [
            WidgetDefinition::make('billing.revenue')
                ->label('Revenue')
                ->description('Revenue for the current month.')
                ->defaultSize(4, 2)
                ->view('billing::widgets.revenue')
                ->resolve(fn (array $settings) => ['total' => Invoice::revenue()]),
        ];
    }
}
```

### Shared plugin helpers

- `$this->featuresFromConfig('billing.atrium.features')` in `features()` returns the features listed under a config key that can be loaded, skipping feature classes whose package (such as refactor-circus/pennantplus) is missing.
- `RefactorCircus\Atrium\Support\ScreenAccess::allows('billing', 'refund', $invoice)` asks a package's policies exactly as its JSON API and MCP tools do, honouring its `authorization` switch. Use it to hide controls.
- The `RefactorCircus\Atrium\Http\Controllers\Concerns\AuthorizesScreens` trait gives a screen controller `$this->authorizeScreen('refund', $invoice)`, which answers 403 the same way for the package the controller belongs to.

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

Discovered plugins are cached in `bootstrap/cache/atrium-plugins.php`, as Laravel caches its package manifest, so a request does not read Composer's `installed.json`. `package:discover` (which Composer runs after every install and update) and `optimize` rebuild it, `atrium:discover` rebuilds it by hand, and `optimize:clear` (or `atrium:clear-discovered`) removes it. Without the file, plugins are read from the installed packages on every boot, as before.

## Screen extensions

Any package can add tabs and sections to any screen that declares itself, without the screen knowing the package exists. A screen declares only generic facts: its key (`{package}.{screen}`), its record, its kind, its built-in tabs and its slots. Atrium declares its own pages: `atrium.dashboard` (`/`), `atrium.named-dashboard` (`d/{slug}`), `atrium.dashboard-widget`, `atrium.settings` and `atrium.settings-panel`.

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
            ->icon('banknotes')
            ->view('acme::screens.invoices')
            ->permission('acme.invoices.view')
            ->resolve(fn (?Model $record, Screen $screen): array => [
                'invoices' => Invoice::forCustomer($record)->latest()->get(),
            ]))

        // A section in one slot of one screen.
        ->section('crm.customer', 'aside', SectionDefinition::make('acme.balance')
            ->component('acme::balance')
            ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $request->user()?->can('view', $record) === true)
            ->resolve(fn (?Model $record, Screen $screen): array => ['balance' => Balance::of($record)]))

        // A row section: rendered once per row of a list screen, with the row as $record.
        ->section('crm.customers', 'row.actions', SectionDefinition::make('acme.row-balance')
            ->view('acme::screens.row-balance')
            ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $record instanceof Customer))

        // A wildcard section: every screen that declares the slot. Return early.
        ->section('*', 'aside', SectionDefinition::make('acme.notes')
            ->view('acme::screens.notes')
            ->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => $screen->kind === Screen::DETAIL
                && $record !== null
                && $request->user()?->can('acme.notes', $record) === true));
}
```

- **Targets.** An exact screen key (`crm.customer`), every screen of one package (`{package}.*`, such as `crm.*`), or every screen (`*`). A `*` tab joins every declared screen; a `*` section joins every screen declaring its slot. A section on a slot the screen does not declare never renders and its closures never run, and a registration for a screen no installed package declares is kept and never renders, with no error.
- **Keys.** Prefix every key with your vendor, as `vendor.key` (`acme.invoices`). Keys go into `?tab=`, `data-testid` and URLs, and match `^[a-z0-9][a-z0-9._-]*$`. A registered tab may not reuse a built-in tab key (`overview` included): it is skipped and reported.
- **Rendering.** Give each tab or section a `view()` or a `component()` (setting one clears the other). A view receives the resolver's data with the host's `screen` (the `Screen`), `record` and `tab` (the open tab's key) over it, so the host's values win. A component receives the resolver's data as one `data` prop.
- **Who sees it.** Extensions are hidden by default. One shows only when its `permission()` passes the screen's `access` closure, its `authorize()` closure returns `true`, both pass when it has both, or it is `public()`. A screen without an `access` closure hides every `permission()` extension. An `authorize()` that throws counts as a denial and is reported once per request.

### Closures and evaluation order

Every closure receives the `Screen` last:

```php
->authorize(fn (Request $request, ?Model $record, Screen $screen): bool => ...)
->resolve(fn (?Model $record, Screen $screen): array => [...])
```

`$record` is the screen's record (null on screens without one), or the row inside a row slot.

1. The host authorizes the request itself. Nothing of yours runs on a page the viewer may not open.
2. The host resolves the screen. Each registered tab's visibility is checked, then each section's when its slot renders, once per row in a row slot.
3. Resolvers run only for what renders: the open registered tab and each visible section in a rendered slot. Answers and data are remembered for the request, per screen, slot, extension and record.

Wildcard and row-slot closures run on every matching screen or row, so keep them cheap: return early on `$screen->key` or `$screen->kind` before any query.

### Opening tabs

A tab opens through `?tab={key}`. An absent or unknown key opens the host's default tab with a 200. A registered tab the viewer cannot see answers 403. That 403-versus-200 difference reveals which tab keys exist, which is accepted: never put anything secret in a key.

The tab bar shows only when two or more tabs are visible. A screen with no built-in tabs gets one, `overview`, holding the page. Registered tabs follow the built-in ones (exact registrations first, then wildcard ones, each in registration order) and are never the default. Built-in labels come from the host; Atrium translates nothing.

### What renders around an open registered tab

The tab's panel replaces the host's page content. `header.actions` always renders; `before`, `after`, `aside` and row slots render only while a built-in tab is open.

A section renders into a buffer: one whose resolver or view throws renders nothing, is reported once per request, and the page still answers 200. An open registered tab's panel that throws fails the page (500), as the page itself would.

The tab bar and the sections use only Atrium's design tokens and safelisted utilities, so they look the same in every theme and layout, and a theme sets nothing for them. Keep your views to the same contract and check them with `AtriumStyles` (see [Package styles](#package-styles)).

A section renders inside the host's page, but it writes through your own routes and your own authorization: forms in it post to your routes, and your requests authorize them. The host only decided who may open the page.

### Duplicates

- **The same key twice on one target** (the same target string, and for sections the same slot): registration throws `InvalidArgumentException` naming the key and the target in the `local` and `testing` environments. In production, and any other environment, it reports the exception once through `report()`, skips the later registration and keeps the first, rather than taking down every route and command from `boot()`.
- **The same key on one screen through different targets**: the more specific target wins: the exact key, then `{package}.*`, then `*`. Each less specific duplicate is skipped and reported once per request.

### Declaring a screen

A host declares a screen per request with `Screen::standard()`, which gives the standard slots: `header.actions`, `before` and `after`, plus `aside` on a `detail` screen or the row slot `row.actions` on a `list` screen. Add more with `slots()` and `rowSlots()`. Resolve it only after your own authorization:

```php
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;

public function show(Request $request, Invoice $invoice, ScreenExtensions $screens): View
{
    $this->authorizeScreen('view', $invoice);

    $screen = Screen::standard('acme.invoice', Screen::DETAIL)
        ->record($invoice)
        ->tabs([
            ['key' => 'details', 'label' => __('Details'), 'icon' => 'document-text'],
            ['key' => 'payments', 'label' => __('Payments'), 'icon' => 'banknotes'],
        ])
        ->access(fn (string $permission, Request $request, ?Model $record): bool => Gate::forUser($request->user())
            ->allows($permission, $record ? [$record] : []));

    return view('acme::invoices.show', [
        'invoice' => $invoice,
        'resolved' => $screens->resolve($screen, $request),
    ]);
}
```

```blade
<x-atrium::page-header :title="$invoice->number">
    @if ($resolved->sections('header.actions') !== [])
        <x-slot:actions>
            <x-atrium::screen-sections :screen="$resolved" slot="header.actions" />
        </x-slot:actions>
    @endif
</x-atrium::page-header>

<x-atrium::screen-tabs :screen="$resolved" />

@if ($resolved->openRegisteredTab !== null)
    <x-atrium::screen-tab-panel :screen="$resolved" />
@else
    <x-atrium::screen-sections :screen="$resolved" slot="before" />

    {{-- Your page, for the built-in tab $resolved->openTab. --}}

    <x-atrium::screen-sections :screen="$resolved" slot="aside" />
    <x-atrium::screen-sections :screen="$resolved" slot="after" />
@endif
```

On a list screen, render the row slot inside each row: `<x-atrium::screen-sections :screen="$resolved" slot="row.actions" :row="$customer" />`.

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

A default takes effect only when its target screen exists: a registration for a screen nobody declares never renders.

### Testing

Registrations made in a test would otherwise outlive it. Use `RefactorCircus\Atrium\Testing\ResetsScreenExtensions` on your test case: it snapshots the registry once the application has booted, keeping every provider's `boot()` registrations, and restores the snapshot after each test.

```php
uses(TestCase::class, ResetsScreenExtensions::class)->in('Feature');
```

## Managing Pennant feature flags

The Feature flags page moved to [refactor-circus/pennantplus](https://github.com/Refactor-Circus/PennantPlus), which registers it as an Atrium plugin when both are installed.

## Widgets are offered, never placed

Returning a `WidgetDefinition` makes a widget *available* in the widget picker. It does not put it on anyone's dashboard. Only a user adding it does that.

A widget that is slow to render can be marked `->lazy()`: the dashboard renders a placeholder in its place and fetches the widget's body afterwards from `atrium.dashboards.widgets.show` (`GET /atrium/dashboards/{dashboard}/widgets/{widget}`), which answers whoever may see the dashboard, behind the same gate. The body arrives as HTML, so Alpine in it starts but its `<script>` tags do not run and Livewire components are not booted; keep lazy widgets to plain Blade views. Widgets render with the page unless marked lazy.

Users keep as many dashboards as they like. Each dashboard belongs to one user, and a dashboard can be marked shared so everyone sees it. When a plugin is uninstalled, its placements are skipped rather than breaking the page.

## The component library

Components work anywhere in your application, inside the dashboard or outside it. They carry no Livewire dependency.

```blade
<x-atrium::card title="Revenue" subtitle="Last 30 days">
    <x-atrium::stat label="Total" value="$48,120" change="+12%" trend="up" />
</x-atrium::card>

<x-atrium::table striped>
    <x-slot:head>
        <x-atrium::table.row>
            <x-atrium::table.cell heading>Name</x-atrium::table.cell>
        </x-atrium::table.row>
    </x-slot:head>

    @foreach ($users as $user)
        <x-atrium::table.row>
            <x-atrium::table.cell>{{ $user->name }}</x-atrium::table.cell>
        </x-atrium::table.row>
    @endforeach
</x-atrium::table>
```

Available components:

**Layout and content**: `card`, `section`, `page-header`, `empty-state`, `stat`, `table` (with `table.row` and `table.cell`), `description-list` (with `description-list.item`), `pagination`, `breadcrumbs`, `guest` (a standalone page outside the shell)

**Controls**: `button`, `icon-button`, `icon`, `badge`, `status-dot`, `chip`, `kbd`, `avatar`, `toggle`, `tooltip`, `dropdown`, `modal`, `tabs`, `tab-panel`, `search-input`

**Feedback**: `alert`, `flash` (the session status and first error), `banner` (with `banner.button`), `progress`, `spinner`, `skeleton`

**Forms**: `form.input` (with `prefix` and `suffix` slots), `form.textarea`, `form.select`, `form.checkbox`, `form.radio`, `form.file`, `form.combobox`, `form.actions`. Pass `bare` to an input, textarea, select or checkbox for the control alone, such as in a table cell.

**Screens**: `screen-tabs`, `screen-sections` and `screen-tab-panel`, which render a declared screen's extensions (see [Screen extensions](#screen-extensions))

### Screen conventions

Packages built on Atrium share one look, so a dashboard reads the same whichever package a screen comes from:

- **Actions are icon buttons.** `<x-atrium::icon-button icon="trash" :label="__('Delete')" variant="danger" type="submit" />` shows only the icon; the label is its accessible name and its tooltip. Tabs and back links too.
- **Statuses are dots.** `<x-atrium::status-dot variant="success" label="Active" />`, the label on hover. `info` is kept for **pending** (waiting on someone's decision); `success` done or active, `warning` held, `danger` failed or revoked, `primary` in progress, `neutral` over.
- **Navigation items have icons**: `NavItem::make('Users')->icon(Icons::svg('users'))`.
- **Only what the viewer may use is shown**: gate navigation with `can()`, `feature()` or `authorize()`, and hide each control unless its action would be allowed - asked exactly as the action asks.

Icons are the [Heroicons](https://heroicons.com) outline set (MIT), by name, through `RefactorCircus\Atrium\Support\Icons::svg('users')` or `<x-atrium::icon name="users" />`. Register your own with `Icons::register('my-icon', $svg)`.

Tooltips are drawn on `<body>`, so tables and scrolling containers never clip them.

### Package styles

Atrium ships one precompiled stylesheet built from its own views plus a safelist of layout utilities (grid columns, gaps, spacing, widths, text sizes and so on; see `resources/css/atrium.css`). The packages of the Refactor Circus suite ship no stylesheet or components of their own: their screens use Atrium's components and those utilities only, and each checks it with `RefactorCircus\Atrium\Testing\AtriumStyles`:

```php
use RefactorCircus\Atrium\Testing\AtriumStyles;

it('uses only atrium styles', function (): void {
    $views = dirname(__DIR__, 2).'/resources/views';

    expect(AtriumStyles::missingClasses($views))->toBe([])
        ->and(AtriumStyles::inlineStyles($views))->toBe([]);
});
```

A third-party package may add its own styles instead. Add what you need from your service provider's `boot()`; it is emitted in the dashboard's `<head>`, after Atrium's stylesheet:

```php
use RefactorCircus\Atrium\Facades\Atrium;

Atrium::css(file_get_contents(__DIR__.'/../resources/css/atrium.css'), 'billing'); // inline, once per key
Atrium::stylesheet(asset('vendor/billing/billing.css'));                           // or a published file
```

Third-party packages may register their own Blade components too, under their own namespace.

The markup is adapted from [Penguin UI](https://www.penguinui.com) under the MIT License. See [CREDITS.md](CREDITS.md).

Publish them to take ownership:

```bash
php artisan vendor:publish --tag=atrium-views
```

## Using the shell for your own pages

```blade
<x-atrium::layout title="Invoices">
    <x-slot:header>
        <x-atrium::page-header title="Invoices" />
    </x-slot:header>

    Your page content.
</x-atrium::layout>
```

Every region is a slot: `brand`, `topbar`, `topbarEnd`, `breadcrumbs`, `header`, `footer`, and `sidebarFooter`.

## Theming

Atrium ships one compiled stylesheet built with Tailwind CSS 4. **No Tailwind build is required in your application** — the package compiles its own, and a host application's Tailwind setup is untouched.

Every color and radius is a design token expressed as a CSS custom property, so a theme is a set of token values applied at runtime rather than a rebuilt stylesheet. The full token list is in `resources/css/atrium.css`; `canvas` / `canvas-dark` color the area behind the sidebar and content panel.

### Themes and the theme switcher

Atrium ships six themes. People pick one from the switcher beside the light/dark toggle; the choice is kept in their browser and applied before paint, and each theme has its own light and dark tokens, so the two choices combine.

| Theme | Look | Layout |
|---|---|---|
| **Atrium** (default) | Indigo on zinc | Sidebar |
| **Harbor** | Teal on slate, softer corners | Sidebar |
| **Sunset** | Orange on warm stone | Sidebar |
| **Forest** | Green on sage | Sidebar |
| **Midnight** | Violet on deep indigo, the roundest corners | Sidebar |
| **Ledger** | Monochrome, near-square corners | Top navigation |

A theme also chooses the shell's layout from the `lg` breakpoint up. `sidebar` is the rail of sections beside a docked panel. `top` puts the sections across a bar under the topbar, with the current section's pages as tabs beneath and a section's pages dropping down on hover. Below `lg` every theme uses the drawer.

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

Atrium::theme(Theme::make('grove')->label('Grove')->swatch('#15803d')->layout('top')->colors([
    'primary' => '#15803d',
    'primary-dark' => '#4ade80',
]));
```

Set the `-dark` tokens as well as the light ones, so dark mode stays readable in your theme. Tokens a theme leaves out keep the compiled defaults.

The switcher shows only when there is more than one theme and the feature named by `switcher_feature` is on, asked through Atrium's feature resolver. By default that is Atrium's `ThemeSwitcherFeature`, a Pennant feature that is on globally until you set its global value, and that every user follows until they are given their own. With [refactor-circus/pennantplus](https://github.com/Refactor-Circus/PennantPlus) installed you turn it off, globally or for particular users, from its feature flags screen. Atrium does not require Pennant: with no feature resolver registered every feature is on, so the switcher always shows. Set `switcher_feature` to `null` for the same, or to a feature name of your own. While the switcher is hidden, everyone sees the default theme.

### Retuning the built-in theme

`atrium.theme` overrides tokens of the built-in `atrium` theme without defining a new one:

```php
'theme' => [
    'primary' => '#0f766e',
    'on-primary' => '#ffffff',
],
```

Dark mode follows a `dark` class on `<html>`. The topbar's appearance menu switches between light, dark and following the system, and the choice is kept in `localStorage` and applied before paint.

## Sidebar

The sidebar has two levels, so a dashboard with many packages stays readable:

- **The rail** holds one icon per section. Pages outside any group (the app's own) come first, each linking straight to its page; then one icon per group, such as each package's.
- **The docked panel** beside it lists the pages of the section you are in. Clicking another section's icon shows its pages in the panel without leaving the page; hovering an icon previews its pages in a flyout.
- The toggle at the rail's foot collapses the panel away, leaving the rail, across pages. Clicking a section opens it again. Below the `lg` breakpoint both sit in an off-canvas drawer.

Items join a section with `NavItem::group('Billing')`. Describe the group to give its section an icon and a place in the rail; otherwise it uses its first page's icon and sorts by its first page:

```php
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Support\Icons;

// In a plugin
public function navigationGroups(): array
{
    return [NavGroup::make('Billing')->icon(Icons::svg('banknotes'))->sort(30)];
}
```

Give nav items an `icon()` (any inline SVG); a section without one shows its initial. A page outside any group that has `children()` opens in the panel like a group, and in the panel an item with children expands in place.

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

    // Rules for a whole sidebar group. The host application can describe
    // the same group with Atrium::navigationGroup() to override these.
    public function navigationGroups(): array
    {
        return [NavGroup::make('Billing admin')->can('billing.manage')];
    }

    public function navigation(): array
    {
        return [
            NavItem::make('Invoices')
                ->url('/atrium/billing/invoices')
                ->can('billing.invoices.view')            // a permission
                ->feature('billing-v2')                   // a feature flag
                ->authorize(fn (Request $request) => ...) // anything else
                ->children([
                    NavItem::make('Refunds')->url('/atrium/billing/refunds')->can('billing.refunds.view'),
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

[refactor-circus/pennantplus](https://github.com/Refactor-Circus/pennantplus) registers a feature resolver backed by Pennant when both packages are installed. Hiding a link does not protect the page behind it: plugin routes follow the plugin's `features()`, `atrium.feature:billing,billing-v2` guards any other route the same way, and permissions still belong in your routes, requests, or policies.

To rebuild the stylesheet while working on the package itself:

```bash
npm install
npm run build:css
```

## Search

A plugin's `search()` returns a `SearchSource`, or a list of them, and the topbar's command palette queries every source the user may see. Return one source per kind of thing the plugin finds: each gets its own `results.per_source`, and classification can choose between them.

```php
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;

public function search(): ?SearchSource
{
    return SearchSource::make('invoices')
        ->label('Invoices')
        ->description('Invoices by number, customer, or amount.')
        ->using(fn (string $query) => Invoice::search($query)->take(5)->get()
            ->map(fn (Invoice $invoice) => SearchResult::make($invoice->number, route('atrium.billing.invoice', $invoice)))
            ->all());
}
```

Sources run with the `Concurrency` driver in `atrium.search.concurrency`: `sync` by default, which runs them one after another inside the request and costs nothing extra for fast sources. Set it to `process` to run them concurrently, each in its own PHP process with its own timeout - worth it for slow sources, but every search then boots the framework once per source - or to null for the application's default. A source that throws is reported and skipped, so one broken plugin never empties the palette. With the `process` or `fork` driver each source runs outside the request: Atrium hands it the signed-in user and the request's root URL (so `route()` and `url()` link to the host the user is on, not `APP_URL`), but nothing else from the request.

Each source gets `atrium.search.timeout` seconds (5 by default), or its own `->timeout(10)`. A source still running then is stopped, reported, and left out, while the others' results are still returned. Only the `process` driver can stop a running source; with `sync` or `fork` the timeout is not enforced.

A source's closures are serialized into the child process, so they must be defined somewhere that process can autoload, such as a plugin class. Closures written inside a Pest test file are scoped to a test class that only exists in the test run, so set `atrium.search.concurrency` to `sync` in tests that register sources that way.

The search box asks for results once a query has `atrium.search.min_length` characters (2 by default), and the endpoint runs no source for a shorter one. A newer keystroke cancels the search in flight, so a slow, stale answer never replaces a newer one.

Without classification every source runs, so `atrium.search.concurrency_limit` caps how many run at once. The rest wait their turn: with the `process` driver the next source starts the moment a running one finishes, and with other drivers sources run in batches of that size. Null runs every source at once.

`atrium.search.results.per_source` (5) caps what one source contributes and `atrium.search.results.total` (20) caps the whole response. Set either to null for no limit.

With [laravel/ai](https://github.com/laravel/ai) installed, set `atrium.search.classification.enabled` to `true` and Atrium classifies each query against the sources' labels and descriptions (with Jev, laravel/ai's default classifier), then only runs the `atrium.search.classification.sources` (3) most likely sources, most likely first. If classification fails, every source runs.

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

Each family implements an interface in `RefactorCircus\Atrium\Contracts`, and Laravel delivers an event to listeners of the interfaces it implements:

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

1. **The dashboard gate.** The `Authorize` middleware checks `config('atrium.gate')` (`viewAtrium` by default) on every Atrium and plugin route.
2. **Model policies.** Every dashboard request is then checked against the policy registered for the model it touches, from `config('atrium.policies')`:

| Endpoint | Request | Ability |
| --- | --- | --- |
| `POST dashboards` | `StoreDashboardRequest` | `create` on `DashboardModel::class` |
| `PUT dashboards/{dashboard}` | `UpdateDashboardRequest` | `update` on the dashboard |
| `DELETE dashboards/{dashboard}` | `DeleteDashboardRequest` | `delete` on the dashboard |
| `PUT dashboards/{dashboard}/layout` | `SaveDashboardLayoutRequest` | `update` on the dashboard, `delete` on each placement it replaces, and `create` on `DashboardWidgetModel::class` when it places any |

The dashboard's edit controls follow the same `update` check.

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

Actions expose `execute()` and keep `handle()` protected, so there is one entry point per action. Their input is a `final readonly` Data object (`CreateDashboardData`, `UpdateDashboardData`, `SaveDashboardLayoutData`, whose `widgets` are `WidgetPlacementData`, in `RefactorCircus\Atrium\Domains\Dashboard\Data`, on refactor-circus/keystone's `Data`), never an array: build it with `new` for values your code vouches for, or with `CreateDashboardData::from($input)` to validate untrusted input against its `rules()`.

## Package layout

The code is organised into domain modules under `src/Domains/{Domain}`, namespace `RefactorCircus\Atrium\Domains\{Domain}`. Each has its own service provider, registered by `RefactorCircus\Atrium\Domains\DomainServiceProvider`, which `AtriumServiceProvider` registers in turn.

| Domain | What lives there |
| --- | --- |
| `Access` | `Services\Gatekeeper`, the `Concerns\Gated` trait, and the `Authorize` and `EnsureFeaturesAreEnabled` middleware (`Http\Middleware`) |
| `Dashboard` | `Models\DashboardModel` and `Models\DashboardWidgetModel`, their policies, actions, events, requests and controllers, and `Services\DashboardManager` |
| `Navigation` | `Data\NavItem`, `Data\NavGroup` and `Services\NavigationRegistry` |
| `Plugins` | The `Contracts\Plugin` contract, the `Support\Plugin` base class, `Services\PluginRegistry`, Composer discovery and the plugin commands |
| `Screens` | `Data\Screen`, `Data\TabDefinition`, `Data\SectionDefinition` and `Data\ResolvedScreen`, `Services\ScreenExtensions` (the registry behind `Atrium::screens()`) and `Services\ScreenVisibility` |
| `Search` | `Data\SearchSource`, `Data\SearchResult`, `Services\SearchRegistry` and the search endpoint |
| `Settings` | `Data\SettingsPanel`, `Services\SettingsRegistry` and the settings pages |
| `Widgets` | `Data\WidgetDefinition` and `Services\WidgetRegistry` |

Package-wide pieces stay at the top level: the `Atrium` class and facade, the `Http\Requests\Request` base class, and `Support` (`Icons`, `StyleRegistry`, `Tables`). The `Action` base, the event contracts and the `DispatchesModelEvents` trait come from [refactor-circus/keystone](https://github.com/Refactor-Circus/Keystone), the shared runtime of the suite. Config keys, route names, view and component names, translation keys and publish tags are the same whichever domain a class lives in.

The models keep the class names they had before the move (`RefactorCircus\Atrium\Models\Dashboard`, `RefactorCircus\Atrium\Models\DashboardWidget`) as their morph aliases, so any polymorphic column or audit record that stored those names still resolves, and new records store the same values.

## Configuration

| Key | Purpose |
| --- | --- |
| `path` | The URI the dashboard is served from. Defaults to `atrium`. |
| `domain` | Serve the dashboard from a dedicated subdomain. |
| `middleware` | The middleware stack applied to all Atrium and plugin routes. |
| `gate` | The gate ability checked before the dashboard is shown. |
| `policies` | The policy class the Gate uses for `DashboardModel` and `DashboardWidgetModel`. |
| `tables` | The table each model is stored in (`dashboards`, `dashboard_widgets`). Rename them **before** migrating: the migrations and models read the same keys, and a published config that lists only some keeps the defaults for the rest. |
| `discover` | Whether to discover plugins from installed packages. |
| `plugins` | Plugin classes registered manually. |
| `disabled` | Plugin keys to hide. |
| `alpine` | Whether the layout loads Atrium's bundled Alpine.js. Set to `false` when the application already loads Alpine. |
| `theme` | Values emitted as CSS custom properties. |
| `search.concurrency` | The `Concurrency` driver search sources run with: `sync` (default), `process` or `fork`. Null uses the application's default. |
| `search.concurrency_limit` | The most search sources run at once when classification is not choosing them. Null for no limit. |
| `search.timeout` | Seconds a search source may run before it is stopped. Enforced by the `process` driver. |
| `search.min_length` | The fewest characters a query needs before any source runs (2). |
| `search.results` | `per_source` and `total` result caps. Null for no limit. |
| `search.classification` | `enabled`, `sources` (how many of the most likely sources run, default 3), `provider`, and `model` for classifying search queries with laravel/ai. |

## Commands

| Command | Purpose |
| --- | --- |
| `atrium:install` | Publish the config and assets, and print the gate stub. |
| `atrium:plugins` | List the plugins currently registered. |
| `atrium:discover` | Cache the plugins installed packages declare (also run by `package:discover` and `optimize`). |
| `atrium:clear-discovered` | Remove that cache (also run by `optimize:clear`). |
| `atrium:plugin` | Generate a new plugin class. |

## Testing

```bash
composer test
```

Browser tests run separately, because they need Playwright:

```bash
npm install
composer test:browser
```

They drive a real Chromium against the dashboard and cover the interactions that HTTP tests cannot reach: entering edit mode, removing and resizing a widget, dragging to reorder, the widget picker, and the search palette.

To see a working dashboard locally:

```bash
composer build && composer serve
```

Every build reseeds the workbench with a demo shop through Atrium's own actions: a few users, the signed-in admin's default and second dashboards with widgets placed, and a dashboard shared by another user. Its demo plugin exercises every plugin surface, including permission- and feature-gated navigation and two search sources.

## Credits

- [Refactor Circus](https://github.com/Refactor-Circus)

## License

The MIT License (MIT). See [License File](LICENSE.md) for more information.
