<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Screens;

use RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions;
use RefactorCircus\Atrium\Domains\Screens\Services\ScreenVisibility;
use RefactorCircus\Atrium\Support\ServiceProvider;

/**
 * Screen extensions: the registry packages fill from `boot()`, which lasts
 * for the process, and the per-request answers about who sees what.
 */
final class ScreensServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ScreenExtensions::class);
        $this->app->scoped(ScreenVisibility::class);
    }
}
