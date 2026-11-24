<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Domains\Integrations\Contracts;

use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

/**
 * What Atrium shows of one suite package, as data only: Atrium never loads
 * the package's classes, models or actions. The Vue components of its
 * front-end module call the package's own API for everything they display.
 *
 * Atrium finds the class by convention from the package's key in
 * `atrium.integrations`: `RefactorCircus\Atrium\Integrations\{Pkg}\{Pkg}Integration`.
 * It registers only while the package is installed, enabled and reachable;
 * its nav items, widgets and settings panel then show only while the
 * integration's feature flags are on for the request.
 */
interface Integration
{
    /**
     * The package's name, as the shell lists the integration.
     */
    public function label(): string;

    /**
     * Nav items, linking to the integration's layer pages with `NavItem::path('/{pkg}/...')`
     * (never `url()` or `route()`, which name host URLs; D-075).
     * Atrium computes no badge for them; an item whose badge or children
     * come from the package's API names a layer resolver with `live()`.
     *
     * @return list<NavItem>
     */
    public function navigation(): array;

    /**
     * Widgets, declared without a resolver: their components fetch their
     * own data from the package's API.
     *
     * @return list<WidgetDefinition>
     */
    public function widgets(): array;

    /**
     * The package's settings panel, if it has one, without a resolver.
     */
    public function settings(): ?SettingsPanel;

    /**
     * The search sources the front end runs against the package's API.
     *
     * @return list<SearchSourceDeclaration>
     */
    public function searchSources(): array;

    /**
     * The package's screens: their keys, kinds, layer paths and subjects.
     * Every key starts with `{pkg}.` and every path with `/{pkg}/`.
     *
     * @return list<ScreenDeclaration>
     */
    public function screens(): array;
}
