<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Polycart;

/**
 * The feature flag the Polycart integration shows behind, by default, in
 * `atrium.integrations.polycart.features`. On for every scope until the host
 * turns it off with its feature flags; Atrium asks only when the host has a
 * flag package installed.
 */
final class PolycartFeature
{
    public function resolve(mixed $scope): bool
    {
        return true;
    }
}
