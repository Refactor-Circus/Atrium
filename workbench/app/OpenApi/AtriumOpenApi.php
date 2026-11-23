<?php

declare(strict_types=1);

namespace Workbench\App\OpenApi;

use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Server;
use Dedoc\Scramble\Support\Generator\Types\Type;
use Dedoc\Scramble\Support\RouteInfo;
use Illuminate\JsonSchema\JsonSchemaTypeFactory;
use Illuminate\Routing\Route;
use RefactorCircus\Atrium\Domains\Dashboard\Resources\DashboardResource;
use RefactorCircus\Atrium\Domains\Dashboard\Resources\DashboardWidgetResource;
use RefactorCircus\Atrium\Domains\Navigation\Http\Resources\ShellResource;
use RefactorCircus\Atrium\Domains\Screens\Http\Resources\ResolvedScreenResource;
use RefactorCircus\Atrium\Domains\Search\Http\Resources\SearchResultResource;
use RefactorCircus\Atrium\Domains\Settings\Http\Resources\SettingsPanelResource;
use RefactorCircus\Atrium\Domains\Widgets\Http\Resources\WidgetDefinitionResource;
use RefactorCircus\Keystone\Http\Resources\JsonResource;

/**
 * The workbench's Scramble configuration of Atrium's OpenAPI document, and
 * the resource-schema extension (AC 72, 73): the `atrium.*` routes, plugin
 * routes left out, each under its route name as operationId, with one
 * relative server and fixed title and version.
 *
 * Every controller answers through `$request->persist()`, which hides the
 * resource from Scramble, so each success response is stated here from the
 * resource's own `schema()`: each resource becomes the component schema of
 * its class basename, and each route's 2xx body references it. Scramble is a
 * dev dependency; nothing in src/ knows about it.
 */
final class AtriumOpenApi
{
    /**
     * The server every operation's path is relative to: the default
     * `atrium.routes.prefix`, without a host, so the document holds nothing
     * machine-specific.
     */
    public const string SERVER = '/atrium/api';

    /**
     * The API resources whose component schema is their own `schema()`.
     *
     * @var list<class-string<JsonResource>>
     */
    public const array RESOURCES = [
        DashboardResource::class,
        DashboardWidgetResource::class,
        ShellResource::class,
        WidgetDefinitionResource::class,
        ResolvedScreenResource::class,
        SettingsPanelResource::class,
        SearchResultResource::class,
    ];

    /**
     * What each route's success response holds: its status; one resource
     * under `data` (`item`), the same or null (`nullable`), a list of them
     * (`list`) or no body (`none`); and what goes beside `data`: the
     * dashboard's `meta.abilities` (`abilities`, required unless `data` may
     * be null) or the resolved settings `screen` (`screen`).
     *
     * @var array<string, array{0: int, 1: 'item'|'nullable'|'list'|'none', 2: class-string<JsonResource>|null, 3?: 'abilities'|'screen'}>
     */
    public const array RESPONSES = [
        'atrium.shell' => [200, 'item', ShellResource::class],
        'atrium.dashboards.default' => [200, 'nullable', DashboardResource::class, 'abilities'],
        'atrium.dashboards.index' => [200, 'list', DashboardResource::class],
        'atrium.dashboards.show' => [200, 'item', DashboardResource::class, 'abilities'],
        'atrium.dashboards.store' => [201, 'item', DashboardResource::class, 'abilities'],
        'atrium.dashboards.update' => [200, 'item', DashboardResource::class, 'abilities'],
        'atrium.dashboards.destroy' => [204, 'none', null],
        'atrium.dashboards.layout' => [200, 'item', DashboardResource::class, 'abilities'],
        'atrium.dashboards.widgets.show' => [200, 'item', DashboardWidgetResource::class],
        'atrium.widgets.index' => [200, 'list', WidgetDefinitionResource::class],
        'atrium.search' => [200, 'list', SearchResultResource::class],
        'atrium.settings.index' => [200, 'list', SettingsPanelResource::class, 'screen'],
        'atrium.settings.show' => [200, 'item', SettingsPanelResource::class, 'screen'],
        'atrium.screens.show' => [200, 'item', ResolvedScreenResource::class],
    ];

    /**
     * The values that make the export the same on every machine and run.
     *
     * @return array<string, mixed>
     */
    public static function config(): array
    {
        return [
            'scramble.api_path' => 'atrium/api',
            'scramble.info.version' => '2.0.0',
            'scramble.info.description' => "Atrium's JSON API: the shell, dashboards and their widgets, widget definitions, search, settings panels and integration screens. The host's guard authenticates every route, and the `viewAtrium` gate authorizes it.",
            'scramble.ui.title' => 'Atrium API',
            'scramble.servers' => null,
            // Always generate: a cached document could be stale.
            'scramble.cache.store' => null,
        ];
    }

    /**
     * Document Atrium's own routes with the resources' schemas.
     */
    public static function register(): void
    {
        Scramble::configure()
            ->routes(fn (Route $route): bool => self::documents((string) $route->getName()))
            ->withOperationTransformers(function (Operation $operation, RouteInfo $routeInfo): void {
                $name = (string) $routeInfo->route->getName();

                $operation->setOperationId($name);

                if (isset(self::RESPONSES[$name])) {
                    self::describeSuccess($operation, self::RESPONSES[$name]);
                }
            })
            ->withDocumentTransformers(function (OpenApi $openApi): void {
                $openApi->servers = [Server::make(self::SERVER)];

                self::useResourceSchemas($openApi);
            });
    }

    /**
     * Whether a route is in the document: every `atrium.*` route but the
     * plugins', which belong to their packages.
     */
    public static function documents(string $name): bool
    {
        return str_starts_with($name, 'atrium.') && ! str_starts_with($name, 'atrium.plugins.');
    }

    /**
     * Each resource's component is its own `schema()`, named by its class
     * basename as Scramble names them, whatever Scramble inferred.
     */
    private static function useResourceSchemas(OpenApi $openApi): void
    {
        $factory = new JsonSchemaTypeFactory;

        foreach (self::RESOURCES as $resource) {
            $openApi->components->addSchema(class_basename($resource), Schema::fromType(self::raw($factory->object($resource::schema($factory))->toArray())));
        }
    }

    /**
     * Replace the success responses Scramble inferred with the route's own:
     * its status and body, from the resource. Error responses stay as
     * Scramble found them.
     *
     * @param  array{0: int, 1: 'item'|'nullable'|'list'|'none', 2: class-string<JsonResource>|null, 3?: 'abilities'|'screen'}  $spec
     */
    private static function describeSuccess(Operation $operation, array $spec): void
    {
        [$status, $kind, $resource] = $spec;
        $beside = $spec[3] ?? null;

        $operation->responses = array_values(array_filter(
            $operation->responses ?? [],
            fn (mixed $response): bool => ! ($response instanceof Response && (int) $response->code >= 200 && (int) $response->code < 300),
        ));

        if ($kind === 'none' || $resource === null) {
            $operation->addResponse(Response::make($status)->setDescription('No content'));

            return;
        }

        $name = class_basename($resource);
        $ref = ['$ref' => '#/components/schemas/'.$name];

        $properties = ['data' => match ($kind) {
            'item' => $ref,
            'nullable' => ['anyOf' => [$ref, ['type' => 'null']]],
            'list' => ['type' => 'array', 'items' => $ref],
        }];
        $required = ['data'];

        if ($beside === 'abilities') {
            $properties['meta'] = self::object([
                'abilities' => self::object([
                    'update' => ['type' => 'boolean'],
                    'delete' => ['type' => 'boolean'],
                ]),
            ], 'What the user may do to the dashboard; absent when `data` is null.');

            if ($kind !== 'nullable') {
                $required[] = 'meta';
            }
        }

        if ($beside === 'screen') {
            $properties['screen'] = ['$ref' => '#/components/schemas/'.class_basename(ResolvedScreenResource::class)];
            $required[] = 'screen';
        }

        $description = match ($kind) {
            'item' => "`{$name}`",
            'nullable' => "`{$name}`, or null",
            'list' => "Array of `{$name}`",
        };

        $operation->addResponse(
            Response::make($status)
                ->setDescription($description)
                ->setContent('application/json', Schema::fromType(self::raw(['type' => 'object', 'properties' => $properties, 'required' => $required]))),
        );
    }

    /**
     * An object whose every property is required.
     *
     * @param  array<string, array<string, mixed>>  $properties
     * @return array<string, mixed>
     */
    private static function object(array $properties, ?string $description = null): array
    {
        return array_filter([
            'type' => 'object',
            'description' => $description,
            'properties' => $properties,
            'required' => array_keys($properties),
        ], fn (mixed $value): bool => $value !== null);
    }

    /**
     * A JSON Schema written as it is: OpenAPI 3.1 schemas are JSON Schema.
     *
     * @param  array<string, mixed>  $schema
     */
    private static function raw(array $schema): Type
    {
        return new class($schema) extends Type
        {
            /**
             * @param  array<string, mixed>  $schema
             */
            public function __construct(private readonly array $schema)
            {
                parent::__construct('object');
            }

            public function serializeAs31(): mixed
            {
                return $this->schema;
            }

            public function serializeAs32(): mixed
            {
                return $this->schema;
            }
        };
    }
}
