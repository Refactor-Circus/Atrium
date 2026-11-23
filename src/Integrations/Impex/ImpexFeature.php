<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Impex;

/**
 * The feature flag the Impex integration shows behind, by default, in
 * `atrium.integrations.impex.features`. On for every scope until the host
 * turns it off with its feature flags; Atrium asks only when the host has a
 * flag package installed.
 */
final class ImpexFeature
{
    public function resolve(mixed $scope): bool
    {
        return true;
    }
}
