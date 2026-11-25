<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Domains\Frontend\Http\Controllers\FrontendController;
use RefactorCircus\Atrium\Domains\Frontend\Services\AppPage;
use RefactorCircus\Atrium\Domains\Frontend\Services\FrontendAssets;
use RefactorCircus\Atrium\Domains\Frontend\Services\ModuleDiscovery;
use RefactorCircus\Atrium\Domains\Frontend\Services\ModuleRegistry;
use RefactorCircus\Atrium\Support\ServiceProvider;

/**
 * Atrium's front end (D-079, D-081, D-082): the one Blade page every path
 * under `atrium.client_path` renders, the route that serves the prebuilt
 * files (Atrium's and each module's), and the modules the page loads.
 */
final class FrontendServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ModuleDiscovery::class, fn (Application $app): ModuleDiscovery => new ModuleDiscovery(
            $app->make(Filesystem::class),
            $app->basePath('vendor'),
            $app->bootstrapPath('cache/atrium-modules.php'),
        ));

        $this->app->singleton(ModuleRegistry::class);
        $this->app->singleton(FrontendAssets::class);
        $this->app->singleton(AppPage::class);
    }

    public function boot(): void
    {
        $this->loadViewsFrom(dirname(__DIR__, 3).'/resources/views', 'atrium');

        // After every provider has booted, so the API group (and a host's
        // own routes) are registered first; the page is a fallback route
        // besides, matched only when nothing else is.
        $this->app->booted(function (): void {
            $this->registerRoutes();
        });
    }

    private function registerRoutes(): void
    {
        $config = $this->app->make(Repository::class);

        if (! filter_var($config->get('atrium.client.enabled', true), FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        $assets = $this->app->make(FrontendAssets::class)->prefix();

        Route::get($assets.'/{owner}/{version}/{path}', [FrontendController::class, 'asset'])
            ->where(['owner' => '[a-z0-9][a-z0-9_-]*', 'version' => '[A-Za-z0-9._-]+', 'path' => '.+'])
            ->name('atrium.assets');

        $base = trim((string) (is_string($path = $config->get('atrium.client_path', '/atrium')) ? $path : '/atrium'), '/');
        $middleware = $config->get('atrium.client.middleware', ['web', 'auth', Authorize::class]);

        Route::get(($base === '' ? '' : $base.'/').'{path?}', [FrontendController::class, 'show'])
            ->where('path', $this->pagePaths($base, [$assets, (string) $config->get('atrium.routes.prefix', 'atrium/api')]))
            ->middleware(is_array($middleware) ? $middleware : [])
            ->name('atrium.app')
            ->fallback();
    }

    /**
     * Every path under the client path but those of Atrium's API and assets,
     * which answer (or 404) on their own.
     *
     * @param  list<string>  $reserved
     */
    private function pagePaths(string $base, array $reserved): string
    {
        $excluded = [];

        foreach ($reserved as $prefix) {
            $prefix = trim($prefix, '/');

            if ($base === '') {
                $excluded[] = preg_quote($prefix, '#');
            } elseif (str_starts_with($prefix.'/', $base.'/') && $prefix !== $base) {
                $excluded[] = preg_quote(substr($prefix, strlen($base) + 1), '#');
            }
        }

        return $excluded === [] ? '.*' : '(?!(?:'.implode('|', $excluded).')(?:/|$)).*';
    }
}
