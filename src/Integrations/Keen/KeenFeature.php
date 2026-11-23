<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\Keen;

/**
 * The feature flag the Keen integration shows behind, by default, in
 * `atrium.integrations.keen.features`. On for every scope until the host
 * turns it off with its feature flags; Atrium asks only when the host has a
 * flag package installed.
 */
final class KeenFeature
{
    public function resolve(mixed $scope): bool
    {
        return true;
    }
}
