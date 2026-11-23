<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Atrium;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Support\ClientPath;

function configFilePath(): string
{
    return dirname(__DIR__, 2).'/config/atrium.php';
}

/**
 * The banner comment above the `routes` key.
 */
function routesBanner(): string
{
    $contents = (string) file_get_contents(configFilePath());

    $start = strpos($contents, '| API Routes');
    $end = strpos($contents, "'routes' =>");

    expect($start)->toBeInt()->and($end)->toBeInt()->toBeGreaterThan($start);

    return substr($contents, (int) $start, (int) $end - (int) $start);
}

it('defaults the API routes to the atrium/api prefix, the api group and Authorize last', function (): void {
    /** @var array<string, mixed> $config */
    $config = require configFilePath();

    expect($config['routes'])->toBe([
        'enabled' => true,
        'prefix' => 'atrium/api',
        'middleware' => ['api', Authorize::class],
    ])->and($config['client_path'])->toBe('/');
});

it('documents the prefix, the middleware and that Authorize stays last', function (): void {
    expect(routesBanner())
        ->toContain('`atrium/api`')
        ->toContain("['api', Authorize::class]")
        ->toContain('Keep')
        ->toContain('Authorize::class last');
});

it('says Atrium ships no authentication and names guards to add', function (): void {
    expect(routesBanner())
        ->toContain('Atrium ships no authentication')
        ->toContain('`auth:sanctum`')
        ->toContain('`auth:api`');
});

it('documents client_path and its default', function (): void {
    expect(routesBanner())
        ->toContain('client_path: The base path the host serves the SPA from. Default: `/`.')
        ->toContain('must match that base URL');
});

it('documents the CORS, CSRF and token setup a cross-origin SPA needs', function (): void {
    expect(routesBanner())
        ->toContain('CORS `paths`')
        ->toContain('`supports_credentials`')
        ->toContain('CSRF')
        ->toContain('Sanctum SPA flow')
        ->toContain('`Authorization` header');
});

it('warns that the viewAtrium gate lets users through in local', function (): void {
    expect(routesBanner())
        ->toContain('`viewAtrium` gate')
        ->toContain('`local` environment')
        ->toContain('APP_ENV=local');
});

it('no longer ships the v1 config keys, and keeps theme', function (): void {
    /** @var array<string, mixed> $config */
    $config = require configFilePath();

    expect($config)->not->toHaveKeys(['path', 'domain', 'middleware', 'alpine', 'logout_route'])
        ->and($config)->toHaveKey('theme')
        ->and(config('atrium'))->not->toHaveKeys(['path', 'domain', 'middleware', 'alpine', 'logout_route']);
});

it('builds client links from app.url and atrium.client_path', function (): void {
    config(['app.url' => 'https://app.test', 'atrium.client_path' => '/admin']);

    expect(ClientPath::for('https://app.test/admin/orders?x=1'))->toBe(['path' => '/orders?x=1', 'external' => false])
        ->and(ClientPath::for('https://app.test/billing'))->toBe(['path' => 'https://app.test/billing', 'external' => true])
        ->and(ClientPath::for('https://docs.example/guide'))->toBe(['path' => 'https://docs.example/guide', 'external' => true])
        ->and(ClientPath::for('javascript:alert(1)'))->toBeNull();
});

it('treats a missing client_path as the root', function (): void {
    config(['app.url' => 'https://app.test', 'atrium.client_path' => null]);

    expect(ClientPath::for('https://app.test/orders'))->toBe(['path' => '/orders', 'external' => false]);
});

it('reports API version 2.0', function (): void {
    expect(Atrium::API_VERSION)->toBe('2.0');
});
