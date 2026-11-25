<?php

declare(strict_types=1);

use Laravel\Pennant\Feature;
use Laravel\Pennant\PennantServiceProvider;
use RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper;
use RefactorCircus\Atrium\Domains\Themes\Data\Theme;
use RefactorCircus\Atrium\Domains\Themes\Features\ThemeSwitcherFeature;
use RefactorCircus\Atrium\Domains\Themes\Services\ThemeRegistry;
use RefactorCircus\Atrium\Facades\Atrium;

it('ships six themes, atrium first', function (): void {
    $themes = app(ThemeRegistry::class);

    expect(array_keys($themes->all()))->toBe(['atrium', 'harbor', 'sunset', 'forest', 'midnight', 'ledger'])
        ->and($themes->default()?->key)->toBe('atrium')
        ->and($themes->find('harbor')?->properties())->toMatchArray([
            '--color-primary' => '#0d9488',
            '--color-primary-dark' => '#2dd4bf',
            '--radius-radius' => '0.75rem',
        ]);
});

it('adds themes from config and from packages', function (): void {
    config()->set('atrium.themes.available', [
        'dusk' => ['label' => 'Dusk', 'swatch' => '#ea580c', 'layout' => 'top', 'colors' => ['primary' => '#ea580c']],
    ]);
    app()->forgetInstance(ThemeRegistry::class);

    Atrium::theme(Theme::make('grove')->label('Grove')->colors(['primary' => '#15803d']));

    $themes = app(ThemeRegistry::class)->all();

    expect(array_keys($themes))->toBe(['atrium', 'harbor', 'sunset', 'forest', 'midnight', 'ledger', 'dusk', 'grove'])
        ->and($themes['dusk']->label)->toBe('Dusk')
        ->and($themes['dusk']->swatchColor())->toBe('#ea580c')
        ->and($themes['dusk']->layout)->toBe('top')
        ->and($themes['grove']->layout)->toBe('sidebar')
        ->and($themes['grove']->properties())->toBe(['--color-primary' => '#15803d']);
});

it('falls back to the first theme when the default names none', function (): void {
    config()->set('atrium.themes.default', 'missing');

    expect(app(ThemeRegistry::class)->default()?->key)->toBe('atrium');
});

it('keeps values that could break out of the style block away from it', function (): void {
    $theme = Theme::make('evil')->colors(['primary' => 'red; } body { display: none', 'outline' => '#eee'])->radius('</style>')->swatch('url("x")');

    expect($theme->properties())->toBe(['--color-outline' => '#eee'])
        ->and($theme->swatchColor())->toBe('var(--color-primary)');
});

it('applies the long-standing theme overrides to the atrium theme', function (): void {
    config()->set('atrium.theme', ['primary' => '#ff0000']);
    app()->forgetInstance(ThemeRegistry::class);

    expect(app(ThemeRegistry::class)->find('atrium')?->properties())->toBe(['--color-primary' => '#ff0000']);
});

it('shows the switcher only while its feature is on', function (): void {
    config()->set('atrium.themes.switcher_feature', 'theme-switcher');
    app(Gatekeeper::class)->resolveFeaturesUsing(fn (string $feature): bool => $feature !== 'theme-switcher');

    expect(app(ThemeRegistry::class)->switchable(request()))->toBeFalse();
});

it('shows the switcher when its feature class is not installed', function (): void {
    config()->set('atrium.themes.switcher_feature', 'Missing\\ThemeSwitcherFeature');
    app(Gatekeeper::class)->resolveFeaturesUsing(fn (): bool => false);

    expect(app(ThemeRegistry::class)->switchable(request()))->toBeTrue();
});

it('shows the switcher behind its own feature, on while no feature resolver is registered', function (): void {
    expect(config('atrium.themes.switcher_feature'))->toBe(ThemeSwitcherFeature::class)
        ->and(app(ThemeRegistry::class)->switchable(request()))->toBeTrue();
});

it('resolves the switcher feature on globally, and to the global value for any other scope', function (): void {
    app()->register(PennantServiceProvider::class);
    config()->set('pennant.default', 'array');

    expect(Feature::for(null)->active(ThemeSwitcherFeature::class))->toBeTrue()
        ->and(Feature::for('ada')->active(ThemeSwitcherFeature::class))->toBeTrue();

    Feature::for(null)->deactivate(ThemeSwitcherFeature::class);

    expect(Feature::for('bob')->active(ThemeSwitcherFeature::class))->toBeFalse();
});

it('hides the switcher with a single theme', function (): void {
    $themes = new ThemeRegistry(config(), app(Gatekeeper::class));
    $themes->register(Theme::make('only'));

    expect($themes->switchable(request()))->toBeFalse();
});

it('lays ledger out with navigation across the top', function (): void {
    $themes = app(ThemeRegistry::class);

    expect($themes->find('ledger')?->layout)->toBe('top')
        ->and($themes->layouts())->toMatchArray(['atrium' => 'sidebar', 'harbor' => 'sidebar', 'ledger' => 'top']);
});

it('refuses a layout it does not know', function (): void {
    Theme::make('odd')->layout('diagonal');
})->throws(InvalidArgumentException::class);
