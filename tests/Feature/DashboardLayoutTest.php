<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\SaveDashboardLayoutAction;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\UpdateDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Data\SaveDashboardLayoutData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\UpdateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\WidgetPlacementData;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetCreatingEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;

beforeEach(function (): void {
    app(WidgetRegistry::class)
        ->add(WidgetDefinition::make('app.orders'))
        ->add(WidgetDefinition::make('app.notes'))
        ->add(WidgetDefinition::make('app.chart'));

    $this->dashboard = DashboardModel::query()->create(['name' => 'Ops']);
});

/**
 * @param  array<int, WidgetPlacementData>  $widgets
 */
function saveLayout(DashboardModel $dashboard, array $widgets, ?int $version = null): DashboardModel
{
    $data = $version === null ? new SaveDashboardLayoutData($widgets) : new SaveDashboardLayoutData($widgets, $version);

    return app(SaveDashboardLayoutAction::class)->execute($dashboard, $data);
}

/**
 * @return array<int, array<string, mixed>>
 */
function layoutRows(DashboardModel $dashboard): array
{
    return $dashboard->widgets()->get()->map->only(['uuid', 'widget_key', 'grid_width', 'sort'])->all();
}

function expectVersionConflict(Closure $save): void
{
    try {
        $save();
    } catch (ValidationException $exception) {
        expect($exception->status)->toBe(409)
            ->and($exception->errors())->toHaveKey('version');

        return;
    }

    expect(false)->toBeTrue('A stale version was not refused.');
}

it('updates a placement in place when its uuid is given', function (): void {
    $orders = $this->dashboard->widgets()->create(['widget_key' => 'app.orders']);

    saveLayout($this->dashboard, [
        new WidgetPlacementData('app.notes'),
        new WidgetPlacementData('app.orders', gridRow: 2, gridWidth: 8, settings: ['range' => 'week'], uuid: $orders->uuid),
    ]);

    $kept = $orders->fresh();

    expect($kept?->id)->toBe($orders->id)
        ->and($kept?->uuid)->toBe($orders->uuid)
        ->and($kept?->grid_row)->toBe(2)
        ->and($kept?->grid_width)->toBe(8)
        ->and($kept?->settings)->toBe(['range' => 'week'])
        // The payload's order is the sort order.
        ->and($kept?->sort)->toBe(1)
        ->and($this->dashboard->widgets()->pluck('widget_key')->all())->toBe(['app.notes', 'app.orders']);
});

it('creates a placement sent without a uuid, with a new uuid', function (): void {
    $dashboard = saveLayout($this->dashboard, [new WidgetPlacementData('app.orders', gridWidth: 6)]);

    $placement = $dashboard->widgets()->sole();

    expect(Str::isUuid($placement->uuid))->toBeTrue()
        ->and($placement->grid_width)->toBe(6);
});

it('treats a uuid the dashboard does not have as a new placement', function (): void {
    $unknown = (string) Str::uuid7();

    $dashboard = saveLayout($this->dashboard, [new WidgetPlacementData('app.orders', uuid: $unknown)]);

    expect($dashboard->widgets()->sole()->uuid)->not->toBe($unknown);
});

it('deletes the placements the layout leaves out', function (): void {
    $orders = $this->dashboard->widgets()->create(['widget_key' => 'app.orders']);
    $this->dashboard->widgets()->create(['widget_key' => 'app.notes']);

    saveLayout($this->dashboard, [new WidgetPlacementData('app.orders', uuid: $orders->uuid)]);

    expect($this->dashboard->widgets()->pluck('uuid')->all())->toBe([$orders->uuid]);
});

it('keeps orphaned placements the layout leaves out', function (): void {
    $orphan = $this->dashboard->widgets()->create(['widget_key' => 'uninstalled.widget', 'grid_width' => 3, 'sort' => 4]);
    $this->dashboard->widgets()->create(['widget_key' => 'app.notes']);

    saveLayout($this->dashboard, []);

    expect(layoutRows($this->dashboard))->toBe([
        ['uuid' => $orphan->uuid, 'widget_key' => 'uninstalled.widget', 'grid_width' => 3, 'sort' => 4],
    ]);
});

it('moves the dashboard version on with every save', function (): void {
    expect(saveLayout($this->dashboard, [], version: 1)->version)->toBe(2)
        ->and(saveLayout($this->dashboard, [], version: 2)->version)->toBe(3);

    // Code that vouches for the dashboard's state may leave the version out;
    // the save still moves it on, so a client holding the old one is refused.
    expect(saveLayout($this->dashboard, [])->version)->toBe(4);
});

it('refuses a stale version with a 409 and changes nothing', function (): void {
    $orders = $this->dashboard->widgets()->create(['widget_key' => 'app.orders']);
    $before = layoutRows($this->dashboard);
    $finished = [];
    Event::listen(DashboardLayoutSavedActionEvent::class, function (DashboardLayoutSavedActionEvent $event) use (&$finished): void {
        $finished[] = $event;
    });

    saveLayout($this->dashboard, [new WidgetPlacementData('app.orders', uuid: $orders->uuid)], version: 1);

    expectVersionConflict(fn (): DashboardModel => saveLayout($this->dashboard, [], version: 1));

    expect(layoutRows($this->dashboard))->toBe($before)
        ->and($this->dashboard->fresh()?->version)->toBe(2)
        ->and($finished)->toHaveCount(1);
});

it('rolls a layout that fails part way back, leaving the old placements intact', function (): void {
    $orders = $this->dashboard->widgets()->create(['widget_key' => 'app.orders']);
    $notes = $this->dashboard->widgets()->create(['widget_key' => 'app.notes']);
    $before = layoutRows($this->dashboard);

    Event::listen(DashboardWidgetCreatingEvent::class, function (DashboardWidgetCreatingEvent $event): void {
        if ($event->widget->widget_key === 'app.chart') {
            throw new RuntimeException('the new placement fails');
        }
    });

    // It would update one placement, delete another and create a third.
    expect(fn (): DashboardModel => saveLayout($this->dashboard, [
        new WidgetPlacementData('app.orders', gridWidth: 12, uuid: $orders->uuid),
        new WidgetPlacementData('app.chart'),
    ], version: 1))->toThrow(RuntimeException::class, 'the new placement fails');

    expect(layoutRows($this->dashboard))->toBe($before)
        ->and($notes->fresh())->not->toBeNull()
        ->and($this->dashboard->fresh()?->version)->toBe(1);
});

it('guards a dashboard update with the version and moves it on', function (): void {
    $updated = app(UpdateDashboardAction::class)->execute($this->dashboard, new UpdateDashboardData(name: 'Renamed', version: 1));

    expect($updated->name)->toBe('Renamed')
        ->and($updated->version)->toBe(2);

    expectVersionConflict(fn (): DashboardModel => app(UpdateDashboardAction::class)->execute(
        $this->dashboard,
        new UpdateDashboardData(name: 'Stale', version: 1),
    ));

    expect($this->dashboard->fresh()?->name)->toBe('Renamed')
        ->and($this->dashboard->fresh()?->version)->toBe(2);
});

it('moves the version on for an update that leaves it out, and never writes it as a field', function (): void {
    $data = new UpdateDashboardData(name: 'Renamed');

    expect($data->toArray())->toBe(['name' => 'Renamed'])
        ->and(app(UpdateDashboardAction::class)->execute($this->dashboard, $data)->version)->toBe(2)
        ->and((new UpdateDashboardData(name: 'Again', version: 2))->toArray())->toBe(['name' => 'Again', 'version' => 2])
        ->and(app(UpdateDashboardAction::class)->execute($this->dashboard, new UpdateDashboardData(name: 'Again', version: 2))->version)->toBe(3);
});
