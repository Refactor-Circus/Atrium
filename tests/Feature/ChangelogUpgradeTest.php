<?php

declare(strict_types=1);

/*
 * The v2.0.0 upgrade guide (AC 23): every removed symbol, config key and
 * route from AC 16, the removed path helpers (D-016), the published-file
 * cleanup and the new migration step are named in the CHANGELOG's v2.0.0
 * section, each with what replaces it.
 */

/**
 * The CHANGELOG's v2.0.0 section: from its level-two heading up to the next.
 */
function changelogUpgradeSection(): string
{
    $markdown = (string) file_get_contents(dirname(__DIR__, 2).'/CHANGELOG.md');

    if (preg_match('/^## \[v2\.0\.0\][^\n]*\R(.*?)(?=^## |\z)/ms', $markdown, $matches) !== 1) {
        return '';
    }

    return $matches[1];
}

it('has a v2.0.0 section with an upgrade guide', function (): void {
    expect(changelogUpgradeSection())->not->toBe('')
        ->toContain('### Upgrading from v1');
});

it('names every removed file and folder', function (string $path): void {
    expect(changelogUpgradeSection())->toContain($path);
})->with([
    'resources/views',
    'resources/css',
    'resources/icons',
    'public/atrium.*',
    'tests/Browser',
    'BrowserTestCase',
    'package.json',
    'npm run build:css',
]);

it('names every removed class, method and trait', function (string $symbol): void {
    expect(changelogUpgradeSection())->toContain($symbol);
})->with([
    'StyleRegistry',
    'Support\\Icons',
    'Icons::svg()',
    'Testing\\AtriumStyles',
    'Atrium::css()',
    'Atrium::stylesheet()',
    'Atrium::path()',
    'Atrium::url()',
    'DashboardCrudController',
    'AuthorizesScreens',
    'loadDashboardRoutesFrom()',
    'DashboardManager::pick()',
    'DashboardManager::isVisible()',
    'DashboardManager::canModify()',
    'view()',
    'x-atrium::',
]);

it('names every removed config key and its replacement', function (string $key): void {
    expect(changelogUpgradeSection())->toContain('`atrium.'.$key.'`');
})->with(['path', 'domain', 'middleware', 'alpine', 'logout_route']);

it('points the removed middleware key at the new routes section', function (): void {
    expect(changelogUpgradeSection())
        ->toContain('`atrium.routes.middleware`')
        ->toContain('`atrium.routes.prefix`')
        ->toContain('`atrium.routes.enabled`')
        ->toContain('`atrium.client_path`');
});

it('names every removed or renamed route', function (string $route): void {
    expect(changelogUpgradeSection())->toContain($route);
})->with([
    // Removed Blade pages.
    '`atrium.dashboard`',
    '`atrium.dashboard.show`',
    // Renamed.
    '`atrium.settings`',
    '`atrium.settings.index`',
    // Rebound by slug and uuid.
    '{dashboard:slug}',
    '{widget:uuid}',
    // New.
    '`atrium.shell`',
    '`atrium.dashboards.default`',
    '`atrium.dashboards.index`',
    '`atrium.dashboards.show`',
    '`atrium.widgets.index`',
    // Plugin routes.
    'atrium.plugins.{key}.',
    'plugins/{key}',
]);

it('explains the published-file cleanup', function (string $path): void {
    expect(changelogUpgradeSection())->toContain($path);
})->with([
    'resources/views/vendor/atrium',
    'public/vendor/atrium',
    'atrium-views',
    'atrium-assets',
]);

it('lists the migration step', function (): void {
    expect(changelogUpgradeSection())
        ->toContain('php artisan migrate')
        ->toContain('add_uuid_and_version_to_atrium_dashboards')
        ->toContain('uuid')
        ->toContain('version');
});

it('points hosts at the Nuxt layer and their own auth', function (): void {
    expect(changelogUpgradeSection())
        ->toContain('github:refactor-circus/atrium/nuxt/layer#v2.0.0')
        ->toContain('$atrium.widget(')
        ->toContain('auth:sanctum');
});

/*
 * The suite integrations (AC 76): the v2.0.0 section names the integrations,
 * `atrium.screens.show`, the shell additions, every suite package key they
 * replace with its Atrium replacement, every v1 action left out (D-032), the
 * parity changes (D-031, D-032) and the release step of D-020.
 */

it('names the suite integrations', function (): void {
    expect(changelogUpgradeSection())
        ->toContain('Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom')
        ->toContain('`atrium.integrations`')
        ->toContain('`atrium.integrations.{pkg}.enabled`')
        ->toContain('`atrium.integrations.{pkg}.api_base`')
        ->toContain('`atrium.integrations.{pkg}.features`');
});

it('names the screen route', function (): void {
    expect(changelogUpgradeSection())
        ->toContain('`atrium.screens.show`')
        ->toContain('GET screens/{screen}');
});

it('names the shell additions', function (string $addition): void {
    expect(changelogUpgradeSection())->toContain($addition);
})->with([
    '`integrations`',
    '`search.sources`',
    '`search.per_source`',
    '`live`',
    'NavItem::live()',
]);

it('names every replaced suite package key with its replacement', function (string $key, string $replacement): void {
    expect(changelogUpgradeSection())
        ->toContain('`'.$key.'`')
        ->toContain($replacement);
})->with([
    // {pkg}.ui.*
    ['cortex.ui.enabled', '`atrium.integrations.cortex.enabled`'],
    ['impex.ui.enabled', '`atrium.integrations.impex.enabled`'],
    ['keen.ui.enabled', '`atrium.integrations.keen.enabled`'],
    ['polycart.ui.enabled', '`atrium.integrations.polycart.enabled`'],
    ['showroom.ui.enabled', '`atrium.integrations.showroom.enabled`'],
    // {pkg}.atrium.*
    ['cortex.atrium.features', '`atrium.integrations.cortex.features`'],
    ['cortex.atrium.redirect_domains.screens', '`atrium.integrations.cortex.redirect_domains.screens`'],
    ['impex.atrium.features', '`atrium.integrations.impex.features`'],
    ['impex.atrium.run_link.screens', '`atrium.integrations.impex.run_link.screens`'],
    ['impex.atrium.show_all', 'D-032'],
    ['keen.atrium.history', '`atrium.integrations.keen.history`'],
    ['polycart.atrium.features', '`atrium.integrations.polycart.features`'],
    ['polycart.atrium.show_all', 'D-032'],
    ['roster.atrium.features', '`atrium.integrations.roster.features`'],
    ['showroom.atrium.features', '`atrium.integrations.showroom.features`'],
    ['showroom.atrium.widget_cache_seconds', '`showroom.stats.cache_seconds`'],
    ['pennantplus.atrium.resolve_features', 'Atrium::resolveFeaturesUsing()'],
]);

it('names every replaced support feature with its replacement', function (string $package): void {
    expect(changelogUpgradeSection())
        ->toContain('`'.$package.'SupportFeature`')
        ->toContain('`RefactorCircus\\Atrium\\Integrations\\'.$package.'\\'.$package.'Feature`');
})->with(['Cortex', 'Impex', 'Polycart', 'Roster', 'Showroom']);

it('names the parity changes', function (): void {
    expect(changelogUpgradeSection())
        ->toContain('D-031')
        ->toContain('D-032')
        ->toContain('Operator mode');
});

/**
 * The `// Not ported (D-032)` comment at the top of a layer file: its lines,
 * without the comment markers.
 */
function notPortedComment(string $path): string
{
    $lines = [];
    $inside = false;

    foreach (file(dirname(__DIR__, 2).'/nuxt/layer/app/'.$path, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (str_contains($line, '// Not ported (D-032)')) {
            $inside = true;
        } elseif ($inside && ! str_starts_with(ltrim($line), '//')) {
            break;
        }

        if ($inside) {
            $lines[] = trim((string) preg_replace('/^\s*\/\/\s?/', '', $line));
        }
    }

    return implode("\n", $lines);
}

it('lists the v1 actions left out of each integration (D-032)', function (string $path, string $heading): void {
    expect(notPortedComment($path))->not->toBe('');

    $section = changelogUpgradeSection();

    if (preg_match('/^#{4,5} Not ported \(D-032\)\R(.*?)(?=^#{2,4} |\z)/ms', $section, $matches) !== 1) {
        test()->fail('The v2.0.0 section has no "Not ported (D-032)" heading.');
    }

    expect($matches[1])->toContain('**'.$heading.'**');
})->with([
    ['integrations/cortex/index.ts', 'Cortex'],
    ['integrations/impex/index.ts', 'Impex'],
    ['integrations/keen/index.ts', 'Keen'],
    ['integrations/pennantplus/index.ts', 'PennantPlus'],
    ['integrations/polycart/index.ts', 'Polycart'],
    ['integrations/hooks/index.ts', 'Cross-package hooks'],
    ['pages/roster/users/index.vue', 'Roster users and impersonations'],
    ['pages/roster/organizations/index.vue', 'Roster organizations, teams and invitations'],
    ['pages/roster/roles/index.vue', 'Roster roles, permissions and transfers'],
    ['integrations/showroom/index.ts', 'Showroom widgets and search'],
    ['pages/showroom/products/index.vue', 'Showroom products, product models and families'],
    ['pages/showroom/attributes/index.vue', 'Showroom attributes, categories, channels and flags'],
    ['pages/showroom/assets/index.vue', 'Showroom assets, owners and transfers'],
]);

it('names the left-out actions themselves (D-032)', function (string $item): void {
    expect(changelogUpgradeSection())->toContain($item);
})->with([
    // Cortex
    '?source=global|owned',
    'redirect domains are turned off',
    // Impex
    'installed transports',
    // PennantPlus
    'database driver',
    // Polycart
    '@polycartCan',
    'CartLineResource.options',
    // Roster
    'roster::impersonation-banner',
    'roster.organizations.purge',
    'roster.invitations.page.accept',
    'Transfers::available()',
    // Showroom
    'FlagScreen::mayAssign()',
    'showroom.workflow.require_approval',
    'assets.upload',
    'associations.add',
    'impex.runs.index',
    'owners.show',
]);

it('has the D-020 release step', function (): void {
    expect(changelogUpgradeSection())
        ->toContain('D-020')
        ->toContain('nuxt/layer/app/integrations/{pkg}/client/')
        ->toContain('pnpm -C nuxt sync:clients')
        ->toContain('"@refactor-circus/{pkg}-client": "github:refactor-circus/{pkg}#v2.0.0&path:/client"')
        ->toContain('create{Pkg}Client')
        ->toContain('export-ignore');
});

it("names Atrium's own OpenAPI document and client", function (): void {
    expect(changelogUpgradeSection())
        ->toContain('openapi.json')
        ->toContain('composer openapi:export')
        ->toContain('pnpm -C nuxt generate:client')
        ->toContain('useAtriumClient()');
});
