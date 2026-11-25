<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Models\User;

/*
 * The Keen integration (AC 39, 40, 45, 53, 57, 64): the audit log, one
 * entry, and each package's history, as layer pages under `/keen/`; the
 * audit-log nav item, and a History item whose children the layer's
 * `keen.history` live resolver lists from `keen.packages.index`. Atrium sends
 * only declarations: Keen has no widget, settings panel or search source.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * Keen installed, its API served under `keen/api`, registration re-run.
 */
function keenIntegrationRegistered(): ?RegisteredIntegration
{
    IntegrationFixture::installed('keen');
    IntegrationFixture::serveApi('keen');

    return IntegrationFixture::register()->get('keen');
}

/**
 * A registered Keen nav item, by label.
 */
function keenIntegrationNavItem(string $label): ?NavItem
{
    foreach (app(IntegrationRegistry::class)->get('keen')->navigation ?? [] as $item) {
        if ($item->label === $label) {
            return $item;
        }
    }

    return null;
}

it('registers while Keen is installed and enabled', function (): void {
    $integration = keenIntegrationRegistered();

    expect($integration)->not->toBeNull()
        ->and($integration?->label)->toBe('Keen')
        ->and($integration?->features)->toBe(['keen.atrium'])
        ->and(array_map(fn (NavItem $item): string => $item->label, $integration->navigation ?? []))->toBe(['Audit log', 'History'])
        ->and(array_keys($integration->screens ?? []))->toBe(['keen.entries', 'keen.entry', 'keen.history']);

    $labels = array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(request()));

    expect($labels)->toContain('Audit log', 'History');
});

it('registers nothing while Keen is not installed', function (): void {
    IntegrationFixture::installed();
    IntegrationFixture::serveApi('keen');

    expect(IntegrationFixture::register()->get('keen'))->toBeNull();

    $labels = array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(request()));

    expect($labels)->not->toContain('Audit log');
});

it('registers nothing while the integration is not enabled', function (mixed $enabled): void {
    config()->set('atrium.integrations.keen.enabled', $enabled);

    expect(keenIntegrationRegistered())->toBeNull();
})->with([
    'false' => [false],
    'the string "false"' => ['false'],
]);

it('calls the API under keen.routes.prefix', function (string $prefix): void {
    IntegrationFixture::installed('keen');
    config()->set('keen.routes', ['enabled' => true, 'prefix' => $prefix]);

    expect(IntegrationFixture::register()->get('keen')?->apiBase)->toBe('/api/keen');
})->with([
    'Keen\'s default' => ['api/keen'],
    'with slashes' => ['/api/keen/'],
]);

it('lets atrium.integrations.keen.api_base win over the prefix', function (): void {
    IntegrationFixture::installed('keen');
    config()->set('keen.routes', ['enabled' => true, 'prefix' => 'api/keen']);
    config()->set('atrium.integrations.keen.api_base', 'https://audit.example.com/api');

    expect(IntegrationFixture::register()->get('keen')?->apiBase)->toBe('https://audit.example.com/api');
});

it('does not register while Keen\'s API is off', function (): void {
    IntegrationFixture::installed('keen');
    config()->set('keen.routes', ['enabled' => false, 'prefix' => 'api/keen']);

    expect(IntegrationFixture::register()->get('keen'))->toBeNull();
});

it('declares the audit-log nav item', function (): void {
    keenIntegrationRegistered();

    $item = keenIntegrationNavItem('Audit log');

    expect($item)->not->toBeNull()
        ->and($item?->resolveUrl())->toBe('/keen/entries')
        ->and($item?->icon)->toBe('i-lucide-clipboard-list')
        ->and($item?->group)->toBe('Keen')
        ->and($item?->sort)->toBe(90)
        ->and($item?->resolveBadge())->toBeNull()
        ->and($item?->live)->toBeNull();
});

it('declares the History item with the keen.history live resolver and its nav settings', function (): void {
    keenIntegrationRegistered();

    $item = keenIntegrationNavItem('History');

    expect($item)->not->toBeNull()
        ->and($item?->icon)->toBe('i-lucide-history')
        ->and($item?->group)->toBe('Keen')
        ->and($item?->sort)->toBe(90)
        ->and($item?->resolveUrl())->toBeNull()
        ->and($item?->resolveBadge())->toBeNull()
        ->and($item?->children)->toBe([])
        ->and($item?->live)->toBe([
            'key' => 'keen.history',
            'options' => [
                'exclude' => [],
                'groups' => ['showroom' => 'showroom', 'pennantplus' => 'pennantplus'],
                'sort' => 90,
            ],
        ]);
});

it('hands the History resolver a changed config', function (): void {
    config()->set('atrium.integrations.keen.history.nav', [
        'enabled' => true,
        'sort' => 40,
        'exclude' => ['roster', 'atrium'],
        'groups' => ['polycart' => 'shop'],
    ]);

    keenIntegrationRegistered();

    $item = keenIntegrationNavItem('History');

    expect($item?->sort)->toBe(40)
        ->and($item?->live['options'] ?? null)->toBe([
            'exclude' => ['roster', 'atrium'],
            'groups' => ['polycart' => 'shop'],
            'sort' => 40,
        ]);
});

it('keeps only usable values of a malformed History config', function (): void {
    config()->set('atrium.integrations.keen.history.nav', [
        'sort' => 'soon',
        'exclude' => 'roster',
        'groups' => ['polycart' => 'shop', 'impex' => 5, 7 => 'numbers', 'roster' => ''],
    ]);

    keenIntegrationRegistered();

    expect(keenIntegrationNavItem('History')?->live['options'] ?? null)->toBe([
        'exclude' => ['roster'],
        'groups' => ['polycart' => 'shop'],
        'sort' => 90,
    ]);
});

it('does not declare the History item while history.nav.enabled is false', function (mixed $enabled): void {
    config()->set('atrium.integrations.keen.history.nav.enabled', $enabled);

    keenIntegrationRegistered();

    expect(keenIntegrationNavItem('History'))->toBeNull()
        ->and(keenIntegrationNavItem('Audit log'))->not->toBeNull();
})->with([
    'false' => [false],
    'the string "false"' => ['false'],
]);

it('sends the History settings in the shell, as the nav item\'s live options', function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);
    $user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);

    keenIntegrationRegistered();

    $shell = $this->actingAs($user)->getJson(route('atrium.shell'))->assertOk()->json('data');
    $items = array_merge([], ...array_column($shell['navigation'], 'items'));
    $history = collect($items)->firstWhere('label', 'History');

    expect(collect($shell['integrations'])->firstWhere('key', 'keen'))->toMatchArray(['key' => 'keen', 'active' => true, 'api_base' => '/keen/api'])
        ->and($history)->toMatchArray([
            'link' => null,
            'badge' => null,
            'live' => [
                'key' => 'keen.history',
                'options' => [
                    'exclude' => [],
                    'groups' => ['showroom' => 'showroom', 'pennantplus' => 'pennantplus'],
                    'sort' => 90,
                ],
            ],
            'children' => [],
        ])
        ->and(collect($items)->firstWhere('label', 'Audit log')['link'] ?? null)->toBe(['path' => '/keen/entries', 'external' => false]);
});

it('declares the three Keen screens', function (): void {
    $screens = array_map(
        fn (ScreenDeclaration $screen): array => [$screen->key, $screen->kind, $screen->path, $screen->subjectType],
        array_values(keenIntegrationRegistered()->screens ?? []),
    );

    expect($screens)->toBe([
        ['keen.entries', 'list', '/keen/entries', null],
        ['keen.entry', 'detail', '/keen/entries/:entry', null],
        ['keen.history', 'list', '/keen/history/:package', null],
    ]);
});

it('sends only static declarations: no widget, settings panel or search source', function (): void {
    $integration = keenIntegrationRegistered();

    expect($integration?->widgets)->toBe([])
        ->and($integration?->settings)->toBeNull()
        ->and($integration?->searchSources)->toBe([]);
});

it('writes its declarations to the layer fixture', function (): void {
    keenIntegrationRegistered();

    IntegrationFixture::assertMatchesFixture('keen');
});
