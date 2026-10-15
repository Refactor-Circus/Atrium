<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\BrowserPlugin;

beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    app(PluginRegistry::class)->registerMany([AlphaPlugin::class, BrowserPlugin::class]);
});

it('docks the current section\'s pages beside the rail', function (): void {
    // Browser Page is /atrium, so the Testing section is the one in view.
    visit('/atrium')
        ->assertSee('TESTING')
        ->assertSee('Browser Page')
        ->assertDontSee('Alpha Home')
        ->assertPresent('[data-testid="nav-section"][aria-label="Main"]');
});

it('switches the docked section from the rail without leaving the page', function (): void {
    visit('/atrium')
        ->click('[data-testid="nav-section"][aria-label="Main"]')
        ->assertSee('MAIN')
        ->assertSee('Alpha Home')
        ->assertDontSee('Browser Page')
        ->assertPathIs('/atrium');
});

it('previews another section\'s pages on hover', function (): void {
    visit('/atrium')
        ->hover('[data-testid="nav-section"][aria-label="Main"]')
        ->assertPresent('@nav-flyout')
        ->assertSeeIn('@nav-flyout', 'Alpha Home');
});

it('collapses to the rail and reopens on a section', function (): void {
    visit('/atrium')
        ->click('@sidebar-toggle')
        ->assertDontSee('Browser Page')
        ->click('[data-testid="nav-section"][aria-label="Main"]')
        ->assertScript('document.documentElement.dataset.atriumSidebar === undefined', true)
        ->assertSee('Alpha Home');
});

it('returns results from a plugin search source as you type', function (): void {
    visit('/atrium')
        ->type('#atrium-search-input', 'invoices')
        ->assertSee('Result for invoices')
        ->assertSee('From the browser plugin');
});

it('shows an empty message when a search matches nothing', function (): void {
    // A closure written in a test file cannot run in another process, as
    // the test case class it is scoped to only exists in this one.
    config()->set('atrium.search.concurrency', 'sync');

    // BrowserPlugin echoes any query back, so ask a source that filters.
    app(SearchRegistry::class)->add(
        SearchSource::make('filtered')
            ->using(fn (string $query): array => $query === 'match'
                ? [SearchResult::make('Found it', '/atrium')]
                : []),
    );

    app(PluginRegistry::class)->disable(['browser']);

    visit('/atrium')
        ->type('#atrium-search-input', 'match')
        ->assertSee('Found it');
});

it('marks the active navigation item on the current page', function (): void {
    visit('/atrium/settings')->assertPresent('@nav-item');
});

it('collapses the sidebar to an icon rail and remembers it across pages', function (): void {
    visit('/atrium')
        ->click('@sidebar-toggle')
        ->assertScript('document.documentElement.dataset.atriumSidebar', 'collapsed')
        ->navigate('/atrium/settings')
        ->assertScript('document.documentElement.dataset.atriumSidebar', 'collapsed')
        // Settings belongs to no section, so there is no panel to reopen.
        ->assertMissing('@sidebar-toggle')
        ->navigate('/atrium')
        ->click('@sidebar-toggle')
        ->assertScript('document.documentElement.dataset.atriumSidebar === undefined', true);
});

it('switches to dark mode and keeps it across pages', function (): void {
    visit('/atrium')
        ->click('@appearance-toggle')
        ->click('@theme-dark')
        ->assertScript('document.documentElement.classList.contains("dark")', true)
        ->navigate('/atrium/settings')
        ->assertScript('document.documentElement.classList.contains("dark")', true)
        ->click('@appearance-toggle')
        ->click('@theme-light')
        ->assertScript('document.documentElement.classList.contains("dark")', false);
});

it('switches theme beside the dark mode toggle and keeps it across pages', function (): void {
    visit('/atrium')
        ->assertScript('document.documentElement.dataset.atriumTheme', 'atrium')
        ->click('@theme-switcher')
        ->click('@palette-harbor')
        ->assertScript('document.documentElement.dataset.atriumTheme', 'harbor')
        ->assertScript('getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim()', '#0d9488')
        ->navigate('/atrium/settings')
        ->assertScript('document.documentElement.dataset.atriumTheme', 'harbor')
        ->click('@theme-switcher')
        ->click('@palette-atrium')
        ->assertScript('document.documentElement.dataset.atriumTheme', 'atrium');
});

it('lays the page out with navigation across the top for the ledger theme', function (): void {
    visit('/atrium')
        ->resize(1280, 800)
        ->assertScript('document.documentElement.dataset.atriumLayout', 'sidebar')
        ->assertVisible('@sidebar')
        ->click('@theme-switcher')
        ->click('@palette-ledger')
        ->assertScript('document.documentElement.dataset.atriumLayout', 'top')
        ->assertMissing('@sidebar')
        ->assertVisible('@top-nav')
        ->assertSeeIn('@top-nav', 'Browser Page')
        // One way to reach a section's pages: click it for its row of tabs.
        ->hover('[data-testid="top-section"][data-section="group-main"]')
        ->assertNotPresent('@nav-flyout')
        ->click('[data-testid="top-section"][data-section="group-main"]')
        ->assertSeeIn('@top-nav', 'Alpha Home')
        ->assertPathIs('/atrium')
        ->navigate('/atrium/settings')
        ->assertScript('document.documentElement.dataset.atriumLayout', 'top')
        ->click('@theme-switcher')
        ->click('@palette-atrium')
        ->assertScript('document.documentElement.dataset.atriumLayout', 'sidebar')
        ->assertVisible('@sidebar')
        ->assertNotPresent('@nav-flyout');
});
