<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations;

use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Services\ComposerInstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Support\ServiceProvider;

class IntegrationsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(InstalledPackages::class, ComposerInstalledPackages::class);
        $this->app->singleton(IntegrationFeatures::class);
        $this->app->singleton(IntegrationRegistry::class);
    }

    public function boot(): void
    {
        $this->loadApiRoutesFrom(__DIR__.'/routes.php');

        // Once every provider has booted, so the packages' own config
        // (`{pkg}.routes.*`) and the host's are all in place.
        $this->app->booted(function (): void {
            $this->app->make(IntegrationRegistry::class)->register();
        });
    }
}
