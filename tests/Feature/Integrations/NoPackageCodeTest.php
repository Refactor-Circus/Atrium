<?php

declare(strict_types=1);

/*
 * No package code (AC 45): Atrium's PHP never loads a suite package's
 * classes, models or actions. Its integrations are data, and the layer
 * calls each package's API. The ArchTest checks the imports; this test
 * also catches names written as strings, and the Composer requirements.
 */

/**
 * The eight suite packages Atrium integrates, by namespace segment.
 */
const NO_PACKAGE_CODE_NAMESPACES = ['Cortex', 'Guardian', 'Impex', 'Keen', 'PennantPlus', 'Polycart', 'Roster', 'Showroom'];

/**
 * Every PHP file under `src/`.
 *
 * @return list<string>
 */
function noPackageCodeSourceFiles(): array
{
    $files = [];

    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__.'/../../../src', FilesystemIterator::SKIP_DOTS)) as $file) {
        if ($file instanceof SplFileInfo && $file->getExtension() === 'php') {
            $files[] = $file->getPathname();
        }
    }

    sort($files);

    return $files;
}

it('names no suite package namespace anywhere in src, strings included', function (): void {
    // `RefactorCircus\Cortex`, with one backslash or an escaped two, in code,
    // strings or comments, in any case.
    $pattern = '/RefactorCircus\\\\{1,2}('.implode('|', NO_PACKAGE_CODE_NAMESPACES).')\b/i';
    $found = [];

    foreach (noPackageCodeSourceFiles() as $file) {
        if (preg_match_all($pattern, (string) file_get_contents($file), $matches) > 0) {
            $found[] = $file.': '.implode(', ', array_unique($matches[0]));
        }
    }

    expect(noPackageCodeSourceFiles())->not->toBeEmpty()
        ->and($found)->toBe([]);
});

it('would catch a package namespace written as a string', function (string $source): void {
    $pattern = '/RefactorCircus\\\\{1,2}('.implode('|', NO_PACKAGE_CODE_NAMESPACES).')\b/i';

    expect(preg_match($pattern, $source))->toBe(1);
})->with([
    'an import' => ['use RefactorCircus\\Roster\\Domains\\User\\Models\\UserModel;'],
    'a single-quoted string' => ["'RefactorCircus\\Impex\\Impex'"],
    'a double-quoted string' => ['"RefactorCircus\\\\Keen\\\\Keen"'],
    'PennantPlus' => ['RefactorCircus\\PennantPlus\\PennantPlus'],
    'Guardian' => ['use RefactorCircus\\Guardian\\Domains\\Roles\\Models\\RoleModel;'],
]);

it('lets Atrium\'s own integration namespaces through', function (): void {
    $pattern = '/RefactorCircus\\\\{1,2}('.implode('|', NO_PACKAGE_CODE_NAMESPACES).')\b/i';

    expect(preg_match($pattern, 'RefactorCircus\\Atrium\\Integrations\\Cortex\\CortexFeature'))->toBe(0)
        ->and(preg_match($pattern, 'RefactorCircus\\Keystone\\Cortex\\CortexIntegration'))->toBe(0);
});

it('requires only PHP, Laravel and Keystone', function (): void {
    $composer = json_decode((string) file_get_contents(__DIR__.'/../../../composer.json'), true, flags: JSON_THROW_ON_ERROR);

    expect(array_keys($composer['require']))->toEqualCanonicalizing(['php', 'laravel/framework', 'refactor-circus/keystone']);
});
