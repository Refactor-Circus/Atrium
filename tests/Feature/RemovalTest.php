<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use RefactorCircus\Atrium\Atrium;

/*
 * Atrium 2 renders no HTML: the Blade UI, its stylesheet, icons and browser
 * suite are gone (AC 16), and the dist ships none of the repo's dev-only
 * folders.
 */

function repositoryPath(string $path = ''): string
{
    return dirname(__DIR__, 2).($path === '' ? '' : '/'.$path);
}

/**
 * @return array<string, mixed>
 */
function repositoryJson(string $path): array
{
    if (! file_exists(repositoryPath($path))) {
        return [];
    }

    $decoded = json_decode((string) file_get_contents(repositoryPath($path)), true);

    return is_array($decoded) ? $decoded : [];
}

it('ships no Blade-era views, stylesheet, icons or public build', function (string $path): void {
    expect(file_exists(repositoryPath($path)))->toBeFalse($path.' is removed');
})->with([
    'resources/views/components',
    'resources/views/layouts',
    'resources/views/dashboard.blade.php',
    'resources/css',
    'resources/icons',
    'public/atrium.css',
    'public/atrium.js',
    'public/alpine.js',
    'bin/build-css.mjs',
    'src/Support/StyleRegistry.php',
    'src/Support/Icons.php',
    'src/Testing/AtriumStyles.php',
    'src/Http/Controllers',
    'tests/Browser',
    'tests/BrowserTestCase.php',
    '.github/workflows/browser-tests.yml',
]);

it('leaves no public/atrium.* file', function (): void {
    expect(glob(repositoryPath('public/atrium.*')) ?: [])->toBe([]);
});

it('removes the Blade-era classes', function (string $class): void {
    expect(class_exists($class))->toBeFalse($class.' is removed');
})->with([
    'RefactorCircus\\Atrium\\Support\\StyleRegistry',
    'RefactorCircus\\Atrium\\Support\\Icons',
    'RefactorCircus\\Atrium\\Testing\\AtriumStyles',
    'RefactorCircus\\Atrium\\Tests\\BrowserTestCase',
    'RefactorCircus\\Atrium\\Domains\\Dashboard\\Http\\Controllers\\DashboardCrudController',
]);

it('removes the Blade-era traits', function (): void {
    expect(trait_exists('RefactorCircus\\Atrium\\Http\\Controllers\\Concerns\\AuthorizesScreens'))->toBeFalse();
});

it('drops the Blade-era helpers from the public API', function (string $method): void {
    expect(method_exists(Atrium::class, $method))->toBeFalse('Atrium::'.$method.'() is removed');
})->with(['css', 'stylesheet', 'path', 'url']);

it('serves one Blade view, the front end\'s page (D-079), and no component namespace or view and asset publish tags', function (): void {
    expect(glob(repositoryPath('resources/views/*')) ?: [])->toBe([repositoryPath('resources/views/app.blade.php')])
        ->and(View::exists('atrium::app'))->toBeTrue()
        ->and(Blade::getAnonymousComponentNamespaces())->not->toHaveKey('atrium')
        ->and(ServiceProvider::pathsToPublish(null, 'atrium-views'))->toBe([])
        ->and(ServiceProvider::pathsToPublish(null, 'atrium-assets'))->toBe([]);
});

it('keeps none of the removed config keys', function (string $key): void {
    expect(config('atrium'))->not->toHaveKey($key)
        ->and(require repositoryPath('config/atrium.php'))->not->toHaveKey($key);
})->with(['path', 'domain', 'middleware', 'alpine', 'logout_route']);

it('has no npm CSS build', function (): void {
    $package = repositoryJson('package.json');
    $scripts = is_array($package['scripts'] ?? null) ? $package['scripts'] : [];
    $dependencies = array_merge(
        is_array($package['dependencies'] ?? null) ? $package['dependencies'] : [],
        is_array($package['devDependencies'] ?? null) ? $package['devDependencies'] : [],
    );

    expect($scripts)->not->toHaveKeys(['build:css', 'build:alpine', 'postinstall'])
        ->and($dependencies)->not->toHaveKeys(['tailwindcss', '@tailwindcss/cli', 'alpinejs', 'playwright']);
});

it('drops the browser and CSS composer scripts and the browser plugin', function (): void {
    $composer = repositoryJson('composer.json');

    expect($composer['scripts'])->not->toHaveKeys(['test:browser', 'build:css'])
        ->and($composer['require-dev'])->not->toHaveKey('pestphp/pest-plugin-browser')
        ->and(json_encode($composer['scripts']))->not->toContain('Browser');
});

/**
 * The `.gitattributes` patterns marked `export-ignore`.
 *
 * @return list<string>
 */
function exportIgnoredPatterns(): array
{
    $rules = array_map(
        fn (string $line): array => preg_split('/\s+/', trim($line)) ?: [],
        file(repositoryPath('.gitattributes'), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [],
    );

    return array_values(array_map(
        fn (array $rule): string => $rule[0],
        array_filter($rules, fn (array $rule): bool => in_array('export-ignore', $rule, true)),
    ));
}

it('keeps the front end\'s sources, the workbench and the tests out of the dist', function (string $path): void {
    expect(exportIgnoredPatterns())->toContain($path);
})->with([
    '/ui/app',
    '/ui/workbench',
    '/ui/scripts',
    '/ui/package.json',
    '/ui/pnpm-workspace.yaml',
    '/ui/pnpm-lock.yaml',
    '/workbench',
    '/tests',
]);

it('keeps the prebuilt front end and the SDK in the dist: the page serves dist/, modules install the SDK by git (D-079, D-082)', function (string $path): void {
    $matching = array_filter(
        exportIgnoredPatterns(),
        fn (string $pattern): bool => fnmatch(rtrim($pattern, '/'), $path),
    );

    expect($matching)->toBe([], $path.' is not export-ignored');
})->with(['/dist', '/dist/build.json', '/ui/sdk', '/ui/sdk/package.json', '/ui/sdk/test/fixtures', '/resources/views/app.blade.php']);

it('has no Nuxt layer or playground left', function (string $path): void {
    expect(file_exists(repositoryPath($path)))->toBeFalse($path.' is removed');
})->with(['nuxt', 'workbench/app/Http/Middleware/AuthenticateWorkbenchToken.php']);
