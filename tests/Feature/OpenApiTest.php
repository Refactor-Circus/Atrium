<?php

declare(strict_types=1);

use Illuminate\JsonSchema\JsonSchemaTypeFactory;
use RefactorCircus\Atrium\Domains\Dashboard\Resources\DashboardResource;
use RefactorCircus\Atrium\Domains\Dashboard\Resources\DashboardWidgetResource;
use RefactorCircus\Atrium\Domains\Navigation\Http\Resources\ShellResource;
use RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource;
use RefactorCircus\Atrium\Domains\Search\Http\Resources\SearchResultResource;
use RefactorCircus\Atrium\Domains\Settings\Http\Resources\SettingsPanelResource;
use RefactorCircus\Atrium\Domains\Widgets\Http\Resources\WidgetDefinitionResource;
use RefactorCircus\Keystone\Http\Resources\JsonResource;
use Symfony\Component\Process\Process;
use Workbench\App\OpenApi\AtriumOpenApi;

/*
 * Atrium's own OpenAPI document and the SDK's generated client (AC 72 to
 * 75), checked without Node: the committed openapi.json must equal a fresh
 * export, and the generated schema.d.ts must carry the hash of that file.
 */

const ATRIUM_OPENAPI_STALE = 'openapi.json or the SDK client is out of date: run `composer openapi:export`, then `pnpm -C ui generate:client`, and commit openapi.json and ui/sdk/src/client/schema.d.ts.';

/**
 * What each documented route's success response holds: one resource under
 * `data` (`item`), a list of them (`list`), or no body (`none`).
 *
 * @var array<string, array{0: 'item'|'list'|'none', 1: class-string<JsonResource>|null}>
 */
const ATRIUM_OPENAPI_RESPONSES = [
    'atrium.shell' => ['item', ShellResource::class],
    'atrium.dashboards.default' => ['item', DashboardResource::class],
    'atrium.dashboards.index' => ['list', DashboardResource::class],
    'atrium.dashboards.show' => ['item', DashboardResource::class],
    'atrium.dashboards.store' => ['item', DashboardResource::class],
    'atrium.dashboards.update' => ['item', DashboardResource::class],
    'atrium.dashboards.destroy' => ['none', null],
    'atrium.dashboards.layout' => ['item', DashboardResource::class],
    'atrium.dashboards.widgets.show' => ['item', DashboardWidgetResource::class],
    'atrium.widgets.index' => ['list', WidgetDefinitionResource::class],
    'atrium.search' => ['list', SearchResultResource::class],
    'atrium.settings.index' => ['list', SettingsPanelResource::class],
    'atrium.settings.show' => ['item', SettingsPanelResource::class],
    'atrium.screens.show' => ['item', ResolvedScreenResource::class],
];

/**
 * The repository root, where openapi.json lives.
 */
function openApiRoot(string $path = ''): string
{
    return dirname(__DIR__, 2).($path === '' ? '' : '/'.$path);
}

/**
 * Run a Testbench command against the workbench, as `composer
 * openapi:export` does, and return its output.
 *
 * @param  list<string>  $arguments
 */
function openApiTestbench(array $arguments): string
{
    $process = new Process([PHP_BINARY, 'vendor/bin/testbench', ...$arguments], openApiRoot(), ['TESTBENCH_WORKING_PATH' => openApiRoot()], timeout: 180);

    lockTestbenchSkeleton();

    try {
        $process->run();
    } finally {
        releaseTestbenchSkeleton();
    }

    expect($process->getExitCode())->toBe(0, $process->getErrorOutput().$process->getOutput());

    return $process->getOutput();
}

/**
 * @return array<string, mixed>
 */
function openApiDecode(string $json): array
{
    /** @var array<string, mixed> $decoded */
    $decoded = json_decode($json, true, flags: JSON_THROW_ON_ERROR);

    return $decoded;
}

/**
 * A fresh `workbench:openapi` export, decoded. Exported once per run: the
 * export boots the workbench in a child process.
 *
 * @return array<string, mixed>
 */
function openApiFreshExport(): array
{
    static $document = null;

    if ($document === null) {
        $path = (string) tempnam(sys_get_temp_dir(), 'atrium-openapi-');

        try {
            openApiTestbench(['workbench:openapi', $path]);
            $document = openApiDecode((string) file_get_contents($path));
        } finally {
            @unlink($path);
        }
    }

    return $document;
}

/**
 * The committed openapi.json, decoded.
 *
 * @return array<string, mixed>
 */
function openApiDocument(): array
{
    return openApiDecode((string) file_get_contents(openApiRoot('openapi.json')));
}

/**
 * The names of the `atrium.*` routes the workbench registers, plugin routes
 * left out.
 *
 * @return list<string>
 */
function openApiRouteNames(): array
{
    static $names = null;

    if ($names === null) {
        /** @var list<array{name?: string|null}> $routes */
        $routes = json_decode(openApiTestbench(['route:list', '--json', '--name=atrium.']), true, flags: JSON_THROW_ON_ERROR);

        $names = array_values(array_filter(
            array_map(fn (array $route): string => (string) ($route['name'] ?? ''), $routes),
            fn (string $name): bool => AtriumOpenApi::documents($name),
        ));
        sort($names);
    }

    return $names;
}

/**
 * Every operation of the committed document, by operationId.
 *
 * @return array<string, array<string, mixed>>
 */
function openApiOperations(): array
{
    $operations = [];

    foreach ((array) openApiDocument()['paths'] as $path => $item) {
        foreach ((array) $item as $method => $operation) {
            if (in_array($method, ['get', 'put', 'post', 'patch', 'delete'], true) && is_array($operation)) {
                /** @var array<string, mixed> $operation */
                $operations[(string) ($operation['operationId'] ?? strtoupper((string) $method).' '.$path)] = $operation;
            }
        }
    }

    ksort($operations);

    return $operations;
}

/**
 * Follow `$ref`s (`#/components/...`) until the value is not a reference.
 *
 * @param  array<string, mixed>  $document
 * @return array<array-key, mixed>
 */
function openApiResolve(array $document, mixed $node): array
{
    $node = is_array($node) ? $node : [];

    while (isset($node['$ref']) && is_string($node['$ref'])) {
        $value = $document;

        foreach (explode('/', substr($node['$ref'], 2)) as $key) {
            $value = is_array($value) ? ($value[str_replace(['~1', '~0'], ['/', '~'], $key)] ?? null) : null;
        }

        $node = is_array($value) ? $value : [];
    }

    return $node;
}

/**
 * The success responses of an operation, by status code.
 *
 * @param  array<string, mixed>  $operation
 * @return array<string, array<array-key, mixed>>
 */
function openApiSuccesses(array $operation): array
{
    $successes = [];

    foreach ((array) ($operation['responses'] ?? []) as $status => $response) {
        if ((int) $status >= 200 && (int) $status < 300) {
            $successes[(string) $status] = openApiResolve(openApiDocument(), $response);
        }
    }

    return $successes;
}

/**
 * The properties a resource's `schema()` marks required.
 *
 * @param  class-string<JsonResource>  $resource
 * @return list<string>
 */
function openApiRequired(string $resource): array
{
    $factory = new JsonSchemaTypeFactory;

    /** @var list<string> $required */
    $required = $factory->object($resource::schema($factory))->toArray()['required'] ?? [];

    return $required;
}

/**
 * The SHA-256 of openapi.json with LF line endings, as generate:client
 * writes it in the client's header.
 */
function openApiHash(): string
{
    return hash('sha256', str_replace("\r\n", "\n", (string) file_get_contents(openApiRoot('openapi.json'))));
}

it('matches a fresh workbench:openapi export', function (): void {
    expect(openApiFreshExport())->toBe(openApiDocument(), ATRIUM_OPENAPI_STALE);
});

it('is an OpenAPI 3.1 document of the Atrium API 2.0.0', function (): void {
    $document = openApiDocument();
    $info = (array) $document['info'];

    expect($document['openapi'])->toStartWith('3.1')
        ->and($info['title'])->toBe('Atrium API')
        ->and($info['version'])->toBe('2.0.0')
        ->and(array_column((array) $document['servers'], 'url'))->toBe(['/atrium/api']);
});

it('has one operation per atrium route, plugin routes left out, named by the route', function (): void {
    $routes = openApiRouteNames();
    $expected = array_keys(ATRIUM_OPENAPI_RESPONSES);
    sort($expected);

    expect($routes)->toBe($expected)
        ->and(array_keys(openApiOperations()))->toBe($routes, ATRIUM_OPENAPI_STALE);
});

it('describes each success response with its resource schema\'s required properties', function (string $route): void {
    [$kind, $resource] = ATRIUM_OPENAPI_RESPONSES[$route];
    $document = openApiDocument();
    $successes = openApiSuccesses(openApiOperations()[$route] ?? []);

    expect($successes)->not->toBeEmpty(ATRIUM_OPENAPI_STALE);

    foreach ($successes as $response) {
        $body = openApiResolve($document, $response['content']['application/json']['schema'] ?? null);
        $data = openApiResolve($document, $body['properties']['data'] ?? null);
        $data = $kind === 'list' ? openApiResolve($document, $data['items'] ?? null) : $data;

        // A resource or null (the default dashboard): the resource's branch.
        foreach ((array) ($data['anyOf'] ?? []) as $branch) {
            if (is_array($branch) && isset($branch['$ref'])) {
                $data = openApiResolve($document, $branch);
            }
        }

        expect($body['required'] ?? [])->toContain('data')
            ->and(openApiRequired((string) $resource))->not->toBeEmpty()
            ->and($data['required'] ?? [])->toContain(...openApiRequired((string) $resource));
    }
})->with(array_keys(array_filter(ATRIUM_OPENAPI_RESPONSES, fn (array $response): bool => $response[0] !== 'none')));

it('answers a deleted dashboard with 204 and no body', function (): void {
    $successes = openApiSuccesses(openApiOperations()['atrium.dashboards.destroy'] ?? []);

    expect(array_keys($successes))->toBe([204], ATRIUM_OPENAPI_STALE)
        ->and($successes['204'])->not->toHaveKey('content');
});

it('sends the abilities beside a dashboard, and null when there is no default', function (): void {
    $document = openApiDocument();
    $body = fn (string $route): array => openApiResolve($document, openApiSuccesses(openApiOperations()[$route])['200']['content']['application/json']['schema'] ?? null);

    expect(array_keys((array) ($body('atrium.dashboards.show')['properties']['meta']['properties']['abilities']['properties'] ?? [])))->toBe(['update', 'delete'])
        ->and((array) ($body('atrium.dashboards.default')['properties']['data'] ?? []))->toHaveKey('anyOf');
});

it('holds no machine-specific value', function (): void {
    $json = (string) file_get_contents(openApiRoot('openapi.json'));

    expect($json)->not->toContain(openApiRoot())
        ->and($json)->not->toContain('base64:')
        ->and($json)->not->toMatch('#https?://#');
});

it('generates the SDK client from this openapi.json', function (): void {
    $client = openApiRoot('ui/sdk/src/client/schema.d.ts');

    expect($client)->toBeFile(ATRIUM_OPENAPI_STALE);

    $header = strtok((string) file_get_contents($client), "\n");

    expect($header)->toBe('// openapi.json sha256: '.openApiHash(), ATRIUM_OPENAPI_STALE);
});

it('names both regeneration commands when the document or the client is stale', function (): void {
    expect(ATRIUM_OPENAPI_STALE)->toContain('composer openapi:export', 'pnpm -C ui generate:client');
});

it('keeps Scramble a dev dependency and exports with composer openapi:export', function (): void {
    $composer = openApiDecode((string) file_get_contents(openApiRoot('composer.json')));

    expect((array) $composer['require'])->not->toHaveKey('dedoc/scramble')
        ->and((array) $composer['require-dev'])->toHaveKey('dedoc/scramble')
        ->and((array) $composer['scripts']['openapi:export'])->toBe(['@php vendor/bin/testbench workbench:openapi openapi.json']);
});
