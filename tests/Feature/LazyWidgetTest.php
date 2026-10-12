<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use Workbench\App\Models\User;

beforeEach(function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    $this->rendered = 0;

    app(WidgetRegistry::class)
        ->add(WidgetDefinition::make('slow')->view('alpha-stats')->lazy()->resolve(function (): array {
            $this->rendered++;

            return [];
        }))
        ->add(WidgetDefinition::make('quick')->view('alpha-stats'));

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

function ownDashboard(User $user, array $attributes = []): DashboardModel
{
    return DashboardModel::query()->create(['name' => 'Mine', 'owner_type' => $user->getMorphClass(), 'owner_id' => $user->getKey(), ...$attributes]);
}

it('renders widgets with the page unless they are lazy', function (): void {
    expect(WidgetDefinition::make('x')->lazy)->toBeFalse()
        ->and(WidgetDefinition::make('x')->lazy()->lazy)->toBeTrue();

    $dashboard = ownDashboard($this->user);
    $slow = $dashboard->widgets()->create(['widget_key' => 'slow']);
    $dashboard->widgets()->create(['widget_key' => 'quick']);

    $this->actingAs($this->user)->get('/atrium')
        ->assertOk()
        ->assertSee('data-testid="lazy-widget"', false)
        ->assertSee(str_replace('/', '\\/', route('atrium.dashboards.widgets.show', [$dashboard->id, $slow->id])), false)
        ->assertSeeTextInOrder(['Alpha stats widget']);

    expect($this->rendered)->toBe(0);
});

it('serves a lazy widget body from its endpoint', function (): void {
    $dashboard = ownDashboard($this->user);
    $slow = $dashboard->widgets()->create(['widget_key' => 'slow']);

    $this->actingAs($this->user)->get(route('atrium.dashboards.widgets.show', [$dashboard->id, $slow->id]))
        ->assertOk()
        ->assertSee('Alpha stats widget');

    expect($this->rendered)->toBe(1);
});

it('serves widgets on shared dashboards to anyone who can see them', function (): void {
    $dashboard = DashboardModel::query()->create(['name' => 'Shared', 'is_shared' => true]);
    $slow = $dashboard->widgets()->create(['widget_key' => 'slow']);

    $this->get(route('atrium.dashboards.widgets.show', [$dashboard->id, $slow->id]))->assertOk();
});

it('hides widgets on dashboards the user cannot see', function (): void {
    $other = User::forceCreate(['name' => 'Grace', 'email' => 'grace@example.com', 'password' => bcrypt('secret')]);
    $dashboard = ownDashboard($other);
    $slow = $dashboard->widgets()->create(['widget_key' => 'slow']);

    $this->actingAs($this->user)->get(route('atrium.dashboards.widgets.show', [$dashboard->id, $slow->id]))->assertNotFound();

    expect($this->rendered)->toBe(0);
});

it('only serves a widget through the dashboard it is on', function (): void {
    $mine = ownDashboard($this->user);
    $other = User::forceCreate(['name' => 'Grace', 'email' => 'grace@example.com', 'password' => bcrypt('secret')]);
    $slow = ownDashboard($other, ['name' => 'Theirs'])->widgets()->create(['widget_key' => 'slow']);

    $this->actingAs($this->user)->get(route('atrium.dashboards.widgets.show', [$mine->id, $slow->id]))->assertNotFound();
});

it('answers not found for a widget whose plugin is gone', function (): void {
    $dashboard = ownDashboard($this->user);
    $gone = $dashboard->widgets()->create(['widget_key' => 'removed.widget']);

    $this->actingAs($this->user)->get(route('atrium.dashboards.widgets.show', [$dashboard->id, $gone->id]))->assertNotFound();
});

it('keeps the widget endpoint behind the dashboard gate', function (): void {
    $this->withEnvironment('production');

    $dashboard = ownDashboard($this->user);
    $slow = $dashboard->widgets()->create(['widget_key' => 'slow']);

    $this->actingAs($this->user)->get(route('atrium.dashboards.widgets.show', [$dashboard->id, $slow->id]))->assertForbidden();
});
