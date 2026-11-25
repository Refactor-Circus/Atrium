<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations;

use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Services\ComposerInstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationHooks;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationManifests;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Support\ServiceProvider;

class IntegrationsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(InstalledPackages::class, ComposerInstalledPackages::class);
        $this->app->singleton(IntegrationManifests::class);
        $this->app->singleton(IntegrationFeatures::class);
        $this->app->singleton(IntegrationRegistry::class);
        $this->app->singleton(IntegrationHooks::class);
    }

    public function boot(): void
    {
        $this->loadApiRoutesFrom(__DIR__.'/routes.php');

        // Once every provider has booted, so the packages' own config
        // (`{pkg}.routes.*`), the host's, and every `Atrium::module()` and
        // `Atrium::integration()` are in place. The manifests' hooks follow,
        // since they place extensions on the screens the registered
        // integrations declare.
        $this->app->booted(function (): void {
            $this->app->make(IntegrationRegistry::class)->register();
            $this->app->make(IntegrationHooks::class)->register();
        });
    }
}
