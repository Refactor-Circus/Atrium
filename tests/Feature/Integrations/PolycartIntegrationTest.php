<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Data\WidgetDefinition;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;

/*
 * The Polycart integration (AC 39, 40, 45, 53, 59, 60, 62): Atrium declares
 * Polycart's two v1 nav items, its two widgets, its search source and its
 * three screens as data only, once the package is installed, enabled and
 * serving its API. Polycart ships its API off (`polycart.routes.enabled`
 * false), so until the host turns it on the integration does not register
 * and Atrium warns once. The layer's Vue pages call Polycart's API.
 */

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

/**
 * Polycart's shipped `routes` config: its API off, under `polycart`.
 *
 * @return array{enabled: bool, prefix: string, middleware: list<string>}
 */
function polycartShippedRoutes(): array
{
    return ['enabled' => false, 'prefix' => 'polycart', 'middleware' => ['api']];
}

/**
 * Polycart installed, with its API turned on under its shipped prefix, then
 * registered.
 */
function registerPolycart(): IntegrationRegistry
{
    IntegrationFixture::installed('polycart');
    config()->set('polycart.routes', [...polycartShippedRoutes(), 'enabled' => true]);

    return IntegrationFixture::register();
}

/**
 * The warning that names both keys a host sets to reach Polycart's API.
 */
function polycartApiWarning(): Closure
{
    return fn (string $message): bool => str_contains($message, 'polycart.routes.enabled')
        && str_contains($message, 'atrium.integrations.polycart.api_base');
}

describe('gating', function (): void {
    it('does not register while polycart.routes.enabled is false, its shipped default, and warns once', function (): void {
        Log::spy();

        IntegrationFixture::installed('polycart');
        config()->set('polycart.routes', polycartShippedRoutes());

        $navigation = app(NavigationRegistry::class)->items(Request::create('/'));
        $widgets = array_keys(app(WidgetRegistry::class)->all());

        expect(IntegrationFixture::register()->all())->toBe([]);

        // A second boot, with a fresh registry, as a new application would have.
        app()->forgetInstance(IntegrationRegistry::class);

        expect(IntegrationFixture::register()->all())->toBe([])
            ->and(app(NavigationRegistry::class)->items(Request::create('/')))->toBe($navigation)
            ->and(array_keys(app(WidgetRegistry::class)->all()))->toBe($widgets);

        Log::shouldHaveReceived('warning')->withArgs(polycartApiWarning())->once();
    });

    it('registers once polycart.routes.enabled is true', function (): void {
        Log::spy();

        $integration = registerPolycart()->get('polycart');

        expect($integration)->not->toBeNull()
            ->and($integration?->label)->toBe('Polycart')
            ->and($integration?->apiBase)->toBe('/polycart')
            ->and($integration?->features)->toBe(['polycart.atrium']);

        Log::shouldNotHaveReceived('warning');
    });

    it('registers nothing while Polycart is not installed', function (): void {
        $navigation = app(NavigationRegistry::class)->items(Request::create('/'));

        IntegrationFixture::installed();
        config()->set('polycart.routes', [...polycartShippedRoutes(), 'enabled' => true]);

        expect(IntegrationFixture::register()->all())->toBe([])
            ->and(app(NavigationRegistry::class)->items(Request::create('/')))->toBe($navigation);
    });

    it('registers nothing while the integration is disabled', function (mixed $enabled): void {
        config()->set('atrium.integrations.polycart.enabled', $enabled);

        expect(registerPolycart()->all())->toBe([]);
    })->with([
        'false' => [false],
        'the string "false"' => ['false'],
    ]);
});

describe('the API base', function (): void {
    it('is Polycart\'s own route prefix, trimmed', function (string $prefix, string $base): void {
        IntegrationFixture::installed('polycart');
        config()->set('polycart.routes', ['enabled' => true, 'prefix' => $prefix]);

        expect(IntegrationFixture::register()->get('polycart')?->apiBase)->toBe($base);
    })->with([
        'the shipped prefix' => ['polycart', '/polycart'],
        'with slashes' => ['/api/carts/', '/api/carts'],
    ]);

    it('is atrium.integrations.polycart.api_base when set, even with Polycart\'s routes off', function (): void {
        IntegrationFixture::installed('polycart');
        config()->set('polycart.routes', polycartShippedRoutes());
        config()->set('atrium.integrations.polycart.api_base', 'https://carts.example.com/api');

        expect(IntegrationFixture::register()->get('polycart')?->apiBase)->toBe('https://carts.example.com/api');
    });

    it('is missing with no Polycart config at all', function (): void {
        Log::spy();

        IntegrationFixture::installed('polycart');

        expect(config('polycart'))->toBeNull()
            ->and(IntegrationFixture::register()->all())->toBe([]);

        Log::shouldHaveReceived('warning')->withArgs(polycartApiWarning())->once();
    });
});

describe('declarations', function (): void {
    it('declares the two v1 nav items, with their labels, Iconify icons and layer paths', function (): void {
        $navigation = registerPolycart()->get('polycart')?->navigation ?? [];

        expect(array_map(fn (NavItem $item): array => [
            'label' => $item->label,
            'icon' => $item->icon,
            'url' => $item->resolveUrl(),
            'group' => $item->group,
            'sort' => $item->sort,
            'badge' => $item->resolveBadge(),
            'live' => $item->live,
            'children' => $item->children,
        ], $navigation))->toBe([
            ['label' => 'Carts', 'icon' => 'i-lucide-shopping-cart', 'url' => '/polycart/carts', 'group' => 'Polycart', 'sort' => 30, 'badge' => null, 'live' => null, 'children' => []],
            ['label' => 'Cart types', 'icon' => 'i-lucide-layers', 'url' => '/polycart/types', 'group' => 'Polycart', 'sort' => 31, 'badge' => null, 'live' => null, 'children' => []],
        ]);
    });

    it('shows its nav items, widgets and no settings panel once registered', function (): void {
        $panels = app(SettingsRegistry::class)->panels(Request::create('/'));

        registerPolycart();

        $labels = array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items(Request::create('/')));

        expect($labels)->toContain('Carts', 'Cart types')
            ->and(array_keys(app(WidgetRegistry::class)->all()))->toContain('polycart.carts-by-type', 'polycart.recent-carts')
            ->and(app(SettingsRegistry::class)->panels(Request::create('/')))->toBe($panels);
    });

    it('declares the two v1 widgets by their v1 keys, without a resolver, so each sends data: {}', function (): void {
        $widgets = registerPolycart()->get('polycart')?->widgets ?? [];

        expect(array_map(fn (WidgetDefinition $widget): array => [
            'key' => $widget->key,
            'component' => $widget->component,
            'label' => $widget->label,
            'icon' => $widget->icon,
            'lazy' => $widget->lazy,
            'size' => [$widget->defaultWidth, $widget->defaultHeight],
            'data' => $widget->resolveData(),
        ], $widgets))->toBe([
            ['key' => 'polycart.carts-by-type', 'component' => 'polycart.carts-by-type', 'label' => 'Carts by type', 'icon' => 'i-lucide-chart-column', 'lazy' => false, 'size' => [6, 2], 'data' => []],
            ['key' => 'polycart.recent-carts', 'component' => 'polycart.recent-carts', 'label' => 'Recent carts', 'icon' => 'i-lucide-clock', 'lazy' => false, 'size' => [6, 2], 'data' => []],
        ]);

        expect(IntegrationFixture::declarations('polycart')['widgets'][0]['data'])->toEqual((object) []);
    });

    it('declares the v1 search source polycart, run in the layer, and nothing in Atrium\'s own search', function (): void {
        $before = app(SearchRegistry::class)->sources(Request::create('/'));

        $integration = registerPolycart()->get('polycart');

        expect(array_map(fn (SearchSourceDeclaration $source): array => [$source->key, $source->label, $source->icon], $integration->searchSources ?? []))
            ->toBe([['polycart', 'Carts', 'i-lucide-shopping-cart']])
            ->and(app(SearchRegistry::class)->sources(Request::create('/')))->toBe($before);
    });

    it('declares no settings panel', function (): void {
        expect(registerPolycart()->get('polycart')?->settings)->toBeNull();
    });

    it('declares the three screens of AC 59, with their kinds and layer paths', function (): void {
        $screens = registerPolycart()->get('polycart')?->screens ?? [];

        expect(array_values(array_map(fn (ScreenDeclaration $screen): array => [
            $screen->key, $screen->kind, $screen->path, $screen->subjectType,
        ], $screens)))->toBe([
            ['polycart.carts', 'list', '/polycart/carts', null],
            ['polycart.cart', 'detail', '/polycart/carts/:cart', null],
            ['polycart.types', 'list', '/polycart/types', null],
        ]);
    });

    it('writes its declarations to the layer fixture', function (): void {
        registerPolycart();

        IntegrationFixture::assertMatchesFixture('polycart');
    });
});
