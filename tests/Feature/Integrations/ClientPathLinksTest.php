<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\Integration;
use RefactorCircus\Atrium\Domains\Integrations\Exceptions\InvalidIntegrationException;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration as BaseIntegration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Integrations\Guardian\GuardianScopeTypes;
use RefactorCircus\Atrium\Integrations\Hooks\GuardianScreens;
use RefactorCircus\Atrium\Integrations\Hooks\Hooks;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Models\User;

/*
 * Integration links under a client path (D-075). Every suite integration
 * declares its nav as pages of the SPA with `NavItem::path()`, so the shell
 * sends them as `{path, external: false}` whatever `atrium.client_path` the
 * host serves the SPA from: with `/admin`, Showroom's products page is
 * `/showroom/products` inside the SPA, never the host's `/showroom/products`
 * (Showroom's JSON API) as an external link.
 */

const CLIENT_PATH_PACKAGES = ['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom'];

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
    GuardianScreens::forgetWarnings();
    GuardianScopeTypes::forget();
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    config()->set('app.url', 'https://app.test');
    config()->set('atrium.client_path', '/admin');

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
    GuardianScreens::forgetWarnings();
    GuardianScopeTypes::forget();
});

/**
 * Every suite package installed and served, its integration and the hooks
 * registered, as boot does.
 */
function clientPathEverything(): IntegrationRegistry
{
    IntegrationFixture::installed(...CLIENT_PATH_PACKAGES);
    IntegrationFixture::serveApi(...CLIENT_PATH_PACKAGES);
    $registry = IntegrationFixture::register();
    app(Hooks::class)->register();

    return $registry;
}

/**
 * Every link in the shell's navigation, sections and items with their
 * children, as `label => link`.
 *
 * @param  list<array<string, mixed>>  $items
 * @return list<array{0: string, 1: mixed}>
 */
function clientPathLinks(array $items): array
{
    $links = [];

    foreach ($items as $item) {
        $links[] = [$item['label'], $item['link']];
        $links = [...$links, ...clientPathLinks($item['children'] ?? $item['items'] ?? [])];
    }

    return $links;
}

it('registers every suite integration', function (): void {
    expect(array_keys(clientPathEverything()->all()))->toBe(CLIENT_PATH_PACKAGES);
});

it('declares every integration nav item as an SPA path under its package', function (string $package): void {
    $integration = clientPathEverything()->get($package);

    expect($integration)->not->toBeNull()
        ->and($integration->navigation)->not->toBe([]);

    foreach ($integration->navigation as $item) {
        expect($item->url)->toBeNull()
            ->and($item->route)->toBeNull();

        // Keen's History item has no link of its own: its live children do.
        if ($item->path === null) {
            expect($item->live)->not->toBeNull()
                ->and($item->link())->toBeNull();

            continue;
        }

        expect($item->path)->toStartWith('/'.$package.'/')
            ->and($item->link())->toBe(['path' => $item->path, 'external' => false])
            ->and($item->resolveUrl())->toBe('/admin'.$item->path);
    }
})->with(CLIENT_PATH_PACKAGES);

it('sends every integration nav link and section link as an SPA path under client_path /admin', function (): void {
    clientPathEverything();

    $navigation = $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->json('data.navigation');
    $links = clientPathLinks($navigation);

    expect($links)->not->toBeEmpty();

    foreach ($links as [$label, $link]) {
        if ($link === null) {
            // Only Keen's History, completed by its live resolver in the layer.
            expect($label)->toBe('History');

            continue;
        }

        expect($link['external'])->toBeFalse("[{$label}] links out to [{$link['path']}]")
            ->and($link['path'])->toMatch('#^/(cortex|guardian|impex|keen|pennantplus|polycart|roster|showroom)/#')
            ->and($link['path'])->not->toStartWith('/admin');
    }

    $showroom = collect($navigation)->firstWhere('label', 'Catalog');

    expect($showroom['link'])->toBe(['path' => '/showroom/products', 'external' => false])
        ->and($showroom['items'][0])->toMatchArray(['label' => 'Products', 'link' => ['path' => '/showroom/products', 'external' => false]]);
});

it('sends the same SPA paths with client_path /', function (): void {
    config()->set('atrium.client_path', '/');
    clientPathEverything();

    $links = clientPathLinks($this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->json('data.navigation'));

    expect(collect($links)->pluck(1, 0)->get('Products'))->toBe(['path' => '/showroom/products', 'external' => false])
        ->and(collect($links)->every(fn (array $link): bool => $link[1] === null || $link[1]['external'] === false))->toBeTrue();
});

it('follows a client_path changed after boot', function (): void {
    $item = clientPathEverything()->get('showroom')->navigation[0];

    config()->set('atrium.client_path', '/back-office/');

    expect($item->resolveUrl())->toBe('/back-office/showroom/products')
        ->and($item->link())->toBe(['path' => '/showroom/products', 'external' => false]);
});

it('sends search sources as descriptors only: the layer links their results inside the SPA', function (): void {
    clientPathEverything();

    $sources = $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->json('data.search.sources');

    expect($sources)->not->toBeEmpty();

    foreach ($sources as $source) {
        expect(array_keys($source))->toBe(['key', 'integration', 'label', 'icon']);
    }
});

it('sends the impex.run-link hook with no URL: the layer links to /impex/runs/:id inside the SPA', function (): void {
    clientPathEverything();

    $screen = $this->actingAs($this->user)->getJson(route('atrium.screens.show', ['screen' => 'showroom.transfers']))->assertOk()->json('data');

    expect($screen['sections']['row.actions'])->toBe([
        ['key' => 'impex.run-link', 'label' => 'Run', 'component' => 'impex.run-link', 'data' => []],
    ])->and(json_encode($screen))->not->toContain('/admin')->not->toContain('"external":true');
});

it('refuses an integration nav item declared with url()', function (): void {
    IntegrationFixture::installed('cortex');
    IntegrationFixture::serveApi('cortex');
    app()->bind(IntegrationRegistry::classFor('cortex'), fn (): Integration => new class extends BaseIntegration
    {
        public function label(): string
        {
            return 'Cortex';
        }

        public function navigation(): array
        {
            return [NavItem::make('Host page')->url('/cortex/records')];
        }
    });

    IntegrationFixture::register();
})->throws(InvalidIntegrationException::class, 'declared with path(), never url() or route()');

it('refuses an integration nav child outside its package', function (): void {
    IntegrationFixture::installed('cortex');
    IntegrationFixture::serveApi('cortex');
    app()->bind(IntegrationRegistry::classFor('cortex'), fn (): Integration => new class extends BaseIntegration
    {
        public function label(): string
        {
            return 'Cortex';
        }

        public function navigation(): array
        {
            return [NavItem::make('Parent')->path('/cortex/records')->children([NavItem::make('Child')->path('/showroom/products')])];
        }
    });

    IntegrationFixture::register();
})->throws(InvalidIntegrationException::class, 'nav item [Child]');
