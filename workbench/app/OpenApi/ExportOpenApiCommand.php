<?php

declare(strict_types=1);

namespace Workbench\App\OpenApi;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Exports the OpenAPI document of Atrium's JSON API (the `atrium.*` routes,
 * plugin routes left out), the same on every run: Scramble reads model
 * columns when their tables exist, so the export always reads a fresh,
 * migrated in-memory SQLite database rather than the developer's workbench
 * database. Title, version and server are fixed in AtriumOpenApi.
 *
 * `composer openapi:export` runs it to write the committed openapi.json, and
 * tests/Feature/OpenApiTest.php runs it to check that file is current.
 * Workbench only: nothing in src/ knows about Scramble.
 */
final class ExportOpenApiCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'workbench:openapi {path=openapi.json : Where to write the document}';

    /**
     * @var string
     */
    protected $description = "Export the OpenAPI document of Atrium's JSON API";

    public function handle(): int
    {
        config([
            'database.connections.openapi' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
                'foreign_key_constraints' => true,
            ],
            'database.default' => 'openapi',
        ]);

        DB::purge('openapi');

        $migrated = $this->callSilently('migrate', ['--database' => 'openapi', '--force' => true]);

        if ($migrated !== self::SUCCESS) {
            $this->components->error('The migrations failed.');

            return self::FAILURE;
        }

        return $this->call('scramble:export', ['--path' => (string) $this->argument('path')]);
    }
}
