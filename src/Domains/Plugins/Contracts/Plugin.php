<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Plugins\Contracts;

use Illuminate\Http\Request;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

interface Plugin
{
    /**
     * Stable identifier used in config, caching, and widget keys.
     */
    public function key(): string;

    /**
     * Human readable name shown in the dashboard.
     */
    public function label(): string;

    /**
     * Determine whether the current request may see this plugin at all.
     */
    public function authorize(Request $request): bool;

    /**
     * Features that must all be on for the plugin to appear at all - its
     * navigation, widgets, settings, search, and routes. Atrium asks the
     * feature resolver, so any flag system can answer.
     *
     * @return array<int, string>
     */
    public function features(): array;

    /**
     * Navigation entries contributed to the dashboard sidebar.
     *
     * @return array<int, NavItem>
     */
    public function navigation(): array;

    /**
     * Visibility rules for the sidebar groups this plugin's items use.
     *
     * @return array<int, NavGroup>
     */
    public function navigationGroups(): array;

    /**
     * Register JSON API routes. Called inside Atrium's API group under the
     * `plugins/{key}` prefix and the `atrium.plugins.{key}.` name, behind the
     * group's middleware and the plugin's feature gate, so name a route by
     * its operation only: `->name('index')` serves `atrium.plugins.{key}.index`.
     */
    public function routes(): void;

    /**
     * Settings section contributed to the dashboard settings page.
     */
    public function settings(): ?SettingsPanel;

    /**
     * Widget types this plugin makes available.
     *
     * These are offered in the widget picker, never placed on a dashboard
     * automatically. Placement is always a user action.
     *
     * @return array<int, WidgetDefinition>
     */
    public function widgets(): array;

    /**
     * The plugin's search source, or one per kind of thing it finds.
     *
     * @return SearchSource|array<int, SearchSource>|null
     */
    public function search(): SearchSource|array|null;
}
