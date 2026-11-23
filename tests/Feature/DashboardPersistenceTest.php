<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use Workbench\App\Models\User;

function persistenceUser(string $email): User
{
    return User::forceCreate(['name' => 'Ada', 'email' => $email, 'password' => bcrypt('secret')]);
}

it('creates the dashboard tables with the placement uuid and the dashboard version', function (): void {
    expect(Schema::hasTable('atrium_dashboards'))->toBeTrue()
        ->and(Schema::hasTable('atrium_dashboard_widgets'))->toBeTrue()
        ->and(Schema::hasColumn('atrium_dashboard_widgets', 'uuid'))->toBeTrue()
        ->and(Schema::hasColumn('atrium_dashboards', 'version'))->toBeTrue();
});

it('slugs a dashboard on creation', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Operations Overview']);

    expect($dashboard->slug)->toBe('operations-overview');
});

it('starts a dashboard at version 1', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Ops']);

    expect($dashboard->version)->toBe(1)
        ->and($dashboard->fresh()?->version)->toBe(1);
});

it('gives every placement a uuid on create, keeping the integer id as its key', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Ops']);

    $first = $dashboard->widgets()->create(['widget_key' => 'app.orders']);
    $second = $dashboard->widgets()->create(['widget_key' => 'app.orders']);

    expect(Str::isUuid($first->uuid))->toBeTrue()
        ->and($first->uuid)->not->toBe($second->uuid)
        ->and($first->getKeyName())->toBe('id')
        ->and($first->getIncrementing())->toBeTrue()
        ->and($first->getKey())->toBeInt()
        ->and($first->fresh()?->uuid)->toBe($first->uuid);
});

it('keeps a uuid given on create', function (): void {
    $uuid = (string) Str::uuid7();

    $placement = DashboardModel::query()->create(['name' => 'Ops'])->widgets()->create(['widget_key' => 'app.orders', 'uuid' => $uuid]);

    expect($placement->fresh()?->uuid)->toBe($uuid);
});

it('resolves a users own dashboards alongside shared ones', function (): void {
    $user = persistenceUser('ada@example.com');
    $other = persistenceUser('grace@example.com');

    DashboardModel::query()->create(['name' => 'Mine', 'owner_type' => $user->getMorphClass(), 'owner_id' => $user->getKey()]);
    DashboardModel::query()->create(['name' => 'Theirs', 'owner_type' => $other->getMorphClass(), 'owner_id' => $other->getKey()]);
    DashboardModel::query()->create(['name' => 'Shared', 'is_shared' => true]);

    $visible = DashboardModel::query()->visibleTo($user)->pluck('name')->all();

    expect($visible)->toContain('Mine')->toContain('Shared')->not->toContain('Theirs');
});

it('cascades widget deletes when a dashboard is removed', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Temp']);

    $dashboard->widgets()->create(['widget_key' => 'app.orders']);

    expect(DashboardWidgetModel::query()->count())->toBe(1);

    $dashboard->delete();

    expect(DashboardWidgetModel::query()->count())->toBe(0);
});

it('resolves a placed widget back to its definition', function (): void {
    app(WidgetRegistry::class)->add(WidgetDefinition::make('app.orders')->label('Orders'));

    $placement = DashboardModel::query()->create(['name' => 'Ops'])->widgets()->create(['widget_key' => 'app.orders']);

    expect($placement->definition()?->label)->toBe('Orders')
        ->and($placement->isOrphaned())->toBeFalse();
});

it('treats a placement as orphaned when its plugin is gone', function (): void {
    $placement = DashboardModel::query()->create(['name' => 'Ops'])->widgets()->create(['widget_key' => 'removed.plugin.widget']);

    expect($placement->definition())->toBeNull()
        ->and($placement->isOrphaned())->toBeTrue();
});

it('knows which owner a dashboard belongs to', function (): void {
    $user = persistenceUser('ada2@example.com');

    $owned = DashboardModel::query()->create(['name' => 'Mine', 'owner_type' => $user->getMorphClass(), 'owner_id' => $user->getKey()]);
    $shared = DashboardModel::query()->create(['name' => 'Shared', 'is_shared' => true]);

    expect($owned->isOwnedBy($user))->toBeTrue()
        ->and($shared->isOwnedBy($user))->toBeFalse()
        ->and($owned->isOwnedBy(null))->toBeFalse();
});
