<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;

/*
 * `NavItem::path()` (D-075): a page of the SPA, sent as it is and resolved
 * to a host URL under `atrium.client_path` only when asked.
 */

it('sends an SPA path as an internal link whatever the client path', function (string $clientPath, string $url): void {
    config()->set('atrium.client_path', $clientPath);

    $item = NavItem::make('Products')->path('/showroom/products?status=draft');

    expect($item->link())->toBe(['path' => '/showroom/products?status=draft', 'external' => false])
        ->and($item->resolveUrl())->toBe($url);
})->with([
    'root' => ['/', '/showroom/products?status=draft'],
    'admin' => ['/admin', '/admin/showroom/products?status=draft'],
    'trailing slash' => ['admin/', '/admin/showroom/products?status=draft'],
]);

it('keeps url(), route() and path() exclusive', function (): void {
    $item = NavItem::make('Products')->url('https://app.test/x')->path('/showroom/products');

    expect($item->url)->toBeNull()->and($item->route)->toBeNull()->and($item->path)->toBe('/showroom/products');

    $item->url('/elsewhere');
    expect($item->path)->toBeNull();

    $item->path('/showroom/products')->route('home');
    expect($item->path)->toBeNull()->and($item->url)->toBeNull();
});

it('refuses a path the SPA cannot route to', function (string $path): void {
    NavItem::make('Bad')->path($path);
})->throws(InvalidArgumentException::class, 'it must be a path inside the SPA')->with([
    'relative' => ['showroom/products'],
    'absolute URL' => ['https://evil.test/'],
    'protocol-relative' => ['//evil.test'],
    'backslash' => ['/\\evil.test'],
    'whitespace' => ['/showroom products'],
    'control' => ["/showroom\nproducts"],
    'empty' => [''],
]);
