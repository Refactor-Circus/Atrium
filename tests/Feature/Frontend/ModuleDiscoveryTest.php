<?php

declare(strict_types=1);

use Illuminate\Filesystem\Filesystem;
use RefactorCircus\Atrium\Domains\Frontend\Data\ModuleManifest;
use RefactorCircus\Atrium\Domains\Frontend\Services\ModuleDiscovery;

/*
 * Module discovery (D-082): an installed package declares its front-end
 * module in composer.json's `extra.atrium`, with no dependency on Atrium,
 * and Atrium finds it as it finds plugins: from installed.json, cached in
 * bootstrap/cache beside the plugin list by `atrium:discover`.
 */

/**
 * A vendor folder whose installed.json lists `$packages`.
 *
 * @param  list<array<string, mixed>>  $packages
 */
function fakeVendor(array $packages): string
{
    $vendor = sys_get_temp_dir().'/atrium-modules-'.bin2hex(random_bytes(4));
    mkdir($vendor.'/composer', 0777, true);
    file_put_contents($vendor.'/composer/installed.json', json_encode(['packages' => $packages]));

    return $vendor;
}

it('discovers the scripts and styles a package declares, relative to its folder, keyed by its name', function (): void {
    $vendor = fakeVendor([
        ['name' => 'acme/billing', 'install-path' => '../acme/billing', 'extra' => ['atrium' => ['scripts' => ['dist/atrium/atrium.js'], 'styles' => ['./dist/atrium/atrium.css']]]],
        ['name' => 'acme/plain', 'install-path' => '../acme/plain', 'extra' => ['laravel' => []]],
        ['name' => 'refactor-circus/roster', 'install-path' => '../refactor-circus/roster', 'extra' => ['atrium' => ['key' => 'roster', 'scripts' => 'dist/atrium/atrium.js']]],
    ]);

    $modules = new ModuleDiscovery(new Filesystem, $vendor)->discover();

    expect(array_map(fn (ModuleManifest $module): array => [$module->key, $module->root, $module->scripts, $module->styles], $modules))->toBe([
        ['billing', $vendor.'/acme/billing', ['dist/atrium/atrium.js'], ['dist/atrium/atrium.css']],
        ['roster', $vendor.'/refactor-circus/roster', ['dist/atrium/atrium.js'], []],
    ]);
});

it('drops a path that could leave the package: absolute, `..`, backslashes', function (): void {
    $vendor = fakeVendor([
        ['name' => 'acme/sly', 'extra' => ['atrium' => ['scripts' => ['/etc/passwd', '../other/a.js', 'dist\\a.js', 'dist/ok.js']]]],
    ]);

    expect(new ModuleDiscovery(new Filesystem, $vendor)->discover()[0]->scripts)->toBe(['dist/ok.js']);
});

it('caches the list with paths relative to vendor/, reads the cache, and clears it', function (): void {
    $vendor = fakeVendor([
        ['name' => 'acme/billing', 'install-path' => '../acme/billing', 'extra' => ['atrium' => ['scripts' => ['dist/atrium/atrium.js']]]],
    ]);
    $cache = $vendor.'/cache/atrium-modules.php';
    $discovery = new ModuleDiscovery(new Filesystem, $vendor, $cache);

    $discovery->build();

    expect((string) file_get_contents($cache))->toContain("'path' => 'acme/billing'")
        ->not->toContain($vendor);

    unlink($vendor.'/composer/installed.json');

    expect($discovery->discover()[0]->key)->toBe('billing');

    $discovery->clear();

    expect(file_exists($cache))->toBeFalse()
        ->and($discovery->discover())->toBe([]);
});

it('caches modules with atrium:discover and clears them with atrium:clear-discovered', function (): void {
    $this->artisan('atrium:discover')->expectsOutputToContain('front-end module(s) cached')->assertSuccessful();

    expect(file_exists(app()->bootstrapPath('cache/atrium-modules.php')))->toBeTrue();

    $this->artisan('atrium:clear-discovered')->assertSuccessful();

    expect(file_exists(app()->bootstrapPath('cache/atrium-modules.php')))->toBeFalse();
});
