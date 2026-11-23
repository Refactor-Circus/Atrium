<?php

declare(strict_types=1);

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Exceptions\UnserializableDataException;
use Workbench\App\Models\User;

beforeEach(function (): void {
    // With no `viewAtrium` gate defined, the route gate lets local through.
    $this->withEnvironment('local');

    $this->lazyCalls = 0;

    app(WidgetRegistry::class)
        ->add(WidgetDefinition::make('app.orders')
            ->label('Orders')
            ->icon('i-lucide-shopping-cart')
            ->component('orders-card')
            ->resolve(fn (array $settings): array => ['count' => 3, 'settings' => $settings]))
        ->add(WidgetDefinition::make('app.slow')
            ->label('Slow')
            ->lazy()
            ->resolve(function (): array {
                $this->lazyCalls++;

                return ['late' => true];
            }));

    $this->ann = User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
});

function dashboardApiOwned(User $user, array $attributes = []): DashboardModel
{
    return DashboardModel::query()->create([
        'name' => 'Mine',
        'owner_type' => $user->getMorphClass(),
        'owner_id' => $user->getKey(),
        ...$attributes,
    ]);
}

/**
 * @return array<string, int>
 */
function dashboardApiGrid(int $row = 0, int $column = 0, int $width = 4, int $height = 2): array
{
    return ['row' => $row, 'column' => $column, 'width' => $width, 'height' => $height];
}

it('returns the default dashboard in the exact resource shape, with its abilities in meta', function (): void {
    dashboardApiOwned($this->ann, ['name' => 'Other', 'sort' => 0]);
    $dashboard = dashboardApiOwned($this->ann, ['is_default' => true, 'sort' => 1]);

    $orders = $dashboard->widgets()->create(['widget_key' => 'app.orders', 'grid_width' => 6, 'settings' => ['range' => 'week'], 'sort' => 0]);
    $slow = $dashboard->widgets()->create(['widget_key' => 'app.slow', 'sort' => 1]);
    $orphan = $dashboard->widgets()->create(['widget_key' => 'gone.widget', 'grid_row' => 2, 'sort' => 2]);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.default'))
        ->assertOk()
        ->assertExactJson([
            'data' => [
                'slug' => 'mine',
                'name' => 'Mine',
                'is_default' => true,
                'version' => 1,
                'widgets' => [
                    [
                        'uuid' => $orders->uuid,
                        'key' => 'app.orders',
                        'component' => 'orders-card',
                        'title' => 'Orders',
                        'icon' => 'i-lucide-shopping-cart',
                        'lazy' => false,
                        'grid' => dashboardApiGrid(width: 6),
                        'settings' => ['range' => 'week'],
                        'data' => ['count' => 3, 'settings' => ['range' => 'week']],
                    ],
                    // Lazy: `data` is absent, not null.
                    [
                        'uuid' => $slow->uuid,
                        'key' => 'app.slow',
                        'component' => 'app.slow',
                        'title' => 'Slow',
                        'icon' => null,
                        'lazy' => true,
                        'grid' => dashboardApiGrid(),
                        'settings' => [],
                    ],
                    // Orphaned: no definition, so no component, and never lazy.
                    [
                        'uuid' => $orphan->uuid,
                        'key' => 'gone.widget',
                        'component' => null,
                        'title' => null,
                        'icon' => null,
                        'lazy' => false,
                        'grid' => dashboardApiGrid(row: 2),
                        'settings' => [],
                        'data' => null,
                    ],
                ],
            ],
            'meta' => ['abilities' => ['update' => true, 'delete' => true]],
        ]);

    expect($this->lazyCalls)->toBe(0);
});

it('answers {"data": null} with no meta when the user has no dashboard, and creates none', function (): void {
    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.default'))
        ->assertOk()
        ->assertExactJson(['data' => null]);

    expect(DashboardModel::query()->count())->toBe(0);
});

it('falls back to the first visible dashboard when none is the default', function (): void {
    dashboardApiOwned($this->ann, ['name' => 'Beta', 'sort' => 1]);
    dashboardApiOwned($this->ann, ['name' => 'Alpha', 'sort' => 0]);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.default'))
        ->assertOk()
        ->assertJsonPath('data.slug', 'alpha');
});

it('never writes on a read', function (): void {
    $dashboard = dashboardApiOwned($this->ann);
    $slow = $dashboard->widgets()->create(['widget_key' => 'app.slow']);
    $dashboard->widgets()->create(['widget_key' => 'app.orders']);

    $writes = [];

    DB::listen(function (QueryExecuted $query) use (&$writes): void {
        if (preg_match('/^\s*(insert|update|delete|replace)\b/i', $query->sql) === 1) {
            $writes[] = $query->sql;
        }
    });

    $reads = [
        route('atrium.dashboards.default'),
        route('atrium.dashboards.index'),
        route('atrium.dashboards.show', $dashboard),
        route('atrium.dashboards.widgets.show', [$dashboard, $slow]),
        route('atrium.widgets.index'),
    ];

    foreach ($reads as $url) {
        $this->actingAs($this->ann)->getJson($url)->assertOk();
    }

    expect($writes)->toBe([]);

    // A user with nothing to see gets nothing made for them either.
    $bob = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('x')]);
    $writes = [];

    $this->actingAs($bob)->getJson(route('atrium.dashboards.default'))->assertExactJson(['data' => null]);
    $this->actingAs($bob)->getJson(route('atrium.dashboards.index'))->assertExactJson(['data' => []]);

    expect(DashboardModel::query()->count())->toBe(1)
        ->and(DashboardWidgetModel::query()->count())->toBe(2)
        ->and($writes)->toBe([]);
});

it('lists the visible dashboards without their widgets', function (): void {
    $bob = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('x')]);

    dashboardApiOwned($this->ann, ['name' => 'Mine', 'sort' => 1])->widgets()->create(['widget_key' => 'app.orders']);
    DashboardModel::query()->create(['name' => 'Company', 'is_shared' => true, 'is_default' => true, 'sort' => 0]);
    dashboardApiOwned($bob, ['name' => 'Theirs']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.index'))
        ->assertOk()
        ->assertExactJson([
            'data' => [
                ['slug' => 'company', 'name' => 'Company', 'is_default' => true, 'version' => 1],
                ['slug' => 'mine', 'name' => 'Mine', 'is_default' => false, 'version' => 1],
            ],
        ]);
});

it('shows a dashboard by its slug, with what the user may do to it', function (): void {
    $shared = DashboardModel::query()->create(['name' => 'Company KPIs', 'is_shared' => true]);
    $placement = $shared->widgets()->create(['widget_key' => 'app.orders']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.show', $shared))
        ->assertOk()
        ->assertExactJson([
            'data' => [
                'slug' => 'company-kpis',
                'name' => 'Company KPIs',
                'is_default' => false,
                'version' => 1,
                'widgets' => [[
                    'uuid' => $placement->uuid,
                    'key' => 'app.orders',
                    'component' => 'orders-card',
                    'title' => 'Orders',
                    'icon' => 'i-lucide-shopping-cart',
                    'lazy' => false,
                    'grid' => dashboardApiGrid(),
                    'settings' => [],
                    'data' => ['count' => 3, 'settings' => []],
                ]],
            ],
            // Shared: viewable, but nobody edits it through Atrium.
            'meta' => ['abilities' => ['update' => false, 'delete' => false]],
        ]);

    expect(route('atrium.dashboards.show', $shared))->toEndWith('/dashboards/company-kpis');
});

it('answers 404 for a slug the user cannot see or that does not exist', function (): void {
    $bob = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('x')]);
    dashboardApiOwned($bob, ['name' => 'Private']);

    $this->actingAs($this->ann)->getJson(route('atrium.dashboards.show', 'private'))
        ->assertNotFound()
        ->assertExactJson(['message' => 'Not found.']);

    $this->actingAs($this->ann)->getJson(route('atrium.dashboards.show', 'missing'))->assertNotFound();
});

it('resolves a slug among the dashboards the user can see', function (): void {
    $bob = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('x')]);

    // Slugs are not unique: both users have a "mine".
    dashboardApiOwned($bob, ['name' => 'Mine']);
    dashboardApiOwned($this->ann, ['name' => 'Mine'])->widgets()->create(['widget_key' => 'app.orders']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.show', 'mine'))
        ->assertOk()
        ->assertJsonPath('meta.abilities.update', true)
        ->assertJsonCount(1, 'data.widgets');

    $this->actingAs($bob)
        ->getJson(route('atrium.dashboards.show', 'mine'))
        ->assertOk()
        ->assertJsonPath('meta.abilities.update', true)
        ->assertJsonCount(0, 'data.widgets');
});

it('creates a dashboard and answers 201 with the resource and its abilities', function (): void {
    $this->actingAs($this->ann)
        ->postJson(route('atrium.dashboards.store'), ['name' => 'Operations'])
        ->assertCreated()
        ->assertExactJson([
            'data' => ['slug' => 'operations', 'name' => 'Operations', 'is_default' => false, 'version' => 1, 'widgets' => []],
            'meta' => ['abilities' => ['update' => true, 'delete' => true]],
        ]);

    expect(DashboardModel::query()->sole()->isOwnedBy($this->ann))->toBeTrue();
});

it('updates a dashboard and answers with the resource, its new version and its abilities', function (): void {
    $dashboard = dashboardApiOwned($this->ann);
    $placement = $dashboard->widgets()->create(['widget_key' => 'app.orders']);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.update', $dashboard), ['name' => 'Renamed', 'version' => 1])
        ->assertOk()
        ->assertExactJson([
            'data' => [
                'slug' => 'mine',
                'name' => 'Renamed',
                'is_default' => false,
                'version' => 2,
                'widgets' => [[
                    'uuid' => $placement->uuid,
                    'key' => 'app.orders',
                    'component' => 'orders-card',
                    'title' => 'Orders',
                    'icon' => 'i-lucide-shopping-cart',
                    'lazy' => false,
                    'grid' => dashboardApiGrid(),
                    'settings' => [],
                    'data' => ['count' => 3, 'settings' => []],
                ]],
            ],
            'meta' => ['abilities' => ['update' => true, 'delete' => true]],
        ]);

    expect($dashboard->fresh()?->name)->toBe('Renamed');
});

it('deletes a dashboard with a 204 and no body', function (): void {
    $dashboard = dashboardApiOwned($this->ann);
    $dashboard->widgets()->create(['widget_key' => 'app.orders']);

    $this->actingAs($this->ann)
        ->deleteJson(route('atrium.dashboards.destroy', $dashboard))
        ->assertNoContent();

    expect(DashboardModel::query()->count())->toBe(0)
        ->and(DashboardWidgetModel::query()->count())->toBe(0);
});

it('rejects an invalid create', function (array $payload, string $field): void {
    $this->actingAs($this->ann)
        ->postJson(route('atrium.dashboards.store'), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor($field);

    expect(DashboardModel::query()->count())->toBe(0);
})->with([
    'no name' => [[], 'name'],
    'an empty name' => [['name' => ''], 'name'],
    'a name too long' => [['name' => str_repeat('x', 256)], 'name'],
]);

it('rejects an invalid update and changes nothing', function (array $payload, string $field): void {
    $dashboard = dashboardApiOwned($this->ann);

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.update', $dashboard), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor($field);

    expect($dashboard->fresh()?->name)->toBe('Mine')
        ->and($dashboard->fresh()?->version)->toBe(1);
})->with([
    'no version' => [['name' => 'Renamed'], 'version'],
    'a version that is not a number' => [['name' => 'Renamed', 'version' => 'one'], 'version'],
    'an empty name' => [['name' => '', 'version' => 1], 'name'],
    'a default flag that is not a boolean' => [['is_default' => 'maybe', 'version' => 1], 'is_default'],
]);

it('guards an update with the dashboard version', function (): void {
    $dashboard = dashboardApiOwned($this->ann);

    // A match is saved and moves the version on.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.update', $dashboard), ['name' => 'First', 'version' => 1])
        ->assertOk()
        ->assertJsonPath('data.version', 2);

    // A second write from the same stale copy is refused and changes nothing.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.update', $dashboard), ['name' => 'Second', 'version' => 1])
        ->assertStatus(409)
        ->assertJsonValidationErrorFor('version');

    // A mismatch from the future is refused as well.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.update', $dashboard), ['name' => 'Third', 'version' => 7])
        ->assertStatus(409);

    expect($dashboard->fresh()?->name)->toBe('First')
        ->and($dashboard->fresh()?->version)->toBe(2);
});

it('refuses changes to a dashboard the user may view but not modify', function (): void {
    $shared = DashboardModel::query()->create(['name' => 'Company', 'is_shared' => true]);
    $shared->widgets()->create(['widget_key' => 'app.orders']);

    $this->actingAs($this->ann)->putJson(route('atrium.dashboards.update', $shared), ['name' => 'Mine now', 'version' => 1])->assertForbidden();
    $this->actingAs($this->ann)->deleteJson(route('atrium.dashboards.destroy', $shared))->assertForbidden();

    expect($shared->fresh()?->name)->toBe('Company')
        ->and(DashboardWidgetModel::query()->count())->toBe(1);
});

it('answers a guest with 401', function (): void {
    $this->getJson(route('atrium.dashboards.default'))->assertUnauthorized();
    $this->postJson(route('atrium.dashboards.store'), ['name' => 'Ops'])->assertUnauthorized();

    expect(DashboardModel::query()->count())->toBe(0);
});

it('isolates a failing eager widget outside local and testing, and reports it', function (): void {
    $this->withEnvironment('production');
    Gate::define('viewAtrium', fn (): bool => true);
    Exceptions::fake();

    app(WidgetRegistry::class)
        ->add(WidgetDefinition::make('app.broken')->resolve(fn (): array => throw new RuntimeException('the API is down')))
        ->add(WidgetDefinition::make('app.closure')->resolve(fn (): array => ['callback' => fn (): int => 1]));

    $dashboard = dashboardApiOwned($this->ann);
    $dashboard->widgets()->create(['widget_key' => 'app.broken', 'sort' => 0]);
    $dashboard->widgets()->create(['widget_key' => 'app.closure', 'sort' => 1]);
    $dashboard->widgets()->create(['widget_key' => 'app.orders', 'sort' => 2]);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.show', $dashboard))
        ->assertOk()
        ->assertJsonPath('data.widgets.0.data', null)
        ->assertJsonPath('data.widgets.0.error', ['message' => 'Widget failed to load'])
        ->assertJsonPath('data.widgets.1.data', null)
        ->assertJsonPath('data.widgets.1.error', ['message' => 'Widget failed to load'])
        ->assertJsonPath('data.widgets.2.data', ['count' => 3, 'settings' => []])
        ->assertJsonMissingPath('data.widgets.2.error');

    Exceptions::assertReported(fn (RuntimeException $exception): bool => $exception->getMessage() === 'the API is down');
    Exceptions::assertReported(UnserializableDataException::class);
});

it('lets a failing eager widget fail the request in local and testing', function (string $environment): void {
    $this->withEnvironment($environment);
    Gate::define('viewAtrium', fn (): bool => true);

    app(WidgetRegistry::class)->add(WidgetDefinition::make('app.broken')->resolve(fn (): array => throw new RuntimeException('the API is down')));

    $dashboard = dashboardApiOwned($this->ann);
    $dashboard->widgets()->create(['widget_key' => 'app.broken']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.show', $dashboard))
        ->assertInternalServerError();
})->with(['local', 'testing']);
