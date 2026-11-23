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
