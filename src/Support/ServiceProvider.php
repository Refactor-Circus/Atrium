<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Support;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Keystone\Support\ServiceProvider as BaseServiceProvider;

/**
 * Base class for Atrium's domain service providers.
 *
 * Atrium's routes are dashboard screens rather than a JSON API. Every one
 * shares one group - the configured path, domain and
 * middleware, and the `atrium.` name prefix - so each domain loads its
 * routes file through `loadDashboardRoutesFrom()` rather than building the
 * group itself.
 */
abstract class ServiceProvider extends BaseServiceProvider
{
    /**
     * Load a routes file inside the dashboard's route group.
     */
    protected function loadDashboardRoutesFrom(string $path): void
    {
        if ($this->routesAreCached()) {
            return;
        }

        Route::group($this->dashboardRouteAttributes(), $path);
    }

    /**
     * The attributes every dashboard route is registered with.
     *
     * @return array<string, mixed>
     */
    protected function dashboardRouteAttributes(): array
    {
        $config = $this->app->make(Repository::class);

        return array_filter([
            'domain' => $config->get('atrium.domain'),
            'prefix' => $config->get('atrium.path', 'atrium'),
            // The `middleware` key left the config in v2; until these routes
            // move to `atrium.routes`, keep them behind Authorize without it.
            'middleware' => $config->get('atrium.middleware', ['web', Authorize::class]),
            'as' => 'atrium.',
        ]);
    }
}
