<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\AtriumServiceProvider;

/**
 * The warning is logged once per process, so forget an earlier test's boot.
 */
function forgetRemovedConfigKeysWarning(): void
{
    new ReflectionProperty(AtriumServiceProvider::class, 'warnedAboutRemovedConfigKeys')->setValue(null, false);
}

beforeEach(function (): void {
    forgetRemovedConfigKeysWarning();
});

afterEach(function (): void {
    forgetRemovedConfigKeysWarning();
});

it('logs one warning naming each removed key still present, however often the provider boots', function (): void {
    Log::spy();

    config([
        'atrium.middleware' => ['web', 'auth'],
        'atrium.alpine' => true,
        'atrium.logout_route' => 'logout',
    ]);

    $this->app->getProvider(AtriumServiceProvider::class)?->boot();
    $this->app->getProvider(AtriumServiceProvider::class)?->boot();
    new AtriumServiceProvider($this->app)->boot();

    Log::shouldHaveReceived('warning')->once()->withArgs(function (string $message): bool {
        expect($message)
            ->toContain('[middleware, alpine, logout_route]')
            ->toContain('atrium.routes.middleware')
            ->not->toContain('path,')
            ->not->toContain('domain');

        return true;
    });
});

it('names a key that is present with a null value', function (): void {
    Log::spy();

    config(['atrium.domain' => null, 'atrium.path' => 'atrium']);

    $this->app->getProvider(AtriumServiceProvider::class)?->boot();

    Log::shouldHaveReceived('warning')->once()->withArgs(
        fn (string $message): bool => str_contains($message, '[path, domain]'),
    );
});

it('logs nothing when no removed key is present', function (): void {
    Log::spy();

    $this->app->getProvider(AtriumServiceProvider::class)?->boot();

    Log::shouldNotHaveReceived('warning');
});
