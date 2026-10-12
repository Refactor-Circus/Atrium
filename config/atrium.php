<?php

declare(strict_types=1);
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardPolicy;
use RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardWidgetPolicy;
use RefactorCircus\Atrium\Domains\Themes\Features\ThemeSwitcherFeature;

return [

    /*
    |--------------------------------------------------------------------------
    | Dashboard Path
    |--------------------------------------------------------------------------
    |
    | The URI path the Atrium dashboard is served from. Plugin routes are
    | registered beneath this prefix so every dashboard URL is consistent.
    |
    */

    'path' => 'atrium',

    /*
    |--------------------------------------------------------------------------
    | Dashboard Domain
    |--------------------------------------------------------------------------
    |
    | Optionally serve the dashboard from a dedicated subdomain. Leave null
    | to serve it from the application's default domain.
    |
    */

    'domain' => null,

    /*
    |--------------------------------------------------------------------------
    | Middleware
    |--------------------------------------------------------------------------
    |
    | Middleware applied to every Atrium route, including plugin routes. The
    | authorization middleware checks the gate defined below.
    |
    */

    'middleware' => [
        'web',
        Authorize::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Authorization Gate
    |--------------------------------------------------------------------------
    |
    | The gate ability checked before the dashboard is shown. Define it in a
    | service provider with Gate::define(). When the gate is not defined,
    | access is granted in the local environment and denied everywhere else.
    |
    */

    'gate' => 'viewAtrium',

    /*
    |--------------------------------------------------------------------------
    | Policies
    |--------------------------------------------------------------------------
    |
    | The policy the Gate uses for each model. Every dashboard request is
    | checked against these, on top of the gate above. By default a
    | dashboard's owner may do anything, everyone may view a shared
    | dashboard, and widget placements follow their dashboard. Point a model
    | at your own class to replace its policy.
    |
    */

    'policies' => [
        DashboardModel::class => DashboardPolicy::class,
        DashboardWidgetModel::class => DashboardWidgetPolicy::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Tables
    |--------------------------------------------------------------------------
    |
    | The table each of Atrium's records is stored in. Set these before running
    | the migrations: the migrations and models both read them. Keys left out
    | keep their default.
    |
    */

    'tables' => [
        'dashboards' => 'atrium_dashboards',
        'dashboard_widgets' => 'atrium_dashboard_widgets',
    ],

    /*
    |--------------------------------------------------------------------------
    | Auditing
    |--------------------------------------------------------------------------
    |
    | Atrium keeps no audit log of its own. With refactor-circus/keen
    | installed, Keen records every dashboard change Atrium makes, and
    | Atrium shows each package's history while that package audits.
    |
    | enabled: Set to false to keep Atrium's own dashboard changes out of the
    |          audit log even while Keen is installed. Other packages' history
    |          follows their own `audit.enabled`.
    |
    */

    'audit' => [
        'enabled' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Plugins
    |--------------------------------------------------------------------------
    |
    | Plugins are discovered automatically from installed packages that
    | declare them under "extra.atrium.plugins" in their composer.json. The
    | list is cached in bootstrap/cache/atrium-plugins.php by `atrium:discover`
    | (run by `package:discover` and `optimize`) and removed by
    | `optimize:clear`; without the cache it is read on every boot.
    |
    | Add plugin classes here to register them manually, and list plugin keys
    | under "disabled" to hide discovered plugins you do not want.
    |
    */

    'discover' => true,

    'plugins' => [
        //
    ],

    'disabled' => [
        //
    ],

    /*
    |--------------------------------------------------------------------------
    | Alpine.js
    |--------------------------------------------------------------------------
    |
    | Atrium's interactive components are built on Alpine. Leave this true to
    | let Atrium serve the copy it ships with. Set it to false when the host
    | application already bundles Alpine, so the page does not load it twice.
    |
    */

    'alpine' => true,

    /*
    |--------------------------------------------------------------------------
    | Global Search
    |--------------------------------------------------------------------------
    |
    | Every search source runs concurrently, and a source that throws or
    | runs out of time is reported and skipped rather than failing the
    | whole search.
    |
    | concurrency: The Concurrency driver to run sources with - `sync`,
    |              `process` or `fork`. Null uses the application's default.
    |              `sync` (the default) runs the sources one after another
    |              inside the request, which is cheapest for fast sources.
    |              `process` starts a PHP process per source on every search,
    |              which costs a framework boot each, but runs them at once
    |              and is the only driver that enforces `timeout`; opt into
    |              it for slow sources. `fork` needs spatie/fork and the
    |              console. Process and fork run each source outside the
    |              request, so Atrium hands each one the signed-in user;
    |              anything else a source needs from the request is not
    |              available to it.
    | concurrency_limit:
    |              The most sources searched at once when classification is
    |              not choosing them. The rest wait, and each starts as soon
    |              as a running one finishes. Null runs every source at once.
    | timeout:     Seconds a source may run before it is stopped and left
    |              out. A source's own `timeout()` overrides it. Only the
    |              process driver can enforce it; null means no limit.
    |
    | min_length:  The fewest characters a query needs before the search box
    |              asks for results, and before the search endpoint runs any
    |              source. Shorter queries return no results. Null for no
    |              minimum.
    |
    | results.per_source: The most results one source contributes.
    | results.total:      The most results returned for one query.
    |              Null for either means no limit.
    |
    | classification.enabled: Classify the query with laravel/ai (Jev, by
    |              default) to decide what is being searched for, and only
    |              run the most likely sources. Needs laravel/ai installed.
    | classification.sources: How many of the most likely sources to run.
    | classification.provider / classification.model:
    |              Override laravel/ai's classification provider and model.
    |
    */

    'search' => [
        'concurrency' => 'sync',

        'concurrency_limit' => null,

        'timeout' => 5,

        'min_length' => 2,

        'results' => [
            'per_source' => 5,
            'total' => 20,
        ],

        'classification' => [
            'enabled' => false,
            'sources' => 3,
            'provider' => null,
            'model' => null,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Themes
    |--------------------------------------------------------------------------
    |
    | Atrium ships six themes - `atrium` (indigo), `harbor` (teal), `sunset`
    | (orange), `forest` (green), `midnight` (violet) and `ledger`
    | (monochrome, with navigation across the top) - and people pick one from
    | the switcher beside the light/dark toggle. Their choice is kept in their
    | browser.
    |
    | default:          The theme shown until someone picks another.
    | switcher_feature: A feature the switcher shows behind, checked through
    |                   Atrium's feature resolver. ThemeSwitcherFeature is a
    |                   Pennant feature: with refactor-circus/pennantplus it is on until
    |                   you turn it off, globally or for some users. With no
    |                   feature resolver every feature is on, so the switcher
    |                   always shows. Null always shows it too; a feature name
    |                   of your own gates it.
    | available:        Your own themes. Each key is a token from
    |                   resources/css/atrium.css without `--color-`; set the
    |                   `-dark` tokens too so dark mode stays readable.
    |                   `layout` is `sidebar` (the default) or `top`.
    |
    | Packages register themes with Atrium::theme(Theme::make('...')).
    |
    */

    'themes' => [
        'default' => 'atrium',

        'switcher_feature' => ThemeSwitcherFeature::class,

        'available' => [
            // 'dusk' => [
            //     'label' => 'Dusk',
            //     'swatch' => '#ea580c',
            //     'radius' => '0.5rem',
            //     'layout' => 'sidebar',
            //     'colors' => ['primary' => '#ea580c', 'primary-dark' => '#fb923c'],
            // ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Theme overrides
    |--------------------------------------------------------------------------
    |
    | These values override the design tokens of the built-in `atrium` theme,
    | so it can be retuned at runtime without rebuilding any assets. Any key
    | here becomes "--color-{key}". To offer a whole new look, add a theme
    | under `themes.available` instead.
    |
    | See resources/css/atrium.css for the full list of available tokens.
    |
    */

    'theme' => [
        // 'primary' => '#4f46e5',
        // 'on-primary' => '#ffffff',
    ],

];
