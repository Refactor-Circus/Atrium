<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Services;

use Illuminate\Contracts\Config\Repository;
use RefactorCircus\Atrium\Domains\Frontend\Data\ModuleManifest;

/**
 * Where the front end's files are, and the URLs they are served at (D-081):
 * `/{atrium.assets.path}/{owner}/{version}/{path}`, `owner` being `atrium`
 * for Atrium's own build and a module's key for its files. The version is
 * the build's source hash, so every URL changes with the build and can be
 * cached for good.
 *
 * Atrium serves the files from the package (and each module's from its
 * package) through one route: no publish step to forget after an update,
 * nothing written to `public/`, the same on Octane and Vapor. Only files
 * with a front-end extension, inside the build's folder (Atrium's `dist/`,
 * the folders a module's composer.json names its scripts and styles in),
 * are ever served.
 */
final class FrontendAssets
{
    /**
     * The extensions served, with their content types.
     */
    public const array TYPES = [
        'js' => 'text/javascript; charset=utf-8',
        'mjs' => 'text/javascript; charset=utf-8',
        'css' => 'text/css; charset=utf-8',
        'map' => 'application/json; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'woff2' => 'font/woff2',
        'woff' => 'font/woff',
        'ttf' => 'font/ttf',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
    ];

    private ?FrontendBuild $atrium = null;

    public function __construct(
        private readonly Repository $config,
        private readonly ModuleRegistry $modules,
    ) {}

    /**
     * Atrium's own build.
     */
    public function atrium(): FrontendBuild
    {
        return $this->atrium ??= FrontendBuild::atrium();
    }

    /**
     * Point Atrium's own build elsewhere (tests).
     */
    public function useAtriumBuild(FrontendBuild $build): static
    {
        $this->atrium = $build;

        return $this;
    }

    /**
     * The URL of a file of Atrium's build.
     */
    public function atriumUrl(string $file): string
    {
        return $this->url('atrium', $this->atrium()->version(), $file);
    }

    /**
     * The URLs of a module's scripts and styles.
     *
     * @return array{scripts: list<string>, styles: list<string>}
     */
    public function moduleUrls(ModuleManifest $module): array
    {
        if ($module->external()) {
            return ['scripts' => $module->scripts, 'styles' => $module->styles];
        }

        $version = $this->modules->buildOf($module)?->version() ?? 'dev';

        return [
            'scripts' => array_map(fn (string $path): string => $this->url($module->key, $version, $path), $module->scripts),
            'styles' => array_map(fn (string $path): string => $this->url($module->key, $version, $path), $module->styles),
        ];
    }

    /**
     * The current version of an owner's build, or null for an owner that
     * serves nothing.
     */
    public function versionOf(string $owner): ?string
    {
        if ($owner === 'atrium') {
            return $this->atrium()->version();
        }

        $module = $this->modules->all()[$owner] ?? null;

        return $module === null ? null : ($this->modules->buildOf($module)?->version() ?? 'dev');
    }

    public function url(string $owner, string $version, string $path): string
    {
        return url($this->prefix().'/'.$owner.'/'.$version.'/'.ltrim($path, '/'));
    }

    /**
     * The asset route's prefix, `vendor/atrium` by default.
     */
    public function prefix(): string
    {
        $prefix = $this->config->get('atrium.assets.path', 'vendor/atrium');

        return trim(is_string($prefix) && $prefix !== '' ? $prefix : 'vendor/atrium', '/');
    }

    /**
     * The file `owner` serves at `path`, or null when it serves none there.
     */
    public function locate(string $owner, string $path): ?string
    {
        if (! array_key_exists(strtolower(pathinfo($path, PATHINFO_EXTENSION)), self::TYPES)
            || preg_match('#(^|/)\.#', $path) === 1
            || str_contains($path, '\\')
            || str_contains($path, "\0")) {
            return null;
        }

        foreach ($this->roots($owner) as [$base, $allowed]) {
            $file = realpath($base.'/'.$path);

            if ($file === false || ! is_file($file)) {
                continue;
            }

            foreach ($allowed as $directory) {
                $directory = realpath($directory);

                if ($directory !== false && str_starts_with($file, $directory.DIRECTORY_SEPARATOR)) {
                    return $file;
                }
            }
        }

        return null;
    }

    /**
     * The folder an owner's paths are relative to, and the folders inside it
     * whose files may be served.
     *
     * @return list<array{0: string, 1: list<string>}>
     */
    private function roots(string $owner): array
    {
        if ($owner === 'atrium') {
            $directory = $this->atrium()->directory();

            return [[$directory, [$directory]]];
        }

        $module = $this->modules->all()[$owner] ?? null;

        if ($module === null || $module->external() || $module->root === null) {
            return [];
        }

        $root = $module->root;
        $allowed = array_values(array_unique(array_map(
            fn (string $file): string => $root.'/'.dirname($file),
            [...$module->scripts, ...$module->styles],
        )));

        return [[$root, $allowed]];
    }
}
