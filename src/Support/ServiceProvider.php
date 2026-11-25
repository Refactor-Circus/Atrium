<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Support;

use Closure;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\ForceJsonResponse;
use RefactorCircus\Keystone\Support\ServiceProvider as BaseServiceProvider;

/**
 * Base class for Atrium's domain service providers.
 *
 * Atrium serves a JSON API. Every route, plugin routes included, sits in one
 * group: Keystone's `loadApiRoutesFrom()` group from `atrium.routes.enabled`,
 * `routes.prefix` and `routes.middleware`, named `atrium.`. Each domain loads
 * its own `routes.php` through it rather than building the group itself.
 */
abstract class ServiceProvider extends BaseServiceProvider
{
    /**
     * Load a routes file, or a closure declaring routes, inside Atrium's API
     * group, with JSON rendering forced ahead of the configured middleware:
     * a guest's 401 from the host's guard, a 404 or a 422 is JSON whatever
     * the request's `Accept` header.
     */
    protected function loadApiRoutesFrom(string|Closure $routes): void
    {
        Route::middleware(ForceJsonResponse::class)->group(function () use ($routes): void {
            parent::loadApiRoutesFrom($routes);
        });
    }
}
