<?php

namespace Workbench\App\Providers;

use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Foundation\Http\Kernel;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\DemoData;
use Workbench\App\Atrium\DemoPlugin;
use Workbench\App\Atrium\ScreenHost\ScreenHostPlugin;
use Workbench\App\Http\Middleware\SignInWorkbenchUser;
use Workbench\App\Models\User;

class WorkbenchServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Keep the workbench user signed in whatever URL is opened first.
        $this->callAfterResolving(HttpKernel::class, function (HttpKernel $kernel): void {
            if ($kernel instanceof Kernel) {
                $kernel->appendMiddlewareToGroup('web', SignInWorkbenchUser::class);
            }
        });

        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'workbench');

        // Installed packages are discovered from their composer.json; the
        // workbench app is the host, so it registers its plugins explicitly.
        // The screen host's pages are the screen-extensions test screens.
        Atrium::plugin(DemoPlugin::class);
        Atrium::plugin(ScreenHostPlugin::class);

        // The workbench dashboard is open so `composer serve` is usable
        // without logging in. A real application defines a real gate.
        Gate::define('viewAtrium', fn ($user = null): bool => true);

        // The permissions the demo's navigation is gated by. The seeded admin
        // holds all of them; everyone signed in may read reports.
        Gate::define('viewReports', fn (User $user): bool => true);
        Gate::define('administer', fn (User $user): bool => $user->email === 'admin@example.com');
        Gate::define('manageBilling', fn (User $user): bool => $user->email === 'admin@example.com');

        // A stand-in for a feature-flag package: `audit-log` is off, so its
        // navigation item stays hidden.
        Atrium::resolveFeaturesUsing(fn (string $feature): bool => DemoData::FEATURES[$feature] ?? true);
    }
}
