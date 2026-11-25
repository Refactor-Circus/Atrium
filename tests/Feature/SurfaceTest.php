<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Keystone\Packages\PackageRegistry;
use RefactorCircus\Keystone\Support\Surface;

/*
 * The surface (AC 46): Atrium names its own `atrium.` route prefix on
 * Keystone's Surface, rather than relying on a prefix Keystone builds in.
 */

/**
 * The prefixes a Surface was told about through `route()`, which Keystone's
 * built-in fallbacks are not part of. Surface is final, so this reads what
 * the instance recorded instead of a mock's call log.
 *
 * @return array<string, string>
 */
function surfaceRoutesRecordedOn(Surface $surface): array
{
    return new ReflectionProperty(Surface::class, 'routes')->getValue($surface);
}

it('names the atrium. prefix on the surface Atrium boots with', function (): void {
    expect(surfaceRoutesRecordedOn(app(Surface::class)))->toMatchArray(['atrium.' => 'atrium']);
});

it('names the prefix on every surface the container builds, since the surface is scoped', function (): void {
    $built = [];

    // A fresh Surface on each resolution, as each request or job gets one.
    app()->bind(Surface::class, function () use (&$built): Surface {
        return $built[] = new Surface(app(), app(PackageRegistry::class));
    });

    app(Surface::class);
    app()->forgetScopedInstances();
    app(Surface::class);

    expect($built)->toHaveCount(2)
        ->and(array_map(surfaceRoutesRecordedOn(...), $built))->each->toBe(['atrium.' => 'atrium']);
});

it('resolves a request to the atrium.shell route as the atrium surface', function (): void {
    $route = Route::getRoutes()->getByName('atrium.shell');

    expect($route)->not->toBeNull();

    $request = Request::create(route('atrium.shell'));
    $request->setRouteResolver(fn (): ?RoutingRoute => $route);

    app()->instance('request', $request);

    expect(app(Surface::class)->current())->toBe('atrium');
});
