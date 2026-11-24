<?php

declare(strict_types=1);
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardPolicy;
use RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardWidgetPolicy;
use RefactorCircus\Atrium\Domains\Themes\Features\ThemeSwitcherFeature;
use RefactorCircus\Atrium\Integrations\Cortex\CortexFeature;
use RefactorCircus\Atrium\Integrations\Guardian\GuardianFeature;
use RefactorCircus\Atrium\Integrations\Impex\ImpexFeature;
use RefactorCircus\Atrium\Integrations\Keen\KeenFeature;
use RefactorCircus\Atrium\Integrations\PennantPlus\PennantPlusFeature;
use RefactorCircus\Atrium\Integrations\Polycart\PolycartFeature;
use RefactorCircus\Atrium\Integrations\Roster\RosterFeature;
use RefactorCircus\Atrium\Integrations\Showroom\ShowroomFeature;

return [

    /*
    |--------------------------------------------------------------------------
    | API Routes
    |--------------------------------------------------------------------------
    |
    | Atrium serves its dashboard as a JSON API, which its front end (the page
    | below) renders. Every route, plugin routes included, is registered
    | under this prefix and middleware and named `atrium.*`.
    |
    | enabled:     Set to false to register no API route at all.
    | prefix:      The URI prefix of every route. Default: `atrium/api`.
    | middleware:  The middleware of every route. Default:
    |              ['web', 'auth', Authorize::class]: the session the page
    |              was served in, so the front end needs no configuration.
    |
    | Atrium ships no authentication: `auth` is your app's own guard, and
    | the session is the one Atrium's page was served in, so its front end
    | needs no setup (it sends the session cookie and the XSRF token). Keep
    | Authorize::class last: it checks the `viewAtrium` gate below against
    | the user the guard signed in, so it must run after the guard. Errors
    | are always JSON: a guest gets 401, never a redirect to a login page.
    |
    | Another client of the API (a front end on another origin, a script)
    | swaps the session for its guard: `auth:sanctum` for Sanctum, `auth:api`
    | for Passport, e.g. ['api', 'auth:sanctum', Authorize::class]. Across
    | origins it needs the host's own setup: CORS `paths` with the prefix,
    | and for cookies `supports_credentials` and the Sanctum SPA flow (CSRF
    | cookie first); for tokens, the `Authorization` header.
    |
    */

    'routes' => [
        'enabled' => true,

        'prefix' => 'atrium/api',

        'middleware' => [
            'web',
            'auth',
            Authorize::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | The Page
    |--------------------------------------------------------------------------
    |
    | Atrium ships its front end prebuilt and serves it itself: one Blade page
    | for every path under `client_path`, so a host needs no Node and no
    | build step (D-079). Each installed package's front-end module, and the
    | app's own scripts, load into that page (D-082).
    |
    | client_path:        Where the page is served, and the base of every
    |                     path the front end routes to. Default: `/atrium`.
    |                     Links on this app's host under it are sent
    |                     relative to it; any other link as external.
    | client.enabled:     Set to false to serve neither the page nor its
    |                     assets (a host that serves its own front end).
    | client.middleware:  The page's middleware: your session and guard, then
    |                     Authorize. A guest is sent to your login page.
    | assets.path:        Where the prebuilt files are served from, Atrium's
    |                     and each module's: `/vendor/atrium/{owner}/{version}/…`,
    |                     straight from the packages, cached for a year. No
    |                     publish step; nothing is written to public/.
    | scripts, styles:    The app's own scripts and stylesheets, loaded after
    |                     every module's: URLs, or entries of the app's Vite
    |                     build (`resources/js/atrium.ts`). Atrium::script()
    |                     and Atrium::style() add more from a provider.
    | icons.remote:       Fetch icons outside the bundled collections (Lucide)
    |                     from the Iconify API. Off: no request leaves the page.
    |
    */

    'client_path' => '/atrium',

    'client' => [
        'enabled' => true,

        'middleware' => [
            'web',
            'auth',
            Authorize::class,
        ],
    ],

    'assets' => [
        'path' => 'vendor/atrium',
    ],

    'scripts' => [
        //
    ],

    'styles' => [
        //
    ],

    'icons' => [
        'remote' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | Authorization Gate
    |--------------------------------------------------------------------------
    |
    | The gate ability Authorize checks on the page and every API route: the
    | `viewAtrium` gate. Define it in a service provider with Gate::define().
    | While it is not defined, a user model implementing
    | RefactorCircus\Atrium\Domains\Access\Contracts\AtriumUser decides with
    | canAccessAtrium(); any other signed-in user gets in only in the
    | `local` environment (D-086). Never run a shared server with
    | APP_ENV=local unless every user who can sign in may see the dashboard.
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
    | installed, Keen records every dashboard change Atrium makes and shows
    | each package's history.
    |
    | enabled: Set to false to keep Atrium's own dashboard changes out of the
    |          audit log even while Keen is installed.
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
    | available:        Your own themes. Each key is a design token of
    |                   Atrium's stylesheet without `--color-`; set the
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
    | Atrium's stylesheet (ui/app/src/assets/atrium.css) lists every token.
    |
    */

    'theme' => [
        // 'primary' => '#4f46e5',
        // 'on-primary' => '#ffffff',
    ],

    /*
    |--------------------------------------------------------------------------
    | Suite Integrations
    |--------------------------------------------------------------------------
    |
    | Atrium hosts the front ends of the Refactor Circus suite packages:
    | Cortex, Guardian, Impex, Keen, PennantPlus, Polycart, Roster and
    | Showroom. Each package ships its own front-end module (its pages,
    | widgets, settings panel and search), which calls its own JSON API;
    | Atrium's PHP sends their declarations only and never loads a package's
    | classes. A package's module loads only while its integration does.
    |
    | Detection: an integration registers when refactor-circus/{pkg} is
    | installed and its `enabled` is true (read as a boolean, so "false" from
    | an env file turns it off). Set `enabled` to false to hide a package from
    | Atrium while keeping it installed.
    |
    | API base: where the module calls the package's API. A non-empty
    | `api_base` wins (a path such as `/cortex/api`, or an absolute URL for a
    | package served from another host). Otherwise it is `/` plus the
    | package's own {pkg}.routes.prefix, while {pkg}.routes.enabled is true.
    | When neither applies the integration does not register, and Atrium logs
    | a warning once per process naming both keys.
    |
    | Security: the package APIs answer with their own auth. Guardian, Polycart
    | and Roster ship with their API off (guardian.routes.enabled,
    | polycart.routes.enabled and roster.routes.enabled are false), so their
    | integrations stay away until you turn the API on, behind your
    | application's authentication middleware (e.g. auth:sanctum) in that
    | package's `routes.middleware`.
    |
    | Guardian: its `guardian.two-factor` and `guardian.session` middleware can
    | go on Atrium's route group (`atrium.middleware`) and on the packages' API
    | groups. A user who still owes a second factor then gets Guardian's 403,
    | and Guardian's module sends them to its two-factor challenge page
    | (/guardian/two-factor/challenge) or setup page (/guardian/two-factor/setup).
    | guardian.scope_types: the morph type Guardian stores for each scope
    |              (`organization`, `team`). A null value resolves to
    |              guardian.adopt.scope_types.{key}; a value that does not
    |              resolve to a non-empty string is dropped, and the
    |              organization access tab is skipped while `organization`
    |              does not resolve.
    |
    | features: feature flags that must all be on for the integration to show
    | to a user: its navigation, widgets, settings panel, search sources and
    | screens. With Laravel Pennant installed each resolves through
    | Feature::for($user)->active($name), so you can turn an integration off
    | globally or per user; each default {Pkg}Feature class is on until you
    | do. Without Pennant every flag is on. An empty list always shows the
    | integration. These are separate from the plugin features gated through
    | Atrium::resolveFeaturesUsing().
    |
    | Cross-package hooks, each registered only while both integrations are:
    |
    | cortex.redirect_domains.screens: the Roster screens that get Cortex's
    |              redirect domains, as a `tab` or in a slot (`aside`).
    | impex.run_link.screens: the Showroom screens whose rows link to their
    |              Impex run, by row slot.
    | keen.history: the Keen history section on every screen matched by
    |              `screens` and not by `exclude`, in `slot`; the activity
    |              tab for each `tabs` entry (`scope` filters by the record as
    |              a scope); and the History nav item, sorted by `nav.sort`,
    |              leaving out `nav.exclude` and grouping packages under the
    |              Atrium nav groups `nav.groups` names.
    | showroom.transfers.flow_prefix: the Impex flows Showroom's transfers
    |              screen lists, by name prefix.
    | guardian.screens: Guardian's tabs and sections on Roster's screens. A
    |              plain value is a tab; a `slot => key` entry is a section.
    |
    | A target is a screen key (`roster.user`), `{package}.*` or `*`. An
    | invalid one throws in local and testing, and is reported and skipped
    | anywhere else.
    |
    */

    'integrations' => [
        'cortex' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [CortexFeature::class],
            'redirect_domains' => [
                'screens' => ['roster.organization' => 'tab', 'roster.user' => 'aside'],
            ],
        ],

        'guardian' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [GuardianFeature::class],
            'scope_types' => [
                'organization' => null,
                'team' => null,
            ],
            'screens' => [
                'roster.organization' => ['guardian.access', 'guardian.sso', 'guardian.scim'],
                'roster.user' => ['guardian.access', 'guardian.user-security', 'aside' => 'guardian.sso-identities'],
            ],
        ],

        'impex' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [ImpexFeature::class],
            'run_link' => [
                'screens' => ['showroom.transfers' => 'row.actions'],
            ],
        ],

        'keen' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [KeenFeature::class],
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

        'pennantplus' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [PennantPlusFeature::class],
        ],

        'polycart' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [PolycartFeature::class],
        ],

        'roster' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [RosterFeature::class],
        ],

        'showroom' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [ShowroomFeature::class],
            'transfers' => [
                'flow_prefix' => 'showroom:',
            ],
        ],
    ],

];
