<?php

declare(strict_types=1);

/*
 * The documentation promises of Atrium 2 (AC 23 and 25): the README covers
 * installing, host-chosen auth and using the Nuxt layer; the README and the
 * Boost skill explain screen extensions as JSON plus client components; the
 * agent docs describe the API + layer model; none of them still teaches the
 * removed Blade UI or the history screen that moved to Keen.
 */

/**
 * A level-two section of a Markdown file: from its heading up to the next one.
 */
function docsSection(string $path, string $heading): string
{
    $markdown = (string) file_get_contents($path);

    if (preg_match('/^## '.preg_quote($heading, '/').'\R(.*?)(?=^## |\z)/ms', $markdown, $matches) !== 1) {
        return '';
    }

    return $matches[1];
}

function docsPath(string $path): string
{
    return dirname(__DIR__, 2).'/'.$path;
}

it('documents installing Atrium', function (): void {
    expect(docsSection(docsPath('README.md'), 'Installation'))->not->toBe('')
        ->toContain('composer require refactor-circus/atrium')
        ->toContain('php artisan atrium:install')
        ->toContain('php artisan migrate')
        ->toContain('viewAtrium')
        ->toContain('atrium/api');
});

it('documents host-chosen auth', function (): void {
    expect(docsSection(docsPath('README.md'), 'Authentication'))->not->toBe('')
        // Atrium ships none: the host's guard goes before Authorize.
        ->toContain('atrium.routes.middleware')
        ->toContain('auth:sanctum')
        ->toContain('auth:api')
        ->toContain('Authorize::class')
        // Cookie auth needs CORS and CSRF.
        ->toContain('CORS')
        ->toContain('CSRF')
        ->toContain('supports_credentials')
        ->toContain('/sanctum/csrf-cookie')
        ->toContain("credentials: 'include'")
        // Token auth sends the Authorization header; the host stores the token.
        ->toContain('`Authorization` header')
        ->toContain('Bearer')
        ->toContain('token storage belongs to the host')
        // The workbench guard is a stand-in.
        ->toContain('AuthenticateWorkbenchToken')
        ->toContain('never copy it into production')
        // The 401 hook.
        ->toContain('onUnauthorized');
});

it('warns about the local gate fallback', function (): void {
    expect(docsSection(docsPath('README.md'), 'Authentication'))
        ->toContain('APP_ENV=local')
        ->toContain('any authenticated user')
        ->toContain('staging');
});

it('documents using the Nuxt layer', function (): void {
    expect(docsSection(docsPath('README.md'), 'The Nuxt layer'))->not->toBe('')
        // Git extends (D-001), private repos, SHA pinning, protected tags.
        ->toContain("extends: ['github:refactor-circus/atrium/nuxt/layer#v2.0.0']")
        ->toContain('GIGET_AUTH')
        ->toContain('commit SHA')
        ->toContain('mutable')
        ->toContain('NUXT_PUBLIC_ATRIUM_API_BASE')
        ->toContain('client_path')
        // The registry.
        ->toContain('$atrium.widget(')
        ->toContain('$atrium.extension(')
        ->toContain('$atrium.settingsPanel(')
        ->toContain('auth(')
        // Icons (D-010) and locales (D-003, D-011).
        ->toContain('@iconify-json/')
        ->toContain('serverBundle')
        ->toContain('fallbackToApi')
        ->toContain('i-lucide-')
        ->toContain('locale')
        // Version skew (D-004).
        ->toContain('api_version');
});

/**
 * The "Screen extensions" section of the README and the Boost skill.
 */
dataset('screen extension docs', [
    'README' => docsPath('README.md'),
    'Boost skill' => docsPath('resources/boost/skills/atrium-development/SKILL.md'),
]);

it('documents screen extensions', function (string $path): void {
    $section = docsSection($path, 'Screen extensions');

    expect($section)->not->toBe('')
        ->and($section)->toContain('boot()')
        ->and($section)->toContain('403')
        ->and($section)->toContain('vendor.key')
        ->and($section)->toContain('Keystone')
        ->and($section)->toContain('config');
})->with('screen extension docs');

it('documents every part of the registry', function (string $path): void {
    $section = docsSection($path, 'Screen extensions');

    expect($section)
        // Registration examples: a tab, a section, a row section, a wildcard,
        // and the host's declaration.
        ->toContain('->tab(')
        ->toContain('->section(')
        ->toContain("'row.actions'")
        ->toContain("->section('*'")
        ->toContain('Screen::standard(')
        // Closures receive the screen last; wildcard closures return early.
        ->toContain('Screen $screen')
        ->toContain('$screen->key')
        // What renders around an open registered tab.
        ->toContain('header.actions')
        // Rendered on the client: the component key and the JSON payload.
        ->toContain('->component(')
        ->toContain('$atrium.extension(')
        ->toContain('ResolvedScreenResource')
        // Duplicates per environment and across targets.
        ->toContain('production')
        ->toContain('{package}.*')
        // The suite rule and the config-defaults pattern.
        ->toContain('suggest');
})->with('screen extension docs');

it('teaches nothing of the removed Blade UI', function (string $path): void {
    expect((string) file_get_contents($path))
        ->not->toContain('x-atrium::')
        ->not->toContain('->view(')
        ->not->toContain('Icons::svg')
        ->not->toContain('AtriumStyles')
        ->not->toContain('Atrium::css(')
        ->not->toContain('Atrium::stylesheet(')
        ->not->toContain('build:css')
        ->not->toContain('test:browser')
        ->not->toContain('atrium.path')
        ->not->toContain('loadDashboardRoutesFrom')
        ->not->toContain('resources/css/atrium.css');
})->with([
    'README' => docsPath('README.md'),
    'Boost skill' => docsPath('resources/boost/skills/atrium-development/SKILL.md'),
    'CLAUDE.md' => docsPath('CLAUDE.md'),
    'components standard' => docsPath('docs/agent/standards/atrium/components.md'),
    'domains standard' => docsPath('docs/agent/standards/atrium/domains.md'),
]);

it('describes the API and layer model in the agent docs', function (string $path, array $phrases): void {
    expect((string) file_get_contents($path))->toContain(...$phrases);
})->with([
    'CLAUDE.md' => [docsPath('CLAUDE.md'), ['nuxt/layer', 'composer test:nuxt', '$atrium.widget(', 'Iconify', 'JsonData']],
    'components standard' => [docsPath('docs/agent/standards/atrium/components.md'), ['nuxt/layer', '$atrium.widget(', '$atrium.extension(', '$atrium.settingsPanel(', 'component', 'Nuxt UI', 'Iconify']],
    'domains standard' => [docsPath('docs/agent/standards/atrium/domains.md'), ['loadApiRoutesFrom()', 'atrium.routes.prefix', 'atrium.plugins.{key}.', 'Resources/', 'Http/Resources/']],
    'Boost skill' => [docsPath('resources/boost/skills/atrium-development/SKILL.md'), ['atrium.routes.middleware', 'github:refactor-circus/atrium/nuxt/layer', '$atrium.widget(', 'client_path', 'i-lucide-']],
]);

it('mentions no history screen or audit component', function (string $path): void {
    expect((string) file_get_contents($path))
        ->not->toContain('atrium.history')
        ->not->toContain('x-atrium::audit')
        ->not->toContain('audit-trail')
        ->not->toContain('historyNavItem')
        ->not->toContain('history/{package}');
})->with([
    'README' => docsPath('README.md'),
    'Boost skill' => docsPath('resources/boost/skills/atrium-development/SKILL.md'),
    'CLAUDE.md' => docsPath('CLAUDE.md'),
    'domains standard' => docsPath('docs/agent/standards/atrium/domains.md'),
]);

it('lists the Screens domain and drops History', function (string $path): void {
    expect((string) file_get_contents($path))
        ->toContain('`Screens`')
        ->not->toContain('`History`');
})->with([
    'CLAUDE.md' => docsPath('CLAUDE.md'),
    'domains standard' => docsPath('docs/agent/standards/atrium/domains.md'),
]);

it('has an upgrade note for the history removal pointing to Keen', function (): void {
    $changelog = (string) file_get_contents(docsPath('CHANGELOG.md'));

    expect($changelog)
        ->toContain('atrium.history.show')
        ->toContain('HistoryController')
        ->toContain('HistoryServiceProvider')
        ->toContain('Plugin::historyNavItem()')
        ->toContain('x-atrium::audit-trail')
        ->toContain('x-atrium::audit.entries')
        ->toContain('refactor-circus/keen')
        ->toContain('ScreenExtensions');
});

it('has the release checks in the pull request template', function (): void {
    expect((string) file_get_contents(docsPath('.github/pull_request_template.md')))
        // The placement uuid migration on the databases CI does not run.
        ->toContain('MySQL')
        ->toContain('Postgres')
        // Sibling packages stay on a tag range until they move to ^2.
        ->toContain('^1')
        ->toContain('dev-main')
        ->toContain('Cortex, Impex, Keen, PennantPlus, Polycart, Roster and Showroom')
        // The release tags giget and Composer resolve.
        ->toContain('v*')
        // The manual doc items, each with its owner.
        ->toContain('Owner: PR author')
        ->toContain('README')
        ->toContain('Boost skill')
        ->toContain('CLAUDE.md')
        ->toContain('atrium/components')
        ->toContain('atrium/domains');
});
