<?php

namespace Workbench\App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\DemoData;
use Workbench\App\Atrium\DemoPlugin;
use Workbench\App\Atrium\DemoScreens;
use Workbench\App\Atrium\DemoSuite;
use Workbench\App\Models\User;
use Workbench\App\OpenApi\AtriumOpenApi;
use Workbench\App\OpenApi\ExportOpenApiCommand;

/**
 * The workbench app is a host application of Atrium: `composer serve` serves
 * it on :8000, Atrium's page at /atrium (signed in as testbench.yaml's
 * `workbench.user` through /_workbench), with every staged suite module and
 * the workbench's own demo module loaded into it.
 *
 * It also holds the one Scramble configuration `workbench:openapi` exports
 * openapi.json with (`composer openapi:export`, AtriumOpenApi). Nothing in
 * src/ knows about Scramble: it is a dev dependency.
 */
class WorkbenchServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // The host chooses its auth: here Atrium's default, the session the
        // page was served in (web + auth, then Authorize), for the page and
        // the API alike.
        config([
            ...AtriumOpenApi::config(),
        ]);

        // The served workbench stands in for every suite package (DemoSuite),
        // with the packages' own modules when ATRIUM_SUITE_PATH points at their checkouts.
        if (DemoSuite::enabled($this->app)) {
            DemoSuite::register($this->app);
        }
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([ExportOpenApiCommand::class]);
        }

        AtriumOpenApi::register();

        // Installed packages are discovered from their composer.json; the
        // workbench app is the host, so it registers its plugin explicitly.
        Atrium::plugin(DemoPlugin::class);

        DemoScreens::register(Atrium::screens());

        // The workbench's own front-end module (ui/workbench), loaded the way
        // an app loads one it builds itself.
        Atrium::module(self::ui('workbench'));

        if (DemoSuite::enabled($this->app)) {
            DemoSuite::boot();
        }

        // The workbench dashboard is open to anyone signed in.
        // A real application defines a real gate.
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

    /**
     * A folder of the package's `ui/` workspace.
     */
    public static function ui(string $path): string
    {
        return dirname(__DIR__, 3).'/ui/'.$path;
    }
}
