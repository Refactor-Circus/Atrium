<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Dashboard\Models\DashboardModel;
use RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry;
use RefactorCircus\Atrium\Domains\Plugins\Support\Plugin;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Exceptions\DuplicateWidgetException;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\BetaPlugin;
use RefactorCircus\Atrium\Tests\Fixtures\UnauthorizedPlugin;

function widgets(): WidgetRegistry
{
    return app(WidgetRegistry::class);
}

/**
 * A plugin offering one widget under the given key.
 */
function widgetPlugin(string $key, string $widget): Plugin
{
    return new class($key, $widget) extends Plugin
    {
        public function __construct(private string $pluginKey, private string $widget) {}

        public function key(): string
        {
            return $this->pluginKey;
        }

        public function widgets(): array
        {
            return [WidgetDefinition::make($this->widget)];
        }
    };
}

it('collects widget definitions from registered plugins', function (): void {
    app(PluginRegistry::class)->registerMany([widgetPlugin('alpha', 'alpha.stats'), BetaPlugin::class]);

    expect(widgets()->all())->toHaveKeys(['alpha.stats', 'beta.chart']);
});

it('offers widgets without placing them on any dashboard', function (): void {
    app(PluginRegistry::class)->register(BetaPlugin::class);

    $dashboard = DashboardModel::query()->create(['name' => 'Ops', 'is_shared' => true]);

    expect(widgets()->all())->toHaveKey('beta.chart')
        ->and($dashboard->widgets()->count())->toBe(0);
});

it('excludes widgets belonging to unauthorized plugins', function (): void {
    app(PluginRegistry::class)->registerMany([BetaPlugin::class, UnauthorizedPlugin::class]);

    $available = widgets()->available(Request::create('/'));

    expect($available)->toHaveKey('beta.chart')
        ->and($available)->not->toHaveKey('restricted.widget');
});

it('excludes a widget whose own authorize callback denies', function (): void {
    widgets()->add(WidgetDefinition::make('app.private')->authorize(fn (): bool => false));
    widgets()->add(WidgetDefinition::make('app.public'));

    $available = widgets()->available(Request::create('/'));

    expect($available)->toHaveKey('app.public')
        ->and($available)->not->toHaveKey('app.private');
});

it('rejects two plugins registering the same widget key', function (): void {
    app(PluginRegistry::class)->registerMany([widgetPlugin('alpha', 'alpha.stats'), widgetPlugin('conflict', 'alpha.stats')]);

    widgets()->all();
})->throws(DuplicateWidgetException::class, 'already registered');

it('resolves widget data only when asked', function (): void {
    $calls = 0;

    $definition = WidgetDefinition::make('lazy')->resolve(function (array $settings) use (&$calls): array {
        $calls++;

        return ['settings' => $settings];
    });

    widgets()->add($definition);

    expect($calls)->toBe(0)
        ->and($definition->resolveData(['a' => 1]))->toBe(['settings' => ['a' => 1]])
        ->and($calls)->toBe(1);
});

it('exposes default and minimum sizing for the picker', function (): void {
    $definition = WidgetDefinition::make('sized')->defaultSize(6, 3)->minSize(2, 1);

    expect($definition->defaultWidth)->toBe(6)
        ->and($definition->defaultHeight)->toBe(3)
        ->and($definition->minWidth)->toBe(2)
        ->and($definition->minHeight)->toBe(1);
});
