<?php

declare(strict_types=1);

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use Workbench\App\Models\User;

it('creates the dashboard tables', function (): void {
    expect(Schema::hasTable('atrium_dashboards'))->toBeTrue()
        ->and(Schema::hasTable('atrium_dashboard_widgets'))->toBeTrue();
})->skip(fn (): bool => ! class_exists(Schema::class));

it('slugs a dashboard on creation', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Operations Overview']);

    expect($dashboard->slug)->toBe('operations-overview');
});

it('resolves a users own dashboards alongside shared ones', function (): void {
    $user = User::forceCreate([
        'name' => 'Ada',
        'email' => 'ada@example.com',
        'password' => bcrypt('secret'),
    ]);

    $other = User::forceCreate([
        'name' => 'Grace',
        'email' => 'grace@example.com',
        'password' => bcrypt('secret'),
    ]);

    DashboardModel::query()->create(['name' => 'Mine', 'owner_type' => $user->getMorphClass(), 'owner_id' => $user->getKey()]);
    DashboardModel::query()->create(['name' => 'Theirs', 'owner_type' => $other->getMorphClass(), 'owner_id' => $other->getKey()]);
    DashboardModel::query()->create(['name' => 'Shared', 'is_shared' => true]);

    $visible = DashboardModel::query()->visibleTo($user)->pluck('name')->all();

    expect($visible)->toContain('Mine')->toContain('Shared')->not->toContain('Theirs');
});

it('cascades widget deletes when a dashboard is removed', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Temp']);

    $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);

    expect(DashboardWidgetModel::query()->count())->toBe(1);

    $dashboard->delete();

    expect(DashboardWidgetModel::query()->count())->toBe(0);
});

it('resolves a placed widget back to its definition', function (): void {
    app(PluginRegistry::class)->register(AlphaPlugin::class);

    $dashboard = DashboardModel::query()->create(['name' => 'Ops']);
    $placement = $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);

    expect($placement->definition())->not->toBeNull()
        ->and($placement->definition()->label)->toBe('Alpha Stats')
        ->and($placement->isOrphaned())->toBeFalse();
});

it('treats a placement as orphaned when its plugin is gone', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Ops']);
    $placement = $dashboard->widgets()->create(['widget_key' => 'removed.plugin.widget']);

    expect($placement->definition())->toBeNull()
        ->and($placement->isOrphaned())->toBeTrue();
});

it('knows which owner a dashboard belongs to', function (): void {
    $user = User::forceCreate([
        'name' => 'Ada',
        'email' => 'ada2@example.com',
        'password' => bcrypt('secret'),
    ]);

    $owned = DashboardModel::query()->create(['name' => 'Mine', 'owner_type' => $user->getMorphClass(), 'owner_id' => $user->getKey()]);
    $shared = DashboardModel::query()->create(['name' => 'Shared', 'is_shared' => true]);

    expect($owned->isOwnedBy($user))->toBeTrue()
        ->and($shared->isOwnedBy($user))->toBeFalse()
        ->and($owned->isOwnedBy(null))->toBeFalse();
});

it('shows a dashboard by its slug', function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    $user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);

    DashboardModel::query()->create(['name' => 'Mine', 'owner_type' => $user->getMorphClass(), 'owner_id' => $user->getKey()]);
    DashboardModel::query()->create(['name' => 'Company KPIs', 'is_shared' => true]);

    $this->actingAs($user)->get(route('atrium.dashboard.show', 'company-kpis'))
        ->assertOk()
        ->assertSee('<title>Company KPIs', false);

    $this->actingAs($user)->get(route('atrium.dashboard.show', 'missing'))->assertNotFound();
});

it('reads the visible dashboards once per page', function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    $user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);

    DashboardModel::query()->create(['name' => 'Mine', 'owner_type' => $user->getMorphClass(), 'owner_id' => $user->getKey()]);
    DashboardModel::query()->create(['name' => 'Company KPIs', 'is_shared' => true]);

    $dashboards = (new DashboardModel)->getTable();
    $reads = 0;

    DB::listen(function (QueryExecuted $query) use ($dashboards, &$reads): void {
        if (str_starts_with(strtolower($query->sql), 'select') && str_contains($query->sql, '"'.$dashboards.'"')) {
            $reads++;
        }
    });

    $this->actingAs($user)->get('/atrium')->assertOk()->assertSee('Company KPIs');

    expect($reads)->toBe(1);
});

it('lists the dashboard made on a first visit', function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    $user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);

    $this->actingAs($user)->get('/atrium')->assertOk()->assertViewHas('dashboards', fn ($dashboards): bool => $dashboards->count() === 1);
});
