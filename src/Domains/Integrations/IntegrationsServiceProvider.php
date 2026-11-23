<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations;

use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Services\ComposerInstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Integrations\Hooks\Hooks;
use RefactorCircus\Atrium\Support\ServiceProvider;

class IntegrationsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(InstalledPackages::class, ComposerInstalledPackages::class);
        $this->app->singleton(IntegrationFeatures::class);
        $this->app->singleton(IntegrationRegistry::class);
        $this->app->singleton(Hooks::class);
    }

    public function boot(): void
    {
        $this->loadApiRoutesFrom(__DIR__.'/routes.php');

        // Once every provider has booted, so the packages' own config
        // (`{pkg}.routes.*`) and the host's are all in place. The
        // cross-package hooks follow, since they place extensions on the
        // screens the registered integrations declare.
        $this->app->booted(function (): void {
            $this->app->make(IntegrationRegistry::class)->register();
            $this->app->make(Hooks::class)->register();
        });
    }
}
