<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\Integration;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Integrations\Impex\ImpexFeature;
use RefactorCircus\Atrium\Integrations\Impex\ImpexIntegration;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;

/*
 * The Impex integration (AC 39, 40, 45, 53, 56, 60, 61, 62, 63), ported from
 * Impex's v1 `ImpexPlugin`: five nav items (Runs carrying the
 * `impex.active-runs` live key), three widgets and the `impex` settings panel
 * declared with no resolver, the `impex` search source and the ten screens.
 * Everything is data; the layer calls Impex's API for what it shows.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * Impex installed, with its API on as its own config ships it (`impex`).
 */
function registerImpex(): ?RegisteredIntegration
{
    IntegrationFixture::installed('impex');
    config()->set('impex.routes', ['enabled' => true, 'prefix' => 'impex']);

    return IntegrationFixture::register()->get('impex');
}

function impexIntegration(): RegisteredIntegration
{
    $integration = registerImpex();

    expect($integration)->not->toBeNull();

    return $integration;
}

it('is found by convention under the impex key', function (): void {
    expect(IntegrationRegistry::classFor('impex'))->toBe(ImpexIntegration::class)
        ->and(new ImpexIntegration)->toBeInstanceOf(Integration::class);
});

it('registers while Impex is installed, enabled and serves its API', function (): void {
    $integration = impexIntegration();

    expect(array_keys(app(IntegrationRegistry::class)->all()))->toBe(['impex'])
        ->and($integration->label)->toBe('Impex')
        ->and($integration->features)->toBe([ImpexFeature::class]);
});

it('registers nothing while Impex is not installed', function (): void {
    IntegrationFixture::installed();
    config()->set('impex.routes', ['enabled' => true, 'prefix' => 'impex']);

    IntegrationFixture::register();

    expect(app(IntegrationRegistry::class)->all())->toBe([])
        ->and(array_keys(app(WidgetRegistry::class)->all()))->not->toContain('impex.run-status')
        ->and(array_map(fn ($panel): string => $panel->key, app(SettingsRegistry::class)->panels(Request::create('/'))))->not->toContain('impex');
});

it('registers nothing while it is not enabled', function (mixed $enabled): void {
    config()->set('atrium.integrations.impex.enabled', $enabled);

    expect(registerImpex())->toBeNull()
        ->and(app(IntegrationRegistry::class)->all())->toBe([])
        ->and(array_keys(app(WidgetRegistry::class)->all()))->not->toContain('impex.run-status');
})->with([
    'false' => [false],
    'the string "false"' => ['false'],
]);

it('reads its API base from impex.routes.prefix', function (string $prefix, string $base): void {
    IntegrationFixture::installed('impex');
    config()->set('impex.routes', ['enabled' => true, 'prefix' => $prefix]);

    expect(IntegrationFixture::register()->get('impex')?->apiBase)->toBe($base);
})->with([
    'the shipped prefix' => ['impex', '/impex'],
    'a nested prefix with slashes' => ['/api/impex/', '/api/impex'],
]);

it('lets atrium.integrations.impex.api_base win', function (): void {
    config()->set('atrium.integrations.impex.api_base', 'https://ops.example.com/impex');

    expect(impexIntegration()->apiBase)->toBe('https://ops.example.com/impex');
});

it('does not register while Impex\'s routes are off, and warns once', function (): void {
    Log::spy();

    IntegrationFixture::installed('impex');
    config()->set('impex.routes', ['enabled' => false, 'prefix' => 'impex']);

    expect(IntegrationFixture::register()->all())->toBe([]);

    app()->forgetInstance(IntegrationRegistry::class);

    expect(IntegrationFixture::register()->all())->toBe([]);

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $message): bool => str_contains($message, 'impex.routes.enabled') && str_contains($message, 'atrium.integrations.impex.api_base'))
        ->once();
});

it('declares the five v1 nav items, Runs carrying the impex.active-runs live key', function (): void {
    $items = impexIntegration()->navigation;

    expect(array_map(fn (NavItem $item): array => [
        'label' => $item->label,
        'link' => $item->link(),
        'icon' => $item->icon,
        'group' => $item->group,
        'sort' => $item->sort,
        'badge' => $item->resolveBadge(),
        'live' => $item->live,
    ], $items))->toBe([
        ['label' => 'Runs', 'link' => ['path' => '/impex/runs', 'external' => false], 'icon' => 'i-lucide-circle-play', 'group' => 'Impex', 'sort' => 10, 'badge' => null, 'live' => ['key' => 'impex.active-runs', 'options' => []]],
        ['label' => 'Messages', 'link' => ['path' => '/impex/messages', 'external' => false], 'icon' => 'i-lucide-inbox', 'group' => 'Impex', 'sort' => 20, 'badge' => null, 'live' => null],
        ['label' => 'Flows', 'link' => ['path' => '/impex/flows', 'external' => false], 'icon' => 'i-lucide-list-ordered', 'group' => 'Impex', 'sort' => 30, 'badge' => null, 'live' => null],
        ['label' => 'Channels', 'link' => ['path' => '/impex/channels', 'external' => false], 'icon' => 'i-lucide-radio-tower', 'group' => 'Impex', 'sort' => 40, 'badge' => null, 'live' => null],
        ['label' => 'Subscriptions', 'link' => ['path' => '/impex/subscriptions', 'external' => false], 'icon' => 'i-lucide-rss', 'group' => 'Impex', 'sort' => 50, 'badge' => null, 'live' => null],
    ]);

    $registered = array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(Request::create('/')));

    expect($registered)->toContain('Runs', 'Messages', 'Flows', 'Channels', 'Subscriptions');
});

it('declares the three v1 widgets by their v1 keys, with no resolver and data {}', function (): void {
    $widgets = impexIntegration()->widgets;

    expect(array_map(fn (WidgetDefinition $widget): array => [
        'key' => $widget->key,
        'component' => $widget->component,
        'label' => $widget->label,
        'lazy' => $widget->lazy,
        'data' => $widget->resolveData(),
    ], $widgets))->toBe([
        ['key' => 'impex.run-status', 'component' => 'impex.run-status', 'label' => 'Run status', 'lazy' => false, 'data' => []],
        ['key' => 'impex.recent-failures', 'component' => 'impex.recent-failures', 'label' => 'Recent failures', 'lazy' => false, 'data' => []],
        ['key' => 'impex.message-volume', 'component' => 'impex.message-volume', 'label' => 'Message volume', 'lazy' => false, 'data' => []],
    ]);

    expect(array_keys(app(WidgetRegistry::class)->all()))->toContain('impex.run-status', 'impex.recent-failures', 'impex.message-volume');
});

it('declares the impex settings panel with data {}', function (): void {
    $panel = impexIntegration()->settings;

    expect($panel?->key)->toBe('impex')
        ->and($panel?->component)->toBe('impex')
        ->and($panel?->label)->toBe('Impex')
        ->and($panel?->description)->toBe('Retention, limits and artifact storage for the workflow engine.')
        ->and($panel?->resolveData())->toBe([]);

    expect(array_map(fn ($panel): string => $panel->key, app(SettingsRegistry::class)->panels(Request::create('/'))))->toContain('impex');
});

it('declares the impex search source', function (): void {
    $sources = impexIntegration()->searchSources;

    expect($sources)->toHaveCount(1)
        ->and($sources[0]->key)->toBe('impex')
        ->and($sources[0]->label)->toBe('Impex runs')
        ->and($sources[0]->icon)->toBe('i-lucide-circle-play');
});

it('declares the ten v1 screens with their layer paths', function (): void {
    $screens = impexIntegration()->screens;

    expect(array_values(array_map(fn (ScreenDeclaration $screen): array => [$screen->key, $screen->kind, $screen->path, $screen->subjectType], $screens)))->toBe([
        ['impex.runs', Screen::LIST, '/impex/runs', null],
        ['impex.run', Screen::DETAIL, '/impex/runs/:run', null],
        ['impex.flows', Screen::LIST, '/impex/flows', null],
        ['impex.messages', Screen::LIST, '/impex/messages', null],
        ['impex.message', Screen::DETAIL, '/impex/messages/:message', null],
        ['impex.channels', Screen::LIST, '/impex/channels', null],
        ['impex.channel-create', Screen::DETAIL, '/impex/channels/create', null],
        ['impex.channel', Screen::DETAIL, '/impex/channels/:name', null],
        ['impex.subscriptions', Screen::LIST, '/impex/subscriptions', null],
        ['impex.subscription', Screen::DETAIL, '/impex/subscriptions/:subscription', null],
    ]);
});

it('serves each declared screen from atrium.screens.show', function (): void {
    impexIntegration();

    expect(app(IntegrationRegistry::class)->forScreen('impex.run')?->key)->toBe('impex')
        ->and(app(IntegrationRegistry::class)->forScreen('impex.channel-create')?->key)->toBe('impex')
        ->and(app(IntegrationRegistry::class)->forScreen('impex.history'))->toBeNull();
});

it('uses only label keys its lang file has', function (): void {
    $source = (string) file_get_contents(__DIR__.'/../../../src/Integrations/Impex/ImpexIntegration.php');

    preg_match_all("/'(atrium::integrations\\/impex\\.[a-z0-9_.-]+)'/", $source, $matches);

    $keys = array_values(array_unique($matches[1]));
    $missing = array_values(array_filter($keys, fn (string $key): bool => ! Lang::has($key, 'en', false)));

    expect($keys)->not->toBeEmpty()
        ->and($missing)->toBe([]);
});

it('writes its declarations to the layer fixture', function (): void {
    impexIntegration();

    IntegrationFixture::assertMatchesFixture('impex');
});
