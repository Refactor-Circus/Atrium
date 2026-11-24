<?php

declare(strict_types=1);

/*
 * The `integrations` config section (AC 38, 79; D-090): no package listed,
 * since each declares itself in its manifest, and a banner that documents
 * detection, the API base, Pennant flags, the APIs that ship off and the
 * keys the suite's manifests read with their defaults.
 */

/**
 * The `integrations` section's banner comment.
 */
function integrationConfigBanner(): string
{
    $source = (string) file_get_contents(__DIR__.'/../../../config/atrium.php');
    $start = strpos($source, '| Integrations');
    $end = strpos($source, "'integrations' =>");

    expect($start)->toBeInt()->and($end)->toBeInt();

    return substr($source, (int) $start, (int) $end - (int) $start);
}

it('lists no package: every default comes from the packages\' manifests', function (): void {
    expect((require __DIR__.'/../../../config/atrium.php')['integrations'])->toBe([])
        ->and(config('atrium.integrations'))->toBe([]);
});

it('documents the detection rule in the banner', function (): void {
    expect(integrationConfigBanner())
        ->toContain('dist/atrium/integration.json')
        ->toContain('extra.atrium.integration')
        ->toContain('atrium:discover')
        ->toContain('Atrium::integration()')
        ->toContain('enabled');
});

it('documents the keys the suite\'s manifests read, with their defaults', function (): void {
    expect(integrationConfigBanner())
        ->toContain('cortex.redirect_domains.screens')
        ->toContain('impex.run_link.screens')
        ->toContain('keen.history')
        ->toContain('showroom.transfers.flow_prefix')
        ->toContain('guardian.screens');
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
