<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Services;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Container\Container;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Frontend\Services\ModuleRegistry;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Data\IntegrationManifest;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Exceptions\InvalidIntegrationException;
use RefactorCircus\Atrium\Domains\Integrations\Support\ManifestValues;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use stdClass;

/**
 * The integrations this application has, registered once at boot from their
 * manifests (D-090). Atrium knows no package: each declares itself in an
 * `integration.json`, found
 *
 * - in each installed package that ships one (`extra.atrium.integration`,
 *   default `dist/atrium/integration.json`), through the InstalledPackages
 *   seam over `atrium:discover`'s cache, while `atrium.discover` is on;
 * - in each module folder added with `Atrium::module()`;
 * - or registered by the app with `Atrium::integration()`, which wins over
 *   the others for the same key, as `Atrium::module()` wins over discovery.
 *
 * Each manifest is checked when it is read (IntegrationManifests), and its
 * integration registers when:
 *
 * - `atrium.integrations.{pkg}.enabled` is true (boolean-coerced, default true), and
 * - it has an API base: a non-empty `atrium.integrations.{pkg}.api_base`, or
 *   else `/` plus the trimmed `{pkg}.routes.prefix` while `{pkg}.routes.enabled`
 *   is true. Without one it does not register, and a warning names both
 *   keys, once per process.
 *
 * Its labels go through Laravel's `__()`, its expressions are read, its
 * feature flags are `atrium.integrations.{pkg}.features` or else the
 * manifest's. Its nav items, widgets and settings panel go into their
 * registries, each gated per request by IntegrationFeatures; its search
 * sources, screens and hooks stay here, for the shell, `atrium.screens.show`
 * and IntegrationHooks.
 */
final class IntegrationRegistry
{
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

    /**
     * Manifests the app registered with `Atrium::integration()`, by key.
     *
     * @var array<string, IntegrationManifest>
     */
    private array $manifests = [];

    /**
     * The manifests the last registration found, by key.
     *
     * @var array<string, IntegrationManifest>|null
     */
    private ?array $found = null;

    public function __construct(
        private readonly Container $app,
        private readonly Repository $config,
        private readonly IntegrationFeatures $features,
        private readonly IntegrationManifests $reader,
    ) {}

    /**
     * Register an integration from a manifest: the path of an
     * `integration.json`, or its JSON as an array. For an app's own
     * integration, or one with no module of its own.
     *
     * @param  string|array<string, mixed>  $manifest
     *
     * @throws InvalidIntegrationException for an invalid manifest
     */
    public function manifest(string|array $manifest): IntegrationManifest
    {
        $read = is_string($manifest)
            ? $this->reader->read($manifest)
            : $this->reader->make($manifest, 'Atrium::integration()');

        $this->found = null;

        return $this->manifests[$read->key] = $read;
    }

    /**
     * Look for manifests again on the next `known()`: a module was added.
     */
    public function forgetManifests(): void
    {
        $this->found = null;
    }

    /**
     * Every manifest Atrium found, by key, in key order: installed packages,
     * then `Atrium::module()` folders, then `Atrium::integration()`, each
     * replacing the one before it for the same key.
     *
     * @return array<string, IntegrationManifest>
     *
     * @throws InvalidIntegrationException for an invalid manifest
     */
    public function manifests(): array
    {
        $manifests = [];

        if ($this->config->get('atrium.discover', true) === true) {
            foreach ($this->app->make(InstalledPackages::class)->integrations() as $key => $path) {
                $manifests[$key] = $path;
            }
        }

        foreach ($this->app->make(ModuleRegistry::class)->added() as $module) {
            if ($module->integration !== null) {
                $manifests[$module->key] = $module->integration;
            }
        }

        $read = [];

        foreach ($manifests as $key => $path) {
            $read[$key] = $this->reader->read($path, $key);
        }

        $read = [...$read, ...$this->manifests];
        ksort($read);

        return $read;
    }

    /**
     * The key of every integration Atrium found a manifest for, registered or
     * not: their modules load only while the integration is registered and
     * active, and the front end treats their `/{pkg}/` paths as theirs.
     *
     * @return list<string>
     */
    public function known(): array
    {
        $keys = array_keys($this->integrations);

        try {
            $keys = [...$keys, ...array_keys($this->found ??= $this->manifests())];
        } catch (InvalidIntegrationException) {
            // Registration has already thrown for it.
        }

        $keys = array_values(array_unique($keys));
        sort($keys);

        return $keys;
    }

    /**
     * Register every integration whose manifest Atrium finds, that is enabled
     * and reachable. One already registered is kept as it is, so running this
     * again only adds what has become available.
     *
     * @throws InvalidIntegrationException for an invalid manifest
     */
    public function register(): void
    {
        $this->found = $this->manifests();

        foreach ($this->found as $key => $manifest) {
            if (isset($this->integrations[$key])) {
                continue;
            }

            $settings = $this->config->get('atrium.integrations.'.$key, []);
            $settings = is_array($settings) ? $settings : [];

            if (! filter_var($settings['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
                continue;
            }

            $apiBase = $this->apiBase($key, $settings);

            if ($apiBase === null) {
                $this->warnUnreachable($key);

                continue;
            }

            $this->add($manifest, $apiBase, $settings);
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
     * Forget which packages this process has warned about, so a test sees its
     * own warning.
     */
    public static function forgetWarnings(): void
    {
        self::$warned = [];
    }

    /**
     * @param  array<array-key, mixed>  $settings
     */
    private function add(IntegrationManifest $manifest, string $apiBase, array $settings): void
    {
        $json = $manifest->json;
        $key = $manifest->key;
        $values = new ManifestValues($this->config, $key);

        $screens = [];

        foreach ($json->screens ?? [] as $screen) {
            $declaration = ScreenDeclaration::make($screen->key, $screen->kind, $screen->path);

            if (isset($screen->subject_type)) {
                $declaration->subjectType($screen->subject_type);
            }

            if (isset($screen->options)) {
                $options = $values->read($screen->options);
                $declaration->options(is_array($options) ? $options : []);
            }

            $screens[$screen->key] = $declaration;
        }

        $registered = new RegisteredIntegration(
            $key,
            self::trans($json->label),
            $apiBase,
            $this->featureNames($json, $settings),
            $this->navigation($json->navigation ?? [], $values),
            array_values(array_map(self::widget(...), $json->widgets ?? [])),
            isset($json->settings) ? self::settings($json->settings) : null,
            array_values(array_map(self::searchSource(...), $json->search_sources ?? [])),
            $screens,
            array_values($json->hooks ?? []),
            array_values($json->features ?? []),
        );

        $active = fn (Request $request): bool => $this->features->active($registered, $request);

        $navigationRegistry = $this->app->make(NavigationRegistry::class);

        foreach ($registered->navigation as $item) {
            $navigationRegistry->add($item->authorize($active));
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
     * @param  list<stdClass>  $items
     * @return list<NavItem>
     */
    private function navigation(array $items, ManifestValues $values): array
    {
        $navigation = [];

        foreach ($items as $item) {
            if (isset($item->when) && $values->read($item->when) !== true) {
                continue;
            }

            $nav = NavItem::make(self::trans($item->label));

            if (isset($item->path)) {
                $nav->path($item->path);
            }

            if (isset($item->icon)) {
                $nav->icon($item->icon);
            }

            if (isset($item->group)) {
                $nav->group(self::trans($item->group));
            }

            if (isset($item->sort)) {
                $sort = $values->read($item->sort);
                $nav->sort(is_int($sort) ? $sort : 100);
            }

            if (isset($item->live)) {
                $options = isset($item->live->options) ? $values->read($item->live->options) : [];
                $nav->live($item->live->key, is_array($options) ? $options : []);
            }

            if (isset($item->children)) {
                $nav->children($this->navigation($item->children, $values));
            }

            $navigation[] = $nav;
        }

        return $navigation;
    }

    private static function widget(stdClass $widget): WidgetDefinition
    {
        $definition = WidgetDefinition::make($widget->key)->label(self::trans($widget->label));

        if (isset($widget->description)) {
            $definition->description(self::trans($widget->description));
        }

        if (isset($widget->icon)) {
            $definition->icon($widget->icon);
        }

        if (isset($widget->component)) {
            $definition->component($widget->component);
        }

        if (isset($widget->size)) {
            $definition->defaultSize($widget->size->width, $widget->size->height);
        }

        if (isset($widget->min_size)) {
            $definition->minSize($widget->min_size->width, $widget->min_size->height);
        }

        if (isset($widget->lazy)) {
            $definition->lazy($widget->lazy);
        }

        return $definition;
    }

    private static function settings(stdClass $settings): SettingsPanel
    {
        $panel = SettingsPanel::make($settings->key)->label(self::trans($settings->label));

        if (isset($settings->description)) {
            $panel->description(self::trans($settings->description));
        }

        if (isset($settings->icon)) {
            $panel->icon($settings->icon);
        }

        if (isset($settings->component)) {
            $panel->component($settings->component);
        }

        if (isset($settings->sort)) {
            $panel->sort($settings->sort);
        }

        return $panel;
    }

    private static function searchSource(stdClass $source): SearchSourceDeclaration
    {
        $declaration = SearchSourceDeclaration::make($source->key);

        if (isset($source->label)) {
            $declaration->label(self::trans($source->label));
        }

        if (isset($source->icon)) {
            $declaration->icon($source->icon);
        }

        return $declaration;
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
     * The feature names that must be on: the host's
     * `atrium.integrations.{pkg}.features`, or else the manifest's.
     *
     * @param  array<array-key, mixed>  $settings
     * @return list<string>
     */
    private function featureNames(stdClass $json, array $settings): array
    {
        $features = $settings['features'] ?? ($json->features ?? []);

        return array_values(array_filter(is_array($features) ? $features : [], is_string(...)));
    }

    /**
     * A manifest label, through the host's translations (lang JSON).
     */
    private static function trans(string $label): string
    {
        $line = __($label);

        return is_string($line) ? $line : $label;
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
