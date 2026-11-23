<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\BetaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\UnauthorizedPlugin;

function nav(): NavigationRegistry
{
    return app(NavigationRegistry::class);
}

it('collects navigation items from every registered plugin', function (): void {
    app(PluginRegistry::class)->registerMany([AlphaPlugin::class, BetaPlugin::class]);

    $labels = array_map(
        fn (NavItem $item): string => $item->label,
        nav()->items(Request::create('/atrium')),
    );

    expect($labels)->toContain('Alpha Home')->toContain('Beta Home');
});

it('sorts navigation items by their sort value', function (): void {
    app(PluginRegistry::class)->registerMany([AlphaPlugin::class, BetaPlugin::class]);

    $labels = array_map(
        fn (NavItem $item): string => $item->label,
        nav()->items(Request::create('/atrium')),
    );

    // Beta sorts at 5, Alpha at 10.
    expect($labels)->toBe(['Beta Home', 'Alpha Home']);
});

it('groups navigation items', function (): void {
    app(PluginRegistry::class)->registerMany([AlphaPlugin::class, BetaPlugin::class]);

    $groups = nav()->grouped(Request::create('/atrium'));

    expect($groups)->toHaveKey('Main')
        ->and($groups['Main'])->toHaveCount(2);
});

it('hides navigation from unauthorized plugins', function (): void {
    app(PluginRegistry::class)->registerMany([AlphaPlugin::class, UnauthorizedPlugin::class]);

    $labels = array_map(
        fn (NavItem $item): string => $item->label,
        nav()->items(Request::create('/atrium')),
    );

    expect($labels)->toContain('Alpha Home')->not->toContain('Secret');
});

it('hides an individual item whose own authorize callback denies', function (): void {
    nav()->add(NavItem::make('Hidden')->url('/hidden')->authorize(fn (): bool => false));
    nav()->add(NavItem::make('Shown')->url('/shown'));

    $labels = array_map(
        fn (NavItem $item): string => $item->label,
        nav()->items(Request::create('/atrium')),
    );

    expect($labels)->toBe(['Shown']);
});

it('resolves a badge callback lazily', function (): void {
    $calls = 0;

    $item = NavItem::make('Inbox')->url('/inbox')->badge(function () use (&$calls) {
        $calls++;

        return 7;
    });

    expect($calls)->toBe(0)
        ->and($item->resolveBadge())->toBe(7)
        ->and($calls)->toBe(1);
});

it('marks an item active when the current url matches', function (): void {
    $item = NavItem::make('Reports')->url('http://localhost/atrium/reports');

    expect($item->isActive(Request::create('http://localhost/atrium/reports')))->toBeTrue()
        ->and($item->isActive(Request::create('http://localhost/atrium/other')))->toBeFalse();
});

it('marks an item with a relative url active on the matching page and the pages beneath it', function (): void {
    $item = NavItem::make('Reports')->url('/atrium/reports/');

    expect($item->isActive(Request::create('https://example.test/atrium/reports?page=2')))->toBeTrue()
        ->and($item->isActive(Request::create('https://example.test/atrium/reports/sales')))->toBeTrue()
        ->and($item->isActive(Request::create('https://example.test/atrium/report')))->toBeFalse();
});

it('ignores the scheme but not the host when matching an absolute url', function (): void {
    $item = NavItem::make('Reports')->url('http://example.test/atrium/reports');

    expect($item->isActive(Request::create('https://example.test/atrium/reports')))->toBeTrue()
        ->and($item->isActive(Request::create('https://other.test/atrium/reports')))->toBeFalse();
});

it('never marks a fragment-only url active', function (): void {
    expect(NavItem::make('Sales')->url('#sales')->isActive(Request::create('http://localhost/')))->toBeFalse();
});

/**
 * A request for a path, matched to a route with the given name.
 */
function requestFor(string $path, ?string $route = null): Request
{
    $request = Request::create($path);

    if ($route !== null) {
        $request->setRouteResolver(fn (): Illuminate\Routing\Route => (new Illuminate\Routing\Route('GET', $path, fn (): null => null))->name($route));
    }

    return $request;
}

it('keeps a resource index item active on the resource\'s other pages', function (): void {
    Route::get('things', fn (): null => null)->name('things.index');

    $item = NavItem::make('Things')->route('things.index');

    expect($item->isActive(requestFor('/things/5', 'things.show')))->toBeTrue()
        ->and($item->isActive(requestFor('/things/5/edit', 'things.edit')))->toBeTrue()
        ->and($item->isActive(requestFor('/thingies', 'thingies.index')))->toBeFalse();
});

it('keeps a url item active on the paths beneath it', function (): void {
    $item = NavItem::make('Reports')->url('/reports');

    expect($item->isActive(requestFor('/reports/sales/2026')))->toBeTrue()
        ->and($item->isActive(requestFor('/reportsx')))->toBeFalse();
});

it('never treats the dashboard root as the parent of every page', function (): void {
    expect(NavItem::make('Home')->url('/atrium')->isActive(requestFor('/atrium/settings')))->toBeFalse();
});
