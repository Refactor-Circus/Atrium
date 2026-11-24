<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Data;

/**
 * A front-end module the Blade page loads (D-082): a package's (declared in
 * its composer.json under `extra.atrium`), a module folder registered with
 * `Atrium::module()`, or the app's own scripts (`Atrium::script()`).
 *
 * A package module's `scripts` and `styles` are paths relative to its
 * `root`, served by Atrium from there; the app's are URLs the host serves.
 */
final class ModuleManifest
{
    /**
     * @param  list<string>  $scripts
     * @param  list<string>  $styles
     */
    public function __construct(
        public private(set) string $key,
        public private(set) ?string $root,
        public private(set) array $scripts,
        public private(set) array $styles,
    ) {}

    /**
     * Whether its files are URLs the host serves (`Atrium::script()`), not
     * files under a package root Atrium serves.
     */
    public function external(): bool
    {
        return $this->root === null;
    }

    /**
     * The manifest of a package: `extra.atrium` of its composer.json, read
     * from `$root`. Null when it declares no script.
     *
     * @param  array<array-key, mixed>  $atrium
     */
    public static function fromComposer(string $root, array $atrium, string $packageName): ?self
    {
        $scripts = self::paths($atrium['scripts'] ?? []);

        if ($scripts === []) {
            return null;
        }

        $key = $atrium['key'] ?? null;

        if (! is_string($key) || $key === '') {
            $key = substr($packageName, (int) strrpos($packageName, '/') + (str_contains($packageName, '/') ? 1 : 0));
        }

        return new self(strtolower($key), rtrim($root, '/\\'), $scripts, self::paths($atrium['styles'] ?? []));
    }

    /**
     * The relative paths of a manifest list: no absolute path, no `..`, no
     * backslash, so a file it names always sits under the package.
     *
     * @return list<string>
     */
    private static function paths(mixed $value): array
    {
        $value = is_string($value) ? [$value] : $value;

        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(
            array_map(fn (mixed $path): ?string => is_string($path) ? (string) preg_replace('#^(\./)+#', '', $path) : null, $value),
            fn (?string $path): bool => is_string($path) && $path !== '' && ! str_starts_with($path, '/') && ! str_contains($path, '..') && ! str_contains($path, '\\') && preg_match('#^[A-Za-z0-9_./@-]+$#', $path) === 1,
        ));
    }
}
