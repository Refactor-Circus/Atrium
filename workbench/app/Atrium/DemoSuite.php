<?php

declare(strict_types=1);

namespace Workbench\App\Atrium;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Env;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Themes\Data\Theme;
use RefactorCircus\Atrium\Facades\Atrium;
use Workbench\App\Providers\WorkbenchServiceProvider;

/**
 * WORKBENCH ONLY. The suite integrations as the design bench: every package
 * reported installed, its API pointed at the workbench's stand-in
 * (SuiteStandIn, `/_suite/{pkg}/…`, which answers from each staged module's
 * vendored openapi.json), and each package's staged module
 * (ui/modules/{pkg}) loaded with Atrium::module() as if the package were
 * installed, so every module's pages render populated while none of the
 * packages is installed here.
 *
 * Only the served workbench uses it (`composer serve`, never the console or
 * the test suite), and only while ATRIUM_WORKBENCH_SUITE is not "false".
 * It also registers `signal`, a brand theme (red primary, near-square
 * corners, neutral greys) to check the layer under a host's colours.
 */
final class DemoSuite implements InstalledPackages
{
    /** The packages the integrations stand for. */
    public const array PACKAGES = ['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom'];

    /** Where the stand-in answers for the packages, on the workbench's own host. */
    public const string STAND_IN = '/_suite';

    public static function enabled(Application $app): bool
    {
        return ! $app->runningInConsole()
            && filter_var(Env::get('ATRIUM_WORKBENCH_SUITE', true), FILTER_VALIDATE_BOOLEAN);
    }

    public static function register(Application $app): void
    {
        $app->singleton(InstalledPackages::class, self::class);

        $overrides = ['pennant.default' => 'array'];

        foreach (self::PACKAGES as $key) {
            $overrides["atrium.integrations.{$key}.api_base"] = self::STAND_IN.'/'.$key;
        }

        config($overrides);
    }

    public static function boot(): void
    {
        foreach (self::PACKAGES as $key) {
            Atrium::module(WorkbenchServiceProvider::ui('modules/'.$key));
        }

        Atrium::theme(
            Theme::make('signal')
                ->label('Signal')
                ->swatch('#fe1940')
                ->radius('0.125rem')
                ->colors([
                    'canvas' => '#f4f4f4',
                    'surface' => '#ffffff',
                    'surface-alt' => '#fbfbfb',
                    'on-surface' => '#474747',
                    'on-surface-strong' => '#1d1d1d',
                    'primary' => '#fe1940',
                    'on-primary' => '#ffffff',
                    'secondary' => '#1d1d1d',
                    'on-secondary' => '#ffffff',
                    'outline' => '#e7e7e7',
                    'outline-strong' => '#343434',
                    'canvas-dark' => '#000000',
                    'surface-dark' => '#1d1d1d',
                    'surface-dark-alt' => '#272727',
                    'on-surface-dark' => '#aaaaaa',
                    'on-surface-dark-strong' => '#f4f4f4',
                    'primary-dark' => '#fe1940',
                    'on-primary-dark' => '#ffffff',
                    'secondary-dark' => '#eaeaea',
                    'on-secondary-dark' => '#1d1d1d',
                    'outline-dark' => '#343434',
                    'outline-dark-strong' => '#808080',
                    'info' => '#2364ee',
                    'success' => '#2db85c',
                    'warning' => '#ff900d',
                    'danger' => '#d51536',
                ]),
        );
    }

    public function isInstalled(string $package): bool
    {
        return in_array($package, array_map(fn (string $key): string => "refactor-circus/{$key}", self::PACKAGES), true);
    }
}
