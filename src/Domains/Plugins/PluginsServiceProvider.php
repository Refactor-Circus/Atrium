<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Plugins;

use Illuminate\Console\Events\CommandFinished;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Plugins\Console\Commands\ClearDiscoveredPluginsCommand;
use RefactorCircus\Atrium\Domains\Plugins\Console\Commands\DiscoverPluginsCommand;
use RefactorCircus\Atrium\Domains\Plugins\Console\Commands\MakePluginCommand;
use RefactorCircus\Atrium\Domains\Plugins\Console\Commands\PluginListCommand;
use RefactorCircus\Atrium\Domains\Plugins\Services\ComposerPluginDiscovery;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Support\ServiceProvider;

class PluginsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ComposerPluginDiscovery::class, fn (Application $app): ComposerPluginDiscovery => new ComposerPluginDiscovery(
            $app->make(Filesystem::class),
            $app->basePath('vendor'),
            $app->bootstrapPath('cache/atrium-plugins.php'),
        ));

        $this->app->singleton(PluginRegistry::class, function (Application $app): PluginRegistry {
            $disabled = $app->make(Repository::class)->get('atrium.disabled', []);

            return new PluginRegistry($app)->disable(is_array($disabled) ? $disabled : []);
        });
    }

    public function boot(): void
    {
        $this->registerPlugins();

        $this->bootRoutes();

        if ($this->app->runningInConsole()) {
            $this->commands([
                ClearDiscoveredPluginsCommand::class,
                DiscoverPluginsCommand::class,
                MakePluginCommand::class,
                PluginListCommand::class,
            ]);

            $this->optimizes(
                optimize: 'atrium:discover',
                clear: 'atrium:clear-discovered',
                key: 'atrium-plugins',
            );

            // Composer runs package:discover after every install and update,
            // so the cached plugin list is rebuilt along with Laravel's own.
            $this->app->make(Dispatcher::class)->listen(function (CommandFinished $event): void {
                if ($event->command === 'package:discover' && $event->exitCode === 0) {
                    $this->app->make(ComposerPluginDiscovery::class)->build();
                }
            });
        }
    }

    /**
     * Register the discovered and configured plugins.
     */
    private function registerPlugins(): void
    {
        $registry = $this->app->make(PluginRegistry::class);

        $config = $this->app->make(Repository::class);

        if ($config->get('atrium.discover', true) === true) {
            $registry->registerMany(
                $this->app->make(ComposerPluginDiscovery::class)->discover(),
            );
        }

        $configured = $config->get('atrium.plugins', []);

        if (is_array($configured)) {
            $registry->registerMany($configured);
        }
    }

    /**
     * Plugin routes go in their own group with the dashboard's attributes,
     * registered once every provider has booted. That ordering lets a host
     * application register a plugin in its own boot() and still get its
     * routes, while the shared attributes keep those routes behind Atrium's
     * prefix and middleware.
     */
    private function bootRoutes(): void
    {
        if ($this->routesAreCached()) {
            return;
        }

        $attributes = $this->dashboardRouteAttributes();

        $this->app->booted(function () use ($attributes): void {
            Route::group($attributes, __DIR__.'/routes.php');
        });
    }
}
