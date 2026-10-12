<?php

declare(strict_types=1);

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use Workbench\App\Models\User;

beforeEach(function (): void {
    // Only CSRF is exempted. The Atrium authorization middleware stays on, so
    // the ownership assertions below exercise the real middleware stack.
    ValidateCsrfToken::except(['*']);

    app()->detectEnvironment(fn (): string => 'local');
    app(PluginRegistry::class)->register(AlphaPlugin::class);
});

function makeUser(string $email): User
{
    return User::forceCreate([
        'name' => 'Test',
        'email' => $email,
        'password' => bcrypt('secret'),
    ]);
}

function dashboardFor(User $user): DashboardModel
{
    return DashboardModel::query()->create([
        'name' => 'Mine',
        'owner_type' => $user->getMorphClass(),
        'owner_id' => $user->getKey(),
    ]);
}

it('persists a widget placement', function (): void {
    $user = makeUser('a@example.com');
    $dashboard = dashboardFor($user);

    $this->actingAs($user)
        ->putJson(route('atrium.dashboards.layout', $dashboard), [
            'widgets' => [
                ['widget_key' => 'alpha.stats', 'grid_row' => 0, 'grid_column' => 0, 'grid_width' => 6, 'grid_height' => 2],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.saved', 1);

    expect($dashboard->widgets()->count())->toBe(1)
        ->and($dashboard->widgets()->first()->grid_width)->toBe(6);
});

it('ignores placements for widgets that are not available', function (): void {
    $user = makeUser('b@example.com');
    $dashboard = dashboardFor($user);

    $this->actingAs($user)
        ->putJson(route('atrium.dashboards.layout', $dashboard), [
            'widgets' => [
                ['widget_key' => 'alpha.stats'],
                ['widget_key' => 'not.registered'],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.saved', 1);

    expect($dashboard->widgets()->pluck('widget_key')->all())->toBe(['alpha.stats']);
});

it('refuses to modify a dashboard owned by someone else', function (): void {
    $owner = makeUser('owner@example.com');
    $intruder = makeUser('intruder@example.com');

    $dashboard = dashboardFor($owner);

    $this->actingAs($intruder)
        ->putJson(route('atrium.dashboards.layout', $dashboard), ['widgets' => []])
        ->assertForbidden();
});

it('refuses to modify a shared dashboard nobody owns', function (): void {
    $user = makeUser('c@example.com');
    $shared = DashboardModel::query()->create(['name' => 'Shared', 'is_shared' => true]);

    $this->actingAs($user)
        ->putJson(route('atrium.dashboards.layout', $shared), ['widgets' => []])
        ->assertForbidden();
});

it('renders a placed widget on the dashboard', function (): void {
    $user = makeUser('d@example.com');
    $dashboard = dashboardFor($user);
    $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);

    $this->actingAs($user)->get('/atrium')->assertOk()->assertSee('Alpha stats widget');
});

it('skips a placed widget whose plugin is gone without breaking the page', function (): void {
    $user = makeUser('e@example.com');
    $dashboard = dashboardFor($user);

    $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);
    $dashboard->widgets()->create(['widget_key' => 'uninstalled.widget']);

    $response = $this->actingAs($user)->get('/atrium')->assertOk();

    // The live widget still renders and the page does not error. The orphaned
    // placement contributes no grid item of its own.
    $response->assertSee('Alpha stats widget');

    expect(substr_count($response->getContent(), 'data-widget-key='))->toBe(1);
});

it('creates a dashboard for the current user', function (): void {
    $user = makeUser('f@example.com');

    $this->actingAs($user)
        ->post(route('atrium.dashboards.store'), ['name' => 'Operations'])
        ->assertRedirect();

    $dashboard = DashboardModel::query()->where('name', 'Operations')->firstOrFail();

    expect($dashboard->isOwnedBy($user))->toBeTrue();
});

it('lets a user keep more than one dashboard', function (): void {
    $user = makeUser('g@example.com');

    $this->actingAs($user)->post(route('atrium.dashboards.store'), ['name' => 'First']);
    $this->actingAs($user)->post(route('atrium.dashboards.store'), ['name' => 'Second']);

    expect(DashboardModel::query()->ownedBy($user)->count())->toBe(2);
});

it('deletes a dashboard the user owns', function (): void {
    $user = makeUser('h@example.com');
    $dashboard = dashboardFor($user);

    $this->actingAs($user)
        ->delete(route('atrium.dashboards.destroy', $dashboard))
        ->assertRedirect();

    expect(DashboardModel::query()->count())->toBe(0);
});

it('creates a first dashboard for a signed in user so the picker is reachable', function (): void {
    $user = makeUser('first@example.com');

    $this->actingAs($user)->get('/atrium')->assertOk()->assertSee('Add widget');

    $dashboard = DashboardModel::query()->ownedBy($user)->firstOrFail();

    // Created empty. Nothing is placed on the user's behalf.
    expect($dashboard->widgets()->count())->toBe(0);
});

it('offers every available widget in the picker without placing any', function (): void {
    $user = makeUser('picker@example.com');

    $response = $this->actingAs($user)->get('/atrium')->assertOk();

    $response->assertSee('Alpha Stats');

    expect(substr_count($response->getContent(), 'data-widget-key='))->toBe(0);
});

it('does not create dashboards for guests', function (): void {
    $this->get('/atrium')->assertOk();

    expect(DashboardModel::query()->count())->toBe(0);
});

it('persists a reordering of placed widgets', function (): void {
    $user = makeUser('reorder@example.com');
    $dashboard = dashboardFor($user);

    app(WidgetRegistry::class)
        ->add(WidgetDefinition::make('app.second')->label('Second'));

    $this->actingAs($user)->putJson(route('atrium.dashboards.layout', $dashboard), [
        'widgets' => [
            ['widget_key' => 'alpha.stats'],
            ['widget_key' => 'app.second'],
        ],
    ])->assertOk();

    expect($dashboard->widgets()->pluck('widget_key')->all())->toBe(['alpha.stats', 'app.second']);

    // Same widgets, swapped order.
    $this->actingAs($user)->putJson(route('atrium.dashboards.layout', $dashboard), [
        'widgets' => [
            ['widget_key' => 'app.second'],
            ['widget_key' => 'alpha.stats'],
        ],
    ])->assertOk();

    expect($dashboard->widgets()->pluck('widget_key')->all())->toBe(['app.second', 'alpha.stats']);
});

it('persists a resize of a placed widget', function (): void {
    $user = makeUser('resize@example.com');
    $dashboard = dashboardFor($user);

    $this->actingAs($user)->putJson(route('atrium.dashboards.layout', $dashboard), [
        'widgets' => [['widget_key' => 'alpha.stats', 'grid_width' => 8, 'grid_height' => 3]],
    ])->assertOk();

    $placement = $dashboard->widgets()->firstOrFail();

    expect($placement->grid_width)->toBe(8)->and($placement->grid_height)->toBe(3);
});

it('removes a placement when it is left out of the payload', function (): void {
    $user = makeUser('removal@example.com');
    $dashboard = dashboardFor($user);

    $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);

    $this->actingAs($user)
        ->putJson(route('atrium.dashboards.layout', $dashboard), ['widgets' => []])
        ->assertOk()
        ->assertJsonPath('data.saved', 0);

    expect($dashboard->widgets()->count())->toBe(0);
});

it('renders the edit controls only for a dashboard the user can modify', function (): void {
    $user = makeUser('controls@example.com');
    $dashboard = dashboardFor($user);
    $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);

    $this->actingAs($user)->get('/atrium')
        ->assertOk()
        ->assertSee('data-testid="remove-alpha-stats"', false)
        ->assertSee('draggable="true"', false);
});

it('omits the edit controls on a shared dashboard the user does not own', function (): void {
    $user = makeUser('viewer@example.com');

    $shared = DashboardModel::query()->create(['name' => 'Shared', 'is_shared' => true, 'is_default' => true]);
    $shared->widgets()->create(['widget_key' => 'alpha.stats']);

    $this->actingAs($user)->get('/atrium')
        ->assertOk()
        ->assertSee('Alpha stats widget')
        ->assertDontSee('data-testid="remove-alpha-stats"', false);
});

it('answers a missing dashboard with a plain 404', function (): void {
    $this->actingAs(makeUser('owner@example.com'))
        ->putJson(route('atrium.dashboards.layout', 999), ['widgets' => []])
        ->assertNotFound()
        ->assertExactJson(['message' => 'Not found.']);
});
