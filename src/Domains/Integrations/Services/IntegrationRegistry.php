<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Services;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\Integration;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Exceptions\InvalidIntegrationException;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;

/**
 * The suite integrations this application has, registered once at boot.
 *
 * For each key of `atrium.integrations`, the integration registers when:
 *
 * - `atrium.integrations.{pkg}.enabled` is true (boolean-coerced, default true),
 * - `refactor-circus/{pkg}` is installed, through the InstalledPackages seam,
 * - its class exists, found by convention:
 *   `RefactorCircus\Atrium\Integrations\{Pkg}\{Pkg}Integration`, and
 * - it has an API base: a non-empty `atrium.integrations.{pkg}.api_base`, or
 *   else `/` plus the trimmed `{pkg}.routes.prefix` while `{pkg}.routes.enabled`
 *   is true. Without one it does not register, and a warning names both
 *   keys, once per process.
 *
 * Its nav items, widgets and settings panel go into their registries, each
 * gated per request by IntegrationFeatures; its search sources and screens
 * stay here, for the shell and `atrium.screens.show`.
 */
final class IntegrationRegistry
{
    /**
     * Each package's studly name, where `Str::studly()` would get it wrong.
     */
    private const array STUDLY = [
        'pennantplus' => 'PennantPlus',
    ];

    /**
     * The packages this process has warned have no API base.
     *
     * @var array<string, true>
     */
    private static array $warned = [];

    /**
     * @var array<string, RegisteredIntegration>
     */
    private array $integrations = [];

    public function __construct(
        private readonly Container $app,
        private readonly Repository $config,
        private readonly IntegrationFeatures $features,
    ) {}

    /**
     * The integration class Atrium looks for under a package key.
     */
    public static function classFor(string $key): string
    {
        $studly = self::STUDLY[$key] ?? Str::studly($key);

        return 'RefactorCircus\\Atrium\\Integrations\\'.$studly.'\\'.$studly.'Integration';
    }

    /**
     * The default feature class of a package key.
     */
    public static function featureFor(string $key): string
    {
        $studly = self::STUDLY[$key] ?? Str::studly($key);

        return 'RefactorCircus\\Atrium\\Integrations\\'.$studly.'\\'.$studly.'Feature';
    }

    /**
     * The Composer package of a package key.
     */
    public static function packageFor(string $key): string
    {
        return 'refactor-circus/'.$key;
    }

    /**
     * Register every configured integration that is enabled, installed and
     * reachable. One already registered is kept as it is, so running this
     * again only adds what has become available.
     */
    public function register(): void
    {
        $configured = $this->config->get('atrium.integrations', []);

        if (! is_array($configured)) {
            return;
        }

        $packages = $this->app->make(InstalledPackages::class);

        foreach ($configured as $key => $settings) {
            if (! is_string($key) || isset($this->integrations[$key])) {
                continue;
            }

            $settings = is_array($settings) ? $settings : [];

            if (! filter_var($settings['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN) || ! $packages->isInstalled(self::packageFor($key))) {
                continue;
            }

            $class = self::classFor($key);

            if (! $this->app->bound($class) && ! class_exists($class)) {
                continue;
            }

            $apiBase = $this->apiBase($key, $settings);

            if ($apiBase === null) {
                $this->warnUnreachable($key);

                continue;
            }

            $this->add($key, $this->resolve($key, $class), $apiBase, $this->featureNames($key, $settings));
        }

        ksort($this->integrations);
    }

    /**
     * Every registered integration, by key, in key order.
     *
     * @return array<string, RegisteredIntegration>
     */
    public function all(): array
    {
        return $this->integrations;
    }

    public function get(string $key): ?RegisteredIntegration
    {
        return $this->integrations[$key] ?? null;
    }

    /**
     * The registered integration that declares the screen, if any.
     */
    public function forScreen(string $screen): ?RegisteredIntegration
    {
        $package = strstr($screen, '.', true);
        $integration = $package === false ? null : $this->get($package);

        return $integration?->screen($screen) === null ? null : $integration;
    }

    /**
     * @param  list<string>  $features
     */
    private function add(string $key, Integration $integration, string $apiBase, array $features): void
    {
        $screens = [];

        foreach ($integration->screens() as $screen) {
            if (! str_starts_with($screen->key, $key.'.') || ! str_starts_with($screen->path, '/'.$key.'/')) {
                throw InvalidIntegrationException::screenOutsidePackage($key, $screen);
            }

            $screens[$screen->key] = $screen;
        }

        $registered = new RegisteredIntegration(
            $key,
            $integration->label(),
            $apiBase,
            $features,
            $integration->navigation(),
            $integration->widgets(),
            $integration->settings(),
            $integration->searchSources(),
            $screens,
        );

        $active = fn (Request $request): bool => $this->features->active($registered, $request);

        $navigation = $this->app->make(NavigationRegistry::class);

        foreach ($registered->navigation as $item) {
            $navigation->add($item->authorize($active));
        }

        $widgets = $this->app->make(WidgetRegistry::class);

        foreach ($registered->widgets as $widget) {
            $widgets->add($widget->authorize($active));
        }

        if ($registered->settings !== null) {
            $this->app->make(SettingsRegistry::class)->add($registered->settings->authorize($active));
        }

        $this->integrations[$key] = $registered;
    }

    /**
     * @throws InvalidIntegrationException for a class that is no integration
     */
    private function resolve(string $key, string $class): Integration
    {
        $integration = $this->app->make($class);

        if (! $integration instanceof Integration) {
            throw InvalidIntegrationException::notAnIntegration($key, $class);
        }

        return $integration;
    }

    /**
     * The configured API base, or the package's own route prefix while its
     * routes are on, or null.
     *
     * @param  array<array-key, mixed>  $settings
     */
    private function apiBase(string $key, array $settings): ?string
    {
        $override = $settings['api_base'] ?? null;

        if (is_string($override) && trim($override) !== '') {
            return $override;
        }

        $prefix = $this->config->get($key.'.routes.prefix');

        if (filter_var($this->config->get($key.'.routes.enabled', false), FILTER_VALIDATE_BOOLEAN) && is_string($prefix)) {
            return '/'.trim($prefix, '/');
        }

        return null;
    }

    /**
     * The feature names that must be on, the package's default feature class
     * when the key is absent.
     *
     * @param  array<array-key, mixed>  $settings
     * @return list<string>
     */
    private function featureNames(string $key, array $settings): array
    {
        $features = $settings['features'] ?? [self::featureFor($key)];

        return array_values(array_filter(is_array($features) ? $features : [], is_string(...)));
    }

    private function warnUnreachable(string $key): void
    {
        if (isset(self::$warned[$key])) {
            return;
        }

        self::$warned[$key] = true;

        Log::warning(sprintf(
            'Atrium does not register the %1$s integration: it has no API to call. Turn the package\'s API on with %1$s.routes.enabled, behind your authentication middleware, or set atrium.integrations.%1$s.api_base to where it is served.',
            $key,
        ));
    }
}
