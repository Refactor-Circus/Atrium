<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures\Integrations;

use Illuminate\Support\Facades\File;
use PHPUnit\Framework\Assert;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Settings\Http\Resources\SettingsPanelResource;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Http\Resources\WidgetDefinitionResource;
use ReflectionProperty;

/**
 * Test helpers for suite integrations (AC 39, 49).
 *
 * Registration runs at boot against the real Composer install, where no
 * suite package is installed. A test reports packages installed with
 * `installed()`, serves their API with `serveApi()`, optionally swaps in the
 * fixture integration with `fake()`, and re-runs registration with
 * `register()`.
 *
 * Each package's integration test then writes what its integration declares
 * - nav items, widgets, settings panel, search sources and screens with their
 * paths - to `ui/sdk/test/fixtures/integrations/{pkg}.json` with
 * `assertMatchesFixture()`, for the layer's Vitest suite (AC 49). As with the
 * other contract fixtures (AC 31), a plain run only compares; the file is
 * written only with `UPDATE_FIXTURES=1`.
 */
final class IntegrationFixture
{
    public const string DIRECTORY = __DIR__.'/../../../ui/sdk/test/fixtures/integrations';

    /**
     * Report exactly these packages installed, by key (`cortex`).
     */
    public static function installed(string ...$keys): void
    {
        app()->instance(InstalledPackages::class, new FakeInstalledPackages(array_values(array_map(
            IntegrationRegistry::packageFor(...),
            $keys,
        ))));
    }

    /**
     * Turn on each package's own API under `{key}/api`, as its
     * `{key}.routes.*` config would.
     */
    public static function serveApi(string ...$keys): void
    {
        foreach ($keys as $key) {
            config()->set($key.'.routes.enabled', true);
            config()->set($key.'.routes.prefix', $key.'/api');
        }
    }

    /**
     * Resolve the fixture integration in place of each package's own.
     */
    public static function fake(string ...$keys): void
    {
        foreach ($keys as $key) {
            app()->bind(IntegrationRegistry::classFor($key), fn (): FixtureIntegration => new FixtureIntegration($key));
        }
    }

    /**
     * Installed, served and faked, then registered: the usual setup.
     */
    public static function registerFakes(string ...$keys): IntegrationRegistry
    {
        self::installed(...$keys);
        self::serveApi(...$keys);
        self::fake(...$keys);

        return self::register();
    }

    /**
     * Run registration again, as boot does.
     */
    public static function register(): IntegrationRegistry
    {
        $registry = app(IntegrationRegistry::class);
        $registry->register();

        return $registry;
    }

    /**
     * Forget which packages this process has warned about, so a test sees its
     * own warning.
     */
    public static function forgetWarnings(): void
    {
        new ReflectionProperty(IntegrationRegistry::class, 'warned')->setValue(null, []);
    }

    /**
     * What the registered integration declares, as the layer's fixture
     * stores it.
     *
     * @return array<string, mixed>
     */
    public static function declarations(string $key): array
    {
        $integration = app(IntegrationRegistry::class)->get($key);

        Assert::assertNotNull($integration, "The [{$key}] integration is not registered.");

        return [
            'key' => $integration->key,
            'label' => $integration->label,
            'api_base' => $integration->apiBase,
            'features' => $integration->features,
            'navigation' => array_map(self::navItem(...), $integration->navigation),
            'widgets' => array_map(
                fn (WidgetDefinition $widget): array => [
                    ...new WidgetDefinitionResource($widget)->resolve(),
                    'data' => (object) $widget->resolveData(),
                ],
                $integration->widgets,
            ),
            'settings' => $integration->settings === null ? null : new SettingsPanelResource($integration->settings)->withData()->resolve(),
            'search_sources' => array_map(
                fn (SearchSourceDeclaration $source): array => [
                    'key' => $source->key,
                    'integration' => $integration->key,
                    'label' => $source->label,
                    'icon' => $source->icon,
                ],
                $integration->searchSources,
            ),
            'screens' => array_values(array_map(
                fn (ScreenDeclaration $screen): array => [
                    'key' => $screen->key,
                    'kind' => $screen->kind,
                    'path' => $screen->path,
                    'subject_type' => $screen->subjectType,
                    'options' => (object) $screen->options,
                ],
                $integration->screens,
            )),
        ];
    }

    /**
     * Compare the integration's declarations with its layer fixture, writing
     * the fixture first only with `UPDATE_FIXTURES=1`.
     */
    public static function assertMatchesFixture(string $key, string $directory = self::DIRECTORY): void
    {
        $path = $directory.'/'.$key.'.json';
        $actual = self::encode(self::declarations($key));
        $regenerate = 'If the change is intended, regenerate it with `UPDATE_FIXTURES=1 vendor/bin/pest` and update the layer code that reads it.';

        if (getenv('UPDATE_FIXTURES') === '1') {
            File::ensureDirectoryExists($directory);
            file_put_contents($path, $actual);
        }

        Assert::assertFileExists($path, "The [{$key}] integration fixture is missing. {$regenerate}");
        Assert::assertSame((string) file_get_contents($path), $actual, "The [{$key}] integration no longer matches its fixture. {$regenerate}");
    }

    /**
     * @return array<string, mixed>
     */
    private static function navItem(NavItem $item): array
    {
        return [
            'label' => $item->label,
            'icon' => $item->icon,
            'group' => $item->group,
            'sort' => $item->sort,
            'link' => $item->link(),
            'badge' => $item->resolveBadge(),
            'live' => $item->live === null ? null : ['key' => $item->live['key'], 'options' => (object) $item->live['options']],
            'children' => array_map(self::navItem(...), array_values($item->children)),
        ];
    }

    /**
     * Pretty-printed as the other contract fixtures are, with `{}` and `[]`
     * kept apart.
     *
     * @param  array<string, mixed>  $data
     */
    private static function encode(array $data): string
    {
        $decoded = json_decode(json_encode($data, JSON_THROW_ON_ERROR), flags: JSON_THROW_ON_ERROR);

        return json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n";
    }
}
