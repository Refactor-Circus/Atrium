<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Console\Commands\InstallCommand;
use RefactorCircus\Atrium\Domains\DomainServiceProvider;
use RefactorCircus\Atrium\Support\StyleRegistry;
use RefactorCircus\Keystone\Packages\Package;
use RefactorCircus\Keystone\Support\PackageServiceProvider;

class AtriumServiceProvider extends PackageServiceProvider
{
    /**
     * The v1 config keys v2 no longer reads.
     */
    private const array REMOVED_CONFIG_KEYS = ['path', 'domain', 'middleware', 'alpine', 'logout_route'];

    /**
     * Whether this process has warned about removed config keys yet: once
     * per process, not on every boot.
     */
    private static bool $warnedAboutRemovedConfigKeys = false;

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
        $this->warnAboutRemovedConfigKeys();

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

    /**
     * A v1 config left in place must not be dropped silently: a guard in the
     * old `middleware` key no longer protects anything, and `routes.middleware`
     * does not inherit it.
     */
    private function warnAboutRemovedConfigKeys(): void
    {
        if (self::$warnedAboutRemovedConfigKeys) {
            return;
        }

        $config = $this->config()->get('atrium', []);

        $present = is_array($config)
            ? array_values(array_filter(self::REMOVED_CONFIG_KEYS, fn (string $key): bool => array_key_exists($key, $config)))
            : [];

        if ($present === []) {
            return;
        }

        self::$warnedAboutRemovedConfigKeys = true;

        Log::warning(sprintf(
            'Atrium 2 no longer reads the config keys [%s]; remove them from config/atrium.php. Its routes take their middleware from atrium.routes.middleware, which does not inherit the old middleware key: add your authentication guard there, before Authorize.',
            implode(', ', $present),
        ));
    }
}
