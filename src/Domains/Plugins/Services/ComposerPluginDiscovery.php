<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Plugins\Services;

use Illuminate\Filesystem\Filesystem;

/**
 * Discovers plugin classes declared by installed Composer packages under
 * their `extra.atrium.plugins` key.
 *
 * Reading Composer's installed.json on every boot is costly, so the list is
 * cached in `bootstrap/cache/atrium-plugins.php`, as Laravel caches its own
 * package manifest. `atrium:discover` (run by `package:discover` and
 * `optimize`) writes it and `optimize:clear` removes it; without it the
 * packages are read live.
 */
class ComposerPluginDiscovery
{
    public function __construct(
        protected Filesystem $files,
        protected string $vendorPath,
        protected ?string $cachePath = null,
    ) {}

    /**
     * The discovered plugin classes, from the cache when there is one.
     *
     * @return array<int, class-string>
     */
    public function discover(): array
    {
        if ($this->cachePath !== null && $this->files->isFile($this->cachePath)) {
            $cached = $this->files->getRequire($this->cachePath);

            if (is_array($cached)) {
                /** @var array<int, class-string> */
                return array_values(array_filter($cached, fn (mixed $class): bool => is_string($class) && $class !== ''));
            }
        }

        return $this->scan();
    }

    /**
     * Read the installed packages and write what they declare to the cache.
     *
     * @return array<int, class-string>
     */
    public function build(): array
    {
        $plugins = $this->scan();

        if ($this->cachePath !== null) {
            $this->files->ensureDirectoryExists(dirname($this->cachePath));

            // A plain array of class names, as Laravel writes its package
            // manifest, so OPcache keeps it in memory.
            $entries = array_map(
                fn (string $class): string => "    '".addcslashes($class, "'\\\\")."',",
                $plugins,
            );

            $this->files->replace($this->cachePath, implode(PHP_EOL, ['<?php', '', 'return [', ...$entries, '];', '']));
        }

        return $plugins;
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

    public function cachePath(): ?string
    {
        return $this->cachePath;
    }

    /**
     * Read the plugin classes straight from Composer's installed.json.
     *
     * @return array<int, class-string>
     */
    public function scan(): array
    {
        $manifest = $this->vendorPath.'/composer/installed.json';

        if (! $this->files->exists($manifest)) {
            return [];
        }

        $contents = json_decode($this->files->get($manifest), true);

        if (! is_array($contents)) {
            return [];
        }

        $packages = $contents['packages'] ?? $contents;

        if (! is_array($packages)) {
            return [];
        }

        $plugins = [];

        foreach ($packages as $package) {
            if (! is_array($package)) {
                continue;
            }

            foreach ($this->pluginsFor($package) as $plugin) {
                $plugins[] = $plugin;
            }
        }

        return array_values(array_unique($plugins));
    }

    /**
     * @param  array<string, mixed>  $package
     * @return array<int, class-string>
     */
    protected function pluginsFor(array $package): array
    {
        $extra = $package['extra'] ?? null;

        if (! is_array($extra)) {
            return [];
        }

        $atrium = $extra['atrium'] ?? null;

        if (! is_array($atrium)) {
            return [];
        }

        $declared = $atrium['plugins'] ?? null;

        if (is_string($declared)) {
            $declared = [$declared];
        }

        if (! is_array($declared)) {
            return [];
        }

        /** @var array<int, class-string> */
        return array_values(array_filter(
            $declared,
            fn (mixed $class): bool => is_string($class) && $class !== '',
        ));
    }
}
