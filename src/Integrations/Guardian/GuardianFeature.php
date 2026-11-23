<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Guardian;

/**
 * The feature flag the Guardian integration shows behind, by default, in
 * `atrium.integrations.guardian.features`. On for every scope until the host
 * turns it off with its feature flags; Atrium asks only when the host has a
 * flag package installed.
 */
final class GuardianFeature
{
    public function resolve(mixed $scope): bool
    {
        return true;
    }
}
