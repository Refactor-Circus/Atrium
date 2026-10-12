<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Navigation;

use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationState;
use RefactorCircus\Atrium\Support\ServiceProvider;

class NavigationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(NavigationRegistry::class);
        $this->app->scoped(NavigationState::class);
    }
}
