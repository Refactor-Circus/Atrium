<?php

declare(strict_types=1);

namespace Workbench\App\Atrium;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Env;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Themes\Data\Theme;
use RefactorCircus\Atrium\Facades\Atrium;

/**
 * WORKBENCH ONLY. The suite integrations as the design bench: every package
 * reported installed and its API pointed at the workbench's stand-in
 * (SuiteStandIn, `/_suite/{pkg}/…`), so the integrations' nav, widgets and
 * screens are listed while none of the packages is installed here.
 *
 * The packages ship their own Atrium modules and integration manifests
 * (MODULES.md, D-090), and Atrium depends on none of them. When
 * ATRIUM_SUITE_PATH names a folder of sibling package checkouts (`Cortex`,
 * `Guardian`, … each with its built `dist/atrium/`), each checkout's module
 * is loaded with Atrium::module(), which reads the checkout's composer.json
 * `extra.atrium` exactly as discovery reads an installed package's, its
 * manifest (`dist/atrium/integration.json`) with it, and the stand-in answers
 * from the checkout's `openapi.json`: every module's pages render populated.
 * A package with no checkout (or a checkout that ships no manifest yet) is
 * declared by Atrium's test fixture manifest
 * (`tests/Fixtures/Manifests/{pkg}/integration.json`), as an installed
 * package would be: without ATRIUM_SUITE_PATH the workbench shows Atrium's
 * core, its own module (ui/workbench) and the integrations' fallback cards.
 *
 * Only the served workbench uses it (`composer serve`, never the console or
 * the test suite), and only while ATRIUM_WORKBENCH_SUITE is not "false".
 * It also registers `signal`, a brand theme (red primary, near-square
 * corners, neutral greys) to check the layer under a host's colours.
 */
final class DemoSuite implements InstalledPackages
{
    /** The packages the integrations stand for, by key, with their checkout folder name. */
    public const array PACKAGES = [
        'cortex' => 'Cortex',
        'guardian' => 'Guardian',
        'impex' => 'Impex',
        'keen' => 'Keen',
        'pennantplus' => 'PennantPlus',
        'polycart' => 'Polycart',
        'roster' => 'Roster',
        'showroom' => 'Showroom',
    ];

    /** The suite's manifests as Atrium's tests read them, for a package with no checkout. */
    public const string FIXTURES = __DIR__.'/../../../tests/Fixtures/Manifests';

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

        foreach (array_keys(self::PACKAGES) as $key) {
            $overrides["atrium.integrations.{$key}.api_base"] = self::STAND_IN.'/'.$key;
        }

        config($overrides);
    }

    public static function boot(): void
    {
        foreach (array_keys(self::PACKAGES) as $key) {
            $checkout = self::checkout($key);

            if ($checkout !== null && is_file($checkout.'/dist/atrium/build.json')) {
                Atrium::module($checkout);
            }
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

    /**
     * The sibling checkout of a package under ATRIUM_SUITE_PATH, when there
     * is one that declares an Atrium module.
     */
    public static function checkout(string $key): ?string
    {
        $suite = Env::get('ATRIUM_SUITE_PATH');
        $folder = self::PACKAGES[$key] ?? null;

        if (! is_string($suite) || $suite === '' || $folder === null) {
            return null;
        }

        $checkout = rtrim($suite, '/\\').'/'.$folder;
        $composer = is_file($checkout.'/composer.json') ? json_decode((string) file_get_contents($checkout.'/composer.json'), true) : null;

        return is_array($composer) && isset($composer['extra']['atrium']['scripts']) ? $checkout : null;
    }

    /**
     * Every package's fixture manifest, as if installed; a checkout's own
     * manifest, loaded with its module, replaces it.
     */
    public function integrations(): array
    {
        $integrations = [];

        foreach (array_keys(self::PACKAGES) as $key) {
            $integrations[$key] = self::FIXTURES.'/'.$key.'/integration.json';
        }

        return $integrations;
    }
}
