<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Services;

use Illuminate\Filesystem\Filesystem;
use RefactorCircus\Atrium\Domains\Frontend\Data\ModuleManifest;

/**
 * Discovers the front-end modules installed packages declare in their
 * composer.json (D-082), without depending on Atrium:
 *
 *   "extra": { "atrium": { "scripts": ["dist/atrium/atrium.js"], "styles": ["dist/atrium/atrium.css"] } }
 *
 * Paths are relative to the package. The list is cached in
 * `bootstrap/cache/atrium-modules.php` beside the plugin list, by the same
 * `atrium:discover` (run by `package:discover` and `optimize`), with each
 * package's folder relative to `vendor/`, so the cache survives a move of
 * the application (a container image, Vapor).
 */
final class ModuleDiscovery
{
    public function __construct(
        private readonly Filesystem $files,
        private readonly string $vendorPath,
        private readonly ?string $cachePath = null,
    ) {}

    /**
     * The discovered modules, from the cache when there is one.
     *
     * @return list<ModuleManifest>
     */
    public function discover(): array
    {
        if ($this->cachePath !== null && $this->files->isFile($this->cachePath)) {
            $cached = $this->files->getRequire($this->cachePath);

            if (is_array($cached)) {
                return $this->manifests($cached);
            }
        }

        return $this->manifests($this->scan());
    }

    /**
     * Read the installed packages and write what they declare to the cache.
     *
     * @return list<ModuleManifest>
     */
    public function build(): array
    {
        $entries = $this->scan();

        if ($this->cachePath !== null) {
            $this->files->ensureDirectoryExists(dirname($this->cachePath));
            $this->files->replace($this->cachePath, '<?php'.PHP_EOL.PHP_EOL.'return '.var_export($entries, true).';'.PHP_EOL);
        }

        return $this->manifests($entries);
    }

    /**
     * Remove the cache, so the next boot reads the installed packages.
     */
    public function clear(): void
    {
        if ($this->cachePath !== null) {
            $this->files->delete($this->cachePath);
        }
    }

    /**
     * Each declaring package, its folder relative to `vendor/`.
     *
     * @return list<array{package: string, path: string, atrium: array<array-key, mixed>}>
     */
    public function scan(): array
    {
        $manifest = $this->vendorPath.'/composer/installed.json';

        if (! $this->files->exists($manifest)) {
            return [];
        }

        $contents = json_decode($this->files->get($manifest), true);
        $packages = is_array($contents) ? ($contents['packages'] ?? $contents) : [];
        $entries = [];

        foreach (is_array($packages) ? $packages : [] as $package) {
            $atrium = is_array($package) ? ($package['extra']['atrium'] ?? null) : null;
            $name = is_array($package) ? ($package['name'] ?? null) : null;

            if (! is_array($atrium) || ! isset($atrium['scripts']) || ! is_string($name)) {
                continue;
            }

            $installPath = $package['install-path'] ?? '../'.$name;

            $entries[] = [
                'package' => $name,
                'path' => $this->relativeToVendor(is_string($installPath) ? $installPath : '../'.$name),
                'atrium' => $atrium,
            ];
        }

        return $entries;
    }

    /**
     * `install-path` is relative to `vendor/composer`; the cache keeps it
     * relative to `vendor/`.
     */
    private function relativeToVendor(string $installPath): string
    {
        $path = str_starts_with($installPath, '../') ? substr($installPath, 3) : 'composer/'.$installPath;

        return trim(str_replace('\\', '/', $path), '/');
    }

    /**
     * @param  array<array-key, mixed>  $entries
     * @return list<ModuleManifest>
     */
    private function manifests(array $entries): array
    {
        $manifests = [];

        foreach ($entries as $entry) {
            if (! is_array($entry) || ! is_string($entry['package'] ?? null) || ! is_string($entry['path'] ?? null) || ! is_array($entry['atrium'] ?? null)) {
                continue;
            }

            $manifest = ModuleManifest::fromComposer($this->vendorPath.'/'.$entry['path'], $entry['atrium'], $entry['package']);

            if ($manifest !== null) {
                $manifests[] = $manifest;
            }
        }

        return $manifests;
    }
}
