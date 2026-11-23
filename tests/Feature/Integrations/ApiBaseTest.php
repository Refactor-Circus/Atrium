<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;

/*
 * The API base (AC 40, D-026): a non-empty `atrium.integrations.{pkg}.api_base`
 * wins; otherwise `/` plus the package's trimmed `{pkg}.routes.prefix`, while
 * `{pkg}.routes.enabled` is true. With neither, the integration does not
 * register, and Atrium warns once per process.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();

    IntegrationFixture::installed('cortex');
    IntegrationFixture::fake('cortex');
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * The warning that names both keys to set for the package.
 */
function apiBaseWarningFor(string $key): Closure
{
    return fn (string $message): bool => str_contains($message, $key.'.routes.enabled')
        && str_contains($message, 'atrium.integrations.'.$key.'.api_base');
}

it('reads the base from the package\'s own route prefix', function (string $prefix): void {
    config()->set('cortex.routes', ['enabled' => true, 'prefix' => $prefix]);

    expect(IntegrationFixture::register()->get('cortex')?->apiBase)->toBe('/cortex/api');
})->with([
    'bare' => ['cortex/api'],
    'with slashes' => ['/cortex/api/'],
]);

it('lets a non-empty api_base win over the prefix', function (bool $routesEnabled): void {
    config()->set('cortex.routes', ['enabled' => $routesEnabled, 'prefix' => 'cortex/api']);
    config()->set('atrium.integrations.cortex.api_base', 'https://api.example.com/cortex');

    expect(IntegrationFixture::register()->get('cortex')?->apiBase)->toBe('https://api.example.com/cortex');
})->with([
    'package routes on' => [true],
    'package routes off' => [false],
]);

it('ignores an empty api_base', function (mixed $apiBase): void {
    config()->set('cortex.routes', ['enabled' => true, 'prefix' => 'cortex/api']);
    config()->set('atrium.integrations.cortex.api_base', $apiBase);

    expect(IntegrationFixture::register()->get('cortex')?->apiBase)->toBe('/cortex/api');
})->with([
    'empty' => [''],
    'blank' => ['   '],
    'null' => [null],
]);

it('does not register while the package routes are off, and warns once per process', function (): void {
    Log::spy();

    config()->set('cortex.routes', ['enabled' => false, 'prefix' => 'cortex/api']);

    expect(IntegrationFixture::register()->all())->toBe([]);

    // A second boot, with a fresh registry, as a new application would have.
    app()->forgetInstance(IntegrationRegistry::class);

    expect(IntegrationFixture::register()->all())->toBe([]);

    Log::shouldHaveReceived('warning')->withArgs(apiBaseWarningFor('cortex'))->once();
});

it('does not register a package with no config at all, and warns', function (): void {
    Log::spy();

    expect(config('cortex'))->toBeNull()
        ->and(IntegrationFixture::register()->all())->toBe([]);

    Log::shouldHaveReceived('warning')->withArgs(apiBaseWarningFor('cortex'))->once();
});

it('does not register a package whose prefix is not a string', function (): void {
    Log::spy();

    config()->set('cortex.routes', ['enabled' => true, 'prefix' => null]);

    expect(IntegrationFixture::register()->all())->toBe([]);

    Log::shouldHaveReceived('warning')->withArgs(apiBaseWarningFor('cortex'))->once();
});

it('warns for each package on its own', function (): void {
    Log::spy();

    IntegrationFixture::installed('cortex', 'roster');
    IntegrationFixture::fake('roster');

    expect(IntegrationFixture::register()->all())->toBe([]);

    Log::shouldHaveReceived('warning')->withArgs(apiBaseWarningFor('cortex'))->once();
    Log::shouldHaveReceived('warning')->withArgs(apiBaseWarningFor('roster'))->once();
});

it('does not warn about a package that is not installed', function (): void {
    Log::spy();

    IntegrationFixture::installed();
    IntegrationFixture::register();

    Log::shouldNotHaveReceived('warning');
});
