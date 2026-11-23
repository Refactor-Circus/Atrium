<?php

declare(strict_types=1);

use Composer\InstalledVersions;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RefactorCircus\Atrium\Domains\Integrations\Contracts\InstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Data\RegisteredIntegration;
use RefactorCircus\Atrium\Domains\Integrations\Data\ScreenDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Data\SearchSourceDeclaration;
use RefactorCircus\Atrium\Domains\Integrations\Exceptions\InvalidIntegrationException;
use RefactorCircus\Atrium\Domains\Integrations\Services\ComposerInstalledPackages;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Integrations\Support\Integration;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Domains\Screens\Data\Screen;
use RefactorCircus\Atrium\Domains\Search\Data\SearchSource;
use RefactorCircus\Atrium\Domains\Search\Services\SearchRegistry;
use RefactorCircus\Atrium\Domains\Settings\Data\SettingsPanel;
use RefactorCircus\Atrium\Domains\Settings\Services\SettingsRegistry;
use RefactorCircus\Atrium\Domains\Widgets\Services\WidgetRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;

/*
 * Registration gating (AC 39): an integration registers only while its
 * package is installed (through the InstalledPackages seam) and its
 * `atrium.integrations.{pkg}.enabled` is true. Each package's own
 * integration class arrives with its group; here the fixture integration
 * stands in for it under the conventional class name.
 */

dataset('suite packages', ['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom']);

/**
 * What every registry an integration adds to holds, by name.
 *
 * @return array<string, list<string>>
 */
function registrationSnapshot(): array
{
    $request = Request::create('/');
    $integrations = app(IntegrationRegistry::class)->all();

    return [
        'integrations' => array_keys($integrations),
        'navigation' => array_map(fn (NavItem $item): string => $item->label, app(NavigationRegistry::class)->items($request)),
        'widgets' => array_keys(app(WidgetRegistry::class)->all()),
        'settings' => array_map(fn (SettingsPanel $panel): string => $panel->key, app(SettingsRegistry::class)->panels($request)),
        'search' => [
            ...array_map(fn (SearchSource $source): string => 'php:'.$source->key, app(SearchRegistry::class)->sources($request)),
            ...array_merge([], ...array_map(
                fn (RegisteredIntegration $integration): array => array_map(fn (SearchSourceDeclaration $source): string => $source->key, $integration->searchSources),
                array_values($integrations),
            )),
        ],
        'screens' => array_merge([], ...array_map(
            fn (RegisteredIntegration $integration): array => array_keys($integration->screens),
            array_values($integrations),
        )),
    ];
}

beforeEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

afterEach(function (): void {
    IntegrationFixture::forgetWarnings();
});

it('binds the seam to Composer\'s installed packages by default', function (): void {
    $packages = app(InstalledPackages::class);

    expect($packages)->toBeInstanceOf(ComposerInstalledPackages::class)
        ->and(app(InstalledPackages::class))->toBe($packages)
        ->and($packages->isInstalled('laravel/framework'))->toBe(InstalledVersions::isInstalled('laravel/framework'))->toBeTrue()
        ->and($packages->isInstalled('refactor-circus/no-such-package'))->toBeFalse();
});

it('registers nothing at boot while no suite package is installed', function (): void {
    expect(app(IntegrationRegistry::class)->all())->toBe([]);
});

it('registers an installed and enabled package\'s nav, widgets, panel, search sources and screens', function (string $key): void {
    $baseline = registrationSnapshot();

    IntegrationFixture::registerFakes($key);

    $label = Str::headline($key);
    $snapshot = registrationSnapshot();

    expect($snapshot['integrations'])->toBe([$key])
        ->and(array_values(array_diff($snapshot['navigation'], $baseline['navigation'])))->toBe([$label.' records'])
        ->and(array_values(array_diff($snapshot['widgets'], $baseline['widgets'])))->toBe([$key.'.stats'])
        ->and(array_values(array_diff($snapshot['settings'], $baseline['settings'])))->toBe([$key])
        ->and(array_values(array_diff($snapshot['search'], $baseline['search'])))->toBe([$key])
        ->and($snapshot['screens'])->toBe([$key.'.records', $key.'.record']);

    $integration = app(IntegrationRegistry::class)->get($key);

    expect($integration?->label)->toBe($label)
        ->and($integration?->apiBase)->toBe('/'.$key.'/api')
        ->and($integration?->features)->toBe(config('atrium.integrations.'.$key.'.features'));
})->with('suite packages');

it('registers nothing for a package that is not installed', function (string $key): void {
    $baseline = registrationSnapshot();

    IntegrationFixture::installed();
    IntegrationFixture::serveApi($key);
    IntegrationFixture::fake($key);
    IntegrationFixture::register();

    expect(registrationSnapshot())->toBe($baseline);
})->with('suite packages');

it('registers nothing for an installed package that is not enabled', function (string $key, mixed $enabled): void {
    $baseline = registrationSnapshot();

    config()->set('atrium.integrations.'.$key.'.enabled', $enabled);

    IntegrationFixture::registerFakes($key);

    expect(registrationSnapshot())->toBe($baseline);
})->with('suite packages')->with([
    'false' => [false],
    'the string "false"' => ['false'],
    'the string "0"' => ['0'],
]);

it('reads enabled boolean-coerced, so the string "true" enables', function (): void {
    config()->set('atrium.integrations.cortex.enabled', 'true');

    IntegrationFixture::registerFakes('cortex');

    expect(array_keys(app(IntegrationRegistry::class)->all()))->toBe(['cortex']);
});

it('registers only the packages that are installed, in key order', function (): void {
    IntegrationFixture::serveApi('roster', 'cortex', 'keen');
    IntegrationFixture::fake('roster', 'cortex', 'keen');
    IntegrationFixture::installed('roster', 'cortex');
    IntegrationFixture::register();

    expect(array_keys(app(IntegrationRegistry::class)->all()))->toBe(['cortex', 'roster']);
});

it('finds each integration by convention from its config key', function (): void {
    expect(IntegrationRegistry::classFor('cortex'))->toBe('RefactorCircus\\Atrium\\Integrations\\Cortex\\CortexIntegration')
        ->and(IntegrationRegistry::classFor('pennantplus'))->toBe('RefactorCircus\\Atrium\\Integrations\\PennantPlus\\PennantPlusIntegration')
        ->and(IntegrationRegistry::classFor('showroom'))->toBe('RefactorCircus\\Atrium\\Integrations\\Showroom\\ShowroomIntegration')
        ->and(IntegrationRegistry::packageFor('pennantplus'))->toBe('refactor-circus/pennantplus');
});

it('skips a configured key whose integration class does not exist', function (): void {
    $baseline = registrationSnapshot();

    config()->set('atrium.integrations.acme', ['enabled' => true, 'api_base' => '/acme/api', 'features' => []]);
    IntegrationFixture::installed('acme');
    IntegrationFixture::register();

    expect(registrationSnapshot())->toBe($baseline);
});

it('registers each integration once, however often registration runs', function (): void {
    IntegrationFixture::registerFakes('cortex');
    IntegrationFixture::register();
    IntegrationFixture::register();

    expect(registrationSnapshot()['navigation'])->toBe(['Cortex records'])
        ->and(registrationSnapshot()['settings'])->toBe(['cortex']);
});

it('refuses a class under the conventional name that is not an integration', function (): void {
    IntegrationFixture::installed('cortex');
    IntegrationFixture::serveApi('cortex');
    app()->bind(IntegrationRegistry::classFor('cortex'), fn (): stdClass => new stdClass);

    IntegrationFixture::register();
})->throws(InvalidIntegrationException::class, 'The [cortex] integration class [RefactorCircus\\Atrium\\Integrations\\Cortex\\CortexIntegration] must implement');

it('refuses a screen outside its integration\'s package', function (string $key, string $path): void {
    IntegrationFixture::installed('cortex');
    IntegrationFixture::serveApi('cortex');
    app()->bind(IntegrationRegistry::classFor('cortex'), fn (): Integration => new class($key, $path) extends Integration
    {
        public function __construct(private readonly string $key, private readonly string $path) {}

        public function label(): string
        {
            return 'Cortex';
        }

        public function screens(): array
        {
            return [ScreenDeclaration::make($this->key, Screen::LIST, $this->path)];
        }
    });

    IntegrationFixture::register();
})->with([
    'a key of another package' => ['roster.users', '/cortex/users'],
    'a path of another package' => ['cortex.users', '/roster/users'],
])->throws(InvalidIntegrationException::class);
