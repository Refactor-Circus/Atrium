<?php

declare(strict_types=1);

use Illuminate\Console\Events\CommandFinished;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\ServiceProvider;
use RefactorCircus\Atrium\Domains\Plugins\PluginsServiceProvider;
use RefactorCircus\Atrium\Domains\Plugins\Services\ComposerPluginDiscovery;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\BetaPlugin;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\NullOutput;

function fakeVendor(array $packages): string
{
    $path = sys_get_temp_dir().'/atrium-discovery-'.uniqid();

    mkdir($path.'/composer', 0777, true);

    file_put_contents(
        $path.'/composer/installed.json',
        json_encode(['packages' => $packages], JSON_THROW_ON_ERROR),
    );

    return $path;
}

function discovery(array $packages): ComposerPluginDiscovery
{
    return new ComposerPluginDiscovery(new Filesystem, fakeVendor($packages));
}

it('discovers plugins declared by installed packages', function (): void {
    $plugins = discovery([
        ['name' => 'acme/billing', 'extra' => ['atrium' => ['plugins' => [AlphaPlugin::class]]]],
        ['name' => 'acme/reports', 'extra' => ['atrium' => ['plugins' => [BetaPlugin::class]]]],
    ])->discover();

    expect($plugins)->toBe([AlphaPlugin::class, BetaPlugin::class]);
});

it('accepts a single plugin declared as a string', function (): void {
    $plugins = discovery([
        ['name' => 'acme/billing', 'extra' => ['atrium' => ['plugins' => AlphaPlugin::class]]],
    ])->discover();

    expect($plugins)->toBe([AlphaPlugin::class]);
});

it('ignores packages that declare no atrium plugins', function (): void {
    $plugins = discovery([
        ['name' => 'acme/unrelated'],
        ['name' => 'acme/other', 'extra' => ['laravel' => ['providers' => ['Something']]]],
        ['name' => 'acme/empty', 'extra' => ['atrium' => []]],
    ])->discover();

    expect($plugins)->toBe([]);
});

it('returns nothing when the composer manifest is missing', function (): void {
    $discovery = new ComposerPluginDiscovery(new Filesystem, '/does/not/exist');

    expect($discovery->discover())->toBe([]);
});

it('deduplicates a plugin declared by more than one package', function (): void {
    $plugins = discovery([
        ['name' => 'acme/one', 'extra' => ['atrium' => ['plugins' => [AlphaPlugin::class]]]],
        ['name' => 'acme/two', 'extra' => ['atrium' => ['plugins' => [AlphaPlugin::class]]]],
    ])->discover();

    expect($plugins)->toBe([AlphaPlugin::class]);
});

it('registers plugins listed in config', function (): void {
    config()->set('atrium.plugins', [AlphaPlugin::class]);

    app()->forgetInstance(PluginRegistry::class);

    $provider = app()->getProvider(PluginsServiceProvider::class);
    $provider->boot();

    expect(app(PluginRegistry::class)->has('alpha'))->toBeTrue();
});

/**
 * A discovery over the given packages that caches to a fresh temporary file.
 */
function cachedDiscovery(array $packages): ComposerPluginDiscovery
{
    return new ComposerPluginDiscovery(new Filesystem, fakeVendor($packages), sys_get_temp_dir().'/atrium-plugins-'.uniqid().'/atrium-plugins.php');
}

it('reads the installed packages live while nothing is cached', function (): void {
    $discovery = cachedDiscovery([
        ['name' => 'acme/billing', 'extra' => ['atrium' => ['plugins' => [AlphaPlugin::class]]]],
    ]);

    expect($discovery->discover())->toBe([AlphaPlugin::class])
        ->and(file_exists((string) $discovery->cachePath()))->toBeFalse();
});

it('serves the cached plugin list without reading the installed packages', function (): void {
    $discovery = cachedDiscovery([
        ['name' => 'acme/billing', 'extra' => ['atrium' => ['plugins' => [AlphaPlugin::class]]]],
    ]);

    expect($discovery->build())->toBe([AlphaPlugin::class]);

    // Composer's manifest changes, but the cache answers until rebuilt.
    $files = Mockery::mock(Filesystem::class)->makePartial();
    $files->shouldNotReceive('get');

    $cached = new ComposerPluginDiscovery($files, '/does/not/matter', $discovery->cachePath());

    expect($cached->discover())->toBe([AlphaPlugin::class]);

    $discovery->clear();

    expect(file_exists((string) $discovery->cachePath()))->toBeFalse();
});

it('caches and clears the discovered plugins from the console', function (): void {
    $discovery = cachedDiscovery([
        ['name' => 'acme/billing', 'extra' => ['atrium' => ['plugins' => [AlphaPlugin::class, BetaPlugin::class]]]],
    ]);

    app()->instance(ComposerPluginDiscovery::class, $discovery);

    $this->artisan('atrium:discover')->assertSuccessful()->expectsOutputToContain('2 Atrium plugin(s) cached.');

    expect(require $discovery->cachePath())->toBe([AlphaPlugin::class, BetaPlugin::class]);

    $this->artisan('atrium:clear-discovered')->assertSuccessful();

    expect(file_exists((string) $discovery->cachePath()))->toBeFalse();
});

it('rebuilds and clears the plugin cache with optimize and optimize:clear', function (): void {
    expect(ServiceProvider::$optimizeCommands)->toHaveKey('atrium-plugins', 'atrium:discover')
        ->and(ServiceProvider::$optimizeClearCommands)->toHaveKey('atrium-plugins', 'atrium:clear-discovered');
});

it('rebuilds the plugin cache after package:discover', function (): void {
    $discovery = cachedDiscovery([
        ['name' => 'acme/billing', 'extra' => ['atrium' => ['plugins' => [AlphaPlugin::class]]]],
    ]);

    app()->instance(ComposerPluginDiscovery::class, $discovery);

    event(new CommandFinished('package:discover', new ArrayInput([]), new NullOutput, 0));

    expect(require $discovery->cachePath())->toBe([AlphaPlugin::class]);

    $discovery->clear();
});

it('registers plugins from the cached list at boot', function (): void {
    $discovery = cachedDiscovery([
        ['name' => 'acme/billing', 'extra' => ['atrium' => ['plugins' => [AlphaPlugin::class]]]],
    ]);
    $discovery->build();

    app()->instance(ComposerPluginDiscovery::class, $discovery);
    app()->forgetInstance(PluginRegistry::class);

    app()->getProvider(PluginsServiceProvider::class)->boot();

    expect(app(PluginRegistry::class)->has('alpha'))->toBeTrue();

    $discovery->clear();
});
