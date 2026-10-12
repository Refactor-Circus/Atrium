<?php

declare(strict_types=1);

use Illuminate\Auth\GenericUser;
use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Plugins\Exceptions\InvalidPluginException;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\BetaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\NotAPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\UnauthorizedPlugin;

function registry(): PluginRegistry
{
    return app(PluginRegistry::class);
}

it('registers a plugin from a class string', function (): void {
    registry()->register(AlphaPlugin::class);

    expect(registry()->has('alpha'))->toBeTrue()
        ->and(registry()->get('alpha'))->toBeInstanceOf(AlphaPlugin::class);
});

it('registers a plugin from an instance', function (): void {
    registry()->register(new BetaPlugin);

    expect(registry()->get('beta'))->toBeInstanceOf(BetaPlugin::class);
});

it('keys plugins so each is registered once', function (): void {
    registry()->register(AlphaPlugin::class)->register(AlphaPlugin::class);

    expect(registry()->all())->toHaveCount(1);
});

it('rejects a class that does not implement the plugin contract', function (): void {
    registry()->register(NotAPlugin::class);
})->throws(InvalidPluginException::class, 'must implement');

it('rejects a plugin class that does not exist', function (): void {
    registry()->register('App\\Nope\\MissingPlugin');
})->throws(InvalidPluginException::class, 'does not exist');

it('rejects two different plugins claiming the same key', function (): void {
    $duplicate = new class extends Plugin
    {
        public function key(): string
        {
            return 'alpha';
        }
    };

    registry()->register(AlphaPlugin::class)->register($duplicate);
})->throws(InvalidPluginException::class, 'already registered');

it('skips plugins the host app disabled', function (): void {
    registry()->disable(['alpha'])->registerMany([AlphaPlugin::class, BetaPlugin::class]);

    expect(registry()->has('alpha'))->toBeFalse()
        ->and(registry()->has('beta'))->toBeTrue();
});

it('filters unauthorized plugins out of the authorized list', function (): void {
    registry()->registerMany([AlphaPlugin::class, UnauthorizedPlugin::class]);

    $authorized = registry()->authorized(Request::create('/atrium'));

    expect($authorized)->toHaveKey('alpha')
        ->and($authorized)->not->toHaveKey('restricted')
        ->and(registry()->all())->toHaveCount(2);
});

/**
 * A plugin that counts how often it is asked whether a request may see it.
 */
function countingPlugin(): Plugin
{
    return new class extends Plugin
    {
        public int $asked = 0;

        public function key(): string
        {
            return 'counting';
        }

        public function authorize(Request $request): bool
        {
            $this->asked++;

            return true;
        }
    };
}

it('decides once per request which plugins it may see', function (): void {
    registry()->register($plugin = countingPlugin());

    $request = Request::create('/atrium');

    registry()->authorized($request);
    registry()->authorized($request);
    registry()->authorized($request);

    expect($plugin->asked)->toBe(1);

    registry()->authorized(Request::create('/atrium'));

    expect($plugin->asked)->toBe(2);
});

it('decides again when the request user changes or a plugin is registered', function (): void {
    registry()->register($plugin = countingPlugin());

    $request = Request::create('/atrium');

    registry()->authorized($request);

    $request->setUserResolver(fn (): GenericUser => new GenericUser(['id' => 1]));
    registry()->authorized($request);

    expect($plugin->asked)->toBe(2);

    registry()->register(AlphaPlugin::class);

    expect(registry()->authorized($request))->toHaveKeys(['counting', 'alpha'])
        ->and($plugin->asked)->toBe(3);
});

it('asks each plugin once while rendering a dashboard page', function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    registry()->register($plugin = countingPlugin());

    $this->get('/atrium')->assertOk();

    expect($plugin->asked)->toBe(1);
});
