<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\UnauthorizedPlugin;
use Workbench\App\Models\User;

/**
 * A plugin with one settings panel, `panelled`.
 */
final class PanelledPlugin extends Plugin
{
    public function key(): string
    {
        return 'panelled';
    }

    public function settings(): ?SettingsPanel
    {
        return SettingsPanel::make('panelled')
            ->label('Panelled Settings')
            ->description('Everything the panelled plugin can configure.')
            ->resolve(fn (): array => ['body' => 'Panelled plugin settings body']);
    }
}

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

it('collects settings panels from plugins', function (): void {
    app(PluginRegistry::class)->register(PanelledPlugin::class);

    $panels = app(SettingsRegistry::class)->panels(Request::create('/atrium/api/settings'));

    expect($panels)->toHaveCount(1)
        ->and($panels[0]->label)->toBe('Panelled Settings');
});

it('sorts panels by their sort value', function (): void {
    $registry = app(SettingsRegistry::class);

    $registry->add(SettingsPanel::make('late')->label('Late')->sort(50));
    $registry->add(SettingsPanel::make('early')->label('Early')->sort(10));

    $labels = array_map(
        fn (SettingsPanel $panel): string => $panel->label,
        $registry->panels(Request::create('/atrium/api/settings')),
    );

    expect($labels)->toBe(['Early', 'Late']);
});

it('excludes panels from unauthorized plugins', function (): void {
    app(PluginRegistry::class)->registerMany([PanelledPlugin::class, UnauthorizedPlugin::class]);

    $panels = app(SettingsRegistry::class)->panels(Request::create('/atrium/api/settings'));

    expect($panels)->toHaveCount(1);
});

it('lists plugin panels from the settings endpoint', function (): void {
    app(PluginRegistry::class)->register(PanelledPlugin::class);

    $this->actingAs($this->user)->getJson(route('atrium.settings.index'))
        ->assertOk()
        ->assertJsonPath('data.0.label', 'Panelled Settings');
});

it('serves an individual panel with its data', function (): void {
    app(PluginRegistry::class)->register(PanelledPlugin::class);

    $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'panelled'))
        ->assertOk()
        ->assertJsonPath('data.description', 'Everything the panelled plugin can configure.')
        ->assertJsonPath('data.data.body', 'Panelled plugin settings body');
});

it('returns 404 for an unknown panel', function (): void {
    $this->actingAs($this->user)->getJson(route('atrium.settings.show', 'nope'))->assertNotFound();
});

it('answers an empty list when no panels exist', function (): void {
    $this->actingAs($this->user)->getJson(route('atrium.settings.index'))
        ->assertOk()
        ->assertJsonPath('data', []);
});
