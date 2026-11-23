<?php

declare(strict_types=1);

use RefactorCircus\Atrium\Atrium;

/*
 * Version skew (AC 28, D-004): the shell sends `Atrium::API_VERSION`, and the
 * Nuxt layer compares it with its own package version. Both come from one
 * release, so the constant must be the major.minor of the layer's
 * package.json.
 */

function apiVersionLayerPackage(): string
{
    return dirname(__DIR__, 2).'/nuxt/layer/package.json';
}

it('is a major.minor version', function (): void {
    expect(Atrium::API_VERSION)->toMatch('/^\d+\.\d+$/');
});

it('equals the major.minor of nuxt/layer/package.json', function (): void {
    $package = json_decode((string) file_get_contents(apiVersionLayerPackage()), true, flags: JSON_THROW_ON_ERROR);
    $version = is_array($package) ? ($package['version'] ?? null) : null;

    expect($version)->toBeString('nuxt/layer/package.json has a version');

    expect(preg_match('/^(\d+)\.(\d+)\.\d+/', (string) $version, $matches))->toBe(1, "nuxt/layer/package.json version [{$version}] is not semver");

    expect(Atrium::API_VERSION)->toBe(
        $matches[1].'.'.$matches[2],
        "Atrium::API_VERSION must equal the major.minor of the layer's version [{$version}]; release both together.",
    );
})->skip(
    fn (): bool => ! file_exists(apiVersionLayerPackage()),
    'nuxt/layer/package.json does not exist yet: the Nuxt layer (task group 8 of the Atrium v2 headless spec) adds it, and this check runs from then on.',
);
