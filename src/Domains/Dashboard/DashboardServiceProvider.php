<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Dashboard;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Dashboard\Services\DashboardManager;
use RefactorCircus\Atrium\Support\ServiceProvider;

class DashboardServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(DashboardManager::class);
    }

    public function boot(): void
    {
        $this->bindRouteModels();

        $this->loadApiRoutesFrom(__DIR__.'/routes.php');
    }

    /**
     * Bind `{dashboard:slug}` and `{widget:uuid}` on Atrium's routes, whose
     * controllers take only their request.
     *
     * Slugs are unique per owner, not across dashboards, so a dashboard is
     * found among those the user may view: one they cannot see is not found.
     * A placement is found through its dashboard (the route's scoped
     * binding), so one on another dashboard is not found either. Routes
     * outside Atrium keep their own parameters.
     */
    private function bindRouteModels(): void
    {
        Route::bind('dashboard', function (string $slug, RoutingRoute $route): DashboardModel|string {
            if (! $route->named('atrium.*')) {
                return $slug;
            }

            return $this->app->make(DashboardManager::class)->findVisible($this->app->make(Request::class), $slug)
                ?? throw (new ModelNotFoundException)->setModel(DashboardModel::class, [$slug]);
        });

        Route::bind('widget', function (string $uuid, RoutingRoute $route): DashboardWidgetModel|string {
            $dashboard = $route->parameter('dashboard');

            if (! $route->named('atrium.*') || ! $dashboard instanceof DashboardModel) {
                return $uuid;
            }

            $widget = $dashboard->resolveChildRouteBinding('widget', $uuid, $route->bindingFieldFor('widget') ?? 'uuid');

            return $widget instanceof DashboardWidgetModel
                ? $widget
                : throw (new ModelNotFoundException)->setModel(DashboardWidgetModel::class, [$uuid]);
        });
    }
}
