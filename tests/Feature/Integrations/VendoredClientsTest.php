<?php

declare(strict_types=1);

/*
 * Vendored clients (AC 50, D-020): until each module moves into its package
 * (phase 2 of D-082), each staged module carries its package's
 * `openapi.json` and generated `schema.d.ts` in `ui/modules/{pkg}/client/`,
 * copied by `pnpm -C ui sync:clients`. No Node is needed here: each copy's stamp is
 * checked against it, and the copies against the sibling checkout
 * (`$ATRIUM_SUITE_PATH/{Pkg}`, by default beside this repository) when one is
 * there.
 */

/**
 * The suite packages the layer integrates, by key, with their checkout folder.
 */
const VENDORED_CLIENTS_PACKAGES = [
    'cortex' => 'Cortex',
    'guardian' => 'Guardian',
    'impex' => 'Impex',
    'keen' => 'Keen',
    'pennantplus' => 'PennantPlus',
    'polycart' => 'Polycart',
    'roster' => 'Roster',
    'showroom' => 'Showroom',
];

function vendoredClientsRoot(): string
{
    return dirname(__DIR__, 3);
}

function vendoredClientPath(string $key, string $file): string
{
    return vendoredClientsRoot().'/ui/modules/'.$key.'/client/'.$file;
}

/**
 * The package's checkout, as `sync:clients` reads it.
 */
function vendoredClientsSibling(string $folder): string
{
    $suite = getenv('ATRIUM_SUITE_PATH');

    return (is_string($suite) && $suite !== '' ? rtrim($suite, '/\\') : dirname(vendoredClientsRoot())).'/'.$folder;
}

function vendoredClientsRead(string $path): string
{
    expect($path)->toBeFile();

    return (string) file_get_contents($path);
}

/**
 * @return array<string, array{string, string}>
 */
function vendoredClientsDataset(): array
{
    $dataset = [];

    foreach (VENDORED_CLIENTS_PACKAGES as $key => $folder) {
        $dataset[$key] = [$key, $folder];
    }

    return $dataset;
}

it('vendors openapi.json, schema.d.ts and openapi.sha256 for every package', function (string $key): void {
    foreach (['openapi.json', 'schema.d.ts', 'openapi.sha256'] as $file) {
        expect(vendoredClientPath($key, $file))->toBeFile();
    }
})->with(array_keys(VENDORED_CLIENTS_PACKAGES));

it('stamps each vendored openapi.json with its SHA-256, taken with LF line endings', function (string $key): void {
    $openapi = str_replace("\r\n", "\n", vendoredClientsRead(vendoredClientPath($key, 'openapi.json')));
    $stamp = trim(vendoredClientsRead(vendoredClientPath($key, 'openapi.sha256')));

    expect($stamp)->toMatch('/^[0-9a-f]{64}$/')
        ->and($stamp)->toBe(hash('sha256', $openapi), "The [{$key}] openapi.sha256 does not match its openapi.json. Run `pnpm -C ui sync:clients`.");
})->with(array_keys(VENDORED_CLIENTS_PACKAGES));

it('matches the sibling checkout\'s openapi.json and client/src/schema.d.ts', function (string $key, string $folder): void {
    $sibling = vendoredClientsSibling($folder);

    if (! is_file($sibling.'/openapi.json') || ! is_file($sibling.'/client/src/schema.d.ts')) {
        $this->markTestSkipped("No {$folder} v2 build at [{$sibling}] (openapi.json and client/src/schema.d.ts) to compare with. Set ATRIUM_SUITE_PATH to the folder holding the package checkouts, then run `pnpm -C ui sync:clients`.");
    }

    $stale = "The vendored [{$key}] client differs from [{$sibling}]. Run `pnpm -C ui sync:clients` and commit the result.";

    expect(json_decode(vendoredClientsRead(vendoredClientPath($key, 'openapi.json')), true, flags: JSON_THROW_ON_ERROR))
        ->toBe(json_decode(vendoredClientsRead($sibling.'/openapi.json'), true, flags: JSON_THROW_ON_ERROR), $stale)
        ->and(vendoredClientsRead(vendoredClientPath($key, 'schema.d.ts')))
        ->toBe(vendoredClientsRead($sibling.'/client/src/schema.d.ts'), $stale);
})->with(vendoredClientsDataset());

/**
 * Every file under `ui/`, build output and dependencies left out.
 *
 * @return list<string>
 */
function vendoredClientsUiFiles(): array
{
    $skipped = ['node_modules', 'dist'];
    $directory = new RecursiveDirectoryIterator(vendoredClientsRoot().'/ui', FilesystemIterator::SKIP_DOTS);
    $filter = new RecursiveCallbackFilterIterator($directory, fn (SplFileInfo $file): bool => ! ($file->isDir() && in_array($file->getFilename(), $skipped, true)));
    $files = [];

    foreach (new RecursiveIteratorIterator($filter) as $file) {
        if ($file instanceof SplFileInfo && in_array($file->getExtension(), ['ts', 'mts', 'vue', 'js', 'mjs', 'json', 'yaml'], true)) {
            $files[] = $file->getPathname();
        }
    }

    sort($files);

    return $files;
}

/**
 * An import, require or dependency entry of a `@refactor-circus/{pkg}-client` package.
 */
const VENDORED_CLIENTS_IMPORT = '~(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)[\'"]@refactor-circus/[a-z0-9-]+-client(?:/[^\'"]*)?[\'"]|[\'"]@refactor-circus/[a-z0-9-]+-client[\'"]\s*:~';

it('imports no @refactor-circus/*-client package anywhere under ui/ until the release step', function (): void {
    $found = [];

    foreach (vendoredClientsUiFiles() as $file) {
        if (preg_match(VENDORED_CLIENTS_IMPORT, (string) file_get_contents($file), $match) === 1) {
            $found[] = $file.': '.$match[0];
        }
    }

    expect(vendoredClientsUiFiles())->not->toBeEmpty()
        ->and($found)->toBe([]);
});

it('would catch an import or a dependency of a package client', function (string $source): void {
    expect(preg_match(VENDORED_CLIENTS_IMPORT, $source))->toBe(1);
})->with([
    'an import' => ["import { createImpexClient } from '@refactor-circus/impex-client'"],
    'a type import' => ['import type { paths } from "@refactor-circus/roster-client"'],
    'a subpath import' => ["import type { paths } from '@refactor-circus/cortex-client/schema'"],
    'a dynamic import' => ["const client = await import('@refactor-circus/keen-client')"],
    'a package.json dependency' => ['"@refactor-circus/showroom-client": "github:refactor-circus/showroom#v2.0.0&path:/client"'],
]);

it('lets Atrium\'s own package names and prose through', function (string $source): void {
    expect(preg_match(VENDORED_CLIENTS_IMPORT, $source))->toBe(0);
})->with([
    'the SDK' => ['"name": "@refactor-circus/atrium"'],
    'a staged module' => ['"name": "@refactor-circus/roster-atrium"'],
    'a comment' => ['// switch to @refactor-circus/impex-client once v2.0.0 is tagged'],
]);

it('vendors a Roster client without the role and permission operations that moved to Guardian (AC 78)', function (): void {
    /** @var array{paths: array<string, array<string, mixed>>} $openapi */
    $openapi = json_decode(vendoredClientsRead(vendoredClientPath('roster', 'openapi.json')), true, flags: JSON_THROW_ON_ERROR);
    $operations = [];

    foreach ($openapi['paths'] as $methods) {
        foreach ($methods as $operation) {
            if (is_array($operation) && isset($operation['operationId']) && is_string($operation['operationId'])) {
                $operations[] = $operation['operationId'];
            }
        }
    }

    $removed = array_values(array_filter($operations, fn (string $id): bool => preg_match('/^roster\\.(roles|permissions|users\\.roles)\\./', $id) === 1
        || in_array($id, ['roster.users.permissions', 'roster.organizations.role-assignments.index'], true)));

    expect($operations)->not->toBeEmpty()
        ->and($removed)->toBe([]);
});
