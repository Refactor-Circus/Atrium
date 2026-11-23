<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\AtriumServiceProvider;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardPolicy;
use RefactorCircus\Atrium\Domains\Dashboard\Policies\DashboardWidgetPolicy;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\Models\TeamDashboard;
use RefactorCircus\Atrium\Tests\Fixtures\Policies\KeepWidgetsPolicy;
use RefactorCircus\Atrium\Tests\Fixtures\Policies\ReadOnlyDashboardPolicy;
use Workbench\App\Models\User;

beforeEach(function (): void {
    // The dashboard gate passes in local, so these tests exercise the policies.
    app()->detectEnvironment(fn (): string => 'local');
    app(PluginRegistry::class)->register(AlphaPlugin::class);

    $this->ann = User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
    $this->bob = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('x')]);
});

/**
 * Register the policies again after a test changes `atrium.policies`, as the
 * provider does on boot.
 *
 * @param  array<class-string, class-string>  $policies
 */
function usePolicies(array $policies): void
{
    foreach ($policies as $model => $policy) {
        config()->set('atrium.policies.'.$model, $policy);
    }

    $provider = app()->getProvider(AtriumServiceProvider::class);

    (fn () => $this->registerPolicies())->call($provider);
}

function ownedDashboard(User $owner, string $name = 'Mine'): DashboardModel
{
    return DashboardModel::query()->create([
        'name' => $name,
        'owner_type' => $owner->getMorphClass(),
        'owner_id' => $owner->getKey(),
    ]);
}

it('registers the policies from the config', function (): void {
    expect(Gate::getPolicyFor(DashboardModel::class))->toBeInstanceOf(DashboardPolicy::class)
        ->and(Gate::getPolicyFor(TeamDashboard::class))->toBeInstanceOf(DashboardPolicy::class)
        ->and(Gate::getPolicyFor(DashboardWidgetModel::class))->toBeInstanceOf(DashboardWidgetPolicy::class);
});

it('lets the owner do anything with their dashboard', function (): void {
    $dashboard = ownedDashboard($this->ann);

    expect($this->ann->can('viewAny', DashboardModel::class))->toBeTrue()
        ->and($this->ann->can('create', DashboardModel::class))->toBeTrue()
        ->and($this->ann->can('view', $dashboard))->toBeTrue()
        ->and($this->ann->can('update', $dashboard))->toBeTrue()
        ->and($this->ann->can('delete', $dashboard))->toBeTrue()
        ->and($this->bob->can('view', $dashboard))->toBeFalse()
        ->and($this->bob->can('update', $dashboard))->toBeFalse()
        ->and($this->bob->can('delete', $dashboard))->toBeFalse();
});

it('lets everyone view a shared dashboard but nobody change it', function (): void {
    $shared = DashboardModel::query()->create(['name' => 'Company', 'is_shared' => true]);

    expect($this->bob->can('view', $shared))->toBeTrue()
        ->and($this->bob->can('update', $shared))->toBeFalse()
        ->and($this->bob->can('delete', $shared))->toBeFalse();
});

it('refuses guests', function (): void {
    $dashboard = ownedDashboard($this->ann);

    expect(Gate::forUser(null)->allows('create', DashboardModel::class))->toBeFalse()
        ->and(Gate::forUser(null)->allows('view', $dashboard))->toBeFalse();

    // Unauthenticated, not forbidden: refactor-circus/keystone answers guests 401.
    $this->postJson(route('atrium.dashboards.store'), ['name' => 'Anonymous'])->assertUnauthorized();

    expect(DashboardModel::query()->where('name', 'Anonymous')->exists())->toBeFalse();
});

it('checks widget placements against their dashboard', function (): void {
    $dashboard = ownedDashboard($this->ann);
    $widget = $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);

    $shared = DashboardModel::query()->create(['name' => 'Company', 'is_shared' => true]);
    $sharedWidget = $shared->widgets()->create(['widget_key' => 'alpha.stats']);

    expect($this->ann->can('viewAny', [DashboardWidgetModel::class, $dashboard]))->toBeTrue()
        ->and($this->ann->can('create', [DashboardWidgetModel::class, $dashboard]))->toBeTrue()
        ->and($this->ann->can('view', $widget))->toBeTrue()
        ->and($this->ann->can('update', $widget))->toBeTrue()
        ->and($this->ann->can('delete', $widget))->toBeTrue()
        ->and($this->bob->can('viewAny', [DashboardWidgetModel::class, $dashboard]))->toBeFalse()
        ->and($this->bob->can('view', $widget))->toBeFalse()
        ->and($this->bob->can('delete', $widget))->toBeFalse()
        ->and($this->bob->can('view', $sharedWidget))->toBeTrue()
        ->and($this->bob->can('create', [DashboardWidgetModel::class, $shared]))->toBeFalse()
        ->and($this->bob->can('update', $sharedWidget))->toBeFalse();
});

it('uses a dashboard policy swapped in the config, for dashboards and their widgets', function (): void {
    usePolicies([DashboardModel::class => ReadOnlyDashboardPolicy::class]);

    $dashboard = ownedDashboard($this->ann);
    $dashboard->widgets()->create(['widget_key' => 'alpha.stats']);

    expect($this->ann->can('update', $dashboard))->toBeFalse()
        ->and($this->ann->can('create', [DashboardWidgetModel::class, $dashboard]))->toBeFalse();

    $this->actingAs($this->ann)->postJson(route('atrium.dashboards.store'), ['name' => 'Another'])->assertForbidden();
    $this->actingAs($this->ann)->putJson(route('atrium.dashboards.update', $dashboard), ['name' => 'Renamed', 'version' => 1])->assertForbidden();
    $this->actingAs($this->ann)->putJson(route('atrium.dashboards.layout', $dashboard), ['version' => 1, 'widgets' => []])->assertForbidden();

    // The dashboard still reads, and its abilities say it cannot be edited.
    $this->actingAs($this->ann)->getJson(route('atrium.dashboards.show', $dashboard))
        ->assertOk()
        ->assertJsonPath('data.widgets.0.key', 'alpha.stats')
        ->assertJsonPath('meta.abilities', ['update' => false, 'delete' => true]);

    // Deleting is still the owner's call under this policy.
    $this->actingAs($this->ann)->deleteJson(route('atrium.dashboards.destroy', $dashboard))->assertNoContent();

    expect(DashboardModel::query()->whereKey($dashboard->id)->exists())->toBeFalse();
});

it('checks every placement a layout save removes against a widget policy swapped in the config', function (): void {
    usePolicies([DashboardWidgetModel::class => KeepWidgetsPolicy::class]);

    $dashboard = ownedDashboard($this->ann);

    // Nothing placed yet, so nothing is removed.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $dashboard), ['version' => 1, 'widgets' => [['widget_key' => 'alpha.stats']]])
        ->assertOk()
        ->assertJsonPath('data.version', 2);

    // Now a save would remove the placement, which the policy forbids.
    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $dashboard), ['version' => 2, 'widgets' => []])
        ->assertForbidden();

    expect($dashboard->widgets()->count())->toBe(1);
});

it('keeps the dashboard gate in front of the policies', function (): void {
    $this->withEnvironment('production');

    $dashboard = ownedDashboard($this->ann);

    // No gate is defined, so outside local nobody gets in, owner or not.
    $this->actingAs($this->ann)->putJson(route('atrium.dashboards.update', $dashboard), ['name' => 'Renamed', 'version' => 1])->assertForbidden();

    expect($dashboard->fresh()?->name)->toBe('Mine');
});
