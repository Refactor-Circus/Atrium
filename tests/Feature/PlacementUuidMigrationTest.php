<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Support\Tables;

/**
 * The migration under test, as the migrator loads it.
 */
function placementUuidMigration(): Migration
{
    return require __DIR__.'/../../database/migrations/2026_11_22_000000_add_uuid_and_version_to_atrium_dashboards.php';
}

/**
 * A v1 dashboard with placements that have no uuid, written straight to the
 * tables as v1 left them.
 */
function seedV1Placements(int $count): int
{
    $dashboard = DB::table(Tables::name('dashboards'))->insertGetId([
        'name' => 'Ops',
        'slug' => 'ops',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    foreach (array_chunk(range(1, $count), 100) as $chunk) {
        DB::table(Tables::name('dashboard_widgets'))->insert(array_map(fn (int $sort): array => [
            'dashboard_id' => $dashboard,
            'widget_key' => 'app.orders',
            'sort' => $sort,
        ], $chunk));
    }

    return $dashboard;
}

it('removes the uuid and version columns on the way down', function (): void {
    placementUuidMigration()->down();

    expect(Schema::hasColumn(Tables::name('dashboard_widgets'), 'uuid'))->toBeFalse()
        ->and(Schema::hasColumn(Tables::name('dashboards'), 'version'))->toBeFalse();
});

it('backfills a distinct uuid for every v1 placement and makes the column unique and not null', function (): void {
    $migration = placementUuidMigration();
    $migration->down();

    $dashboard = seedV1Placements(3);

    $migration->up();

    $uuids = DB::table(Tables::name('dashboard_widgets'))->pluck('uuid');

    expect($uuids)->toHaveCount(3)
        ->and($uuids->filter(fn (mixed $uuid): bool => is_string($uuid) && Str::isUuid($uuid)))->toHaveCount(3)
        ->and($uuids->unique())->toHaveCount(3)
        ->and(DB::table(Tables::name('dashboards'))->where('id', $dashboard)->value('version'))->toEqual(1);

    expect(fn () => DB::table(Tables::name('dashboard_widgets'))->insert([
        'dashboard_id' => $dashboard,
        'widget_key' => 'app.orders',
        'uuid' => $uuids->first(),
    ]))->toThrow(UniqueConstraintViolationException::class);

    expect(fn () => DB::table(Tables::name('dashboard_widgets'))->insert([
        'dashboard_id' => $dashboard,
        'widget_key' => 'app.orders',
    ]))->toThrow(QueryException::class);
});

it('backfills more placements than one chunk holds', function (): void {
    $migration = placementUuidMigration();
    $migration->down();

    $count = $migration::CHUNK * 2 + 1;
    seedV1Placements($count);

    $migration->up();

    $uuids = DB::table(Tables::name('dashboard_widgets'))->pluck('uuid');

    expect($uuids)->toHaveCount($count)
        ->and($uuids->filter())->toHaveCount($count)
        ->and($uuids->unique())->toHaveCount($count);
});

it('runs again after being rolled back', function (): void {
    $migration = placementUuidMigration();

    $migration->down();
    $migration->up();
    $migration->down();
    $migration->up();

    expect(Schema::hasColumn(Tables::name('dashboard_widgets'), 'uuid'))->toBeTrue()
        ->and(Schema::hasColumn(Tables::name('dashboards'), 'version'))->toBeTrue();
});
