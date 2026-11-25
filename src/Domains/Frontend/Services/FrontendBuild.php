<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Frontend\Services;

use RuntimeException;

/**
 * A prebuilt front end and its `build.json` (D-079, D-085): Atrium's own in
 * the package's `dist/`, or a module's beside its scripts. The file says
 * which shared API the build targets, the hash of its sources and, for
 * Atrium's, the app's entry and the file of every shared specifier.
 */
final class FrontendBuild
{
    /**
     * @var array<string, mixed>|null
     */
    private ?array $info = null;

    public function __construct(private readonly string $directory) {}

    /**
     * Atrium's own build, `dist/` at the package root.
     */
    public static function atrium(): self
    {
        return new self(dirname(__DIR__, 4).'/dist');
    }

    public function directory(): string
    {
        return $this->directory;
    }

    public function exists(): bool
    {
        return is_file($this->directory.'/build.json');
    }

    /**
     * The build's `build.json`; empty when it has none.
     *
     * @return array<string, mixed>
     */
    public function info(): array
    {
        if ($this->info !== null) {
            return $this->info;
        }

        $decoded = $this->exists() ? json_decode((string) file_get_contents($this->directory.'/build.json'), true) : null;

        /** @var array<string, mixed> $info */
        $info = is_array($decoded) ? $decoded : [];

        return $this->info = $info;
    }

    /**
     * The shared API the build was made for (`1.0`), or null when unknown.
     */
    public function sharedApi(): ?string
    {
        $api = $this->info()['shared_api'] ?? null;

        return is_string($api) ? $api : null;
    }

    /**
     * A short version for asset URLs: the start of the sources' hash, or of
     * the build file's modification time when there is no hash.
     */
    public function version(): string
    {
        $hash = $this->info()['hash'] ?? null;

        if (is_string($hash) && $hash !== '') {
            return substr($hash, 0, 12);
        }

        return substr(hash('sha256', (string) @filemtime($this->directory)), 0, 12);
    }

    /**
     * The app's entry script, relative to the build.
     */
    public function entryScript(): string
    {
        $script = $this->info()['entry']['script'] ?? null;

        if (! is_string($script)) {
            throw new RuntimeException(sprintf('Atrium has no front-end build at [%s]: run `pnpm -C ui build` in the package, or reinstall it.', $this->directory));
        }

        return $script;
    }

    /**
     * The app's stylesheets, relative to the build.
     *
     * @return list<string>
     */
    public function entryStyles(): array
    {
        $styles = $this->info()['entry']['styles'] ?? [];

        return array_values(array_filter(is_array($styles) ? $styles : [], is_string(...)));
    }

    /**
     * Each shared specifier, to its file relative to the build.
     *
     * @return array<string, string>
     */
    public function imports(): array
    {
        $imports = $this->info()['imports'] ?? [];
        $map = [];

        foreach (is_array($imports) ? $imports : [] as $specifier => $file) {
            if (is_string($specifier) && is_string($file)) {
                $map[$specifier] = $file;
            }
        }

        return $map;
    }
}
