<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Domains\Navigation\Data\NavGroup;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Concerns\DefinesExtension;
use RefactorCircus\Atrium\Domains\Screens\Data\SectionDefinition;
use RefactorCircus\Atrium\Domains\Screens\Data\TabDefinition;
use RefactorCircus\Atrium\Domains\Search\Data\SearchResult;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Themes\Data\Theme;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Support\Iconify;

/*
 * The extension contract: widgets, screen tabs, screen sections and settings
 * panels name the client component that renders them, by key, and every icon
 * is an Iconify name checked where it is set.
 */

dataset('extensions', [
    'widget' => [fn (): WidgetDefinition => WidgetDefinition::make('acme.orders')],
    'settings panel' => [fn (): SettingsPanel => SettingsPanel::make('acme.orders')],
    'tab' => [fn (): TabDefinition => TabDefinition::make('acme.orders')],
    'section' => [fn (): SectionDefinition => SectionDefinition::make('acme.orders')],
]);

dataset('icon setters', [
    'nav item' => [fn (string $icon): object => NavItem::make('Orders')->icon($icon)],
    'nav group' => [fn (string $icon): object => NavGroup::make('Sales')->icon($icon)],
    'widget' => [fn (string $icon): object => WidgetDefinition::make('acme.orders')->icon($icon)],
    'tab' => [fn (string $icon): object => TabDefinition::make('acme.orders')->icon($icon)],
    'settings panel' => [fn (string $icon): object => SettingsPanel::make('acme.orders')->icon($icon)],
    'search result' => [fn (string $icon): object => SearchResult::make('Order 1', '/orders/1')->icon($icon)],
    'theme swatch' => [fn (string $icon): object => Theme::make('harbor')->icon($icon)],
]);

it('defaults the component to the definition key', function (Closure $make): void {
    expect($make()->component)->toBe('acme.orders');
})->with('extensions');

it('lets the component be overridden through a fluent setter', function (Closure $make): void {
    $definition = $make();

    expect($definition->component('AcmeOrdersCard'))->toBe($definition)
        ->and($definition->component)->toBe('AcmeOrdersCard');
})->with('extensions');

it('exposes the component as public private(set)', function (string $class): void {
    $property = new ReflectionProperty($class, 'component');

    expect($property->isPublic())->toBeTrue()
        ->and($property->isPrivateSet())->toBeTrue()
        ->and((string) $property->getType())->toBe('string');
})->with([
    WidgetDefinition::class,
    SettingsPanel::class,
    TabDefinition::class,
    SectionDefinition::class,
]);

it('refuses a component written from outside', function (Closure $make): void {
    $definition = $make();

    expect(fn () => $definition->component = 'Other')->toThrow(Error::class);
})->with('extensions');

it('has no view, as a method or a property', function (string $class): void {
    $reflection = new ReflectionClass($class);

    expect($reflection->hasMethod('view'))->toBeFalse()
        ->and($reflection->hasProperty('view'))->toBeFalse();
})->with([
    WidgetDefinition::class,
    SettingsPanel::class,
    TabDefinition::class,
    SectionDefinition::class,
    DefinesExtension::class,
]);

it('accepts an Iconify name on every icon setter', function (Closure $set): void {
    expect($set('i-lucide-home')->icon)->toBe('i-lucide-home');
})->with('icon setters');

it('rejects anything but an Iconify name on every icon setter', function (Closure $set, string $icon): void {
    expect(fn () => $set($icon))->toThrow(InvalidArgumentException::class, 'is not an Iconify name');
})->with('icon setters')->with([
    'a collection:name pair' => ['lucide:home'],
    'inline SVG' => ['<svg viewBox="0 0 24 24"><path d="M3 12h18"/></svg>'],
    'a name with no collection' => ['i-home'],
    'a v1 Atrium icon name' => ['squares-2x2'],
]);

it('gives a tab an Iconify name by default', function (): void {
    expect(Iconify::assert(TabDefinition::DEFAULT_ICON))->toBe(TabDefinition::DEFAULT_ICON)
        ->and(TabDefinition::make('acme.orders')->icon)->toBe(TabDefinition::DEFAULT_ICON);
});

it('leaves the icon unset until one is given', function (Closure $make): void {
    expect($make()->icon)->toBeNull();
})->with([
    'nav item' => [fn (): NavItem => NavItem::make('Orders')],
    'nav group' => [fn (): NavGroup => NavGroup::make('Sales')],
    'widget' => [fn (): WidgetDefinition => WidgetDefinition::make('acme.orders')],
    'settings panel' => [fn (): SettingsPanel => SettingsPanel::make('acme.orders')],
    'search result' => [fn (): SearchResult => SearchResult::make('Order 1', '/orders/1')],
    'theme swatch' => [fn (): Theme => Theme::make('harbor')],
]);
