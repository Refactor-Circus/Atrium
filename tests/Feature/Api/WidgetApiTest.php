<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\UnauthorizedPlugin;
use Workbench\App\Models\User;

beforeEach(function (): void {
    $this->withEnvironment('local');

    $this->lazyCalls = 0;

    app(WidgetRegistry::class)
        ->add(WidgetDefinition::make('app.slow')
            ->label('Slow')
            ->description('Takes its time.')
            ->icon('i-lucide-timer')
            ->component('slow-card')
            ->defaultSize(6, 3)
            ->minSize(2, 2)
            ->lazy()
            ->resolve(function (array $settings): array {
                $this->lazyCalls++;

                return ['late' => true, 'settings' => $settings];
            }))
        ->add(WidgetDefinition::make('app.quick')->label('Quick'))
        ->add(WidgetDefinition::make('app.private')->lazy()->authorize(fn (): bool => false));

    $this->ann = User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
    $this->dashboard = widgetApiDashboard($this->ann, 'Mine');
});

function widgetApiDashboard(User $user, string $name): DashboardModel
{
    return DashboardModel::query()->create(['name' => $name, 'owner_type' => $user->getMorphClass(), 'owner_id' => $user->getKey()]);
}

it('lists the widgets the user may place', function (): void {
    app(PluginRegistry::class)->register(UnauthorizedPlugin::class);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.widgets.index'))
        ->assertOk()
        ->assertExactJson([
            'data' => [
                [
                    'key' => 'app.slow',
                    'label' => 'Slow',
                    'description' => 'Takes its time.',
                    'icon' => 'i-lucide-timer',
                    'component' => 'slow-card',
                    'lazy' => true,
                    'default_size' => ['width' => 6, 'height' => 3],
                    'min_size' => ['width' => 2, 'height' => 2],
                ],
                [
                    'key' => 'app.quick',
                    'label' => 'Quick',
                    'description' => null,
                    'icon' => null,
                    'component' => 'app.quick',
                    'lazy' => false,
                    'default_size' => ['width' => 4, 'height' => 2],
                    'min_size' => ['width' => 1, 'height' => 1],
                ],
            ],
        ]);

    // Listing widgets places none.
    expect($this->dashboard->widgets()->count())->toBe(0);
});

it('serves a lazy placement with its data, by uuid', function (): void {
    $slow = $this->dashboard->widgets()->create(['widget_key' => 'app.slow', 'grid_width' => 6, 'settings' => ['range' => 'week']]);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$this->dashboard, $slow]))
        ->assertOk()
        ->assertExactJson([
            'data' => [
                'uuid' => $slow->uuid,
                'key' => 'app.slow',
                'component' => 'slow-card',
                'title' => 'Slow',
                'icon' => 'i-lucide-timer',
                'lazy' => true,
                'grid' => ['row' => 0, 'column' => 0, 'width' => 6, 'height' => 2],
                'settings' => ['range' => 'week'],
                'data' => ['late' => true, 'settings' => ['range' => 'week']],
            ],
        ]);

    expect($this->lazyCalls)->toBe(1)
        ->and(route('atrium.dashboards.widgets.show', [$this->dashboard, $slow]))->toEndWith('/dashboards/mine/widgets/'.$slow->uuid);
});

it('only serves a placement through the dashboard it is on', function (): void {
    $other = widgetApiDashboard($this->ann, 'Second');
    $slow = $other->widgets()->create(['widget_key' => 'app.slow']);

    // Both dashboards are the user's own, but the placement is not on this one.
    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$this->dashboard, $slow]))
        ->assertNotFound();

    $bob = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('x')]);
    $theirs = widgetApiDashboard($bob, 'Theirs')->widgets()->create(['widget_key' => 'app.slow']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$this->dashboard, $theirs]))
        ->assertNotFound();

    expect($this->lazyCalls)->toBe(0);
});

it('answers 404 for an orphaned placement', function (): void {
    $orphan = $this->dashboard->widgets()->create(['widget_key' => 'uninstalled.widget']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$this->dashboard, $orphan]))
        ->assertNotFound();
});

it('answers 404 for a placement whose widget the user may not see', function (): void {
    $private = $this->dashboard->widgets()->create(['widget_key' => 'app.private']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$this->dashboard, $private]))
        ->assertNotFound();
});

it('answers 404 for a dashboard the user cannot see', function (): void {
    $bob = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('x')]);
    $theirs = widgetApiDashboard($bob, 'Theirs');
    $slow = $theirs->widgets()->create(['widget_key' => 'app.slow']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$theirs, $slow]))
        ->assertNotFound();

    expect($this->lazyCalls)->toBe(0);
});

it('answers 404 for a uuid that names no placement', function (string $uuid): void {
    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$this->dashboard, $uuid]))
        ->assertNotFound();
})->with([
    'not a uuid' => ['42'],
    'an unknown uuid' => ['0199a3c1-0000-7000-8000-000000000000'],
]);

it('serves widgets on a shared dashboard to whoever can see it', function (): void {
    $shared = DashboardModel::query()->create(['name' => 'Company', 'is_shared' => true]);
    $slow = $shared->widgets()->create(['widget_key' => 'app.slow']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$shared, $slow]))
        ->assertOk()
        ->assertJsonPath('data.data.late', true);
});

it('keeps a failing lazy widget out of the dashboard payload', function (): void {
    app(WidgetRegistry::class)->add(WidgetDefinition::make('app.flaky')->lazy()->resolve(fn (): array => throw new RuntimeException('down')));

    $flaky = $this->dashboard->widgets()->create(['widget_key' => 'app.flaky']);

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.show', $this->dashboard))
        ->assertOk()
        ->assertJsonPath('data.widgets.0.uuid', $flaky->uuid)
        ->assertJsonMissingPath('data.widgets.0.data');

    $this->actingAs($this->ann)
        ->getJson(route('atrium.dashboards.widgets.show', [$this->dashboard, $flaky]))
        ->assertInternalServerError();
});

it('answers a guest with 401', function (): void {
    // Shared, so the dashboard binds for a guest too and the policy decides.
    $shared = DashboardModel::query()->create(['name' => 'Company', 'is_shared' => true]);
    $slow = $shared->widgets()->create(['widget_key' => 'app.slow']);

    $this->getJson(route('atrium.widgets.index'))->assertUnauthorized();
    $this->getJson(route('atrium.dashboards.widgets.show', [$shared, $slow]))->assertUnauthorized();

    expect($this->lazyCalls)->toBe(0);
});
