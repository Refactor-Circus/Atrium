<?php

declare(strict_types=1);

/*
 * The committed front-end builds match their sources (D-085): Atrium's own
 * (`dist/`), each staged module's and the workbench's. Each build writes
 * `build.json` with the SHA-256 of the files it was built from; this
 * recomputes it as the preset does (`hashInputs()` in ui/sdk/vite), so a
 * source changed without a rebuild fails here, with no Node needed. CI
 * also rebuilds and diffs (`.github/workflows/ui.yml`).
 */

/**
 * The SHA-256 of `inputs` under `root`, as `hashInputs()` takes it.
 *
 * @param  list<string>  $inputs
 */
function sourcesHash(string $root, array $inputs): string
{
    $files = [];

    $walk = function (string $path) use (&$walk, &$files, $root): void {
        $absolute = $root.'/'.$path;

        if (! file_exists($absolute)) {
            return;
        }

        if (is_dir($absolute)) {
            foreach (scandir($absolute) ?: [] as $entry) {
                if (! in_array($entry, ['node_modules', 'dist', '.DS_Store', '.git'], true) && ! str_starts_with($entry, '.')) {
                    $walk($path.'/'.$entry);
                }
            }

            return;
        }

        $files[] = $path;
    };

    foreach ($inputs as $input) {
        $walk(rtrim($input, '/'));
    }

    $files = array_values(array_unique($files));
    sort($files, SORT_STRING);

    $lines = array_map(
        fn (string $path): string => $path."\0".hash('sha256', str_replace("\r\n", "\n", (string) file_get_contents($root.'/'.$path)))."\n",
        $files,
    );

    return hash('sha256', implode('', $lines));
}

/**
 * Every committed build's `build.json`.
 *
 * @return array<string, array{string}>
 */
function committedBuilds(): array
{
    $root = dirname(__DIR__, 3);
    $builds = ['atrium' => [$root.'/dist/build.json'], 'workbench' => [$root.'/ui/workbench/dist/atrium/build.json']];

    foreach (glob($root.'/ui/modules/*/dist/atrium/build.json') ?: [] as $file) {
        $builds[basename(dirname($file, 3))] = [$file];
    }

    return $builds;
}

it('has a build for Atrium, the workbench and each of the eight staged modules', function (): void {
    expect(array_keys(committedBuilds()))->toBe(['atrium', 'workbench', 'cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom']);
});

it('was built from the sources as they are now', function (string $file): void {
    /** @var array{key: string, shared_api: string, root: string, inputs: list<string>, hash: string} $info */
    $info = json_decode((string) file_get_contents($file), true, flags: JSON_THROW_ON_ERROR);
    $root = realpath(dirname($file).'/'.$info['root']);

    expect($root)->toBeString()
        ->and($info['shared_api'])->toBe('1.0')
        ->and(sourcesHash((string) $root, $info['inputs']))->toBe($info['hash'], "The [{$info['key']}] build is older than its sources: run `pnpm -C ui build` and commit the result.");
})->with(committedBuilds());
