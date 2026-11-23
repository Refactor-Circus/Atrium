<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Integrations\Cortex\CortexFeature;
use RefactorCircus\Atrium\Integrations\Guardian\GuardianFeature;
use RefactorCircus\Atrium\Integrations\Impex\ImpexFeature;
use RefactorCircus\Atrium\Integrations\Keen\KeenFeature;
use RefactorCircus\Atrium\Integrations\PennantPlus\PennantPlusFeature;
use RefactorCircus\Atrium\Integrations\Polycart\PolycartFeature;
use RefactorCircus\Atrium\Integrations\Roster\RosterFeature;
use RefactorCircus\Atrium\Integrations\Showroom\ShowroomFeature;

/*
 * The `integrations` config section (AC 38, 79): exactly the eight packages,
 * their defaults, the cross-package hooks' v1 defaults, and a banner that
 * documents detection, the API base, Pennant flags and the APIs that ship off.
 */

/**
 * The `integrations` section's banner comment.
 */
function integrationConfigBanner(): string
{
    $source = (string) file_get_contents(__DIR__.'/../../../config/atrium.php');
    $start = strpos($source, '| Suite Integrations');
    $end = strpos($source, "'integrations' =>");

    expect($start)->toBeInt()->and($end)->toBeInt();

    return substr($source, (int) $start, (int) $end - (int) $start);
}

it('has exactly the eight package keys, with their defaults and the hooks\' v1 defaults', function (): void {
    $defaults = (require __DIR__.'/../../../config/atrium.php')['integrations'];

    expect($defaults)->toBe([
        'cortex' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [CortexFeature::class],
            'redirect_domains' => [
                'screens' => ['roster.organization' => 'tab', 'roster.user' => 'aside'],
            ],
        ],
        'guardian' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [GuardianFeature::class],
            'scope_types' => [
                'organization' => null,
                'team' => null,
            ],
            'screens' => [
                'roster.organization' => ['guardian.access', 'guardian.sso', 'guardian.scim'],
                'roster.user' => ['guardian.access', 'guardian.user-security', 'aside' => 'guardian.sso-identities'],
            ],
        ],
        'impex' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [ImpexFeature::class],
            'run_link' => [
                'screens' => ['showroom.transfers' => 'row.actions'],
            ],
        ],
        'keen' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [KeenFeature::class],
            'history' => [
                'screens' => ['*'],
                'slot' => 'after',
                'exclude' => ['keen.*', 'atrium.*'],
                'tabs' => ['roster.organization' => ['scope' => true]],
                'nav' => [
                    'enabled' => true,
                    'sort' => 90,
                    'exclude' => [],
                    'groups' => ['showroom' => 'showroom', 'pennantplus' => 'pennantplus'],
                ],
            ],
        ],
        'pennantplus' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [PennantPlusFeature::class],
        ],
        'polycart' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [PolycartFeature::class],
        ],
        'roster' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [RosterFeature::class],
        ],
        'showroom' => [
            'enabled' => true,
            'api_base' => null,
            'features' => [ShowroomFeature::class],
            'transfers' => [
                'flow_prefix' => 'showroom:',
            ],
        ],
    ]);
});

it('merges the section into the running config', function (): void {
    expect(array_keys(config('atrium.integrations')))
        ->toBe(['cortex', 'guardian', 'impex', 'keen', 'pennantplus', 'polycart', 'roster', 'showroom']);
});

it('documents the detection rule in the banner', function (): void {
    expect(integrationConfigBanner())
        ->toContain('refactor-circus/{pkg}')
        ->toContain('installed')
        ->toContain('enabled');
});

it('documents the API base rule in the banner', function (): void {
    expect(integrationConfigBanner())
        ->toContain('api_base')
        ->toContain('{pkg}.routes.prefix')
        ->toContain('{pkg}.routes.enabled')
        ->toContain('does not register')
        ->toContain('warning');
});

it('documents the Pennant flags in the banner', function (): void {
    expect(integrationConfigBanner())
        ->toContain('features')
        ->toContain('Laravel Pennant')
        ->toContain('Feature::for(')
        ->toContain('every flag is on');
});

it('warns in the banner that Guardian, Polycart and Roster ship with their API off', function (): void {
    expect(integrationConfigBanner())
        ->toContain('guardian.routes.enabled')
        ->toContain('polycart.routes.enabled')
        ->toContain('roster.routes.enabled')
        ->toContain('authentication middleware');
});

it('documents Guardian\'s middleware and its challenge and setup pages in the banner (AC 79)', function (): void {
    expect(integrationConfigBanner())
        ->toContain('guardian.two-factor')
        ->toContain('guardian.session')
        ->toContain("Atrium's route group")
        ->toContain("packages' API")
        ->toContain('/guardian/two-factor/challenge')
        ->toContain('/guardian/two-factor/setup');
});

it('documents how guardian.scope_types resolves in the banner (AC 79, D-048)', function (): void {
    expect(integrationConfigBanner())
        ->toContain('guardian.scope_types')
        ->toContain('guardian.adopt.scope_types.{key}')
        ->toContain('dropped');
});

it('gives every package a feature class that resolves on and imports nothing from Pennant', function (string $class): void {
    expect(new $class()->resolve(null))->toBeTrue()
        ->and(new $class()->resolve('ada'))->toBeTrue()
        ->and((string) file_get_contents((string) new ReflectionClass($class)->getFileName()))->not->toContain('Laravel\\Pennant');
})->with([
    CortexFeature::class,
    GuardianFeature::class,
    ImpexFeature::class,
    KeenFeature::class,
    PennantPlusFeature::class,
    PolycartFeature::class,
    RosterFeature::class,
    ShowroomFeature::class,
]);
