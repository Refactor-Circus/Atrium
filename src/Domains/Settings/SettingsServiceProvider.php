<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Settings;

use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Support\ServiceProvider;

class SettingsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SettingsRegistry::class);
    }

    public function boot(): void
    {
        $this->loadApiRoutesFrom(__DIR__.'/routes.php');
    }
}
