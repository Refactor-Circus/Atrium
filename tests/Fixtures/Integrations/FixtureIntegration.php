<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Tests\Fixtures\Integrations;

use Illuminate\Support\Str;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;

/**
 * A stand-in integration for any package key: one nav item with a live key,
 * one widget, a settings panel, a search source and a list and a detail
 * screen, all declared as data only. Tests bind it in place of the
 * conventional `{Pkg}Integration` class with `IntegrationFixture::fake()`.
 */
final class FixtureIntegration extends Integration
{
    public function __construct(private readonly string $key) {}

    public function label(): string
    {
        return Str::headline($this->key);
    }

    public function navigation(): array
    {
        return [
            NavItem::make($this->label().' records')
                ->path('/'.$this->key.'/records')
                ->icon('i-lucide-box')
                ->group($this->label())
                ->sort(50)
                ->live($this->key.'.active-records', ['sort' => 90]),
        ];
    }

    public function widgets(): array
    {
        return [
            WidgetDefinition::make($this->key.'.stats')->label($this->label().' stats')->icon('i-lucide-chart-bar'),
        ];
    }

    public function settings(): SettingsPanel
    {
        return SettingsPanel::make($this->key)->label($this->label())->icon('i-lucide-settings');
    }

    public function searchSources(): array
    {
        return [
            SearchSourceDeclaration::make($this->key)->label($this->label().' records')->icon('i-lucide-search'),
        ];
    }

    public function screens(): array
    {
        return [
            ScreenDeclaration::make($this->key.'.records', Screen::LIST, '/'.$this->key.'/records'),
            ScreenDeclaration::make($this->key.'.record', Screen::DETAIL, '/'.$this->key.'/records/:record')->subjectType($this->key.'.record'),
        ];
    }
}
