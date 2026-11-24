<?php

namespace Workbench\App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use RefactorCircus\Atrium\Domains\Access\Http\Middleware\Authorize;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Atrium\DemoData;
use Workbench\App\Atrium\DemoPlugin;
use Workbench\App\Atrium\DemoScreens;
use Workbench\App\Atrium\DemoSuite;
use Workbench\App\Http\Middleware\AuthenticateWorkbenchToken;
use Workbench\App\Models\User;
use Workbench\App\OpenApi\AtriumOpenApi;
use Workbench\App\OpenApi\ExportOpenApiCommand;

/**
 * The workbench app is a host application of Atrium's JSON API: `composer
 * serve` serves it on :8000, and the Nuxt playground (`nuxt/playground`, on
 * :3000) renders it.
 *
 * It also holds the one Scramble configuration `workbench:openapi` exports
 * openapi.json with (`composer openapi:export`, AtriumOpenApi). Nothing in
 * src/ knows about Scramble: it is a dev dependency.
 */
class WorkbenchServiceProvider extends ServiceProvider
{
    /**
     * The origins the Nuxt playground's dev server runs on.
     *
     * @var list<string>
     */
    public const array PLAYGROUND_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

    /**
     * Register services.
     */
    public function register(): void
    {
        // The host chooses its auth: here, the workbench-only bearer token
        // guard, before Authorize as every host guard must be. The playground
        // reads the API across origins, so CORS allows its dev server and the
        // `Authorization` header; with token auth no cookies cross, so
        // credentials stay off. A host using cookie (Sanctum SPA) auth sets
        // `supports_credentials` and the CSRF flow instead.
        config([
            'atrium.routes.middleware' => ['api', AuthenticateWorkbenchToken::class, Authorize::class],
            'cors.paths' => ['atrium/api/*'],
            'cors.allowed_origins' => self::PLAYGROUND_ORIGINS,
            'cors.allowed_methods' => ['*'],
            'cors.allowed_headers' => ['*'],
            'cors.supports_credentials' => false,
            ...AtriumOpenApi::config(),
        ]);

        // The served workbench stands in for every suite package (DemoSuite),
        // so the playground renders each integration's pages populated.
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

        if (DemoSuite::enabled($this->app)) {
            DemoSuite::boot();
        }

        // The workbench dashboard is open to anyone the token guard signs in.
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
}
