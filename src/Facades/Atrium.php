<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static \RefactorCircus\Atrium\Domains\Screens\Services\ScreenExtensions screens()
 * @method static \RefactorCircus\Atrium\Atrium theme(\RefactorCircus\Atrium\Domains\Themes\Data\Theme $theme)
 * @method static array<string, \RefactorCircus\Atrium\Domains\Themes\Data\Theme> themes()
 * @method static \RefactorCircus\Atrium\Atrium stylesheet(string $href)
 * @method static \RefactorCircus\Atrium\Atrium css(string $css, ?string $key = null)
 * @method static \RefactorCircus\Atrium\Atrium plugin(\RefactorCircus\Atrium\Domains\Plugins\Contracts\Plugin|class-string $plugin)
 * @method static array<string, \RefactorCircus\Atrium\Domains\Plugins\Contracts\Plugin> plugins()
 * @method static \RefactorCircus\Atrium\Domains\Plugins\Services\PluginRegistry pluginRegistry()
 * @method static \RefactorCircus\Atrium\Atrium nav(\RefactorCircus\Atrium\Domains\Navigation\Data\NavItem $item)
 * @method static \RefactorCircus\Atrium\Atrium navigationGroup(\RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup $group)
 * @method static \RefactorCircus\Atrium\Atrium resolvePermissionsUsing(?\Closure $callback)
 * @method static \RefactorCircus\Atrium\Atrium resolveFeaturesUsing(?\Closure $callback)
 * @method static bool featureEnabled(string $feature, ?\Illuminate\Http\Request $request = null)
 * @method static array<int, \RefactorCircus\Atrium\Domains\Navigation\Data\NavItem> navigation(?\Illuminate\Http\Request $request = null)
 * @method static array<string, array<int, \RefactorCircus\Atrium\Domains\Navigation\Data\NavItem>> navigationGroups(?\Illuminate\Http\Request $request = null)
 * @method static array<int, \RefactorCircus\Atrium\Domains\Navigation\Data\NavSection> navigationSections(?\Illuminate\Http\Request $request = null)
 * @method static \RefactorCircus\Atrium\Atrium widget(\RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition $definition)
 * @method static array<string, \RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition> widgets(?\Illuminate\Http\Request $request = null)
 * @method static \RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry widgetRegistry()
 * @method static \RefactorCircus\Atrium\Atrium settingsPanel(\RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel $panel)
 * @method static array<int, \RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel> settings(?\Illuminate\Http\Request $request = null)
 * @method static \RefactorCircus\Atrium\Atrium searchSource(\RefactorCircus\Atrium\Domains\Search\Data\SearchSource $source)
 * @method static array<int, \RefactorCircus\Atrium\Domains\Search\Data\SearchResult> search(string $query, ?\Illuminate\Http\Request $request = null)
 * @method static string path()
 * @method static string url(string $path = '')
 *
 * @see \RefactorCircus\Atrium\Atrium
 */
class Atrium extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return \RefactorCircus\Atrium\Atrium::class;
    }
}
