<?php

declare(strict_types=1);

use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Support\Tables;
use Workbench\App\Models\User;

beforeEach(function (): void {
    // The route gate passes in local.
    $this->withEnvironment('local');

    app(WidgetRegistry::class)
        ->add(WidgetDefinition::make('app.orders')->label('Orders')->resolve(fn (): array => ['count' => 3]))
        ->add(WidgetDefinition::make('app.slow')->lazy()->resolve(fn (): array => ['late' => true]));

    $this->ann = User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
});

it('migrates every table under its configured name', function (): void {
    foreach (array_keys(Tables::DEFAULTS) as $key) {
        expect(Schema::hasTable('crm_'.$key))->toBeTrue()
            ->and(Schema::hasTable('atrium_'.$key))->toBeFalse();
    }

    expect(Schema::hasColumn('crm_dashboard_widgets', 'uuid'))->toBeTrue()
        ->and(Schema::hasColumn('crm_dashboards', 'version'))->toBeTrue();
});

it('backfills placement uuids on renamed tables, and rolls them back', function (): void {
    $migration = require __DIR__.'/../../../database/migrations/2026_11_22_000000_add_uuid_and_version_to_atrium_dashboards.php';
    $migration->down();

    expect(Schema::hasColumn('crm_dashboard_widgets', 'uuid'))->toBeFalse()
        ->and(Schema::hasColumn('crm_dashboards', 'version'))->toBeFalse();

    $dashboard = DB::table('crm_dashboards')->insertGetId(['name' => 'Ops', 'slug' => 'ops']);
    DB::table('crm_dashboard_widgets')->insert(array_map(fn (int $sort): array => [
        'dashboard_id' => $dashboard,
        'widget_key' => 'app.orders',
        'sort' => $sort,
    ], range(1, $migration::CHUNK + 1)));

    $migration->up();

    $uuids = DB::table('crm_dashboard_widgets')->pluck('uuid');

    expect($uuids)->toHaveCount($migration::CHUNK + 1)
        ->and($uuids->filter(fn (mixed $uuid): bool => is_string($uuid) && Str::isUuid($uuid)))->toHaveCount($migration::CHUNK + 1)
        ->and($uuids->unique())->toHaveCount($migration::CHUNK + 1)
        ->and(DB::table('crm_dashboards')->where('id', $dashboard)->value('version'))->toEqual(1);

    expect(fn () => DB::table('crm_dashboard_widgets')->insert(['dashboard_id' => $dashboard, 'widget_key' => 'app.orders', 'uuid' => $uuids->first()]))
        ->toThrow(UniqueConstraintViolationException::class);

    expect(fn () => DB::table('crm_dashboard_widgets')->insert(['dashboard_id' => $dashboard, 'widget_key' => 'app.orders']))
        ->toThrow(QueryException::class);
});

it('creates, lays out, renames, reads and deletes dashboards on renamed tables', function (): void {
    $this->actingAs($this->ann)
        ->postJson(route('atrium.dashboards.store'), ['name' => 'Operations'])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'operations');

    $dashboard = DashboardModel::query()->ownedBy($this->ann)->sole();

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $dashboard), [
            'version' => 1,
            'widgets' => [
                ['widget_key' => 'app.orders', 'grid_width' => 6],
                ['widget_key' => 'app.slow'],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.version', 2)
        ->assertJsonCount(2, 'data.widgets');

    $orders = $dashboard->widgets()->where('widget_key', 'app.orders')->sole();

    // Placement uuids are checked against the renamed table.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $dashboard), [
            'version' => 2,
            'widgets' => [['uuid' => $orders->uuid, 'widget_key' => 'app.orders', 'grid_width' => 8]],
        ])
        ->assertOk()
        ->assertJsonPath('data.widgets.0.uuid', $orders->uuid);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.update', $dashboard), ['name' => 'Renamed', 'version' => 3])
        ->assertOk()
        ->assertJsonPath('data.version', 4);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.default'))
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed')
        ->assertJsonPath('data.widgets.0.data', ['count' => 3]);

    // The second layout left the lazy placement out, so place it again.
    $slow = $dashboard->widgets()->create(['widget_key' => 'app.slow']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$dashboard, $slow]))
        ->assertOk()
        ->assertJsonPath('data.data', ['late' => true]);

    expect($orders->fresh()?->grid_width)->toBe(8)
        ->and(DashboardModel::query()->visibleTo($this->ann)->count())->toBe(1);

    $this->actingAs($this->ann)
        ->deleteJson(route('atrium.dashboards.destroy', $dashboard))
        ->assertNoContent();

    // The widget placements go with their dashboard.
    expect(DashboardModel::query()->count())->toBe(0)
        ->and(DashboardWidgetModel::query()->count())->toBe(0);
});
