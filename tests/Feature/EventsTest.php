<?php

declare(strict_types=1);

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\CreateDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\DeleteDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\SaveDashboardLayoutAction;
use RefactorCircus\Atrium\Domains\Dashboard\Actions\UpdateDashboardAction;
use RefactorCircus\Atrium\Domains\Dashboard\Data\CreateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\SaveDashboardLayoutData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\UpdateDashboardData;
use RefactorCircus\Atrium\Domains\Dashboard\Data\WidgetPlacementData;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardCreatingEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardDeletedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardLayoutSavingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatedActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatedEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardUpdatingActionEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetCreatedEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Events\DashboardWidgetCreatingEvent;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\Models\TeamDashboard;
use RefactorCircus\Keystone\Contracts\ActionFinishedEvent;
use RefactorCircus\Keystone\Contracts\ActionStartingEvent;
use RefactorCircus\Keystone\Contracts\ModelLifecycleEvent;
use Workbench\App\Models\User;

/**
 * Record every event of a kind, in order.
 *
 * @param  class-string  $kind
 * @return ArrayObject<int, object>
 */
function recordEvents(string $kind): ArrayObject
{
    /** @var ArrayObject<int, object> $seen */
    $seen = new ArrayObject;

    Event::listen($kind, function (object $event) use ($seen): void {
        $seen->append($event);
    });

    return $seen;
}

function actor(string $email = 'actor@example.com'): User
{
    return User::forceCreate(['name' => 'Actor', 'email' => $email, 'password' => bcrypt('x')]);
}

it('fires every lifecycle event of a dashboard', function (): void {
    $seen = recordEvents(ModelLifecycleEvent::class);

    $dashboard = DashboardModel::query()->create(['name' => 'Ops']);
    $dashboard->update(['name' => 'Renamed']);
    DashboardModel::query()->find($dashboard->id);
    $dashboard->replicate();
    $dashboard->delete();

    $hooks = collect($seen)
        ->filter(fn (ModelLifecycleEvent $event): bool => $event->model() instanceof DashboardModel)
        ->map(fn (ModelLifecycleEvent $event): string => $event->hook())
        ->unique()
        ->values()
        ->all();

    expect($hooks)->toEqualCanonicalizing([
        'retrieved', 'creating', 'created', 'updating', 'updated', 'saving', 'saved', 'deleting', 'deleted', 'replicating',
    ]);
});

it('fires every lifecycle event of a widget placement', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Ops']);

    $seen = recordEvents(ModelLifecycleEvent::class);

    $widget = $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);
    $widget->update(['grid_width' => 6]);
    DashboardWidgetModel::query()->find($widget->id);
    $widget->replicate();
    $widget->delete();

    $hooks = collect($seen)
        ->filter(fn (ModelLifecycleEvent $event): bool => $event->model() instanceof DashboardWidgetModel)
        ->map(fn (ModelLifecycleEvent $event): string => $event->hook())
        ->unique()
        ->values()
        ->all();

    expect($hooks)->toEqualCanonicalizing([
        'retrieved', 'creating', 'created', 'updating', 'updated', 'saving', 'saved', 'deleting', 'deleted', 'replicating',
    ]);
});

it('carries the model as a typed property', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Ops']);

    Event::fake([DashboardUpdatedEvent::class, DashboardWidgetCreatedEvent::class]);

    $dashboard->update(['name' => 'Renamed']);
    $widget = $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);

    Event::assertDispatched(
        DashboardUpdatedEvent::class,
        fn (DashboardUpdatedEvent $event): bool => $event->dashboard->name === 'Renamed' && $event->hook() === 'updated',
    );
    Event::assertDispatched(
        DashboardWidgetCreatedEvent::class,
        fn (DashboardWidgetCreatedEvent $event): bool => $event->widget->is($widget) && $event->model() === $event->widget,
    );
});

it('fires the dashboard events for a dashboard subclass', function (): void {
    Event::fake([DashboardCreatingEvent::class]);

    TeamDashboard::query()->create(['name' => 'Team']);

    Event::assertDispatched(DashboardCreatingEvent::class, fn (DashboardCreatingEvent $event): bool => $event->dashboard instanceof TeamDashboard);
});

it('lets a creating listener stop a dashboard being created', function (): void {
    Event::listen(DashboardCreatingEvent::class, fn (): bool => false);

    $dashboard = DashboardModel::query()->create(['name' => 'Ops']);

    expect($dashboard->exists)->toBeFalse()
        ->and(DashboardModel::query()->count())->toBe(0);
});

it('starts and finishes every action once, in order', function (): void {
    app(PluginRegistry::class)->register(AlphaPlugin::class);

    $starts = recordEvents(ActionStartingEvent::class);
    $stops = recordEvents(ActionFinishedEvent::class);

    $dashboard = app(CreateDashboardAction::class)->execute(new CreateDashboardData('Ops'), actor());
    app(UpdateDashboardAction::class)->execute($dashboard, new UpdateDashboardData(name: 'Renamed'));
    app(SaveDashboardLayoutAction::class)->execute($dashboard, new SaveDashboardLayoutData([new WidgetPlacementData('alpha.stats')]));
    app(DeleteDashboardAction::class)->execute($dashboard);

    expect(collect($starts)->map(fn (object $event): string => class_basename($event))->all())->toBe([
        'DashboardCreatingActionEvent', 'DashboardUpdatingActionEvent', 'DashboardLayoutSavingActionEvent', 'DashboardDeletingActionEvent',
    ])->and(collect($stops)->map(fn (object $event): string => class_basename($event))->all())->toBe([
        'DashboardCreatedActionEvent', 'DashboardUpdatedActionEvent', 'DashboardLayoutSavedActionEvent', 'DashboardDeletedActionEvent',
    ]);
});

it('gives every action exactly one start and one finish event', function (): void {
    $actions = glob(dirname(__DIR__, 2).'/src/Domains/*/Actions/*Action.php') ?: [];

    $unpaired = [];

    foreach ($actions as $path) {
        $domain = basename(dirname($path, 2));
        $source = (string) file_get_contents($path);
        preg_match_all('/([A-Za-z]+ActionEvent)::dispatch/', $source, $matches);

        $kinds = array_map(
            fn (string $event): string => is_subclass_of('RefactorCircus\\Atrium\\Domains\\'.$domain.'\\Events\\'.$event, ActionStartingEvent::class) ? 'start' : 'finish',
            $matches[1],
        );

        sort($kinds);

        if ($kinds !== ['finish', 'start']) {
            $unpaired[] = basename($path, '.php');
        }
    }

    expect($actions)->not->toBeEmpty()
        ->and($unpaired)->toBe([]);
});

it('carries the input on the start event and the result on the finish event', function (): void {
    app(PluginRegistry::class)->register(AlphaPlugin::class);

    Event::fake([
        DashboardCreatingActionEvent::class, DashboardCreatedActionEvent::class,
        DashboardUpdatingActionEvent::class, DashboardUpdatedActionEvent::class,
        DashboardLayoutSavingActionEvent::class, DashboardLayoutSavedActionEvent::class,
        DashboardDeletedActionEvent::class,
    ]);

    $user = actor();

    $dashboard = app(CreateDashboardAction::class)->execute(new CreateDashboardData('Operations'), $user);
    app(UpdateDashboardAction::class)->execute($dashboard, new UpdateDashboardData(name: 'Renamed'));
    app(SaveDashboardLayoutAction::class)->execute($dashboard, new SaveDashboardLayoutData([new WidgetPlacementData('alpha.stats', gridWidth: 6)]));
    app(DeleteDashboardAction::class)->execute($dashboard);

    expect($dashboard->isOwnedBy($user))->toBeTrue();

    Event::assertDispatched(
        DashboardCreatingActionEvent::class,
        fn (DashboardCreatingActionEvent $event): bool => $event->data->toArray() === ['name' => 'Operations', 'is_shared' => false] && $event->owner?->is($user) === true,
    );
    Event::assertDispatched(DashboardCreatedActionEvent::class, fn (DashboardCreatedActionEvent $event): bool => $event->dashboard->is($dashboard));
    Event::assertDispatched(DashboardUpdatingActionEvent::class, fn (DashboardUpdatingActionEvent $event): bool => $event->data->toArray() === ['name' => 'Renamed']);
    Event::assertDispatched(DashboardUpdatedActionEvent::class, fn (DashboardUpdatedActionEvent $event): bool => $event->dashboard->name === 'Renamed');
    Event::assertDispatched(
        DashboardLayoutSavingActionEvent::class,
        fn (DashboardLayoutSavingActionEvent $event): bool => $event->data->widgets[0]->widgetKey === 'alpha.stats' && $event->data->widgets[0]->gridWidth === 6,
    );
    Event::assertDispatched(DashboardLayoutSavedActionEvent::class, fn (DashboardLayoutSavedActionEvent $event): bool => $event->widgetKeys === ['alpha.stats']);
    Event::assertDispatched(DashboardDeletedActionEvent::class, fn (DashboardDeletedActionEvent $event): bool => $event->dashboard->is($dashboard));
});

it('creates a shared dashboard with no owner', function (): void {
    $dashboard = app(CreateDashboardAction::class)->execute(
        new CreateDashboardData('Company', isShared: true),
        actor('shared@example.com'),
    );

    expect($dashboard->is_shared)->toBeTrue()
        ->and($dashboard->owner_id)->toBeNull();
});

it('starts before the work and finishes only once it is committed', function (): void {
    $countAtStart = null;

    Event::listen(DashboardCreatingActionEvent::class, function () use (&$countAtStart): void {
        $countAtStart = DashboardModel::query()->count();
    });

    $finished = recordEvents(DashboardCreatedActionEvent::class);

    DB::transaction(function () use ($finished): void {
        app(CreateDashboardAction::class)->execute(new CreateDashboardData('Ops'), actor());

        expect($finished)->toHaveCount(0);
    });

    expect($countAtStart)->toBe(0)
        ->and($finished)->toHaveCount(1);
});

it('starts a create that rolled back but never finishes it', function (): void {
    $starts = recordEvents(DashboardCreatingActionEvent::class);
    $stops = recordEvents(DashboardCreatedActionEvent::class);

    try {
        DB::transaction(function (): void {
            app(CreateDashboardAction::class)->execute(new CreateDashboardData('Doomed'), actor('rollback@example.com'));

            throw new RuntimeException('caller aborts after the action');
        });
    } catch (RuntimeException) {
        // expected
    }

    expect(DashboardModel::query()->count())->toBe(0)
        ->and($starts)->toHaveCount(1)
        ->and($stops)->toHaveCount(0);
});

it('rolls back a layout that fails part way and never finishes it', function (): void {
    $dashboard = app(CreateDashboardAction::class)->execute(new CreateDashboardData('Ops'), actor());
    app(SaveDashboardLayoutAction::class)->execute($dashboard, new SaveDashboardLayoutData([new WidgetPlacementData('alpha.stats')]));

    $stops = recordEvents(DashboardLayoutSavedActionEvent::class);

    Event::listen(DashboardWidgetCreatingEvent::class, function (DashboardWidgetCreatingEvent $event): void {
        if ($event->widget->widget_key === 'alpha.broken') {
            throw new RuntimeException('the second placement fails');
        }
    });

    expect(fn (): DashboardModel => app(SaveDashboardLayoutAction::class)->execute($dashboard, new SaveDashboardLayoutData([
        new WidgetPlacementData('alpha.chart'),
        new WidgetPlacementData('alpha.broken'),
    ])))->toThrow(RuntimeException::class);

    expect($dashboard->widgets()->pluck('widget_key')->all())->toBe(['alpha.stats'])
        ->and($stops)->toHaveCount(0);
});

it('exposes execute as the entry point and keeps handle protected', function (): void {
    $handle = new ReflectionMethod(CreateDashboardAction::class, 'handle');

    expect($handle->isProtected())->toBeTrue();
});
