<?php

declare(strict_types=1);

namespace RefactorCircus\Atrium\Integrations\PennantPlus;

/**
 * The feature flag the PennantPlus integration shows behind, by default, in
 * `atrium.integrations.pennantplus.features`. On for every scope until the
 * host turns it off with its feature flags; Atrium asks only when the host
 * has a flag package installed.
 */
final class PennantPlusFeature
{
    public function resolve(mixed $scope): bool
    {
        return true;
    }
}
