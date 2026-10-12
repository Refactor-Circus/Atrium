<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium;

use Illuminate\Support\Facades\Blade;
use RefactorCircus\Atrium\Console\Commands\InstallCommand;
use RefactorCircus\Atrium\Domains\DomainServiceProvider;
use RefactorCircus\Atrium\Support\StyleRegistry;
use RefactorCircus\Keystone\Packages\Package;
use RefactorCircus\Keystone\Support\PackageServiceProvider;

class AtriumServiceProvider extends PackageServiceProvider
{
    /**
     * The dashboard always authorizes through the Gate: every screen acts
     * as the signed-in user, unless `atrium.authorization` turns it off.
     */
    protected function definition(): Package
    {
        return Package::make('atrium', __NAMESPACE__)->label('Atrium')->authorization();
    }

    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/atrium.php', 'atrium');

        $this->registerPackage();

        $this->app->singleton(StyleRegistry::class);
        $this->app->singleton(Atrium::class);

        $this->app->register(DomainServiceProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
        $this->registerNotFoundResponses();

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'atrium');

        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        $this->loadTranslationsFrom(__DIR__.'/../lang', 'atrium');

        // Exposes the shared library as <x-atrium::card>, usable anywhere in
        // the host application, inside the dashboard shell or outside it.
        Blade::anonymousComponentNamespace('atrium::components', 'atrium');

        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__.'/../config/atrium.php' => config_path('atrium.php'),
        ], ['atrium', 'atrium-config']);

        $this->publishes([
            __DIR__.'/../resources/views' => resource_path('views/vendor/atrium'),
        ], ['atrium', 'atrium-views']);

        $this->publishes([
            __DIR__.'/../lang' => $this->app->langPath('vendor/atrium'),
        ], ['atrium', 'atrium-lang']);

        $this->publishes([
            __DIR__.'/../public' => public_path('vendor/atrium'),
        ], ['atrium', 'atrium-assets']);

        $this->publishesMigrations([
            __DIR__.'/../database/migrations' => database_path('migrations'),
        ], ['atrium', 'atrium-migrations']);

        $this->publishes([
            __DIR__.'/../stubs' => base_path('stubs/atrium'),
        ], ['atrium', 'atrium-stubs']);

        $this->commands([
            InstallCommand::class,
        ]);
    }
}
