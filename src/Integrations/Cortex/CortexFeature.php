<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Cortex;

/**
 * The feature flag the Cortex integration shows behind, by default, in
 * `atrium.integrations.cortex.features`. On for every scope until the host
 * turns it off with its feature flags; Atrium asks only when the host has a
 * flag package installed.
 */
final class CortexFeature
{
    public function resolve(mixed $scope): bool
    {
        return true;
    }
}
