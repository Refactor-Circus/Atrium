<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Access;

use Illuminate\Contracts\Http\Kernel as KernelContract;
use Illuminate\Foundation\Http\Kernel;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Support\Facades\Route;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\EnsureFeaturesAreEnabled;
use RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper;
use RefactorCircus\Atrium\Support\ServiceProvider;

class AccessServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Gatekeeper::class);
    }

    public function boot(): void
    {
        Route::aliasMiddleware('atrium.feature', EnsureFeaturesAreEnabled::class);

        $this->authorizeBeforeBinding();
    }

    /**
     * Authorize stays last in `atrium.routes.middleware`, after the host's
     * guard, but runs before route model binding: a guest gets 401 and a
     * refused user 403 on every route, never a 404 for a dashboard or
     * placement they may not look up.
     */
    private function authorizeBeforeBinding(): void
    {
        $this->callAfterResolving(KernelContract::class, function (mixed $kernel): void {
            if ($kernel instanceof Kernel) {
                $kernel->addToMiddlewarePriorityBefore(SubstituteBindings::class, Authorize::class);
            }
        });
    }
}
