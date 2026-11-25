<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use Workbench\App\Models\User;

beforeEach(function (): void {
    $this->withEnvironment('local');

    app(WidgetRegistry::class)
        ->add(WidgetDefinition::make('app.orders')->label('Orders')->resolve(fn (array $settings): array => ['count' => 3]))
        ->add(WidgetDefinition::make('app.notes')->label('Notes'))
        ->add(WidgetDefinition::make('app.slow')->label('Slow')->lazy())
        ->add(WidgetDefinition::make('app.private')->authorize(fn (): bool => false));

    $this->ann = User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);

    $this->dashboard = DashboardModel::query()->create([
        'name' => 'Mine',
        'owner_type' => $this->ann->getMorphClass(),
        'owner_id' => $this->ann->getKey(),
    ]);
});

/**
 * @return array<int, string>
 */
function layoutApiKeys(DashboardModel $dashboard): array
{
    return $dashboard->widgets()->pluck('widget_key')->all();
}

it('saves the layout and answers with the dashboard, its new version and its abilities', function (): void {
    $orders = $this->dashboard->widgets()->create(['widget_key' => 'app.orders']);

    $response = $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), [
            'version' => 1,
            'widgets' => [
                ['uuid' => $orders->uuid, 'widget_key' => 'app.orders', 'grid_row' => 1, 'grid_column' => 2, 'grid_width' => 8, 'grid_height' => 3, 'settings' => ['range' => 'month']],
                ['widget_key' => 'app.slow'],
            ],
        ])
        ->assertOk();

    $slow = $this->dashboard->widgets()->where('widget_key', 'app.slow')->sole();

    $response->assertExactJson([
        'data' => [
            'slug' => 'mine',
            'name' => 'Mine',
            'is_default' => false,
            'version' => 2,
            'widgets' => [
                [
                    'uuid' => $orders->uuid,
                    'key' => 'app.orders',
                    'component' => 'app.orders',
                    'title' => 'Orders',
                    'icon' => null,
                    'lazy' => false,
                    'grid' => ['row' => 1, 'column' => 2, 'width' => 8, 'height' => 3],
                    'settings' => ['range' => 'month'],
                    'data' => ['count' => 3],
                ],
                [
                    'uuid' => $slow->uuid,
                    'key' => 'app.slow',
                    'component' => 'app.slow',
                    'title' => 'Slow',
                    'icon' => null,
                    'lazy' => true,
                    'grid' => ['row' => 0, 'column' => 0, 'width' => 4, 'height' => 2],
                    'settings' => [],
                ],
            ],
        ],
        'meta' => ['abilities' => ['update' => true, 'delete' => true]],
    ]);

    // The placement sent with its uuid was updated in place, not recreated.
    expect($orders->fresh()?->grid_width)->toBe(8)
        ->and($orders->fresh()?->id)->toBe($orders->id);
});

it('deletes placements left out of the payload', function (): void {
    $orders = $this->dashboard->widgets()->create(['widget_key' => 'app.orders']);
    $notes = $this->dashboard->widgets()->create(['widget_key' => 'app.notes']);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), [
            'version' => 1,
            'widgets' => [['uuid' => $notes->uuid, 'widget_key' => 'app.notes']],
        ])
        ->assertOk()
        ->assertJsonCount(1, 'data.widgets')
        ->assertJsonPath('data.widgets.0.uuid', $notes->uuid);

    expect($orders->fresh())->toBeNull()
        ->and(layoutApiKeys($this->dashboard))->toBe(['app.notes']);
});

it('keeps orphaned placements even when they are left out', function (): void {
    $orphan = $this->dashboard->widgets()->create(['widget_key' => 'uninstalled.widget', 'sort' => 9]);
    $this->dashboard->widgets()->create(['widget_key' => 'app.orders']);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), ['version' => 1, 'widgets' => []])
        ->assertOk()
        ->assertJsonCount(1, 'data.widgets')
        ->assertJsonPath('data.widgets.0.uuid', $orphan->uuid)
        ->assertJsonPath('data.widgets.0.component', null);

    expect(layoutApiKeys($this->dashboard))->toBe(['uninstalled.widget']);
});

it('treats a v1 payload with no uuids as an all-new layout', function (): void {
    $orders = $this->dashboard->widgets()->create(['widget_key' => 'app.orders', 'sort' => 0]);
    $notes = $this->dashboard->widgets()->create(['widget_key' => 'app.notes', 'sort' => 1]);
    $orphan = $this->dashboard->widgets()->create(['widget_key' => 'uninstalled.widget', 'sort' => 5]);

    $response = $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), [
            'version' => 1,
            'widgets' => [
                ['widget_key' => 'app.orders', 'grid_width' => 6],
                ['widget_key' => 'app.notes'],
            ],
        ])
        ->assertOk();

    $placements = $this->dashboard->widgets()->get();
    [$newOrders, $newNotes] = [$placements[0], $placements[1]];

    // Every non-orphan placement was deleted and recreated with a new uuid,
    // so its lazy URL changed; the orphan is kept as it was.
    $response->assertJsonPath('data.version', 2)
        ->assertJsonPath('data.widgets.*.uuid', [$newOrders->uuid, $newNotes->uuid, $orphan->uuid])
        ->assertJsonPath('data.widgets.*.key', ['app.orders', 'app.notes', 'uninstalled.widget'])
        ->assertJsonPath('data.widgets.0.grid.width', 6);

    expect($placements)->toHaveCount(3)
        ->and(DashboardWidgetModel::query()->count())->toBe(3)
        ->and(DashboardWidgetModel::query()->whereIn('uuid', [$orders->uuid, $notes->uuid])->count())->toBe(0)
        ->and([$newOrders->uuid, $newNotes->uuid])->not->toContain($orders->uuid)
        ->and([$newOrders->uuid, $newNotes->uuid])->not->toContain($notes->uuid)
        ->and($orphan->fresh()?->sort)->toBe(5);
});

it('rejects a placement uuid from another dashboard and changes nothing', function (): void {
    $other = DashboardModel::query()->create([
        'name' => 'Second',
        'owner_type' => $this->ann->getMorphClass(),
        'owner_id' => $this->ann->getKey(),
    ]);
    $foreign = $other->widgets()->create(['widget_key' => 'app.orders']);
    $mine = $this->dashboard->widgets()->create(['widget_key' => 'app.notes']);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), [
            'version' => 1,
            'widgets' => [['uuid' => $foreign->uuid, 'widget_key' => 'app.orders']],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('widgets.0.uuid');

    expect($mine->fresh())->not->toBeNull()
        ->and($foreign->fresh()?->dashboard_id)->toBe($other->id)
        ->and($this->dashboard->fresh()?->version)->toBe(1);
});

it('rejects an invalid layout and leaves the old placements intact', function (array $payload, string $field): void {
    $kept = $this->dashboard->widgets()->create(['widget_key' => 'app.orders', 'grid_width' => 5]);

    $payload = json_decode(str_replace('{uuid}', $kept->uuid, (string) json_encode($payload)), true);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor($field);

    expect($this->dashboard->widgets()->get()->map->only(['uuid', 'widget_key', 'grid_width'])->all())
        ->toBe([['uuid' => $kept->uuid, 'widget_key' => 'app.orders', 'grid_width' => 5]])
        ->and($this->dashboard->fresh()?->version)->toBe(1);
})->with([
    'no version' => [['widgets' => []], 'version'],
    'no widgets' => [['version' => 1], 'widgets'],
    'widgets that are not a list' => [['version' => 1, 'widgets' => 'all'], 'widgets'],
    'a placement with no widget key' => [['version' => 1, 'widgets' => [['grid_width' => 4]]], 'widgets.0.widget_key'],
    'a zero width' => [['version' => 1, 'widgets' => [['widget_key' => 'app.notes', 'grid_width' => 0]]], 'widgets.0.grid_width'],
    'a negative row' => [['version' => 1, 'widgets' => [['widget_key' => 'app.notes', 'grid_row' => -1]]], 'widgets.0.grid_row'],
    'a uuid that is not a uuid' => [['version' => 1, 'widgets' => [['uuid' => 'abc', 'widget_key' => 'app.notes']]], 'widgets.0.uuid'],
    'the same uuid twice' => [['version' => 1, 'widgets' => [
        ['uuid' => '{uuid}', 'widget_key' => 'app.orders'],
        ['uuid' => '{uuid}', 'widget_key' => 'app.orders'],
    ]], 'widgets.0.uuid'],
]);

it('drops widgets the user may not place', function (): void {
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), [
            'version' => 1,
            'widgets' => [
                ['widget_key' => 'app.orders'],
                ['widget_key' => 'not.registered'],
                ['widget_key' => 'app.private'],
            ],
        ])
        ->assertOk()
        ->assertJsonCount(1, 'data.widgets');

    expect(layoutApiKeys($this->dashboard))->toBe(['app.orders']);
});

it('guards a layout save with the dashboard version', function (): void {
    $orders = $this->dashboard->widgets()->create(['widget_key' => 'app.orders']);

    // A match is saved and moves the version on.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), [
            'version' => 1,
            'widgets' => [['uuid' => $orders->uuid, 'widget_key' => 'app.orders'], ['widget_key' => 'app.notes']],
        ])
        ->assertOk()
        ->assertJsonPath('data.version', 2);

    // A second save from the same stale copy would delete the new placement;
    // it is refused with 409 and changes nothing.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), [
            'version' => 1,
            'widgets' => [['uuid' => $orders->uuid, 'widget_key' => 'app.orders']],
        ])
        ->assertStatus(409)
        ->assertJsonValidationErrorFor('version');

    // So is a version the dashboard never had.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), ['version' => 3, 'widgets' => []])
        ->assertStatus(409);

    expect(layoutApiKeys($this->dashboard))->toBe(['app.orders', 'app.notes'])
        ->and($this->dashboard->fresh()?->version)->toBe(2);

    // The reloaded version saves again.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $this->dashboard), ['version' => 2, 'widgets' => []])
        ->assertOk()
        ->assertJsonPath('data.version', 3);
});

it('refuses a layout save to a dashboard the user may view but not modify', function (): void {
    $shared = DashboardModel::query()->create(['name' => 'Company', 'is_shared' => true]);
    $shared->widgets()->create(['widget_key' => 'app.orders']);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $shared), ['version' => 1, 'widgets' => []])
        ->assertForbidden();

    expect($shared->widgets()->count())->toBe(1);
});

it('answers 404 for a dashboard the user cannot see', function (): void {
    $bob = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('x')]);
    $theirs = DashboardModel::query()->create(['name' => 'Theirs', 'owner_type' => $bob->getMorphClass(), 'owner_id' => $bob->getKey()]);
    $theirs->widgets()->create(['widget_key' => 'app.orders']);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $theirs), ['version' => 1, 'widgets' => []])
        ->assertNotFound();

    expect($theirs->widgets()->count())->toBe(1);
});
