<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains;

use Illuminate\Support\ServiceProvider;
use RefactorCircus\Atrium\Domains\Access\AccessServiceProvider;
use RefactorCircus\Atrium\Domains\Dashboard\DashboardServiceProvider;
use RefactorCircus\Atrium\Domains\Navigation\NavigationServiceProvider;
use RefactorCircus\Atrium\Domains\Plugins\PluginsServiceProvider;
use RefactorCircus\Atrium\Domains\Screens\ScreensServiceProvider;
use RefactorCircus\Atrium\Domains\Search\SearchServiceProvider;
use RefactorCircus\Atrium\Domains\Settings\SettingsServiceProvider;
use RefactorCircus\Atrium\Domains\Themes\ThemesServiceProvider;
use RefactorCircus\Atrium\Domains\Widgets\WidgetsServiceProvider;

class DomainServiceProvider extends ServiceProvider
{
    /**
     * The domain service providers.
     *
     * @var array<int, class-string<ServiceProvider>>
     */
    private array $providers = [
        AccessServiceProvider::class,
        DashboardServiceProvider::class,
        NavigationServiceProvider::class,
        PluginsServiceProvider::class,
        ScreensServiceProvider::class,
        SearchServiceProvider::class,
        SettingsServiceProvider::class,
        ThemesServiceProvider::class,
        WidgetsServiceProvider::class,
    ];

    public function register(): void
    {
        foreach ($this->providers as $provider) {
            $this->app->register($provider);
        }
    }
}
