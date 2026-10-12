<?php

declare(strict_types=1);

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Schema;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardWidgetModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Support\Tables;
use RefactorCircus\Atrium\Tests\Fixtures\AlphaPlugin;
use Workbench\App\Models\User;

beforeEach(function (): void {
    ValidateCsrfToken::except(['*']);

    // The dashboard gate passes in local.
    app()->detectEnvironment(fn (): string => 'local');
    app(PluginRegistry::class)->register(AlphaPlugin::class);

    $this->ann = User::forceCreate(['name' => 'Ann', 'email' => 'ann@example.com', 'password' => bcrypt('x')]);
});

it('migrates every table under its configured name', function (): void {
    foreach (array_keys(Tables::DEFAULTS) as $key) {
        expect(Schema::hasTable('crm_'.$key))->toBeTrue()
            ->and(Schema::hasTable('atrium_'.$key))->toBeFalse();
    }
});

it('creates, lays out, renames and deletes dashboards on renamed tables', function (): void {
    $this->actingAs($this->ann)->post(route('atrium.dashboards.store'), ['name' => 'Operations'])->assertRedirect();

    $dashboard = DashboardModel::query()->ownedBy($this->ann)->sole();

    $this->actingAs($this->ann)
        ->putJson(route('atrium.dashboards.layout', $dashboard), [
            'widgets' => [['widget_key' => 'alpha.stats', 'grid_row' => 0, 'grid_column' => 0, 'grid_width' => 6, 'grid_height' => 2]],
        ])
        ->assertOk()
        ->assertJsonPath('data.saved', 1);

    $this->actingAs($this->ann)->put(route('atrium.dashboards.update', $dashboard), ['name' => 'Renamed'])->assertRedirect();

    $this->actingAs($this->ann)->get('/atrium')
        ->assertOk()
        ->assertSee('Alpha stats widget');

    expect($dashboard->fresh()?->name)->toBe('Renamed')
        ->and($dashboard->widgets()->sole()->grid_width)->toBe(6)
        ->and(DashboardModel::query()->visibleTo($this->ann)->count())->toBe(1);

    $this->actingAs($this->ann)->delete(route('atrium.dashboards.destroy', $dashboard))->assertRedirect();

    // The widget placements go with their dashboard.
    expect(DashboardModel::query()->count())->toBe(0)
        ->and(DashboardWidgetModel::query()->count())->toBe(0);
});
