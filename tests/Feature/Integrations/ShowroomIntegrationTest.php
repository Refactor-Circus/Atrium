<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\Integration;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Integrations\Showroom\ShowroomFeature;
use RefactorCircus\Atrium\Integrations\Showroom\ShowroomIntegration;
use RefactorCircus\Atrium\Support\ClientPath;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Models\User;

/*
 * The Showroom integration (AC 39, 40, 45, 53, 60, 61, 62, 71), ported from
 * Showroom's v1 `ShowroomPlugin`: the eleven Catalog nav items, the four
 * widgets and the `showroom` settings panel declared with no resolver, the
 * `showroom` search source and the 27 screens. Everything is data; the layer
 * calls Showroom's API for what it shows.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * Showroom installed, with its API on as its own config ships it (`showroom`).
 */
function registerShowroom(): ?RegisteredIntegration
{
    IntegrationFixture::installed('showroom');
    config()->set('showroom.routes', ['enabled' => true, 'prefix' => 'showroom']);

    return IntegrationFixture::register()->get('showroom');
}

function showroomIntegration(): RegisteredIntegration
{
    $integration = registerShowroom();

    expect($integration)->not->toBeNull();

    return $integration;
}

it('is found by convention under the showroom key', function (): void {
    expect(IntegrationRegistry::classFor('showroom'))->toBe(ShowroomIntegration::class)
        ->and(new ShowroomIntegration)->toBeInstanceOf(Integration::class);
});

it('registers while Showroom is installed, enabled and serves its API', function (): void {
    $integration = showroomIntegration();

    expect(array_keys(app(IntegrationRegistry::class)->all()))->toBe(['showroom'])
        ->and($integration->label)->toBe('Showroom')
        ->and($integration->features)->toBe([ShowroomFeature::class]);
});

it('registers nothing while Showroom is not installed', function (): void {
    IntegrationFixture::installed();
    config()->set('showroom.routes', ['enabled' => true, 'prefix' => 'showroom']);

    IntegrationFixture::register();

    expect(app(IntegrationRegistry::class)->all())->toBe([])
        ->and(array_keys(app(WidgetRegistry::class)->all()))->not->toContain('showroom.product-status')
        ->and(array_map(fn (SettingsPanel $panel): string => $panel->key, app(SettingsRegistry::class)->panels(Request::create('/'))))->not->toContain('showroom')
        ->and(array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(Request::create('/'))))->not->toContain('Products');
});

it('registers nothing while it is not enabled', function (mixed $enabled): void {
    config()->set('atrium.integrations.showroom.enabled', $enabled);

    expect(registerShowroom())->toBeNull()
        ->and(app(IntegrationRegistry::class)->all())->toBe([])
        ->and(array_keys(app(WidgetRegistry::class)->all()))->not->toContain('showroom.product-status');
})->with([
    'false' => [false],
    'the string "false"' => ['false'],
]);

it('reads its API base from showroom.routes.prefix', function (string $prefix, string $base): void {
    IntegrationFixture::installed('showroom');
    config()->set('showroom.routes', ['enabled' => true, 'prefix' => $prefix]);

    expect(IntegrationFixture::register()->get('showroom')?->apiBase)->toBe($base);
})->with([
    'the shipped prefix' => ['showroom', '/showroom'],
    'a nested prefix with slashes' => ['/api/catalog/', '/api/catalog'],
]);

it('lets atrium.integrations.showroom.api_base win', function (): void {
    config()->set('atrium.integrations.showroom.api_base', 'https://pim.example.com/showroom');

    expect(showroomIntegration()->apiBase)->toBe('https://pim.example.com/showroom');
});

it('does not register while Showroom\'s routes are off, and warns once', function (): void {
    Log::spy();

    IntegrationFixture::installed('showroom');
    config()->set('showroom.routes', ['enabled' => false, 'prefix' => 'showroom']);

    expect(IntegrationFixture::register()->all())->toBe([]);

    app()->forgetInstance(IntegrationRegistry::class);

    expect(IntegrationFixture::register()->all())->toBe([]);

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $message): bool => str_contains($message, 'showroom.routes.enabled') && str_contains($message, 'atrium.integrations.showroom.api_base'))
        ->once();
});

it('does not register without any Showroom config', function (): void {
    IntegrationFixture::installed('showroom');
    config()->set('showroom', null);

    expect(IntegrationFixture::register()->all())->toBe([]);
});

it('declares the eleven v1 nav items in the Catalog group, with no badge', function (): void {
    $items = showroomIntegration()->navigation;

    expect(array_map(fn (NavItem $item): array => [
        'label' => $item->label,
        'link' => ClientPath::for($item->resolveUrl()),
        'icon' => $item->icon,
        'group' => $item->group,
        'sort' => $item->sort,
        'badge' => $item->resolveBadge(),
        'live' => $item->live,
    ], $items))->toBe([
        ['label' => 'Products', 'link' => ['path' => '/showroom/products', 'external' => false], 'icon' => 'i-lucide-box', 'group' => 'Catalog', 'sort' => 1, 'badge' => null, 'live' => null],
        ['label' => 'Product models', 'link' => ['path' => '/showroom/product-models', 'external' => false], 'icon' => 'i-lucide-layers', 'group' => 'Catalog', 'sort' => 2, 'badge' => null, 'live' => null],
        ['label' => 'Categories', 'link' => ['path' => '/showroom/categories', 'external' => false], 'icon' => 'i-lucide-folder', 'group' => 'Catalog', 'sort' => 3, 'badge' => null, 'live' => null],
        ['label' => 'Assets', 'link' => ['path' => '/showroom/assets', 'external' => false], 'icon' => 'i-lucide-image', 'group' => 'Catalog', 'sort' => 4, 'badge' => null, 'live' => null],
        ['label' => 'Owners', 'link' => ['path' => '/showroom/owners', 'external' => false], 'icon' => 'i-lucide-store', 'group' => 'Catalog', 'sort' => 3, 'badge' => null, 'live' => null],
        ['label' => 'Families', 'link' => ['path' => '/showroom/families', 'external' => false], 'icon' => 'i-lucide-layout-grid', 'group' => 'Catalog', 'sort' => 5, 'badge' => null, 'live' => null],
        ['label' => 'Attributes', 'link' => ['path' => '/showroom/attributes', 'external' => false], 'icon' => 'i-lucide-tag', 'group' => 'Catalog', 'sort' => 10, 'badge' => null, 'live' => null],
        ['label' => 'Channels', 'link' => ['path' => '/showroom/channels', 'external' => false], 'icon' => 'i-lucide-globe', 'group' => 'Catalog', 'sort' => 30, 'badge' => null, 'live' => null],
        ['label' => 'Import & export', 'link' => ['path' => '/showroom/transfers', 'external' => false], 'icon' => 'i-lucide-arrow-up-down', 'group' => 'Catalog', 'sort' => 40, 'badge' => null, 'live' => null],
        ['label' => 'Association types', 'link' => ['path' => '/showroom/association-types', 'external' => false], 'icon' => 'i-lucide-link', 'group' => 'Catalog', 'sort' => 35, 'badge' => null, 'live' => null],
        ['label' => 'Attribute groups', 'link' => ['path' => '/showroom/attribute-groups', 'external' => false], 'icon' => 'i-lucide-grid-2x2', 'group' => 'Catalog', 'sort' => 20, 'badge' => null, 'live' => null],
    ]);

    $registered = array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(Request::create('/')));

    expect($registered)->toContain('Products', 'Product models', 'Categories', 'Assets', 'Owners', 'Families', 'Attributes', 'Channels', 'Import & export', 'Association types', 'Attribute groups');
});

it('declares the four v1 widgets by their v1 keys, with no resolver and data {}', function (): void {
    $widgets = showroomIntegration()->widgets;

    expect(array_map(fn (WidgetDefinition $widget): array => [
        'key' => $widget->key,
        'component' => $widget->component,
        'label' => $widget->label,
        'description' => $widget->description,
        'lazy' => $widget->lazy,
        'data' => $widget->resolveData(),
    ], $widgets))->toBe([
        ['key' => 'showroom.product-status', 'component' => 'showroom.product-status', 'label' => 'Products by status', 'description' => 'How many products sit in each review state, and how many are live.', 'lazy' => false, 'data' => []],
        ['key' => 'showroom.completeness', 'component' => 'showroom.completeness', 'label' => 'Completeness', 'description' => 'Average completeness and fully complete products per channel and locale.', 'lazy' => false, 'data' => []],
        ['key' => 'showroom.review-queue', 'component' => 'showroom.review-queue', 'label' => 'Review queue', 'description' => 'Products waiting for review, oldest first.', 'lazy' => false, 'data' => []],
        ['key' => 'showroom.recent-changes', 'component' => 'showroom.recent-changes', 'label' => 'Recent changes', 'description' => 'The latest product edits, transitions and reverts.', 'lazy' => false, 'data' => []],
    ]);

    expect(array_keys(app(WidgetRegistry::class)->all()))->toContain('showroom.product-status', 'showroom.completeness', 'showroom.review-queue', 'showroom.recent-changes');
});

it('declares the showroom settings panel with data {}', function (): void {
    $panel = showroomIntegration()->settings;

    expect($panel?->key)->toBe('showroom')
        ->and($panel?->component)->toBe('showroom')
        ->and($panel?->label)->toBe('Showroom')
        ->and($panel?->description)->toBe('How the catalog is exposed over HTTP and MCP.')
        ->and($panel?->icon)->toBe('i-lucide-box')
        ->and($panel?->resolveData())->toBe([]);

    expect(array_map(fn (SettingsPanel $panel): string => $panel->key, app(SettingsRegistry::class)->panels(Request::create('/'))))->toContain('showroom');
});

it('declares the showroom search source', function (): void {
    $sources = showroomIntegration()->searchSources;

    expect($sources)->toHaveCount(1)
        ->and($sources[0]->key)->toBe('showroom')
        ->and($sources[0]->label)->toBe('Showroom')
        ->and($sources[0]->icon)->toBe('i-lucide-box');
});

it('declares the 27 v1 screens with their layer paths, and the morph alias of each record that has one', function (): void {
    $screens = showroomIntegration()->screens;

    expect(array_values(array_map(fn (ScreenDeclaration $screen): array => [$screen->key, $screen->kind, $screen->path, $screen->subjectType], $screens)))->toBe([
        ['showroom.products', Screen::LIST, '/showroom/products', null],
        ['showroom.product-create', Screen::DETAIL, '/showroom/products/create', null],
        ['showroom.product', Screen::DETAIL, '/showroom/products/:product', 'showroom_product'],
        ['showroom.product-models', Screen::LIST, '/showroom/product-models', null],
        ['showroom.product-model', Screen::DETAIL, '/showroom/product-models/:productModel', 'showroom_product_model'],
        ['showroom.families', Screen::LIST, '/showroom/families', null],
        ['showroom.family', Screen::DETAIL, '/showroom/families/:family', null],
        ['showroom.family-variant', Screen::DETAIL, '/showroom/family-variants/:familyVariant', null],
        ['showroom.attributes', Screen::LIST, '/showroom/attributes', null],
        ['showroom.attribute-create', Screen::DETAIL, '/showroom/attributes/create', null],
        ['showroom.attribute', Screen::DETAIL, '/showroom/attributes/:attribute', null],
        ['showroom.attribute-groups', Screen::LIST, '/showroom/attribute-groups', null],
        ['showroom.attribute-group', Screen::DETAIL, '/showroom/attribute-groups/:group', null],
        ['showroom.association-types', Screen::LIST, '/showroom/association-types', null],
        ['showroom.categories', Screen::LIST, '/showroom/categories', null],
        ['showroom.category', Screen::DETAIL, '/showroom/categories/:category', null],
        ['showroom.channels', Screen::LIST, '/showroom/channels', null],
        ['showroom.channel', Screen::DETAIL, '/showroom/channels/:channel', null],
        ['showroom.owners', Screen::LIST, '/showroom/owners', null],
        ['showroom.owner', Screen::DETAIL, '/showroom/owners/:owner', 'showroom_owner'],
        ['showroom.owner-types', Screen::LIST, '/showroom/owner-types', null],
        ['showroom.owner-type', Screen::DETAIL, '/showroom/owner-types/:ownerType', null],
        ['showroom.flags', Screen::LIST, '/showroom/flags', null],
        ['showroom.flag', Screen::DETAIL, '/showroom/flags/:flag', null],
        ['showroom.assets', Screen::LIST, '/showroom/assets', null],
        ['showroom.asset', Screen::DETAIL, '/showroom/assets/:asset', null],
        ['showroom.transfers', Screen::LIST, '/showroom/transfers', null],
    ]);
});

it('declares showroom.transfers with the flow prefix from atrium.integrations.showroom.transfers.flow_prefix, and no options elsewhere', function (mixed $configured, string $prefix): void {
    config()->set('atrium.integrations.showroom.transfers.flow_prefix', $configured);

    $options = array_map(fn (ScreenDeclaration $screen): array => $screen->options, showroomIntegration()->screens);

    expect($options['showroom.transfers'])->toBe(['flow_prefix' => $prefix])
        ->and(array_filter($options, fn (array $screen, string $key): bool => $key !== 'showroom.transfers' && $screen !== [], ARRAY_FILTER_USE_BOTH))->toBe([]);
})->with([
    'the shipped default' => ['showroom:', 'showroom:'],
    'a changed prefix' => ['catalog-feed:', 'catalog-feed:'],
    'an absent key falls back to the default' => [null, 'showroom:'],
    'a non-string falls back to the default' => [['showroom:'], 'showroom:'],
]);

it('sends the flow prefix with showroom.transfers from atrium.screens.show', function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);
    config()->set('atrium.integrations.showroom.transfers.flow_prefix', 'pim:');
    showroomIntegration();

    $user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);

    $this->actingAs($user)->getJson(route('atrium.screens.show', ['screen' => 'showroom.transfers']))
        ->assertOk()
        ->assertJsonPath('data.key', 'showroom.transfers')
        ->assertJsonPath('data.path', '/showroom/transfers')
        ->assertJsonPath('data.options', ['flow_prefix' => 'pim:']);

    $products = $this->actingAs($user)->getJson(route('atrium.screens.show', ['screen' => 'showroom.products']))->assertOk();

    expect($products->json('data.options'))->toBe([])
        ->and((string) $products->getContent())->toContain('"options":{}');
});

it('serves each declared screen from atrium.screens.show', function (): void {
    showroomIntegration();

    expect(app(IntegrationRegistry::class)->forScreen('showroom.product')?->key)->toBe('showroom')
        ->and(app(IntegrationRegistry::class)->forScreen('showroom.transfers')?->key)->toBe('showroom')
        ->and(app(IntegrationRegistry::class)->forScreen('showroom.history'))->toBeNull();
});

it('uses only label keys its lang file has', function (): void {
    $source = (string) file_get_contents(__DIR__.'/../../../src/Integrations/Showroom/ShowroomIntegration.php');

    preg_match_all("/'(atrium::integrations\\/showroom\\.[a-z0-9_.-]+)'/", $source, $matches);

    $keys = array_values(array_unique($matches[1]));
    $missing = array_values(array_filter($keys, fn (string $key): bool => ! Lang::has($key, 'en', false)));

    expect($keys)->not->toBeEmpty()
        ->and($missing)->toBe([]);
});

it('names no Showroom class, even as a string', function (): void {
    $source = (string) file_get_contents(__DIR__.'/../../../src/Integrations/Showroom/ShowroomIntegration.php');

    expect($source)->not->toContain('RefactorCircus\\Showroom')
        ->and($source)->not->toContain('RefactorCircus\\\\Showroom');
});

it('writes its declarations to the layer fixture', function (): void {
    showroomIntegration();

    IntegrationFixture::assertMatchesFixture('showroom');
});
