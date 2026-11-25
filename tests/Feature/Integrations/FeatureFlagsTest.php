<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use Laravel\Pennant\Feature;
use Laravel\Pennant\PennantServiceProvider;
use RefactorCircus\Atrium\Domains\Access\Services\Gatekeeper;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationFeatures;
use RefactorCircus\Atrium\Domains\Integrations\Services\IntegrationRegistry;
use RefactorCircus\Atrium\Domains\Navigation\Data\NavItem;
use RefactorCircus\Atrium\Domains\Navigation\Services\NavigationRegistry;
use RefactorCircus\Atrium\Tests\Fixtures\Integrations\IntegrationFixture;
use Workbench\App\Models\User;

/*
 * Feature flags (AC 41, D-027): a registered integration is active for a
 * request only while every feature in its `features` list is. With Laravel
 * Pennant available each resolves through `Feature::for($user)`; without it
 * every flag is on. Atrium's plugin feature gate (Gatekeeper) is untouched.
 */

beforeEach(function (): void {
    Gate::define('viewAtrium', fn ($user = null): bool => true);

    $this->user = User::forceCreate(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => bcrypt('secret')]);

    IntegrationFixture::registerFakes('cortex', 'roster');
});

/**
 * Laravel Pennant, on its array driver.
 */
function featureFlagsWithPennant(): void
{
    app()->register(PennantServiceProvider::class);
    config()->set('pennant.default', 'array');
}

/**
 * Everything a user sees of the Cortex fixture integration, by surface.
 *
 * @return array<string, mixed>
 */
function featureFlagsCortexSurfaces(object $test): array
{
    $shell = $test->actingAs($test->user)->getJson(route('atrium.shell'))->assertOk()->json('data');
    $widgets = $test->actingAs($test->user)->getJson(route('atrium.widgets.index'))->assertOk()->json('data');
    $labels = array_column(array_merge([], ...array_column($shell['navigation'], 'items')), 'label');

    return [
        'integration' => collect($shell['integrations'])->firstWhere('key', 'cortex'),
        'navigation' => in_array('Cortex records', $labels, true),
        'settings' => in_array('cortex', array_column($shell['settings'], 'key'), true),
        'sources' => in_array('cortex', array_column($shell['search']['sources'], 'integration'), true),
        'widgets' => in_array('cortex.stats', array_column($widgets, 'key'), true),
        'screen' => $test->actingAs($test->user)->getJson(route('atrium.screens.show', 'cortex.records'))->getStatusCode(),
    ];
}

it('turns an integration off for a user whose flag is deactivated', function (): void {
    featureFlagsWithPennant();

    Feature::for($this->user)->deactivate('cortex.atrium');

    expect(featureFlagsCortexSurfaces($this))->toBe([
        'integration' => [
            'key' => 'cortex',
            'label' => 'Cortex',
            'active' => false,
            'api_base' => '/cortex/api',
            'features' => ['cortex.atrium' => false],
        ],
        'navigation' => false,
        'settings' => false,
        'sources' => false,
        'widgets' => false,
        'screen' => 404,
    ]);
});

it('leaves the other integrations on when one is flagged off', function (): void {
    featureFlagsWithPennant();

    Feature::for($this->user)->deactivate('cortex.atrium');

    $shell = $this->actingAs($this->user)->getJson(route('atrium.shell'))->assertOk()->json('data');

    expect(array_column($shell['integrations'], 'active', 'key'))->toBe(['cortex' => false, 'roster' => true])
        ->and(array_column($shell['search']['sources'], 'integration'))->toBe(['roster']);

    $this->actingAs($this->user)->getJson(route('atrium.screens.show', 'roster.records'))->assertOk();
});

it('keeps an integration on for a user whose flag is active', function (): void {
    featureFlagsWithPennant();

    Feature::for($this->user)->activate('cortex.atrium');

    expect(featureFlagsCortexSurfaces($this))->toBe([
        'integration' => [
            'key' => 'cortex',
            'label' => 'Cortex',
            'active' => true,
            'api_base' => '/cortex/api',
            'features' => ['cortex.atrium' => true],
        ],
        'navigation' => true,
        'settings' => true,
        'sources' => true,
        'widgets' => true,
        'screen' => 200,
    ]);
});

it('defines the manifests\' feature names on under Pennant, until the host defines them', function (): void {
    featureFlagsWithPennant();

    expect(Feature::defined())->not->toContain('cortex.atrium')
        ->and(featureFlagsCortexSurfaces($this)['integration']['active'])->toBeTrue()
        ->and(Feature::for($this->user)->active('cortex.atrium'))->toBeTrue()
        ->and(Feature::for($this->user)->active('roster.atrium'))->toBeTrue();
});

it('keeps a feature the host defined', function (): void {
    featureFlagsWithPennant();

    Feature::define('cortex.atrium', fn (): bool => false);

    expect(featureFlagsCortexSurfaces($this)['integration']['active'])->toBeFalse();
});

it('needs every listed feature to be on', function (): void {
    featureFlagsWithPennant();

    config()->set('atrium.integrations.keen.features', ['cortex.atrium', 'cortex-beta']);
    IntegrationFixture::registerFakes('keen');

    $integration = collect($this->actingAs($this->user)->getJson(route('atrium.shell'))->json('data.integrations'))->firstWhere('key', 'keen');

    // An undefined Pennant feature reads as off.
    expect($integration['active'])->toBeFalse()
        ->and($integration['features'])->toBe(['cortex.atrium' => true, 'cortex-beta' => false]);
});

it('turns every flag on while Pennant is unavailable', function (): void {
    featureFlagsWithPennant();

    Feature::for($this->user)->deactivate('cortex.atrium');
    app(IntegrationFeatures::class)->detectPennantUsing(fn (): bool => false);

    expect(featureFlagsCortexSurfaces($this))->toMatchArray([
        'integration' => [
            'key' => 'cortex',
            'label' => 'Cortex',
            'active' => true,
            'api_base' => '/cortex/api',
            'features' => ['cortex.atrium' => true],
        ],
        'navigation' => true,
        'screen' => 200,
    ]);
});

it('detects Pennant by its feature manager being bound', function (): void {
    $features = app(IntegrationFeatures::class);

    expect($features->pennantAvailable())->toBeFalse();

    featureFlagsWithPennant();

    expect($features->pennantAvailable())->toBeTrue();
});

it('leaves the plugin feature gate alone', function (): void {
    featureFlagsWithPennant();

    $gatekeeper = app(Gatekeeper::class);

    // Registering integrations installs no feature resolver on the Gatekeeper.
    expect(new ReflectionProperty(Gatekeeper::class, 'features')->getValue($gatekeeper))->toBeNull();

    // A plugin's feature is still on until the host resolves it, even
    // though Pennant is installed and would call the undefined feature off.
    app(NavigationRegistry::class)->add(NavItem::make('Beta page')->url('/beta')->feature('beta'));

    $labels = fn (): array => array_column(array_merge([], ...array_column(
        $this->actingAs($this->user)->getJson(route('atrium.shell'))->json('data.navigation'),
        'items',
    )), 'label');

    expect($labels())->toContain('Beta page');

    // And the Gatekeeper's resolver does not decide integrations.
    $gatekeeper->resolveFeaturesUsing(fn (): bool => false);

    expect($labels())->not->toContain('Beta page')->toContain('Cortex records');
});

it('asks Pennant about the signed-in user', function (): void {
    featureFlagsWithPennant();

    $other = User::forceCreate(['name' => 'Bob', 'email' => 'bob@example.com', 'password' => bcrypt('secret')]);
    Feature::for($other)->deactivate('cortex.atrium');

    expect(featureFlagsCortexSurfaces($this)['integration']['active'])->toBeTrue()
        ->and(app(IntegrationRegistry::class)->get('cortex')?->features)->toBe(['cortex.atrium']);
});
