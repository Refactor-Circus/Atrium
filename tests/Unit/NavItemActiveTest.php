<?php

declare(strict_types=1);

use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;

/*
 * Atrium 2 has no dashboard path: the `atrium.path` key is gone, so
 * NavItem::isActive() no longer reads it (D-016). Only the site root is
 * never the parent of every page.
 */

beforeEach(function (): void {
    // A stale v1 config that still sets the removed key.
    $container = new Container;
    $container->instance('config', new Repository(['atrium' => ['path' => 'atrium']]));

    Container::setInstance($container);
});

afterEach(function (): void {
    Container::setInstance(null);
});

it('ignores a leftover atrium.path when matching the pages beneath an item', function (): void {
    $item = NavItem::make('Atrium')->url('/atrium');

    expect($item->isActive(Request::create('/atrium')))->toBeTrue()
        ->and($item->isActive(Request::create('/atrium/settings')))->toBeTrue()
        ->and($item->isActive(Request::create('/atriumx')))->toBeFalse();
});

it('never treats the site root as the parent of every page', function (string $url): void {
    $item = NavItem::make('Home')->url($url);

    expect($item->isActive(Request::create('/')))->toBeTrue()
        ->and($item->isActive(Request::create('/settings')))->toBeFalse();
})->with(['/', 'http://localhost/']);

it('does not read the atrium.path key', function (): void {
    $source = (string) file_get_contents(new ReflectionClass(NavItem::class)->getFileName() ?: '');

    expect($source)->not->toContain('atrium.path');
});
