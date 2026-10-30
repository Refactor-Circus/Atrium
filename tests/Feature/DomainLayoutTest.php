<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Relations\Relation;
use RefactorCircus\Atrium\Domains\Access\AccessServiceProvider;
use RefactorCircus\Atrium\Domains\Dashboard\DashboardServiceProvider;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\DomainServiceProvider;
use RefactorCircus\Atrium\Domains\Navigation\NavigationServiceProvider;
use RefactorCircus\Atrium\Domains\Plugins\PluginsServiceProvider;
use RefactorCircus\Atrium\Domains\Search\SearchServiceProvider;
use RefactorCircus\Atrium\Domains\Settings\SettingsServiceProvider;
use RefactorCircus\Atrium\Domains\Themes\ThemesServiceProvider;
use RefactorCircus\Atrium\Domains\Widgets\WidgetsServiceProvider;

it('registers every domain service provider', function (string $provider): void {
    expect(app()->getProvider($provider))->toBeInstanceOf($provider);
})->with([
    DomainServiceProvider::class,
    AccessServiceProvider::class,
    DashboardServiceProvider::class,
    NavigationServiceProvider::class,
    PluginsServiceProvider::class,
    SearchServiceProvider::class,
    SettingsServiceProvider::class,
    ThemesServiceProvider::class,
    WidgetsServiceProvider::class,
]);

it('stores models under their own class names', function (): void {
    expect(new DashboardModel()->getMorphClass())->toBe(DashboardModel::class)
        ->and(new DashboardWidgetModel()->getMorphClass())->toBe(DashboardWidgetModel::class)
        ->and(Relation::getMorphedModel('RefactorCircus\\Atrium\\Models\\Dashboard'))->toBeNull();
});
