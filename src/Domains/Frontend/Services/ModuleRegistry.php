<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Services;

use Illuminate\Contracts\Config\Repository;
use Illuminate\Foundation\Vite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use RefactorCircus\Atrium\Domains\Frontend\Data\ModuleManifest;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;

/**
 * Every front-end module the Blade page may load (D-082): the packages that
 * declare one (`extra.atrium.scripts`, discovered), module folders
 * registered with `Atrium::module()`, and the app's own scripts and
 * stylesheets (`Atrium::script()`, `Atrium::style()`, `atrium.scripts`,
 * `atrium.styles`).
 *
 * Per request it keeps an integration's module (one whose key has an
 * integration manifest, D-090) only while that integration is registered and
 * active for the user, drops a module listed
 * in `atrium.disabled`, and one built for another major of the shared API.
 */
final class ModuleRegistry
{
    /**
     * Keys a module may not take: Atrium's own build and the app's scripts.
     */
    public const array RESERVED = ['atrium', 'app'];

    /**
     * @var array<string, ModuleManifest>
     */
    private array $added = [];

    /**
     * @var list<string>
     */
    private array $scripts = [];

    /**
     * @var list<string>
     */
    private array $styles = [];

    /**
     * @var array<string, true>
     */
    private static array $warned = [];

    public function __construct(
        private readonly Repository $config,
        private readonly ModuleDiscovery $discovery,
        private readonly IntegrationRegistry $integrations,
        private readonly IntegrationFeatures $features,
    ) {}

    /**
     * Load the module in `$path`, read from its composer.json's
     * `extra.atrium`, as if its package were installed: for a module folder
     * the app builds itself, or a package checked out beside the app.
     */
    public function module(string $path): ModuleManifest
    {
        $composer = rtrim($path, '/\\').'/composer.json';
        $decoded = is_file($composer) ? json_decode((string) file_get_contents($composer), true) : null;
        $atrium = is_array($decoded) ? ($decoded['extra']['atrium'] ?? null) : null;
        $name = is_array($decoded) && is_string($decoded['name'] ?? null) ? $decoded['name'] : basename($path);
        $manifest = is_array($atrium) ? ModuleManifest::fromComposer($path, $atrium, $name) : null;

        if ($manifest === null) {
            throw new InvalidArgumentException("Atrium::module() found no module at [{$path}]: its composer.json must declare extra.atrium.scripts.");
        }

        $this->assertKey($manifest->key);
        $this->integrations->forgetManifests();

        return $this->added[$manifest->key] = $manifest;
    }

    /**
     * Load a script of the app's own, after every module's: a URL (absolute,
     * or a path on this host) or a Vite entry of the app (`resources/js/atrium.ts`),
     * resolved through Laravel's Vite manifest.
     */
    public function script(string $source): static
    {
        $this->scripts[] = $source;

        return $this;
    }

    /**
     * Load a stylesheet of the app's own: a URL or a Vite entry.
     */
    public function style(string $source): static
    {
        $this->styles[] = $source;

        return $this;
    }

    /**
     * The module folders added with `Atrium::module()`, by key.
     *
     * @return array<string, ModuleManifest>
     */
    public function added(): array
    {
        return $this->added;
    }

    /**
     * Every module, discovered and added (an added one replaces a discovered
     * one with the same key), and the app's scripts last.
     *
     * @return array<string, ModuleManifest>
     */
    public function all(): array
    {
        $modules = [];

        if ($this->config->get('atrium.discover', true) === true) {
            foreach ($this->discovery->discover() as $manifest) {
                if (! in_array($manifest->key, self::RESERVED, true) && preg_match('/^[a-z0-9][a-z0-9_-]*$/', $manifest->key) === 1) {
                    $modules[$manifest->key] = $manifest;
                }
            }
        }

        $modules = [...$modules, ...$this->added];

        $scripts = [...$this->configured('atrium.scripts'), ...$this->scripts];
        $styles = [...$this->configured('atrium.styles'), ...$this->styles];

        if ($scripts !== [] || $styles !== []) {
            $modules['app'] = new ModuleManifest('app', null, array_map($this->url(...), $scripts), array_map($this->url(...), $styles));
        }

        return $modules;
    }

    /**
     * The modules the page loads for this request, in load order.
     *
     * @return list<ModuleManifest>
     */
    public function forRequest(Request $request, ?string $sharedApi): array
    {
        $disabled = $this->config->get('atrium.disabled', []);
        $known = $this->integrations->known();

        return array_values(array_filter($this->all(), function (ModuleManifest $module) use ($request, $sharedApi, $disabled, $known): bool {
            if (is_array($disabled) && in_array($module->key, $disabled, true)) {
                return false;
            }

            if (in_array($module->key, $known, true)) {
                $integration = $this->integrations->get($module->key);

                if ($integration === null || ! $this->features->active($integration, $request)) {
                    return false;
                }
            }

            return $this->compatible($module, $sharedApi);
        }));
    }

    /**
     * The directory a module's build sits in, where its `build.json` is: the
     * folder of its first script.
     */
    public function buildOf(ModuleManifest $module): ?FrontendBuild
    {
        if ($module->external() || $module->scripts === []) {
            return null;
        }

        return new FrontendBuild($module->root.'/'.dirname($module->scripts[0]));
    }

    /**
     * Whether a module was built for Atrium's major of the shared API. A
     * build that does not say is let through.
     */
    private function compatible(ModuleManifest $module, ?string $sharedApi): bool
    {
        $theirs = $this->buildOf($module)?->sharedApi();

        if ($theirs === null || $sharedApi === null || strtok($theirs, '.') === strtok($sharedApi, '.')) {
            return true;
        }

        if (! isset(self::$warned[$module->key])) {
            self::$warned[$module->key] = true;

            Log::warning(sprintf(
                'Atrium does not load the [%s] module: it was built for version %s of the shared front-end API, and this Atrium provides %s. Update the package, or rebuild its module against this Atrium.',
                $module->key,
                $theirs,
                $sharedApi,
            ));
        }

        return false;
    }

    /**
     * @return list<string>
     */
    private function configured(string $key): array
    {
        $value = $this->config->get($key, []);

        return array_values(array_filter(is_array($value) ? $value : [], fn (mixed $item): bool => is_string($item) && $item !== ''));
    }

    /**
     * A URL as given; anything else is a Vite entry of the app.
     */
    private function url(string $source): string
    {
        if (preg_match('#^(https?:)?//#i', $source) === 1 || str_starts_with($source, '/')) {
            return $source;
        }

        return app(Vite::class)->asset($source);
    }

    private function assertKey(string $key): void
    {
        if (in_array($key, self::RESERVED, true) || preg_match('/^[a-z0-9][a-z0-9_-]*$/', $key) !== 1) {
            throw new InvalidArgumentException("[{$key}] is no module key: use lowercase letters, digits, - and _, and neither atrium nor app.");
        }
    }
}
