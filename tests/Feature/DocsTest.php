<?php

declare(strict_types=1);

/*
 * The documentation promises of the screen extensions registry: the README
 * and the Boost skill both explain it, and neither Atrium's docs nor its
 * agent instructions still mention the history screen that moved to Keen.
 */

/**
 * The "Screen extensions" section of a Markdown file: from its level-two
 * heading up to the next one.
 */
function screenExtensionsSection(string $path): string
{
    $markdown = (string) file_get_contents($path);

    if (preg_match('/^## Screen extensions\R(.*?)(?=^## |\z)/ms', $markdown, $matches) !== 1) {
        return '';
    }

    return $matches[1];
}

dataset('screen extension docs', [
    'README' => dirname(__DIR__, 2).'/README.md',
    'Boost skill' => dirname(__DIR__, 2).'/resources/boost/skills/atrium-development/SKILL.md',
]);

it('documents screen extensions', function (string $path): void {
    $section = screenExtensionsSection($path);

    expect($section)->not->toBe('')
        ->and($section)->toContain('boot()')
        ->and($section)->toContain('403')
        ->and($section)->toContain('vendor.key')
        ->and($section)->toContain('Keystone')
        ->and($section)->toContain('config');
})->with('screen extension docs');

it('documents every part of the registry', function (string $path): void {
    $section = screenExtensionsSection($path);

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
        // What renders around an open registered tab, and the theme contract.
        ->toContain('header.actions')
        ->toContain('token')
        // Duplicates per environment and across targets.
        ->toContain('production')
        ->toContain('{package}.*')
        // The suite rule and the config-defaults pattern.
        ->toContain('suggest');
})->with('screen extension docs');

it('mentions no history screen or audit component', function (string $path): void {
    expect((string) file_get_contents($path))
        ->not->toContain('atrium.history')
        ->not->toContain('x-atrium::audit')
        ->not->toContain('audit-trail')
        ->not->toContain('historyNavItem')
        ->not->toContain('history/{package}');
})->with([
    'README' => dirname(__DIR__, 2).'/README.md',
    'Boost skill' => dirname(__DIR__, 2).'/resources/boost/skills/atrium-development/SKILL.md',
    'CLAUDE.md' => dirname(__DIR__, 2).'/CLAUDE.md',
    'domains standard' => dirname(__DIR__, 2).'/docs/agent/standards/atrium/domains.md',
]);

it('lists the Screens domain and drops History', function (string $path): void {
    expect((string) file_get_contents($path))
        ->toContain('`Screens`')
        ->not->toContain('`History`');
})->with([
    'CLAUDE.md' => dirname(__DIR__, 2).'/CLAUDE.md',
    'domains standard' => dirname(__DIR__, 2).'/docs/agent/standards/atrium/domains.md',
]);

it('has an upgrade note for the history removal pointing to Keen', function (): void {
    $changelog = (string) file_get_contents(dirname(__DIR__, 2).'/CHANGELOG.md');

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
